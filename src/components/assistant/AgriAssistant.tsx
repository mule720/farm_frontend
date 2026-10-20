/**
 * AGRINUXES AI guide. One floating button and a slide-over panel for every kind of account (farm, vendor,
 * government, extension officer, partner, buyer, visitor). Three tabs:
 *   Ask   - asks what you want to do, answers from the user guide, suggests next steps, can open pages and add enterprises.
 *   Setup - a checklist for your account type that ticks itself where it can, with "take me there" and "help me".
 *   Learn - short step-by-step lessons.
 * It styles itself like the ERP's assistant panel (sparkles button, slide-over) and works with the shells through two
 * window events: `agri:page` (shell tells us where the person is) and `agri:navigate` (we ask the shell to open a page).
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Sparkles, X, Send, CheckCircle2, Circle, ArrowRight, GraduationCap, ListChecks, MessageCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useOrg } from '@/store/orgStore';
import { gqlRequest } from '@/lib/api';
import { getTemplate } from '@/lib/templates';
import { PLAYBOOKS, accountKind, SetupFacts, SetupStep, Lesson } from '@/lib/assistant/playbooks';

type Action = { type: 'navigate'; page: string; label: string } | { type: 'add_enterprise'; templateId: string; label: string };
type Msg = { role: 'user' | 'assistant'; content: string; actions?: Action[]; sources?: string[]; note?: boolean };

const ASK = `mutation($q:String!,$h:JSONString,$c:JSONString,$id:String){ askAssistant(question:$q,history:$h,context:$c,conversationId:$id){ result } }`;
const COLORS = ['#F59E0B', '#3B82F6', '#22C55E', '#8B5CF6', '#EF4444', '#F97316', '#06B6D4', '#EC4899'];

/** Tiny formatter: **bold**, numbered and dashed lines, blank lines as paragraph breaks. */
function Rich({ text }: { text: string }) {
  const inline = (s: string, k: string) => s.split(/(\*\*[^*]+\*\*)/g).map((p, i) =>
    p.startsWith('**') && p.endsWith('**') ? <strong key={k + i}>{p.slice(2, -2)}</strong> : <React.Fragment key={k + i}>{p}</React.Fragment>);
  const lines = text.split('\n');
  return (
    <div className="space-y-1.5">
      {lines.map((ln, i) => {
        if (!ln.trim()) return <div key={i} className="h-1" />;
        const num = ln.match(/^\s*(\d+)[.)]\s+(.*)$/);
        if (num) return <div key={i} className="flex gap-2"><span className="font-semibold text-emerald-700 w-4 flex-shrink-0">{num[1]}.</span><span>{inline(num[2], `n${i}`)}</span></div>;
        const bul = ln.match(/^\s*[-•]\s+(.*)$/);
        if (bul) return <div key={i} className="flex gap-2"><span className="text-emerald-600">•</span><span>{inline(bul[1], `b${i}`)}</span></div>;
        return <div key={i}>{inline(ln, `p${i}`)}</div>;
      })}
    </div>
  );
}

