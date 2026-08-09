import React, { useState } from 'react';
import { ArrowRight, ArrowLeft, Check, Building2, Globe, DollarSign, Sprout } from 'lucide-react';
import { useOrg } from '@/store/orgStore';
import { CATEGORIES, getTemplate } from '@/lib/templates';
import { EnterpriseConfig } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

const STEPS = ['Welcome', 'Your Business', 'What You Operate', 'Your Enterprises', 'Ready'];

const CURRENCIES = ['ZMW', 'USD', 'ZAR', 'KES', 'NGN', 'GHS', 'TZS', 'UGX', 'ETB', 'XOF'];
const COUNTRIES  = [
  'Zambia', 'South Africa', 'Nigeria', 'Kenya', 'Tanzania', 'Uganda',
  'Zimbabwe', 'Malawi', 'Mozambique', 'Ghana', 'Cameroon', 'Ethiopia',
  'Rwanda', 'DR Congo', 'Botswana', 'Namibia', 'Senegal', 'Côte d\'Ivoire',
  'Other',
];

const ENTERPRISE_COLORS = [
  'bg-amber-500', 'bg-blue-500', 'bg-green-500', 'bg-purple-500',
  'bg-red-500', 'bg-orange-500', 'bg-cyan-500', 'bg-pink-500',
];

interface PendingEnterprise {
  id: string;
  name: string;
  templateId: string;
  color: string;
}

