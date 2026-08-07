import React, { useState } from 'react';
import {
  ShieldCheck, Brain, BarChart3, Smartphone, Globe, Zap, CheckCircle2,
  ArrowRight, Star, Bird, Fish, Sprout, Users, TrendingUp, Lock, Check,
} from 'lucide-react';
import { MODULE_CATALOG, PLAN_BUNDLES, calcPrice, type PlanBundle } from '@/lib/subscriptionData';

interface LandingProps {
  onLaunchApp: () => void;
  onAdminLogin: () => void;
  onSignIn?: () => void;
  onSignUp?: () => void;
  isAuthed?: boolean;
  userName?: string;
}

export default function Landing({ onLaunchApp, onAdminLogin, onSignIn, onSignUp, isAuthed, userName }: LandingProps) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  async function handleSubscribe(e: React.FormEvent, source: string) {
    e.preventDefault();
    if (!email) return;
    try {
      await fetch('https://famous.ai/api/crm/69fd480a6269afb4fdd032f5/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source, tags: ['farmpulse', 'waitlist', 'newsletter'] }),
      });
    } catch (e) {}
    setSubmitted(true);
    setEmail('');
    setTimeout(() => setSubmitted(false), 4000);
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-slate-100 sticky top-0 bg-white/95 backdrop-blur z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div className="font-bold text-lg">FarmPulse</div>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-slate-600">
            <a href="#features" className="hover:text-green-600">Features</a>
            <a href="#enterprises" className="hover:text-green-600">Enterprises</a>
            <a href="#pricing" className="hover:text-green-600">Pricing</a>
            <a href="#smart" className="hover:text-green-600">AI Engine</a>
          </nav>
          <div className="flex items-center gap-2">
            {isAuthed ? (
              <>
                <span className="hidden md:block text-xs text-slate-600">Hi, {userName?.split(' ')[0] || 'there'}</span>
                <button onClick={onAdminLogin} className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-md">SaaS Admin</button>
                <button onClick={onLaunchApp} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">Open App</button>
              </>
            ) : (
              <>
                <button onClick={onSignIn} className="px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100 rounded-md">Sign in</button>
                <button onClick={onSignUp} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">Get Started</button>
              </>
            )}
          </div>
        </div>
      </header>


      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-white to-emerald-50" />
        <div className="relative max-w-7xl mx-auto px-6 py-20 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold mb-5">
              <Zap className="w-3 h-3" /> AI-powered • Built for African agribusiness
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight">
              The complete<br />
              <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">operating system</span><br />
              for modern farms
            </h1>
            <p className="mt-6 text-lg text-slate-600 max-w-lg">
              FarmPulse unifies poultry, piggery, fish, horticulture and more into one intelligent platform — with smart feeding, real-time analytics, and end-to-end financials.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button onClick={onLaunchApp} className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 flex items-center gap-2">
                Try Live Demo <ArrowRight className="w-4 h-4" />
              </button>
              <button onClick={() => document.getElementById('pricing')?.scrollIntoView({behavior: 'smooth'})} className="px-6 py-3 border border-slate-200 rounded-lg font-medium hover:bg-slate-50">
                See Pricing
              </button>
            </div>
            <div className="mt-8 flex items-center gap-6 text-sm text-slate-500">
              <div className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-500" /> 14-day free trial</div>
              <div className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-500" /> No credit card</div>
            </div>
          </div>

          <div className="relative">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-semibold text-slate-700">Live Dashboard Preview</div>
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-red-400 rounded-full" />
                  <div className="w-2 h-2 bg-amber-400 rounded-full" />
                  <div className="w-2 h-2 bg-green-400 rounded-full" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <MiniStat label="Revenue" value="$761K" up />
                <MiniStat label="FCR" value="1.65" up />
                <MiniStat label="Mortality" value="2.4%" />
              </div>
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 mb-3">
                <div className="text-xs text-slate-500 mb-2">Today's Smart Feed Plan</div>
                <div className="flex items-end gap-2 h-24">
                  {[40, 65, 50, 80, 70, 90, 75].map((h, i) => (
                    <div key={i} className="flex-1 bg-gradient-to-t from-green-500 to-emerald-400 rounded-t" style={{ height: `${h}%` }} />
                  ))}
                </div>
              </div>
              <div className="flex gap-2 text-xs">
                <div className="flex-1 p-2 bg-blue-50 rounded">📊 1,840kg feed</div>
                <div className="flex-1 p-2 bg-cyan-50 rounded">💧 4,200L water</div>
              </div>
            </div>
            <div className="absolute -bottom-4 -right-4 bg-purple-600 text-white rounded-xl p-3 shadow-xl text-sm flex items-center gap-2">
              <Brain className="w-4 h-4" /> 6 AI insights ready
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-slate-100 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <Stat value="120+" label="Active farms" />
          <Stat value="$24M" label="Tracked annually" />
          <Stat value="14" label="African countries" />
          <Stat value="99.7%" label="Uptime SLA" />
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Everything your farm needs</h2>
          <p className="mt-3 text-slate-600">18 fully integrated modules. One platform. Zero spreadsheets.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: Brain, title: 'Smart AI Engine', desc: 'Auto-recommends daily feed, water, and growth targets per batch by age & breed.', color: 'bg-purple-100 text-purple-600' },
            { icon: BarChart3, title: 'Live Dashboards', desc: 'Real-time KPIs: FCR, mortality, revenue, and 12+ metrics across all enterprises.', color: 'bg-blue-100 text-blue-600' },
            { icon: TrendingUp, title: 'Profitability per Batch', desc: 'Track cost, revenue, and profit for every single production cycle.', color: 'bg-green-100 text-green-600' },
            { icon: ShieldCheck, title: 'Biosecurity & Vet', desc: 'Vaccination schedules, disease tracking, and quarantine management built-in.', color: 'bg-red-100 text-red-600' },
            { icon: Smartphone, title: 'Offline Mobile App', desc: 'Field workers capture data without internet. Auto-syncs when reconnected.', color: 'bg-amber-100 text-amber-600' },
            { icon: Globe, title: 'Cross-Border Export', desc: 'COMESA documentation, FX management, and DRC logistics out-of-the-box.', color: 'bg-cyan-100 text-cyan-600' },
          ].map((f, i) => {
            const Icon = f.icon;
            return (
              <div key={i} className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                <div className={`w-12 h-12 rounded-lg ${f.color} flex items-center justify-center mb-4`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-slate-600">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Smart engine highlight */}
      <section id="smart" className="bg-gradient-to-br from-purple-700 via-indigo-700 to-blue-700 text-white">
        <div className="max-w-7xl mx-auto px-6 py-20 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-semibold mb-5">
              <Brain className="w-3 h-3" /> AI Operations Engine
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Stop guessing. Start optimizing.</h2>
            <p className="text-blue-100 mb-6">FarmPulse calculates daily feeding quantities, water requirements, vaccination schedules, and growth targets — automatically tailored to each batch's age, breed, and weight.</p>
            <ul className="space-y-3">
              {[
                'Daily feed quantity per batch & per animal',
                'Water-to-feed ratio monitoring with anomaly alerts',
                'Predictive disease outbreak detection',
                'Auto feed-stage transitions (Starter → Grower → Finisher)',
                'Inventory forecasting up to 90 days ahead',
                'AI-driven harvest & market timing recommendations',
              ].map((b, i) => (
                <li key={i} className="flex items-start gap-2"><CheckCircle2 className="w-5 h-5 text-green-300 flex-shrink-0 mt-0.5" />{b}</li>
              ))}
            </ul>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { stage: 'Pre-starter', age: 'Day 1-7', feed: '18g', water: '36ml' },
              { stage: 'Starter', age: 'Day 8-14', feed: '55g', water: '110ml' },
              { stage: 'Grower', age: 'Day 15-28', feed: '110g', water: '220ml' },
              { stage: 'Finisher', age: 'Day 29+', feed: '165g', water: '330ml' },
            ].map((s, i) => (
              <div key={i} className="bg-white/10 backdrop-blur rounded-lg p-4">
                <div className="text-xs text-blue-200">{s.age}</div>
                <div className="font-semibold">{s.stage}</div>
                <div className="mt-3 text-sm space-y-1">
                  <div>🌾 {s.feed}/bird</div>
                  <div>💧 {s.water}/bird</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enterprises */}
      <section id="enterprises" className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Built for every kind of farm</h2>
          <p className="mt-3 text-slate-600">7 production enterprises • Each with smart feeding & lifecycle tracking</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Bird, name: 'Broiler Poultry', desc: 'Commercial broiler' },
            { icon: Bird, name: 'Village Chicken', desc: 'Free-range flocks' },
            { icon: Bird, name: 'Piggery', desc: 'Breeding & finishing' },
            { icon: Fish, name: 'Fish Farming', desc: 'Pond aquaculture' },
            { icon: Bird, name: 'Duck Mgmt', desc: 'Meat & eggs' },
            { icon: Sprout, name: 'Goats & Sheep', desc: 'Small ruminants' },
            { icon: Sprout, name: 'Horticulture', desc: 'Veggies & crops' },
            { icon: Users, name: 'Custom Enterprise', desc: 'Add your own' },
          ].map((e, i) => {
            const Icon = e.icon;
            return (
              <div key={i} className="bg-white border border-slate-200 rounded-xl p-5 text-center hover:border-green-400 hover:shadow-md transition-all">
                <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Icon className="w-6 h-6 text-green-600" />
                </div>
                <div className="font-semibold text-sm">{e.name}</div>
                <div className="text-xs text-slate-500 mt-0.5">{e.desc}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Pricing */}
      <PricingSection onSignUp={onSignUp ?? onLaunchApp} />

      {/* Testimonials */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">Trusted by Africa's leading agribusinesses</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { quote: 'FarmPulse cut our feed wastage by 22% in the first 90 days. The AI feeding engine pays for itself.', name: 'Joseph Mwansa', role: 'GM, Afrivera Investments', country: 'Zambia' },
            { quote: 'We finally have visibility across 4 enterprises. Mortality is down, profits are up. Game changer.', name: 'Folake Adeyemi', role: 'CEO, Lagos Fresh', country: 'Nigeria' },
            { quote: 'The DRC export module saves us 15+ hours per shipment on paperwork alone. Brilliant.', name: 'Patrice Mbala', role: 'Director, Kinshasa Poultry', country: 'DR Congo' },
          ].map((t, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-xl p-6">
              <div className="flex gap-1 mb-3">{[...Array(5)].map((_, j) => <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />)}</div>
              <p className="text-slate-700 mb-4">"{t.quote}"</p>
              <div className="text-sm">
                <div className="font-semibold">{t.name}</div>
                <div className="text-slate-500 text-xs">{t.role} • {t.country}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-br from-green-600 to-emerald-700 text-white">
        <div className="max-w-4xl mx-auto px-6 py-16 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to transform your farm operations?</h2>
          <p className="text-green-100 mb-8">Get early access updates and a personalized onboarding session.</p>
          <form onSubmit={(e) => handleSubscribe(e, 'cta-section')} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@farm.com"
              className="flex-1 px-4 py-3 rounded-lg text-slate-900 focus:outline-none"
            />
            <button type="submit" className="px-6 py-3 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800">
              Get Early Access
            </button>
          </form>
          {submitted && <div className="mt-3 text-sm text-green-100">✓ You're on the list! We'll be in touch.</div>}
          <button onClick={onLaunchApp} className="mt-6 text-sm underline">Or skip and try the live demo →</button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300">
        <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-5 gap-8">
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-white" />
              </div>
              <div className="font-bold text-white">FarmPulse</div>
            </div>
            <p className="text-sm text-slate-400 max-w-sm">The complete operations management platform for modern African agribusiness. Built by farmers, for farmers.</p>
            <form onSubmit={(e) => handleSubscribe(e, 'footer-signup')} className="mt-4 flex gap-2 max-w-sm">
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Newsletter email" className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-sm text-white" />
              <button className="px-3 py-2 bg-green-600 text-white rounded-md text-sm">Subscribe</button>
            </form>
          </div>
          <FooterCol title="Product" links={['Features', 'Pricing', 'Mobile App', 'Smart AI', 'Integrations']} />
          <FooterCol title="Company" links={['About', 'Blog', 'Careers', 'Press', 'Contact']} />
          <FooterCol title="Resources" links={['Documentation', 'Help Center', 'API', 'Status', 'Security']} />
        </div>
        <div className="border-t border-slate-800 px-6 py-4 max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center text-xs text-slate-500">
          <div>© 2026 FarmPulse Technologies Ltd. All rights reserved.</div>
          <div className="flex gap-4 mt-2 md:mt-0">
            <a href="#" className="hover:text-white">Terms</a>
            <a href="#" className="hover:text-white">Privacy</a>
            <a href="#" className="hover:text-white">Cookies</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ─── Interactive Pricing Section ──────────────────────────────────────────────

const GROUPS = Array.from(new Set(MODULE_CATALOG.filter(m => !m.isCore).map(m => m.group)));

function PricingSection({ onSignUp }: { onSignUp: () => void }) {
  const [mode, setMode] = useState<'bundles' | 'custom'>('bundles');
  const [selectedBundle, setSelectedBundle] = useState<string>('professional');
  const [selectedModules, setSelectedModules] = useState<Set<string>>(
    new Set(PLAN_BUNDLES.find(p => p.id === 'professional')!.modules)
  );

  function selectBundle(b: PlanBundle) {
    setSelectedBundle(b.id);
    setSelectedModules(new Set(b.modules));
    setMode('bundles');
  }

  function toggleModule(id: string) {
    const m = MODULE_CATALOG.find(m => m.id === id);
    if (!m || m.isCore) return;
    setSelectedModules(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
    setSelectedBundle('custom');
    setMode('custom');
  }

  const customPrice = calcPrice(Array.from(selectedModules));
  const moduleCount = Array.from(selectedModules).filter(id => {
    const m = MODULE_CATALOG.find(m => m.id === id);
    return m && !m.isCore;
  }).length;

  return (
    <section id="pricing" className="bg-slate-50 py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold mb-4">
            <Zap className="w-3 h-3" /> Module-based pricing — pay only for what you use
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Build your perfect plan</h2>
          <p className="mt-3 text-slate-600">Start with a bundle or pick modules individually. 14-day free trial on every plan.</p>
        </div>

        {/* Toggle */}
        <div className="flex justify-center mb-8">
          <div className="bg-white border border-slate-200 rounded-xl p-1 flex gap-1">
            <button onClick={() => setMode('bundles')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'bundles' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-700'}`}>Bundle Plans</button>
            <button onClick={() => setMode('custom')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'custom' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-700'}`}>Build Custom</button>
          </div>
        </div>

        {mode === 'bundles' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {PLAN_BUNDLES.map(plan => {
              const nonCore = plan.modules.filter(id => {
                const m = MODULE_CATALOG.find(m => m.id === id);
                return m && !m.isCore;
              });
              const fullPrice = calcPrice(nonCore);
              const saving = fullPrice - plan.flatPrice;
              const isSelected = selectedBundle === plan.id;
              return (
                <div key={plan.id} onClick={() => selectBundle(plan)} className={`bg-white rounded-2xl p-6 cursor-pointer transition-all relative ${plan.popular ? 'ring-2 ring-green-500 shadow-lg' : isSelected ? 'ring-2 ring-indigo-400' : 'border border-slate-200 hover:border-slate-300 hover:shadow-md'}`}>
                  {plan.popular && <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 bg-green-600 text-white text-xs rounded-full font-semibold">Most Popular</div>}
                  {isSelected && !plan.popular && <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 bg-indigo-600 text-white text-xs rounded-full font-semibold">Selected</div>}
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-bold text-lg text-slate-900">{plan.name}</div>
                      <div className="text-xs text-slate-500">{plan.description}</div>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'}`}>
                      {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                    </div>
                  </div>
                  <div className="mt-4 mb-1">
                    <span className="text-4xl font-bold text-slate-900">${plan.flatPrice}</span>
                    <span className="text-slate-500 text-sm">/month</span>
                  </div>
                  {saving > 0 && <div className="text-xs text-green-600 font-medium mb-3">Save ${saving}/mo vs. custom</div>}
                  <div className="text-xs text-slate-500 mb-4">{plan.maxUsers === -1 ? 'Unlimited users' : `Up to ${plan.maxUsers} users`} · {nonCore.length} modules</div>
                  <div className="space-y-1.5 mb-5">
                    {nonCore.slice(0, 6).map(id => {
                      const m = MODULE_CATALOG.find(m => m.id === id);
                      return m ? <div key={id} className="flex items-center gap-2 text-xs text-slate-600"><CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />{m.label}</div> : null;
                    })}
                    {nonCore.length > 6 && <div className="text-xs text-slate-400">+{nonCore.length - 6} more modules</div>}
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); onSignUp(); }} className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-colors ${plan.popular ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-slate-900 hover:bg-slate-800 text-white'}`}>
                    Start 14-day free trial
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {mode === 'custom' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Module picker */}
            <div className="lg:col-span-2 space-y-5">
              {GROUPS.map(group => (
                <div key={group} className="bg-white rounded-2xl border border-slate-200 p-5">
                  <div className="text-sm font-bold text-slate-700 mb-3">{group}</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {MODULE_CATALOG.filter(m => m.group === group && !m.isCore).map(mod => {
                      const on = selectedModules.has(mod.id);
                      return (
                        <button key={mod.id} onClick={() => toggleModule(mod.id)} className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${on ? 'bg-green-50 border-green-300' : 'bg-slate-50 border-slate-200 hover:border-slate-300'}`}>
                          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${on ? 'bg-green-500 border-green-500' : 'border-slate-300'}`}>
                            {on && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-slate-800">{mod.label}</div>
                            <div className="text-[11px] text-slate-500 mt-0.5">{mod.description}</div>
                          </div>
                          <div className="text-sm font-bold text-slate-700 flex-shrink-0">${mod.price}<span className="text-xs font-normal text-slate-400">/mo</span></div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Sticky price summary */}
            <div className="lg:sticky lg:top-20 h-fit">
              <div className="bg-slate-900 rounded-2xl p-6 text-white">
                <div className="text-sm text-slate-400 mb-1">Your custom plan</div>
                <div className="text-5xl font-bold mb-1">${customPrice}</div>
                <div className="text-slate-400 text-sm mb-4">/month · {moduleCount} module{moduleCount !== 1 ? 's' : ''}</div>
                <div className="space-y-1.5 mb-5 max-h-48 overflow-y-auto pr-1">
                  {Array.from(selectedModules).map(id => {
                    const m = MODULE_CATALOG.find(m => m.id === id);
                    if (!m || m.isCore) return null;
                    return (
                      <div key={id} className="flex justify-between text-sm">
                        <span className="text-slate-300 truncate">{m.label}</span>
                        <span className="text-slate-400 flex-shrink-0 ml-2">${m.price}</span>
                      </div>
                    );
                  })}
                  {MODULE_CATALOG.filter(m => m.isCore).map(m => (
                    <div key={m.id} className="flex justify-between text-sm">
                      <span className="text-slate-300 truncate">{m.label}</span>
                      <span className="text-green-400">Free</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-slate-700 pt-4 mb-4">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span><span>${customPrice}/mo</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">Billed monthly. Cancel anytime.</div>
                </div>
                <button onClick={onSignUp} className="w-full bg-green-500 hover:bg-green-400 text-white py-3 rounded-xl font-semibold">
                  Start 14-day free trial
                </button>
                <div className="text-center text-xs text-slate-500 mt-3">No credit card required</div>
              </div>
              <div className="mt-3 text-center text-xs text-slate-500">
                Need help choosing?{' '}
                <button onClick={() => setMode('bundles')} className="text-green-600 hover:underline">View bundles →</button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 text-center text-sm text-slate-500 flex items-center justify-center gap-6 flex-wrap">
          <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-500" />14-day free trial</span>
          <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-500" />No credit card required</span>
          <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-500" />Cancel anytime</span>
          <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-500" />Add or remove modules monthly</span>
        </div>
      </div>
    </section>
  );
}

function MiniStat({ label, value, up }: any) {
  return (
    <div className="bg-slate-50 rounded-lg p-2">
      <div className="text-[10px] text-slate-500">{label}</div>
      <div className="text-sm font-bold flex items-center gap-1">
        {value} {up && <span className="text-green-500 text-xs">↑</span>}
      </div>
    </div>
  );
}

function Stat({ value, label }: any) {
  return (
    <div>
      <div className="text-3xl md:text-4xl font-bold text-slate-900">{value}</div>
      <div className="text-sm text-slate-500 mt-1">{label}</div>
    </div>
  );
}

function FooterCol({ title, links }: any) {
  return (
    <div>
      <div className="font-semibold text-white text-sm mb-3">{title}</div>
      <ul className="space-y-2 text-sm">
        {links.map((l: string) => <li key={l}><a href="#" className="hover:text-white">{l}</a></li>)}
      </ul>
    </div>
  );
}
