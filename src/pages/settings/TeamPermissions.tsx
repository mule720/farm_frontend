// ─────────────────────────────────────────────────────────────────────────────
// Team & Permissions — shared by farm, government, extension and partner shells.
// Members (invite / role / branch / admin / per-module permissions / deactivate),
// Branches (sites, district offices, camps, country offices), Audit log.
// Everything is driven by the backend role catalogue for the org type.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Users, Plus, Shield, ShieldCheck, Building2, ScrollText, X, Loader2, CheckCircle2, AlertTriangle, RotateCcw, UserX, UserCheck, KeyRound, Copy } from 'lucide-react';
import { gqlRequest } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import {
  TEAM_HOME_QUERY, AUDIT_QUERY, INVITE_MUTATION, UPDATE_ROLE_MUTATION, SET_PERMISSIONS_MUTATION, RESET_PERMISSIONS_MUTATION,
  SET_ADMIN_MUTATION, SET_BRANCH_MUTATION, ACTIVATE_MUTATION, DEACTIVATE_MUTATION, CREATE_BRANCH_MUTATION, UPDATE_BRANCH_MUTATION,
  DELETE_BRANCH_MUTATION, parseJson, type RoleCatalogue, type TeamMember, type Branch, type AuditEntry, type PermMatrix, type Action,
} from '@/graphql/teamQueries';