export default function OnboardingWizard() {
  const { createOrg, addEnterprise, completeOnboarding } = useOrg();
  const [step, setStep]     = useState(0);
  const [orgName, setOrgName]   = useState('');
  const [country, setCountry]   = useState('Zambia');
  const [currency, setCurrency] = useState('ZMW');
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [enterprises, setEnterprises] = useState<PendingEnterprise[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function toggleCategory(id: string) {
    setSelectedCategories(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function addEnterprisePending(templateId: string, name: string) {
    setEnterprises(prev => [
      ...prev,
      { id: uuidv4(), name, templateId, color: ENTERPRISE_COLORS[prev.length % ENTERPRISE_COLORS.length] },
    ]);
  }

  function removeEnterprisePending(id: string) {
    setEnterprises(prev => prev.filter(e => e.id !== id));
  }

  function updateEnterpriseName(id: string, name: string) {
    setEnterprises(prev => prev.map(e => e.id === id ? { ...e, name } : e));
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (step === 1 && !orgName.trim()) errs.orgName = 'Business name is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function next() {
    if (!validate()) return;
    if (step === 1) {
      createOrg(orgName.trim(), country, currency);
    }
    setStep(s => s + 1);
  }

  function finish() {
    // Save all enterprises
    enterprises.forEach(e => {
      addEnterprise({
        name: e.name,
        templateId: e.templateId,
        color: e.color,
        active: true,
      });
    });
    completeOnboarding();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex flex-col">
      {/* Header */}
      <div className="border-b border-slate-100 bg-white/80 backdrop-blur px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
            <Sprout className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-slate-900">AgroNexus</span>
        </div>
        {/* Step dots */}
        <div className="flex items-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s} className={`flex items-center gap-1 text-xs font-medium transition-colors ${i <= step ? 'text-green-600' : 'text-slate-400'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all ${
                i < step ? 'bg-green-500 text-white' :
                i === step ? 'bg-green-600 text-white ring-4 ring-green-100' :
                'bg-slate-200 text-slate-500'
              }`}>
                {i < step ? <Check className="w-3 h-3" /> : i + 1}
              </div>
              <span className="hidden sm:block">{s}</span>
              {i < STEPS.length - 1 && <div className="w-6 h-px bg-slate-200 ml-1" />}
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-start justify-center px-4 py-12">
        <div className="w-full max-w-3xl">

          {/* ── Step 0: Welcome ── */}
          {step === 0 && (
            <div className="text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-green-200">
                <Sprout className="w-12 h-12 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-slate-900 mb-4">Welcome to AgroNexus</h1>
              <p className="text-lg text-slate-600 max-w-xl mx-auto mb-2">
                The operating platform for <strong>any agricultural business</strong> — farms, processors, cooperatives, and service providers.
              </p>
              <p className="text-slate-500 max-w-lg mx-auto mb-10">
                This 4-step setup takes under 2 minutes. You'll configure your business and the platform adapts everything for you.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-xl mx-auto mb-10 text-left">
                {[
                  { icon: '🌱', title: 'Any enterprise', desc: 'Poultry, cattle, fish, crops, processing...' },
                  { icon: '⚙️', title: 'Auto-configured', desc: 'Dashboard, stages, and KPIs set up for you.' },
                  { icon: '📈', title: 'Grow together', desc: 'Add more enterprises any time.' },
                ].map(f => (
                  <div key={f.title} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                    <div className="text-2xl mb-2">{f.icon}</div>
                    <div className="font-semibold text-sm text-slate-800">{f.title}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{f.desc}</div>
                  </div>
                ))}
              </div>
              <button onClick={() => setStep(1)} className="px-8 py-3 bg-green-600 text-white rounded-xl font-semibold text-base hover:bg-green-700 flex items-center gap-2 mx-auto">
                Get started <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ── Step 1: Business details ── */}
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-1">Tell us about your business</h2>
              <p className="text-slate-500 mb-8">This sets the name, location, and currency across the platform.</p>
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Business / Farm Name *</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={orgName}
                      onChange={e => { setOrgName(e.target.value); setErrors({}); }}
                      placeholder="e.g. Sunrise Poultry Farm, Green Valley Agri..."
                      className={`w-full pl-9 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${errors.orgName ? 'border-red-400' : 'border-slate-300'}`}
                    />
                  </div>
                  {errors.orgName && <p className="text-xs text-red-500 mt-1">{errors.orgName}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      <Globe className="inline w-3.5 h-3.5 mr-1" />Country
                    </label>
                    <select value={country} onChange={e => setCountry(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                      {COUNTRIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      <DollarSign className="inline w-3.5 h-3.5 mr-1" />Currency
                    </label>
                    <select value={currency} onChange={e => setCurrency(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                      {CURRENCIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <StepNav onBack={() => setStep(0)} onNext={next} />
            </div>
          )}

          {/* ── Step 2: What do you operate? ── */}
          {step === 2 && (
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-1">What does your business operate?</h2>
              <p className="text-slate-500 mb-6">Select all that apply. You can add more later.</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
                {CATEGORIES.map(cat => {
                  const selected = selectedCategories.has(cat.id);
                  return (
                    <button
                      key={cat.id}
                      onClick={() => toggleCategory(cat.id)}
                      className={`relative text-left p-4 rounded-xl border-2 transition-all ${
                        selected
                          ? `${cat.bgClass} ${cat.borderClass} shadow-sm`
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {selected && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                      <div className="text-2xl mb-2">{cat.icon}</div>
                      <div className={`font-semibold text-sm ${selected ? cat.textClass : 'text-slate-700'}`}>{cat.label}</div>
                      <div className="text-xs text-slate-500 mt-0.5 leading-tight">{cat.description.split('...')[0]}...</div>
                    </button>
                  );
                })}
              </div>
              {selectedCategories.size === 0 && (
                <p className="text-amber-600 text-sm mb-4">Select at least one to continue.</p>
              )}
              <StepNav onBack={() => setStep(1)} onNext={() => { if (selectedCategories.size > 0) setStep(3); }} nextLabel="Configure enterprises" />
            </div>
          )}

          {/* ── Step 3: Configure enterprises ── */}
          {step === 3 && (
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-1">Configure your enterprises</h2>
              <p className="text-slate-500 mb-6">
                An <strong>enterprise</strong> is a specific operation you run — e.g. "Broiler House 1" or "5ha Tomato". Add one for each.
              </p>

              {/* Templates from selected categories */}
              <div className="space-y-4 mb-6">
                {CATEGORIES.filter(c => selectedCategories.has(c.id)).map(cat => (
                  <div key={cat.id} className="bg-white rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg">{cat.icon}</span>
                      <span className="font-semibold text-slate-800">{cat.label}</span>
                    </div>
                    {cat.templates.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {cat.templates.map(tpl => (
                          <button
                            key={tpl.id}
                            onClick={() => addEnterprisePending(tpl.id, tpl.name + ' 1')}
                            className="flex items-center gap-3 p-3 rounded-lg border border-dashed border-slate-300 hover:border-green-400 hover:bg-green-50 text-left transition-all group"
                          >
                            <span className="text-xl">{tpl.icon}</span>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-slate-700 group-hover:text-green-700">{tpl.name}</div>
                              <div className="text-xs text-slate-500 truncate">{tpl.description}</div>
                            </div>
                            <div className="text-green-500 opacity-0 group-hover:opacity-100 text-lg">+</div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">Templates coming soon — you can add a custom enterprise after setup.</p>
                    )}
                  </div>
                ))}
              </div>

              {/* Added enterprises */}
              {enterprises.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
                  <div className="font-semibold text-green-800 text-sm mb-3">
                    Added enterprises ({enterprises.length})
                  </div>
                  <div className="space-y-2">
                    {enterprises.map(e => {
                      const tpl = getTemplate(e.templateId);
                      return (
                        <div key={e.id} className="flex items-center gap-3 bg-white rounded-lg border border-green-200 p-3">
                          <span className="text-lg">{tpl?.icon ?? '🌱'}</span>
                          <input
                            type="text"
                            value={e.name}
                            onChange={ev => updateEnterpriseName(e.id, ev.target.value)}
                            className="flex-1 text-sm font-medium text-slate-800 bg-transparent border-b border-slate-200 focus:outline-none focus:border-green-500 py-0.5"
                          />
                          <span className="text-xs text-slate-400">{tpl?.shortName}</span>
                          <button
                            onClick={() => removeEnterprisePending(e.id)}
                            className="text-slate-400 hover:text-red-500 text-xs"
                          >✕</button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {enterprises.length === 0 && (
                <p className="text-amber-600 text-sm mb-4">Add at least one enterprise above to continue.</p>
              )}

              <StepNav
                onBack={() => setStep(2)}
                onNext={() => { if (enterprises.length > 0) setStep(4); }}
                nextLabel="Finish setup"
              />
            </div>
          )}

          {/* ── Step 4: Done ── */}
          {step === 4 && (
            <div className="text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl shadow-green-200">
                <Check className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 mb-3">You're all set!</h2>
              <p className="text-slate-600 mb-2 text-lg">
                Your AgroNexus workspace is ready with <strong>{enterprises.length} enterprise{enterprises.length !== 1 ? 's' : ''}</strong>.
              </p>
              <p className="text-slate-500 mb-8">
                Your dashboard, production engines, and tools are configured for your operations.
              </p>
              <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-8 max-w-md mx-auto text-left">
                <div className="text-sm font-semibold text-slate-600 mb-3">Your enterprises:</div>
                <div className="space-y-2">
                  {enterprises.map(e => {
                    const tpl = getTemplate(e.templateId);
                    return (
                      <div key={e.id} className="flex items-center gap-3">
                        <span className="text-xl">{tpl?.icon}</span>
                        <div>
                          <div className="text-sm font-semibold text-slate-800">{e.name}</div>
                          <div className="text-xs text-slate-400">{tpl?.name}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <button
                onClick={finish}
                className="px-10 py-3.5 bg-green-600 text-white rounded-xl font-semibold text-base hover:bg-green-700 flex items-center gap-2 mx-auto shadow-lg shadow-green-200"
              >
                Open my workspace <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Nav buttons ──────────────────────────────────────────────────────────────

function StepNav({ onBack, onNext, nextLabel = 'Continue' }: { onBack: () => void; onNext: () => void; nextLabel?: string }) {
  return (
    <div className="flex items-center justify-between mt-8">
      <button onClick={onBack} className="flex items-center gap-1 px-4 py-2 text-slate-600 hover:text-slate-900 text-sm">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>
      <button onClick={onNext} className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-xl font-semibold text-sm hover:bg-green-700">
        {nextLabel} <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
