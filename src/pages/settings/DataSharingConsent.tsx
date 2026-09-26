// ─────────────────────────────────────────────────────────────────────────────
// Data sharing consent — farmer opt-in to government & partner aggregates.
// Only a director can change it. Aggregates are de-identified; consent only
// controls whether this organisation's counts are included at all.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useEffect, useState } from 'react';
import { Landmark, Loader2 } from 'lucide-react';
import { gqlRequest } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { MY_ORG_QUERY, SET_CONSENT_MUTATION, UPDATE_ORG_LOCATION_MUTATION } from '@/graphql/governmentQueries';
import { MY_PROFILE_QUERY, type ParticipantProfile } from '@/graphql/partnerQueries';
import { ParticipantProfileForm } from '@/pages/partner/Logframe';

interface OrgInfo { id: string; orgType: string; province: string; district: string; dataSharingConsent: boolean; dataSharingConsentedAt: string | null }

export default function DataSharingConsent() {
  const { profile } = useAuth();
  const isDirector = profile?.role === 'director';
  const [org, setOrg] = useState<OrgInfo | null>(null);
  const [province, setProvince] = useState('');
  const [district, setDistrict] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [hh, setHh] = useState<ParticipantProfile | null | undefined>(undefined);
  const [editHh, setEditHh] = useState(false);

  useEffect(() => {
    gqlRequest<{ myParticipantProfile: ParticipantProfile | null }>(MY_PROFILE_QUERY).then(r => setHh(r.myParticipantProfile)).catch(() => setHh(null));
    gqlRequest<{ organization: OrgInfo }>(MY_ORG_QUERY)
      .then(r => { setOrg(r.organization); setProvince(r.organization.province); setDistrict(r.organization.district); })
      .catch(() => {});
  }, []);

  if (!org || org.orgType !== 'farm') return null;

  async function toggle() {
    if (!org) return;
    setBusy(true); setMsg('');
    try {
      const r = await gqlRequest<{ setDataSharingConsent: { organization: OrgInfo } }>(SET_CONSENT_MUTATION, { consent: !org.dataSharingConsent });
      setOrg(o => o ? { ...o, ...r.setDataSharingConsent.organization } : o);
      setMsg(r.setDataSharingConsent.organization.dataSharingConsent ? 'Sharing enabled.' : 'Sharing disabled.');
    } catch (e: any) { setMsg(e?.message ?? 'Failed to update'); }
    finally { setBusy(false); }
  }

  async function saveLocation() {
    setBusy(true); setMsg('');
    try {
      const r = await gqlRequest<{ updateOrganization: { organization: { province: string; district: string } } }>(
        UPDATE_ORG_LOCATION_MUTATION, { input: { province, district } });
      setOrg(o => o ? { ...o, ...r.updateOrganization.organization } : o);
      setMsg('Location saved.');
    } catch (e: any) { setMsg(e?.message ?? 'Failed to save'); }
    finally { setBusy(false); }
  }

  const locationDirty = province !== org.province || district !== org.district;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5" data-testid="data-sharing-consent">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Landmark className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-slate-800">Share with government &amp; partners</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-prose">
              When enabled, this organisation's counts (enterprises, records, prices, reports) are included in
              de-identified district and national dashboards used by the Ministry of Agriculture, extension
              services and development partners. Your organisation's name is never shown. You also receive district advisories.
            </p>
            {org.dataSharingConsent && org.dataSharingConsentedAt && (
              <p className="text-[11px] text-green-700 mt-1">Sharing since {new Date(org.dataSharingConsentedAt).toLocaleDateString()}</p>
            )}
          </div>
        </div>
        <button onClick={toggle} disabled={!isDirector || busy} role="switch" aria-checked={org.dataSharingConsent}
          title={isDirector ? '' : 'Only a director can change this'}
          className={`relative w-12 h-7 rounded-full flex-shrink-0 transition-colors disabled:opacity-50 ${org.dataSharingConsent ? 'bg-green-600' : 'bg-slate-300'}`}>
          <span className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-all ${org.dataSharingConsent ? 'left-6' : 'left-1'}`} />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
        <label className="text-xs text-slate-500">Province
          <input value={province} onChange={e => setProvince(e.target.value)} disabled={!isDirector} placeholder="e.g. Lusaka"
            className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-800 disabled:bg-slate-50" />
        </label>
        <label className="text-xs text-slate-500">District
          <input value={district} onChange={e => setDistrict(e.target.value)} disabled={!isDirector} placeholder="e.g. Chongwe"
            className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-800 disabled:bg-slate-50" />
        </label>
        <button onClick={saveLocation} disabled={!isDirector || busy || !locationDirty}
          className="px-3 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium disabled:opacity-40">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
        </button>
      </div>
      <p className="text-[11px] text-slate-400 mt-1">Province and district place your organisation on district dashboards and target advisories to you.</p>
      {msg && <p className="text-xs text-slate-600 mt-2">{msg}</p>}

      <div className="mt-5 pt-4 border-t border-slate-200">
        <div className="flex items-start justify-between gap-3">
          <div><h4 className="font-semibold text-slate-800 text-sm">Household profile</h4><p className="text-xs text-slate-500 mt-0.5 max-w-prose">Programmes you join report results by sex, age and household size (for example “women-headed farms trained”). Only counts are ever shared; your national ID is stored as a hash for de-duplication.</p></div>
          {isDirector && !editHh && <button onClick={() => setEditHh(true)} className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-700 whitespace-nowrap">{hh ? 'Edit' : 'Add profile'}</button>}
        </div>
        {hh && !editHh && <p className="text-xs text-slate-700 mt-2">{hh.headSex === 'F' ? 'Woman-headed' : hh.headSex === 'M' ? 'Man-headed' : 'Head of household not recorded'}{hh.headAge != null && ` · head aged ${hh.headAge}${hh.isYouth ? ' (youth)' : ''}`}{hh.householdSize != null && ` · ${hh.householdSize} household members`}{hh.landHa != null && ` · ${hh.landHa} ha`}{hh.disability && ' · includes a person with a disability'}{hh.hasNationalId && ' · ID on file'}</p>}
        {hh === null && !editHh && <p className="text-xs text-slate-400 mt-2">Not recorded yet.</p>}
        {editHh && <div className="mt-3"><ParticipantProfileForm existing={hh ?? null} onSaved={p => { setHh(p); setEditHh(false); setMsg('Household profile saved.'); }} onCancel={() => setEditHh(false)} /></div>}
      </div>
    </div>
  );
}
