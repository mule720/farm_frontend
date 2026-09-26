import { gqlRequest } from '@/lib/api';
import React, { useState } from 'react';
import { ArrowRight, ArrowLeft, Check, Building2, Globe, DollarSign, Sprout } from 'lucide-react';
import { useOrg } from '@/store/orgStore';
import { CATEGORIES, getTemplate } from '@/lib/templates';
import { BusinessType } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

// ─── Steps ────────────────────────────────────────────────────────────────────
const STEPS = ['Welcome', 'Business Type', 'Your Business', 'Setup', 'Ready'];

const CURRENCIES = ['ZMW', 'USD', 'ZAR', 'KES', 'NGN', 'GHS', 'TZS', 'UGX', 'ETB', 'XOF'];
const COUNTRIES  = [
  'Zambia', 'South Africa', 'Nigeria', 'Kenya', 'Tanzania', 'Uganda',
  'Zimbabwe', 'Malawi', 'Mozambique', 'Ghana', 'Cameroon', 'Ethiopia',
  'Rwanda', 'DR Congo', 'Botswana', 'Namibia', 'Senegal', "Côte d'Ivoire",
  'Other',
];

const ENTERPRISE_COLORS = [
  '#F59E0B', '#3B82F6', '#22C55E', '#8B5CF6',
  '#EF4444', '#F97316', '#06B6D4', '#EC4899',
];

// ─── Business type definitions ────────────────────────────────────────────────
const BUSINESS_TYPES: Array<{
  id: BusinessType;
  icon: string;
  label: string;
  desc: string;
  color: string;
}> = [
  { id: 'farmer',               icon: '🌾', label: 'Farmer / Farm',         desc: 'Manage crops, livestock, fish, and farm cycles', color: 'green' },
  { id: 'agro_dealer',          icon: '🏪', label: 'Agro Dealer',           desc: 'Sell seeds, fertilizers, pesticides & farm inputs', color: 'amber' },
  { id: 'vet_provider',         icon: '🩺', label: 'Vet / Animal Health',   desc: 'Veterinary services, consultations & treatments', color: 'blue' },
  { id: 'equipment_hire',       icon: '🚜', label: 'Equipment Hire',        desc: 'Rent out tractors, harvesters & machinery', color: 'orange' },
  { id: 'agrifood_seller',      icon: '🥦', label: 'AgriFood Seller',       desc: 'Sell fresh produce, food products & farm outputs', color: 'emerald' },
  { id: 'agrisupply_provider',  icon: '📦', label: 'AgriSupply Provider',   desc: 'Supply farm materials, packaging & logistics', color: 'purple' },
  { id: 'agriservices_provider',icon: '🔧', label: 'AgriServices Provider', desc: 'Irrigation, fencing, soil testing & other services', color: 'cyan' },
  { id: 'processor',            icon: '🏭', label: 'Agro Processor',        desc: 'Process raw farm produce into finished goods', color: 'red' },
  { id: 'transport',            icon: '🚚', label: 'Transport / Haulage',   desc: 'Move produce and inputs between farms, depots and markets', color: 'slate' },
  { id: 'cooperative',          icon: '🤝', label: 'Cooperative',           desc: 'Smallholder group running shared crops, livestock and marketing', color: 'lime' },
];

// Service/product category options for non-farmer vendors
const VENDOR_CATEGORIES: Record<string, string[]> = {
  agro_dealer: ['Seeds', 'Fertilizers', 'Pesticides', 'Animal Feeds', 'Farming Tools', 'Irrigation Supplies'],
  vet_provider: ['General Vet Consults', 'Vaccination Programs', 'Surgery', 'Lab Diagnostics', 'Farm Visits', 'Livestock Nutrition'],
  equipment_hire: ['Tractors', 'Ploughing', 'Planters', 'Harvesters', 'Irrigation Rigs', 'Spray Equipment'],
  agrifood_seller: ['Grains & Cereals', 'Vegetables', 'Fruits', 'Poultry & Eggs', 'Meat & Fish', 'Dairy Products'],
  agrisupply_provider: ['Packaging Materials', 'Cold Chain Logistics', 'Transport & Delivery', 'Storage Solutions', 'Farm Chemicals'],
  agriservices_provider: ['Land Preparation', 'Irrigation Installation', 'Fencing & Security', 'Soil & Water Testing', 'Consulting'],
  processor: ['Grain Milling', 'Oil Pressing', 'Dairy Processing', 'Meat Processing', 'Drying & Packaging', 'Fermentation'],
  transport: ['Grain Haulage', 'Livestock Transport', 'Refrigerated Transport', 'Input Delivery', 'Last-mile Delivery', 'Cross-border Freight'],
};

