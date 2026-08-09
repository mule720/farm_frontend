// ─────────────────────────────────────────────────────────────────────────────
// AgroNexus v2 — Landing / Get-started page
// Shown only when no org is stored yet (new device / first visit)
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react';
import { OrgProvider, useOrg } from '@/store/orgStore';
import { Sprout, ArrowRight, CheckCircle2 } from 'lucide-react';

const HIGHLIGHTS = [
  'Works for poultry, livestock, aquaculture, crops & more',
  'Configuration-driven — one platform, any enterprise type',
  'Built-in AgriFood Market, AgriSupply & AgriServices',
  'AI-powered insights (coming soon)',
];

export default function LandingV2() {
  const { createOrg } = useOrg();

  function startOnboarding() {
    // Create a placeholder org — the wizard will overwrite the name/country/currency
    createOrg('My Farm', 'Zambia', 'ZMW');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 flex flex-col">
      {/* Nav */}
      <nav className="px-6 py-4 flex items-center justify-between max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center">
            <Sprout className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-bold text-lg">AgroNexus</span>
          <span className="ml-1 px-1.5 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] font-bold rounded uppercase tracking-wider">v2</span>
        </div>
        <button
          onClick={startOnboarding}
          className="text-sm text-green-400 hover:text-green-300 font-medium"
        >
          Sign in
        </button>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="max-w-2xl text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 text-green-400 rounded-full text-sm font-medium">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            Now in beta — free to try
          </div>

          {/* Heading */}
          <h1 className="text-5xl sm:text-6xl font-extrabold text-white leading-tight">
            The farm management platform{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">
              built for Africa
            </span>
          </h1>

          <p className="text-slate-400 text-lg leading-relaxed">
            One configuration-driven engine for every enterprise — broilers, dairy, tilapia, maize,
            tomatoes, and more. Built-in marketplaces connect you to buyers, suppliers, and services.
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={startOnboarding}
              className="flex items-center justify-center gap-2 px-8 py-4 bg-green-500 hover:bg-green-400 text-white font-semibold rounded-xl text-base transition-colors"
            >
              Set up your workspace <ArrowRight className="w-5 h-5" />
            </button>
            <a
              href="https://agrinuxes.com"
              className="flex items-center justify-center gap-2 px-8 py-4 border border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white font-medium rounded-xl text-base transition-colors"
            >
              View current platform
            </a>
          </div>

          {/* Highlights */}
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
            {HIGHLIGHTS.map(h => (
              <li key={h} className="flex items-start gap-2 text-sm text-slate-400">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                {h}
              </li>
            ))}
          </ul>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-xs text-slate-600">
        © {new Date().getFullYear()} AgroNexus · Built for African farmers
      </footer>
    </div>
  );
}