export default function AgriAssistant() {
  const { profile } = useAuth();
  const { org, cycles, addEnterprise } = useOrg();
  const kind = accountKind(profile, org);
  const book = PLAYBOOKS[kind];

  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'ask' | 'setup' | 'learn'>('ask');
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [chips, setChips] = useState<string[]>([]);
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const [testMode, setTestMode] = useState(false);
  const [coach, setCoach] = useState(false);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [lessonStep, setLessonStep] = useState(0);
  const [page, setPage] = useState<{ page: string; label?: string }>({ page: '' });
  const convo = useRef<string | undefined>(undefined);
  const scroller = useRef<HTMLDivElement>(null);

  // where the person is, as reported by the shell
  useEffect(() => {
    const h = (e: Event) => setPage((e as CustomEvent).detail || { page: '' });
    window.addEventListener('agri:page', h);
    return () => window.removeEventListener('agri:page', h);
  }, []);

  // manual ticks, kept per organisation (or per person for accounts without one)
  const scope = `agri_assist_done:${org?.id ?? (profile as any)?.email ?? 'visitor'}`;
  const [manual, setManual] = useState<Record<string, boolean>>({});
  useEffect(() => { try { setManual(JSON.parse(localStorage.getItem(scope) || '{}')); } catch { setManual({}); } }, [scope]);
  const tick = (id: string) => setManual(prev => { const n = { ...prev, [id]: !prev[id] }; try { localStorage.setItem(scope, JSON.stringify(n)); } catch { /* private mode */ } return n; });

  const facts: SetupFacts = useMemo(() => {
    const ents = org?.enterprises ?? [];
    const own = (org?.customTemplates ?? []).map((t: any) => t.id);
    return {
      onboarded: !!org?.onboardingComplete,
      enterprises: ents.length,
      ownTemplate: ents.some((e: any) => own.includes(e.templateId)),
      cycles: cycles.length,
      dailyRecords: cycles.reduce((n: number, c: any) => n + (c.stages ?? []).reduce((m: number, s: any) => m + (s.dailyRecords?.length ?? 0), 0), 0),
    };
  }, [org, cycles]);

  const steps = book.steps.map(s => ({ ...s, done: s.auto ? s.auto(facts) || !!manual[s.id] : !!manual[s.id] }));
  const doneCount = steps.filter(s => s.done).length;
  const next: (SetupStep & { done: boolean }) | undefined = steps.find(s => !s.done);

  useEffect(() => { scroller.current?.scrollTo({ top: tab === 'ask' ? scroller.current.scrollHeight : 0, behavior: tab === 'ask' ? 'smooth' : 'auto' }); }, [msgs, busy, tab, open, lesson]);

  // first message when the panel opens
  useEffect(() => {
    if (!open || msgs.length) return;
    const lead = next ? `Your next set-up step is **${next.label}**.` : steps.length ? 'Your set-up checklist is complete. Well done.' : '';
    setMsgs([{ role: 'assistant', content: `Hello! I am your AGRINUXES guide for ${book.label.toLowerCase() === 'visitor' ? 'new visitors' : 'your ' + book.label.toLowerCase()}. ${book.intro}\n\n${lead} What would you like to do?`.trim() }]);
    setChips(next ? [`Help me: ${next.label}`.slice(0, 60), ...book.starters].slice(0, 4) : book.starters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const navigate = (p: string) => {
    window.dispatchEvent(new CustomEvent('agri:navigate', { detail: { page: p } }));
    if (window.innerWidth < 640) setOpen(false);
  };

  async function send(text: string, opts: { coach?: boolean; lesson?: string } = {}) {
    const question = text.trim();
    if (!question || busy) return;
    const isCoach = opts.coach ?? coach;
    if (opts.coach !== undefined) setCoach(opts.coach);
    setTab('ask');
    setQ('');
    setChips([]);
    const history = msgs.filter(m => !m.note).map(m => ({ role: m.role, content: m.content }));
    setMsgs(p => [...p, { role: 'user', content: question }]);
    setBusy(true);
    try {
      const context = {
        accountType: kind, page: page.page, pageLabel: page.label, mode: isCoach ? 'coach' : 'normal', lesson: opts.lesson,
        steps: steps.map(s => ({ id: s.id, label: s.label, done: s.done })),
        enterprises: (org?.enterprises ?? []).map((e: any) => ({ name: e.name, templateId: e.templateId })),
      };
      const d = await gqlRequest<{ askAssistant: { result: string } }>(ASK, { q: question, h: JSON.stringify(history), c: JSON.stringify(context), id: convo.current });
      const r = JSON.parse(d.askAssistant.result);
      convo.current = r.conversationId;
      setTestMode(!!r.testMode);
      setMsgs(p => [...p, { role: 'assistant', content: r.answer, actions: r.actions, sources: r.sources }]);
      setChips(r.suggestions || []);
    } catch (e: any) {
      setMsgs(p => [...p, { role: 'assistant', content: 'I could not reach the guide just now. Check your connection and try again. You can still use the Setup and Learn tabs.', note: true }]);
    } finally {
      setBusy(false);
    }
  }

  function runAction(a: Action) {
    if (a.type === 'navigate') return navigate(a.page);
    // add_enterprise
    const t = getTemplate(a.templateId);
    if (!t || !org) return;
    if (!org.onboardingComplete) {
      setMsgs(p => [...p, { role: 'assistant', note: true, content: 'Finish the set-up wizard first. On the "What does your farm operate?" step, tick the category and click the template there.' }]);
      return;
    }
    const taken = org.enterprises.filter((e: any) => e.templateId === t.id).length;
    addEnterprise({ name: taken ? `${t.shortName || t.name} ${taken + 1}` : (t.shortName || t.name), templateId: t.id, color: COLORS[org.enterprises.length % COLORS.length], active: true });
    setMsgs(p => [...p, {
      role: 'assistant', note: true,
      content: `Done. **${t.name}** is now one of your enterprises. Next, start your first cycle from it in **Production**, then record the daily log. I can walk you through it.`,
      actions: [{ type: 'navigate', page: 'production', label: 'Open Production' }],
    }]);
    setChips(['Help me start my first cycle', 'What is a template?', 'Teach me step by step']);
  }

  const startLesson = (l: Lesson) => { setLesson(l); setLessonStep(0); };
  const lessonAsk = () => {
    if (!lesson) return;
    send(`I am on step ${lessonStep + 1} of the lesson "${lesson.title}": ${lesson.steps[lessonStep].text} Explain it and ask me if I am stuck.`, { coach: true, lesson: lesson.title });
  };

  if (new URLSearchParams(window.location.search).get('credit')) return null;     // public lender report

  return (
    <>
      {!open && (
        <button onClick={() => setOpen(true)} title="Ask the AGRINUXES guide"
          className="fixed bottom-5 right-5 z-[60] flex items-center gap-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white pl-4 pr-5 py-3 shadow-lg shadow-emerald-900/30 transition-colors print:hidden">
          <Sparkles className="w-4 h-4" />
          <span className="text-sm font-semibold">Ask AI</span>
          {steps.length > 0 && doneCount < steps.length && (
            <span className="ml-1 text-[11px] bg-white/25 rounded-full px-1.5 py-0.5">{doneCount}/{steps.length}</span>
          )}
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-[70] print:hidden" role="dialog" aria-label="AGRINUXES AI guide">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 right-0 w-full sm:w-[430px] bg-white text-slate-800 shadow-2xl flex flex-col">
            <header className="flex items-center gap-2 px-4 py-3 border-b border-slate-200 bg-emerald-700 text-white">
              <Sparkles className="w-4 h-4" />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm">AGRINUXES AI guide</div>
                <div className="text-[11px] text-emerald-100 truncate">{book.label}{page.label ? ` · ${page.label}` : ''}</div>
              </div>
              {testMode && <span title="No AI key is connected, so answers come from the built-in user guide search." className="text-[10px] bg-amber-400/90 text-amber-950 rounded px-1.5 py-0.5 font-semibold">Guide mode</span>}
              <button onClick={() => setOpen(false)} className="p-1.5 rounded hover:bg-white/15" aria-label="Close"><X className="w-4 h-4" /></button>
            </header>

            <nav className="flex border-b border-slate-200 text-sm">
              {([['ask', 'Ask', MessageCircle], ['setup', steps.length ? `Setup ${doneCount}/${steps.length}` : 'Setup', ListChecks], ['learn', 'Learn', GraduationCap]] as const).map(([id, label, Icon]) => (
                <button key={id} onClick={() => setTab(id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 font-medium border-b-2 ${tab === id ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                  <Icon className="w-4 h-4" />{label}
                </button>
              ))}
            </nav>

            <div ref={scroller} className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
              {tab === 'ask' && (
                <>
                  {msgs.map((m, i) => (
                    <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex'}>
                      <div className={`max-w-[92%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${m.role === 'user' ? 'bg-emerald-600 text-white rounded-br-md' : m.note ? 'bg-emerald-50 border border-emerald-200 rounded-bl-md' : 'bg-white border border-slate-200 rounded-bl-md'}`}>
                        {m.role === 'user' ? m.content : <Rich text={m.content} />}
                        {!!m.actions?.length && (
                          <div className="mt-2.5 flex flex-wrap gap-2">
                            {m.actions.map((a, j) => (
                              <button key={j} onClick={() => runAction(a)} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5">
                                {a.label}<ArrowRight className="w-3 h-3" />
                              </button>
                            ))}
                          </div>
                        )}
                        {!!m.sources?.length && <div className="mt-2 text-[11px] text-slate-400">From the guide: {m.sources.join(' · ')}</div>}
                      </div>
                    </div>
                  ))}
                  {busy && <div className="flex"><div className="bg-white border border-slate-200 rounded-2xl rounded-bl-md px-4 py-3 text-slate-400 text-sm">Thinking…</div></div>}
                  {!busy && chips.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {chips.map(c => (
                        <button key={c} onClick={() => send(c, c.toLowerCase().startsWith('teach me') ? { coach: true } : {})}
                          className="text-xs rounded-full border border-emerald-300 bg-white text-emerald-800 hover:bg-emerald-50 px-3 py-1.5 text-left">{c}</button>
                      ))}
                    </div>
                  )}
                </>
              )}

              {tab === 'setup' && (
                <div className="space-y-3">
                  {steps.length === 0 ? (
                    <div className="text-sm text-slate-600 bg-white border border-slate-200 rounded-xl p-4">
                      There is no set-up checklist for this account type. Pick a lesson under <b>Learn</b> or just ask me what you want to do.
                    </div>
                  ) : (
                    <>
                      <div className="bg-white border border-slate-200 rounded-xl p-4">
                        <div className="flex justify-between text-sm font-semibold"><span>Your set-up</span><span className="text-emerald-700">{doneCount} of {steps.length} done</span></div>
                        <div className="h-2 bg-slate-100 rounded-full mt-2 overflow-hidden"><div className="h-full bg-emerald-500 transition-all" style={{ width: `${(doneCount / steps.length) * 100}%` }} /></div>
                        <p className="text-xs text-slate-500 mt-2">Steps tick themselves when I can see they are done in your workspace. Tick the others yourself.</p>
                      </div>
                      {steps.map(s => (
                        <div key={s.id} className={`bg-white border rounded-xl p-3.5 ${next?.id === s.id ? 'border-emerald-400 ring-1 ring-emerald-200' : 'border-slate-200'}`}>
                          <div className="flex gap-3">
                            <button onClick={() => !s.auto && tick(s.id)} disabled={!!s.auto && s.auto(facts)} className="mt-0.5 flex-shrink-0" aria-label={s.done ? 'Done' : 'Mark done'}>
                              {s.done ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <Circle className="w-5 h-5 text-slate-300" />}
                            </button>
                            <div className="flex-1 min-w-0">
                              <div className={`text-sm font-semibold ${s.done ? 'text-slate-400 line-through' : ''}`}>{s.label}{next?.id === s.id && <span className="ml-2 text-[10px] font-bold uppercase text-emerald-700">Next</span>}</div>
                              <p className="text-xs text-slate-500 mt-0.5">{s.why}</p>
                              <div className="flex gap-2 mt-2">
                                {s.page && <button onClick={() => navigate(s.page!)} className="text-xs rounded-lg border border-slate-300 px-2.5 py-1 hover:bg-slate-50">Take me there</button>}
                                <button onClick={() => send(s.ask)} className="text-xs rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1">Help me</button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}

              {tab === 'learn' && !lesson && (
                <div className="space-y-3">
                  {book.lessons.length === 0 && <div className="text-sm text-slate-600 bg-white border border-slate-200 rounded-xl p-4">No lessons for this account type yet. Ask me anything and I will teach you.</div>}
                  {book.lessons.map(l => (
                    <button key={l.id} onClick={() => startLesson(l)} className="w-full text-left bg-white border border-slate-200 hover:border-emerald-400 rounded-xl p-3.5">
                      <div className="text-sm font-semibold">{l.title}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{l.steps.length} steps · about {l.minutes} minutes</div>
                    </button>
                  ))}
                  <button onClick={() => send('Teach me step by step', { coach: true })} className="w-full text-sm rounded-xl border border-dashed border-emerald-400 text-emerald-800 py-3 hover:bg-emerald-50">Let the AI coach me on something else</button>
                </div>
              )}

              {tab === 'learn' && lesson && (
                <div className="space-y-3">
                  <button onClick={() => setLesson(null)} className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1"><ChevronLeft className="w-3 h-3" />All lessons</button>
                  <div className="bg-white border border-slate-200 rounded-xl p-4">
                    <div className="text-xs uppercase tracking-wide text-emerald-700 font-bold">{lesson.title}</div>
                    <div className="text-xs text-slate-400 mt-0.5">Step {lessonStep + 1} of {lesson.steps.length}</div>
                    <div className="h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden"><div className="h-full bg-emerald-500" style={{ width: `${((lessonStep + 1) / lesson.steps.length) * 100}%` }} /></div>
                    <p className="text-sm mt-4 leading-relaxed">{lesson.steps[lessonStep].text}</p>
                    <div className="flex flex-wrap gap-2 mt-4">
                      {lesson.steps[lessonStep].page && <button onClick={() => navigate(lesson.steps[lessonStep].page!)} className="text-xs rounded-lg border border-slate-300 px-2.5 py-1.5 hover:bg-slate-50">Take me there</button>}
                      <button onClick={lessonAsk} className="text-xs rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1.5">I am stuck, ask the AI</button>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <button disabled={lessonStep === 0} onClick={() => setLessonStep(s => s - 1)} className="text-sm flex items-center gap-1 disabled:opacity-30"><ChevronLeft className="w-4 h-4" />Back</button>
                    {lessonStep < lesson.steps.length - 1
                      ? <button onClick={() => setLessonStep(s => s + 1)} className="text-sm flex items-center gap-1 font-semibold text-emerald-700">Next<ChevronRight className="w-4 h-4" /></button>
                      : <button onClick={() => setLesson(null)} className="text-sm font-semibold text-emerald-700">Finish lesson</button>}
                  </div>
                </div>
              )}
            </div>

            {tab === 'ask' && (
              <footer className="border-t border-slate-200 p-3 bg-white">
                {coach && <div className="flex items-center justify-between text-[11px] text-emerald-800 bg-emerald-50 rounded-md px-2 py-1 mb-2">Coaching: one step at a time<button onClick={() => setCoach(false)} className="underline">Stop</button></div>}
                <form onSubmit={e => { e.preventDefault(); send(q); }} className="flex gap-2">
                  <input value={q} onChange={e => setQ(e.target.value)} placeholder="Ask anything, or say what you want to do…" maxLength={1500}
                    className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  <button type="submit" disabled={!q.trim() || busy} className="rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white px-3" aria-label="Send"><Send className="w-4 h-4" /></button>
                </form>
                <p className="text-[10px] text-slate-400 mt-1.5">Check doses and treatments with your vet or extension officer.</p>
              </footer>
            )}
          </aside>
        </div>
      )}
    </>
  );
}