interface PendingEnterprise {
  id: string;
  name: string;
  templateId: string;
  color: string;
}

export default function OnboardingWizard() {
  const { createOrg, addEnterprise, completeOnboarding, updateOrg } = useOrg();
  const [step, setStep]               = useState(0);
  const [businessType, setBusinessType] = useState<BusinessType>('farmer');
  const [orgName, setOrgName]         = useState('');
  const [country, setCountry]         = useState('Zambia');
  const [currency, setCurrency]       = useState('ZMW');
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [enterprises, setEnterprises] = useState<PendingEnterprise[]>([]);
  const [vendorCategories, setVendorCategories] = useState<Set<string>>(new Set());
  const [errors, setErrors]           = useState<Record<string, string>>({});

  const isFarmer = businessType === 'farmer' || businessType === 'cooperative';

  function toggleCategory(id: string) {
    setSelectedCategories(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleVendorCat(c: string) {
    setVendorCategories(prev => {
      const next = new Set(prev);
      next.has(c) ? next.delete(c) : next.add(c);
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
    if (step === 2 && !orgName.trim()) errs.orgName = 'Business name is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function next() {
    if (!validate()) return;
    if (step === 2) {
      createOrg(orgName.trim(), country, currency, businessType);
      // Persist the participant type on the backend organisation (programmes & government statistics rely on it)
      gqlRequest('mutation($i: UpdateOrganizationInput!) { updateOrganization(input: $i) { organization { id } } }', { i: { businessType, country, currency } }).catch(() => {});
    }
    if (step === 3) {
      if (!isFarmer) {
        // Save vendor service categories to org
        updateOrg({ serviceCategories: Array.from(vendorCategories) });
        completeOnboarding();
        return;
      }
      if (enterprises.length === 0) return;
      // Save enterprises
      enterprises.forEach(e => {
        addEnterprise({ name: e.name, templateId: e.templateId, color: e.color, active: true });
      });
      setStep(4);
      return;
    }
    setStep(s => s + 1);
  }

  function finish() {
    completeOnboarding();
  }

  const colorMap: Record<string, string> = {
    green: 'border-green-400 bg-green-50 text-green-700',
    amber: 'border-amber-400 bg-amber-50 text-amber-700',
    blue: 'border-blue-400 bg-blue-50 text-blue-700',
    orange: 'border-orange-400 bg-orange-50 text-orange-700',
    emerald: 'border-emerald-400 bg-emerald-50 text-emerald-700',
    purple: 'border-purple-400 bg-purple-50 text-purple-700',
    cyan: 'border-cyan-400 bg-cyan-50 text-cyan-700',
    red: 'border-red-400 bg-red-50 text-red-700',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex flex-col">
      {/* Header */}
      <div className="border-b border-slate-100 bg-white/80 backdrop-blur px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
            <Sprout className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-slate-900">AGRINUXES</span>
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
              <h1 className="text-4xl font-bold text-slate-900 mb-4">Welcome to AGRINUXES</h1>
              <p className="text-lg text-slate-600 max-w-xl mx-auto mb-2">
                The operating platform for <strong>every agricultural business</strong> — farms, dealers, vets, processors, service providers, and more.
              </p>
              <p className="text-slate-500 max-w-lg mx-auto mb-10">
                This 4-step setup takes under 2 minutes. Pick your business type and the platform adapts everything for you.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 max-w-2xl mx-auto mb-10 text-left">
                {[
                  { icon: '🏪', title: 'All business types', desc: 'Farms, dealers, vets, equipment, processors...' },
                  { icon: '⚙️', title: 'Auto-configured', desc: 'Dashboard tailored to your role.' },
                  { icon: '📦', title: 'Marketplace access', desc: 'Sell or buy on the AGRINUXES marketplace.' },
                  { icon: '📈', title: 'Grow together', desc: 'Analytics and insights built in.' },
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

          {/* ── Step 1: Business Type ── */}
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-1">What type of business are you?</h2>
              <p className="text-slate-500 mb-6">Your dashboard, tools, and marketplace features are customized based on this.</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                {BUSINESS_TYPES.map(bt => {
                  const selected = businessType === bt.id;
                  const cls = selected ? colorMap[bt.color] : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300';
                  return (
                    <button
                      key={bt.id}
                      onClick={() => setBusinessType(bt.id)}
                      className={`relative text-left p-4 rounded-xl border-2 transition-all ${cls}`}
                    >
                      {selected && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                      <div className="text-3xl mb-2">{bt.icon}</div>
                      <div className="font-semibold text-sm">{bt.label}</div>
                      <div className="text-xs opacity-70 mt-0.5 leading-tight">{bt.desc}</div>
                    </button>
                  );
                })}
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex gap-3">
                <span className="text-blue-500 text-lg">ℹ️</span>
                <p className="text-sm text-blue-700">
                  <strong>Individual buyers</strong> don't need a business account — they browse the marketplace directly after signing up as an individual.
                </p>
              </div>
              <StepNav onBack={() => setStep(0)} onNext={() => setStep(2)} />
            </div>
          )}

          {/* ── Step 2: Business details ── */}
          {step === 2 && (
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-1">Tell us about your business</h2>
              <p className="text-slate-500 mb-8">This sets the name, location, and currency across the platform.</p>
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Business Name *</label>
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
              <StepNav onBack={() => setStep(1)} onNext={next} />
            </div>
          )}

          {/* ── Step 3: Setup ── */}
          {step === 3 && (
            <div>
              {isFarmer ? (
                <>
                  <h2 className="text-2xl font-bold text-slate-900 mb-1">What does your farm operate?</h2>
                  <p className="text-slate-500 mb-6">Select all categories, then add an enterprise for each operation you run.</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
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

                  {/* Enterprise templates from selected categories */}
                  {selectedCategories.size > 0 && (
                    <div className="space-y-4 mb-6">
                      {CATEGORIES.filter(c => selectedCategories.has(c.id)).map(cat => (
                        <div key={cat.id} className="bg-white rounded-xl border border-slate-200 p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-lg">{cat.icon}</span>
                            <span className="font-semibold text-slate-800">{cat.label}</span>
                          </div>
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
                        </div>
                      ))}
                    </div>
                  )}

                  {enterprises.length > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
                      <div className="font-semibold text-green-800 text-sm mb-3">Added enterprises ({enterprises.length})</div>
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
                              <button onClick={() => removeEnterprisePending(e.id)} className="text-slate-400 hover:text-red-500 text-xs">✕</button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {enterprises.length === 0 && selectedCategories.size > 0 && (
                    <p className="text-amber-600 text-sm mb-4">Add at least one enterprise above to continue.</p>
                  )}
                  {selectedCategories.size === 0 && (
                    <p className="text-amber-600 text-sm mb-4">Select at least one category to continue.</p>
                  )}

                  <StepNav
                    onBack={() => setStep(2)}
                    onNext={next}
                    nextLabel="Finish setup"
                    disabled={enterprises.length === 0}
                  />
                </>
              ) : (
                <>
                  {/* Vendor: select service/product categories */}
                  <h2 className="text-2xl font-bold text-slate-900 mb-1">What do you offer?</h2>
                  <p className="text-slate-500 mb-6">Select all the products or services your business provides. You can update these later.</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
                    {(VENDOR_CATEGORIES[businessType] ?? []).map(cat => {
                      const sel = vendorCategories.has(cat);
                      return (
                        <button
                          key={cat}
                          onClick={() => toggleVendorCat(cat)}
                          className={`relative text-left p-4 rounded-xl border-2 transition-all ${
                            sel ? 'border-green-400 bg-green-50' : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          {sel && (
                            <div className="absolute top-2 right-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          )}
                          <div className={`font-semibold text-sm ${sel ? 'text-green-800' : 'text-slate-700'}`}>{cat}</div>
                        </button>
                      );
                    })}
                  </div>
                  {vendorCategories.size === 0 && (
                    <p className="text-amber-600 text-sm mb-4">Select at least one to continue.</p>
                  )}
                  <StepNav
                    onBack={() => setStep(2)}
                    onNext={next}
                    nextLabel="Finish setup"
                    disabled={vendorCategories.size === 0}
                  />
                </>
              )}
            </div>
          )}

          {/* ── Step 4: Ready (farmers only — vendors go straight to dashboard) ── */}
          {step === 4 && isFarmer && (
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

function StepNav({ onBack, onNext, nextLabel = 'Continue', disabled }: {
  onBack: () => void;
  onNext: () => void;
  nextLabel?: string;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between mt-8">
      <button onClick={onBack} className="flex items-center gap-1 px-4 py-2 text-slate-600 hover:text-slate-900 text-sm">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>
      <button
        onClick={onNext}
        disabled={disabled}
        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all ${
          disabled
            ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
            : 'bg-green-600 text-white hover:bg-green-700'
        }`}
      >
        {nextLabel} <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