const title = (s: string) => (s || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
const inputCls = 'w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400';
type Msg = { ok: boolean; text: string } | null;
const MsgBox = ({ m }: { m: Msg }) => !m ? null : <div className={`flex items-center gap-2 p-3 rounded-xl text-sm border ${m.ok ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>{m.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />} {m.text}</div>;

interface Props { accent?: 'emerald' | 'amber' | 'sky' }

export default function TeamPermissions({ accent = 'emerald' }: Props) {
  const { profile, isOrgAdmin } = useAuth();
  const [tab, setTab] = useState<'members' | 'branches' | 'audit'>('members');
  const [cat, setCat] = useState<RoleCatalogue | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [showInactive, setShowInactive] = useState(false);
  const [msg, setMsg] = useState<Msg>(null);
  const [loading, setLoading] = useState(true);
  const btn = { emerald: 'bg-emerald-600 hover:bg-emerald-700', amber: 'bg-amber-600 hover:bg-amber-700', sky: 'bg-sky-600 hover:bg-sky-700' }[accent];

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await gqlRequest<{ roleCatalogue: any; teamMembers: any[]; branches: Branch[] }>(TEAM_HOME_QUERY, { inactive: showInactive });
      setCat({ ...r.roleCatalogue, roles: r.roleCatalogue.roles.map((x: any) => ({ ...x, defaultPermissions: parseJson<PermMatrix>(x.defaultPermissions, {}) })) });
      setMembers(r.teamMembers.map(m => ({ ...m, permissions: parseJson<PermMatrix>(m.permissions, {}) })));
      setBranches(r.branches);
    } catch (e: any) { setMsg({ ok: false, text: e?.message ?? 'Failed to load' }); } finally { setLoading(false); }
  }, [showInactive]);
  useEffect(() => { load(); }, [load]);

  const act = async (fn: () => Promise<string>) => { try { const t = await fn(); setMsg({ ok: true, text: t }); await load(); } catch (e: any) { setMsg({ ok: false, text: e?.message }); } };

  return (
    <div className="p-6 space-y-5 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><Users className="w-6 h-6" /> Team & Permissions</h1>
        <p className="text-sm text-slate-500 mt-1">{profile?.organization} · {cat ? `${members.filter(m => m.isActive).length} active members · ${branches.filter(b => b.isActive).length} branches` : 'Loading…'}{!isOrgAdmin && ' · read-only (you are not an administrator)'}</p>
      </div>
      <MsgBox m={msg} />
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {([['members', 'Members', Users], ['branches', 'Branches', Building2], ['audit', 'Audit log', ScrollText]] as const).map(([t, l, Icon]) => (
          <button key={t} onClick={() => setTab(t)} className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium ${tab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><Icon className="w-4 h-4" />{l}</button>
        ))}
      </div>
      {loading && !cat ? <div className="flex items-center gap-2 text-slate-500 text-sm"><Loader2 className="w-4 h-4 animate-spin" /> Loading team…</div> : cat && (
        <>
          {tab === 'members' && <MembersTab cat={cat} members={members} branches={branches} meId={profile?.id ?? ''} isAdmin={isOrgAdmin} btn={btn} act={act} showInactive={showInactive} setShowInactive={setShowInactive} />}
          {tab === 'branches' && <BranchesTab cat={cat} branches={branches} isAdmin={isOrgAdmin} btn={btn} act={act} />}
          {tab === 'audit' && <AuditTab isAdmin={isOrgAdmin} />}
        </>
      )}
    </div>
  );
}

// ─── Members ─────────────────────────────────────────────────────────────────

function MembersTab({ cat, members, branches, meId, isAdmin, btn, act, showInactive, setShowInactive }: { cat: RoleCatalogue; members: TeamMember[]; branches: Branch[]; meId: string; isAdmin: boolean; btn: string; act: (fn: () => Promise<string>) => Promise<void>; showInactive: boolean; setShowInactive: (v: boolean) => void }) {
  const [inviting, setInviting] = useState(false);
  const [editing, setEditing] = useState<TeamMember | null>(null);
  const [f, setF] = useState({ fullName: '', phone: '', email: '', role: cat.roles[cat.roles.length - 1]?.id ?? '', branchId: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [temp, setTemp] = useState<{ name: string; pwd: string; login: string } | null>(null);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<any>) => setF(x => ({ ...x, [k]: e.target.value }));
  const activeBranches = branches.filter(b => b.isActive);

  async function invite(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    try {
      const r = await gqlRequest<{ inviteUser: { tempPassword: string } }>(INVITE_MUTATION, { i: { fullName: f.fullName, phone: f.phone, email: f.email || null, role: f.role, branchId: f.branchId || null, password: f.password || null } });
      setTemp({ name: f.fullName, pwd: r.inviteUser.tempPassword, login: f.email || f.phone });
      setInviting(false); setF(x => ({ ...x, fullName: '', phone: '', email: '', password: '' }));
      await act(async () => `${f.fullName} added as ${cat.roles.find(r => r.id === f.role)?.label ?? f.role}.`);
    } catch (err: any) { await act(async () => { throw err; }); } finally { setBusy(false); }
  }

  return (
    <div className="space-y-4">
      {temp && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm">
          <div className="flex items-start justify-between gap-3"><div><div className="font-semibold text-amber-900 flex items-center gap-2"><KeyRound className="w-4 h-4" /> Temporary password for {temp.name}</div><div className="text-amber-800 mt-1">Login: <code className="bg-white px-1.5 py-0.5 rounded border border-amber-200">{temp.login}</code> · Password: <code className="bg-white px-1.5 py-0.5 rounded border border-amber-200">{temp.pwd}</code></div><div className="text-xs text-amber-700 mt-1">Shown once. Send it to them privately; they should change it after first sign-in.</div></div>
            <div className="flex gap-1"><button onClick={() => navigator.clipboard?.writeText(`Login: ${temp.login}\nPassword: ${temp.pwd}`)} className="p-1.5 rounded-lg border border-amber-300 text-amber-800"><Copy className="w-4 h-4" /></button><button onClick={() => setTemp(null)} className="p-1.5 rounded-lg border border-amber-300 text-amber-800"><X className="w-4 h-4" /></button></div></div>
        </div>
      )}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-semibold text-slate-900">Members</h3>
          <div className="flex items-center gap-3">
            <label className="text-xs text-slate-500 inline-flex items-center gap-1.5"><input type="checkbox" checked={showInactive} onChange={e => setShowInactive(e.target.checked)} /> Show deactivated</label>
            {isAdmin && <button onClick={() => setInviting(v => !v)} className={`inline-flex items-center gap-1 px-3 py-2 text-white rounded-lg text-sm font-medium ${btn}`}><Plus className="w-4 h-4" /> Add member</button>}
          </div>
        </div>
        {inviting && (
          <form onSubmit={invite} className="grid md:grid-cols-3 gap-2 p-3 bg-slate-50 rounded-xl">
            <input value={f.fullName} onChange={set('fullName')} placeholder="Full name" className={inputCls} required />
            <input value={f.phone} onChange={set('phone')} placeholder="Phone (login if no email)" className={inputCls} required />
            <input type="email" value={f.email} onChange={set('email')} placeholder="Email (optional)" className={inputCls} />
            <select value={f.role} onChange={set('role')} className={`${inputCls} bg-white`}>{cat.roles.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}</select>
            <select value={f.branchId} onChange={set('branchId')} className={`${inputCls} bg-white`}><option value="">Organisation-wide (no branch)</option>{activeBranches.map(b => <option key={b.id} value={b.id}>{b.name}{b.isHeadquarters ? ' (HQ)' : ''}</option>)}</select>
            <input value={f.password} onChange={set('password')} placeholder="Set a password (optional)" className={inputCls} />
            <p className="md:col-span-2 text-xs text-slate-500 self-center">{cat.roles.find(r => r.id === f.role)?.description}</p>
            <button type="submit" disabled={busy} className={`px-4 py-2 text-white rounded-lg text-sm font-medium disabled:opacity-50 ${btn}`}>{busy ? 'Adding…' : 'Add member'}</button>
          </form>
        )}
        <div className="overflow-x-auto"><table className="w-full text-sm">
          <thead><tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 border-b border-slate-200">{['Member', 'Role', 'Branch', 'Access', 'Status', ''].map(h => <th key={h} className="py-2 pr-3 font-medium">{h}</th>)}</tr></thead>
          <tbody>{members.map(m => {
            const mods = Object.entries(m.permissions).filter(([, a]) => a.includes('view')).length;
            return (
              <tr key={m.id} className={`border-b border-slate-100 last:border-0 ${!m.isActive ? 'opacity-50' : ''}`}>
                <td className="py-2.5 pr-3"><div className="font-medium text-slate-900 flex items-center gap-1.5">{m.fullName}{m.isOrgAdmin && <span title="Administrator"><ShieldCheck className="w-4 h-4 text-emerald-600" /></span>}{m.id === meId && <span className="text-[10px] text-slate-400">(you)</span>}</div><div className="text-xs text-slate-500">{m.email.endsWith('@agrinuxes.local') ? m.phone : m.email}{m.phone && !m.email.endsWith('@agrinuxes.local') && ` · ${m.phone}`}</div></td>
                <td className="py-2.5 pr-3">{isAdmin && m.id !== meId ? <select value={m.role} onChange={e => act(async () => { await gqlRequest(UPDATE_ROLE_MUTATION, { id: m.id, role: e.target.value }); return `${m.fullName} is now ${cat.roles.find(r => r.id === e.target.value)?.label}.`; })} className="border border-slate-300 rounded-lg px-2 py-1 text-xs bg-white">{cat.roles.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}</select> : <span>{m.roleLabel}</span>}</td>
                <td className="py-2.5 pr-3">{isAdmin ? <select value={m.branch?.id ?? ''} onChange={e => act(async () => { await gqlRequest(SET_BRANCH_MUTATION, { id: m.id, b: e.target.value || null }); return `${m.fullName} moved to ${e.target.value ? activeBranches.find(b => b.id === e.target.value)?.name : 'organisation-wide'}.`; })} className="border border-slate-300 rounded-lg px-2 py-1 text-xs bg-white"><option value="">Org-wide</option>{activeBranches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select> : <span className="text-slate-600">{m.branch?.name ?? 'Org-wide'}</span>}</td>
                <td className="py-2.5 pr-3 text-xs text-slate-600">{m.isOrgAdmin ? <span className="text-emerald-700 font-semibold">Full access</span> : <>{mods} of {cat.modules.length} modules{m.hasOverride && <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">custom</span>}</>}</td>
                <td className="py-2.5 pr-3"><span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${m.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{m.isActive ? 'Active' : 'Deactivated'}</span></td>
                <td className="py-2.5 whitespace-nowrap">{isAdmin && (
                  <div className="flex items-center gap-1">
                    {!m.isOrgAdmin && <button onClick={() => setEditing(m)} title="Permissions" className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-900"><Shield className="w-4 h-4" /></button>}
                    {m.id !== meId && <button onClick={() => act(async () => { await gqlRequest(SET_ADMIN_MUTATION, { id: m.id, a: !m.isOrgAdmin }); return `${m.fullName} ${m.isOrgAdmin ? 'is no longer' : 'is now'} an administrator.`; })} title={m.isOrgAdmin ? 'Remove administrator' : 'Make administrator'} className={`p-1.5 rounded-lg border border-slate-200 ${m.isOrgAdmin ? 'text-emerald-600' : 'text-slate-400 hover:text-emerald-600'}`}><ShieldCheck className="w-4 h-4" /></button>}
                    {m.id !== meId && (m.isActive
                      ? <button onClick={() => confirm(`Deactivate ${m.fullName}? They will no longer be able to sign in.`) && act(async () => { await gqlRequest(DEACTIVATE_MUTATION, { id: m.id }); return `${m.fullName} deactivated.`; })} title="Deactivate" className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-red-600"><UserX className="w-4 h-4" /></button>
                      : <button onClick={() => act(async () => { await gqlRequest(ACTIVATE_MUTATION, { id: m.id }); return `${m.fullName} reactivated.`; })} title="Reactivate" className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-green-600"><UserCheck className="w-4 h-4" /></button>)}
                  </div>
                )}</td>
              </tr>
            );
          })}</tbody>
        </table></div>
      </div>
      {editing && <PermissionEditor cat={cat} member={editing} btn={btn} onClose={() => setEditing(null)} onSaved={async (t) => { setEditing(null); await act(async () => t); }} />}
    </div>
  );
}

// ─── Permission editor ───────────────────────────────────────────────────────

function PermissionEditor({ cat, member, btn, onClose, onSaved }: { cat: RoleCatalogue; member: TeamMember; btn: string; onClose: () => void; onSaved: (t: string) => Promise<void> }) {
  const [matrix, setMatrix] = useState<PermMatrix>(() => JSON.parse(JSON.stringify(member.permissions)));
  const [busy, setBusy] = useState(false);
  const roleDefault = cat.roles.find(r => r.id === member.role)?.defaultPermissions ?? {};
  const groups = useMemo(() => [...new Set(cat.modules.map(m => m.group))], [cat]);
  const toggle = (mod: string, a: Action) => setMatrix(x => {
    const cur = new Set(x[mod] ?? []);
    if (cur.has(a)) { cur.delete(a); if (a === 'view') cur.clear(); } else { cur.add(a); cur.add('view'); }
    return { ...x, [mod]: cat.actions.filter(k => cur.has(k)) };
  });
  const toggleModule = (mod: string) => setMatrix(x => ({ ...x, [mod]: (x[mod] ?? []).length ? [] : [...cat.actions] }));
  async function save() {
    setBusy(true);
    try { await gqlRequest(SET_PERMISSIONS_MUTATION, { id: member.id, p: JSON.stringify(matrix) }); await onSaved(`Permissions saved for ${member.fullName}.`); }
    catch (e: any) { await onSaved(e?.message); } finally { setBusy(false); }
  }
  async function reset() { setBusy(true); try { await gqlRequest(RESET_PERMISSIONS_MUTATION, { id: member.id }); await onSaved(`${member.fullName} reset to the ${member.roleLabel} default.`); } finally { setBusy(false); } }
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div><h3 className="font-semibold text-slate-900">{member.fullName} — module permissions</h3><p className="text-xs text-slate-500">Role: {member.roleLabel}. Ticking anything creates a custom matrix for this person; “Reset” returns to the role default.</p></div>
          <button onClick={onClose}><X className="w-4 h-4 text-slate-500" /></button>
        </div>
        <div className="overflow-x-auto"><table className="w-full text-sm">
          <thead><tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 border-b border-slate-200"><th className="py-2 pr-3 font-medium">Module</th>{cat.actions.map(a => <th key={a} className="py-2 px-2 font-medium text-center">{title(a)}</th>)}<th className="py-2 pl-2 font-medium text-center">All</th></tr></thead>
          <tbody>{groups.map(g => (
            <React.Fragment key={g}>
              <tr><td colSpan={cat.actions.length + 2} className="pt-3 pb-1 text-[10px] uppercase tracking-wider text-slate-400">{g}</td></tr>
              {cat.modules.filter(m => m.group === g).map(m => {
                const cur = matrix[m.id] ?? [];
                const isDefault = JSON.stringify([...cur].sort()) === JSON.stringify([...(roleDefault[m.id] ?? [])].sort());
                return (
                  <tr key={m.id} className="border-b border-slate-100">
                    <td className="py-1.5 pr-3 text-slate-800">{m.label}{!isDefault && <span className="ml-1 text-[10px] text-amber-600">•</span>}</td>
                    {cat.actions.map(a => <td key={a} className="py-1.5 px-2 text-center"><input type="checkbox" checked={cur.includes(a)} onChange={() => toggle(m.id, a)} /></td>)}
                    <td className="py-1.5 pl-2 text-center"><button onClick={() => toggleModule(m.id)} className="text-[11px] text-slate-500 hover:text-slate-900">{cur.length === cat.actions.length ? 'none' : 'all'}</button></td>
                  </tr>
                );
              })}
            </React.Fragment>
          ))}</tbody>
        </table></div>
        <div className="flex items-center justify-between gap-2">
          <button onClick={reset} disabled={busy} className="inline-flex items-center gap-1 px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 disabled:opacity-50"><RotateCcw className="w-4 h-4" /> Reset to role default</button>
          <div className="flex gap-2"><button onClick={onClose} className="px-4 py-2 border border-slate-300 rounded-lg text-sm">Cancel</button><button onClick={save} disabled={busy} className={`px-4 py-2 text-white rounded-lg text-sm font-medium disabled:opacity-50 ${btn}`}>{busy ? 'Saving…' : 'Save permissions'}</button></div>
        </div>
      </div>
    </div>
  );
}

// ─── Branches ────────────────────────────────────────────────────────────────

function BranchesTab({ cat, branches, isAdmin, btn, act }: { cat: RoleCatalogue; branches: Branch[]; isAdmin: boolean; btn: string; act: (fn: () => Promise<string>) => Promise<void> }) {
  const empty = { name: '', code: '', kind: cat.branchKinds[0]?.[0] ?? 'site', province: '', district: '', address: '', phone: '', isHeadquarters: false };
  const [form, setForm] = useState<typeof empty & { id?: string }>(empty);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof empty) => (e: React.ChangeEvent<any>) => setForm(x => ({ ...x, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  async function save(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    const { id, ...i } = form;
    try { await act(async () => { if (id) { await gqlRequest(UPDATE_BRANCH_MUTATION, { id, i }); return `${i.name} updated.`; } await gqlRequest(CREATE_BRANCH_MUTATION, { i }); return `${i.name} created.`; }); setOpen(false); setForm(empty); }
    finally { setBusy(false); }
  }
  const hint: Record<string, string> = { farm: 'Farm sites, pack-houses and outlets. Members can be assigned to a site.', government: 'HQ, provincial and district offices, camps. Members of a district office or camp only see and act on their own district; provincial members see their province; HQ sees the nation.', ngo: 'Country office and field offices / project sites.', donor: 'Country office and field offices / project sites.' };
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h3 className="font-semibold text-slate-900 flex items-center gap-2"><Building2 className="w-4 h-4" /> Branches</h3><p className="text-xs text-slate-500">{hint[cat.orgType]}</p></div>
        {isAdmin && <button onClick={() => { setForm(empty); setOpen(v => !v); }} className={`inline-flex items-center gap-1 px-3 py-2 text-white rounded-lg text-sm font-medium ${btn}`}><Plus className="w-4 h-4" /> Add branch</button>}
      </div>
      {open && (
        <form onSubmit={save} className="grid md:grid-cols-4 gap-2 p-3 bg-slate-50 rounded-xl">
          <input value={form.name} onChange={set('name')} placeholder="Branch name" className={`${inputCls} md:col-span-2`} required />
          <select value={form.kind} onChange={set('kind')} className={`${inputCls} bg-white`}>{cat.branchKinds.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
          <input value={form.code} onChange={set('code')} placeholder="Code (optional)" className={inputCls} />
          <input value={form.province} onChange={set('province')} placeholder="Province" className={inputCls} />
          <input value={form.district} onChange={set('district')} placeholder="District" className={inputCls} />
          <input value={form.address} onChange={set('address')} placeholder="Address" className={inputCls} />
          <input value={form.phone} onChange={set('phone')} placeholder="Phone" className={inputCls} />
          <label className="text-xs text-slate-600 inline-flex items-center gap-1.5 md:col-span-3"><input type="checkbox" checked={form.isHeadquarters} onChange={set('isHeadquarters')} /> Headquarters — members here are organisation-wide, not scoped to a district</label>
          <button type="submit" disabled={busy} className={`px-4 py-2 text-white rounded-lg text-sm font-medium disabled:opacity-50 ${btn}`}>{busy ? 'Saving…' : form.id ? 'Save branch' : 'Create branch'}</button>
        </form>
      )}
      {!branches.length ? <p className="text-sm text-slate-400 text-center py-6">No branches yet — the whole organisation acts as one unit.</p> : (
        <ul className="divide-y divide-slate-100">{branches.map(b => (
          <li key={b.id} className={`py-3 flex flex-wrap items-center gap-3 ${!b.isActive ? 'opacity-50' : ''}`}>
            <div className="flex-1 min-w-0"><div className="font-medium text-slate-900">{b.name}{b.isHeadquarters && <span className="ml-2 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-800 text-white">HQ</span>}{b.code && <span className="ml-2 text-xs text-slate-400">{b.code}</span>}</div><div className="text-xs text-slate-500">{b.kindDisplay}{(b.district || b.province) && ` · ${[b.district, b.province].filter(Boolean).join(', ')}`}{b.address && ` · ${b.address}`} · {b.memberCount} member{b.memberCount === 1 ? '' : 's'}</div></div>
            {isAdmin && <div className="flex gap-1">
              <button onClick={() => { setForm({ id: b.id, name: b.name, code: b.code, kind: b.kind, province: b.province, district: b.district, address: b.address, phone: b.phone, isHeadquarters: b.isHeadquarters }); setOpen(true); }} className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700">Edit</button>
              <button onClick={() => act(async () => { await gqlRequest(UPDATE_BRANCH_MUTATION, { id: b.id, i: { isActive: !b.isActive } }); return `${b.name} ${b.isActive ? 'deactivated' : 'reactivated'}.`; })} className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700">{b.isActive ? 'Deactivate' : 'Reactivate'}</button>
              {b.memberCount === 0 && <button onClick={() => confirm(`Delete ${b.name}?`) && act(async () => { await gqlRequest(DELETE_BRANCH_MUTATION, { id: b.id }); return `${b.name} deleted.`; })} className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-red-600">Delete</button>}
            </div>}
          </li>
        ))}</ul>
      )}
    </div>
  );
}

// ─── Audit ───────────────────────────────────────────────────────────────────

function AuditTab({ isAdmin }: { isAdmin: boolean }) {
  const [rows, setRows] = useState<AuditEntry[] | null>(null);
  const [err, setErr] = useState('');
  useEffect(() => { if (isAdmin) gqlRequest<{ accessAuditLog: AuditEntry[] }>(AUDIT_QUERY).then(r => setRows(r.accessAuditLog.map(x => ({ ...x, detail: parseJson(x.detail, {}) })))).catch(e => setErr(e?.message)); }, [isAdmin]);
  if (!isAdmin) return <p className="text-sm text-slate-400 bg-white rounded-xl border border-slate-200 p-6">Only administrators can view the audit log.</p>;
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h3 className="font-semibold text-slate-900 mb-3">Access audit log</h3>
      {err && <p className="text-sm text-red-700">{err}</p>}
      {!rows ? <p className="text-sm text-slate-400">Loading…</p> : !rows.length ? <p className="text-sm text-slate-400">No changes recorded yet.</p> : (
        <ul className="divide-y divide-slate-100 text-sm">{rows.map(r => (
          <li key={r.id} className="py-2 flex flex-wrap gap-x-3 gap-y-0.5"><span className="text-xs text-slate-400 w-36">{new Date(r.createdAt).toLocaleString()}</span><span className="font-medium text-slate-800">{title(r.action)}</span><span className="text-slate-600">by {r.actorName}{r.targetName && <> → {r.targetName}</>}</span>{Object.keys(r.detail || {}).length > 0 && <span className="text-xs text-slate-400">{Object.entries(r.detail).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v ?? '—'}`).join(' · ')}</span>}</li>
        ))}</ul>
      )}
    </div>
  );
}
