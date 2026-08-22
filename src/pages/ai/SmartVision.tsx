/**
 * SmartVision — CCTV · Drone · AI Vision Doctor · Community Intel
 * Fully localStorage-based; no backend required.
 */
import React, { useState, useMemo, useCallback } from 'react';
import {
  Camera, Plane, Brain, Users, AlertTriangle, CheckCircle, Loader2,
  Upload, Eye, Zap, TrendingUp, Activity, BarChart3, MapPin, Clock,
  ThumbsUp, MessageCircle, RefreshCw, X, Wifi, WifiOff, Video,
  Scan, Bug, Sprout, Heart, Plus, Trash2, Shield, Bell, ChevronRight,
  Hash, ArrowDown, ArrowUp, Minus, Radio, Navigation,
} from 'lucide-react';
import { useOrg } from '@/store/orgStore';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CCTVCamera {
  id: string;
  name: string;
  enterpriseId: string;
  location: string;
  status: 'online' | 'offline' | 'recording';
  resolution: string;
  aiEnabled: boolean;
  addedAt: string;
}

interface StockCount {
  id: string;
  cameraId: string | null;
  enterpriseId: string;
  expectedQty: number;
  countedQty: number;
  discrepancy: number;
  discrepancyPct: number;
  status: 'ok' | 'discrepancy' | 'authorized';
  notes: string;
  countedAt: string;
  authRef?: string;
}

interface AlertItem {
  id: string;
  cameraId: string;
  cameraName: string;
  type: 'count_discrepancy' | 'behaviour' | 'health' | 'intrusion' | 'equipment';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  detail: string;
  timestamp: string;
  resolved: boolean;
}

interface VisionAnalysis {
  id: string;
  imageUrl: string;
  analysisType: string;
  enterpriseId: string;
  diagnosis: string;
  severity: 'none' | 'low' | 'medium' | 'high' | 'critical';
  confidencePct: number;
  aiSummary: string;
  findings: { title: string; detail: string }[];
  recommendations: string[];
  createdAt: string;
  isPublic: boolean;
}

interface DroneFlight {
  id: string;
  enterpriseId: string;
  flightType: string;
  status: 'planned' | 'in_flight' | 'completed' | 'aborted';
  areaCoveredHa?: number;
  notes: string;
  healthScore?: number;
  overallHealth?: string;
  aiSummary?: string;
  detectedIssues?: string[];
  createdAt: string;
}

interface CommunityReport {
  id: string;
  category: string;
  title: string;
  description: string;
  cropOrAnimal: string;
  locationHint: string;
  imageUrl: string;
  isResolved: boolean;
  helpfulCount: number;
  createdAt: string;
  diagnosis?: string;
  severity?: string;
  recommendations?: string[];
}

// ─── localStorage keys ────────────────────────────────────────────────────────

const LS_CAMERAS   = 'agronexus_v2_sv_cameras';
const LS_COUNTS    = 'agronexus_v2_sv_counts';
const LS_ALERTS    = 'agronexus_v2_sv_alerts';
const LS_ANALYSES  = 'agronexus_v2_sv_analyses';
const LS_FLIGHTS   = 'agronexus_v2_sv_flights';
const LS_COMMUNITY = 'agronexus_v2_sv_community';

// ─── Seed data ────────────────────────────────────────────────────────────────

const SEED_CAMERAS: CCTVCamera[] = [
  { id: 'cam-1', name: 'Broiler House 1 — Entry', enterpriseId: '', location: 'Entry door, north side', status: 'recording', resolution: '4K', aiEnabled: true, addedAt: new Date().toISOString() },
  { id: 'cam-2', name: 'Broiler House 1 — Interior', enterpriseId: '', location: 'Centre aisle, overhead mount', status: 'online', resolution: '1080p', aiEnabled: true, addedAt: new Date().toISOString() },
  { id: 'cam-3', name: 'Fish Pond A — Bank', enterpriseId: '', location: 'South bank, pole mount', status: 'online', resolution: '1080p', aiEnabled: false, addedAt: new Date().toISOString() },
  { id: 'cam-4', name: 'Perimeter — Gate 1', enterpriseId: '', location: 'Main farm entrance', status: 'offline', resolution: '1080p', aiEnabled: false, addedAt: new Date().toISOString() },
];

const SEED_COUNTS: StockCount[] = [
  { id: 'cnt-1', cameraId: 'cam-2', enterpriseId: '', expectedQty: 500, countedQty: 488, discrepancy: 12, discrepancyPct: 2.4, status: 'discrepancy', notes: 'AI count via overhead cam, evening', countedAt: new Date(Date.now() - 2 * 3600000).toISOString() },
  { id: 'cnt-2', cameraId: 'cam-1', enterpriseId: '', expectedQty: 500, countedQty: 501, discrepancy: -1, discrepancyPct: -0.2, status: 'ok', notes: 'Morning count', countedAt: new Date(Date.now() - 26 * 3600000).toISOString() },
];

const SEED_ALERTS: AlertItem[] = [
  { id: 'al-1', cameraId: 'cam-2', cameraName: 'Broiler House 1 — Interior', type: 'count_discrepancy', severity: 'medium', title: 'Stock Count Discrepancy — 12 birds missing', detail: 'AI counted 488 birds. Expected 500. 2.4% deficit. Possible mortality not yet recorded, or birds moved without documentation.', timestamp: new Date(Date.now() - 2 * 3600000).toISOString(), resolved: false },
  { id: 'al-2', cameraId: 'cam-2', cameraName: 'Broiler House 1 — Interior', type: 'behaviour', severity: 'low', title: 'Unusual Clustering Detected', detail: 'AI detected >30% of flock clustering near south wall — possible draught or predator stress. Inspect south wall and curtains.', timestamp: new Date(Date.now() - 5 * 3600000).toISOString(), resolved: false },
  { id: 'al-3', cameraId: 'cam-4', cameraName: 'Perimeter — Gate 1', type: 'intrusion', severity: 'high', title: 'Camera Offline — Security Gap', detail: 'Gate 1 CCTV has been offline for 14 hours. Check power supply and cable connection. Do not leave perimeter unmonitored.', timestamp: new Date(Date.now() - 14 * 3600000).toISOString(), resolved: false },
];

const SEED_COMMUNITY: CommunityReport[] = [
  { id: 'cr-1', category: 'animal_disease', title: 'Newcastle-like symptoms in 6-week broilers', description: 'Twisted necks, respiratory signs. 3 deaths in 2 days. Vaccinated at Day 1 and 21.', cropOrAnimal: 'Broiler chicken', locationHint: 'Lusaka district', imageUrl: '', isResolved: false, helpfulCount: 7, createdAt: new Date(Date.now() - 3 * 86400000).toISOString(), diagnosis: 'Newcastle Disease (virulent strain suspected)', severity: 'critical', recommendations: ['Immediately isolate affected birds', 'Contact nearest DVS office', 'Do not sell or move birds off farm', 'Disinfect all equipment'] },
  { id: 'cr-2', category: 'crop_disease', title: 'Brown leaf spots on tomatoes after rains', description: 'Spots started at older leaves and moved upward. Plants look wilted in morning.', cropOrAnimal: 'Tomato', locationHint: 'Chongwe area', imageUrl: '', isResolved: true, helpfulCount: 12, createdAt: new Date(Date.now() - 7 * 86400000).toISOString(), diagnosis: 'Early Blight (Alternaria solani)', severity: 'medium', recommendations: ['Apply copper-based fungicide', 'Improve drainage, avoid overhead irrigation', 'Remove and destroy infected leaves'] },
];

// ─── AI simulation engine ─────────────────────────────────────────────────────

const AI_DIAGNOSES: Record<string, { diagnosis: string; severity: 'none'|'low'|'medium'|'high'|'critical'; summary: string; findings: {title:string;detail:string}[]; recommendations: string[] }[]> = {
  crop_disease: [
    { diagnosis: 'Early Blight (Alternaria solani)', severity: 'medium', summary: 'Visible concentric ring lesions typical of Early Blight. Fungal spores spread via splash and wind. Warm, wet conditions accelerate infection.', findings: [{ title: 'Concentric ring lesions', detail: 'Dark-brown spots with yellow halo on older leaves — classic early blight pattern.' }, { title: 'Upward progression', detail: 'Disease starting at lower leaves progressing upward — consistent with soil-splash transmission.' }], recommendations: ['Apply copper-based or mancozeb fungicide immediately', 'Remove and destroy infected lower leaves', 'Avoid overhead irrigation; water at base', 'Apply preventive spray every 7 days during wet season'] },
    { diagnosis: 'Powdery Mildew', severity: 'low', summary: 'White powdery coating on leaf surfaces consistent with Powdery Mildew. Typically worse in humid, warm conditions with poor air circulation.', findings: [{ title: 'White powdery coating', detail: 'Fungal mycelium visible on upper leaf surface.' }, { title: 'Leaf distortion', detail: 'Younger leaves showing curl — a sign of active infection.' }], recommendations: ['Apply sulfur or neem-based spray', 'Improve air circulation between plants', 'Avoid excessive nitrogen fertiliser'] },
  ],
  livestock_health: [
    { diagnosis: 'Newcastle Disease (suspected)', severity: 'critical', summary: 'Clinical signs are consistent with Newcastle Disease — a notifiable disease in Zambia. Immediate isolation and DVS notification are required.', findings: [{ title: 'Respiratory signs', detail: 'Gasping and rales audible — indicative of respiratory ND.' }, { title: 'Neurological signs', detail: 'Twisted necks / torticollis observed in some birds.' }, { title: 'Drop in egg production', detail: 'If a laying flock, egg production drop of >30% expected.' }], recommendations: ['Immediately isolate affected birds', 'Contact DVS (Dept of Veterinary Services) — this is a notifiable disease', 'Do NOT sell or move birds', 'Carry out emergency vaccination of unaffected birds', 'Disinfect all equipment and footwear'] },
    { diagnosis: 'Coccidiosis', severity: 'medium', summary: 'Bloody diarrhoea and huddling behaviour suggest intestinal Coccidiosis. Most common in young broilers during wet conditions.', findings: [{ title: 'Bloody droppings', detail: 'Cecal haemorrhage is pathognomonic for E. tenella infection.' }, { title: 'Hunched posture', detail: 'Birds sitting with ruffled feathers — sign of abdominal pain.' }], recommendations: ['Administer amprolium or toltrazuril in drinking water for 5 days', 'Improve litter management — remove wet/caked litter', 'Ensure adequate ventilation to reduce humidity'] },
  ],
  pest_identification: [
    { diagnosis: 'Fall Armyworm (Spodoptera frugiperda)', severity: 'high', summary: 'Characteristic window-pane feeding and frass in whorls confirms Fall Armyworm. Crop can be destroyed within days if untreated.', findings: [{ title: 'Window-pane feeding', detail: 'Transparent patches on leaves from young larvae scraping the surface.' }, { title: 'Frass in whorls', detail: 'Sawdust-like droppings in maize whorls — larvae present.' }], recommendations: ['Apply emamectin benzoate (e.g. Intrepid, Proclaim) immediately', 'Scout field at dawn/dusk when larvae are active', 'Conserve natural enemies — limit broad-spectrum insecticide use', 'Report outbreak to district agricultural office'] },
    { diagnosis: 'Red Spider Mite', severity: 'medium', summary: 'Fine webbing and stippled leaves indicate heavy Red Spider Mite infestation. Populations explode in hot, dry conditions.', findings: [{ title: 'Fine webbing on undersides', detail: 'Silk webbing between leaves and stems protects mite colonies.' }, { title: 'Bronze/stippled leaf surface', detail: 'Cell content removed by mites causes characteristic stippling.' }], recommendations: ['Apply acaricide (abamectin, spiromesifen)', 'Increase plant irrigation to raise humidity', 'Release predatory mites if available'] },
  ],
  weed_detection: [
    { diagnosis: 'Striga (Witchweed) infestation', severity: 'high', summary: 'Striga asiatica detected — a parasitic weed that attaches to crop roots. Can cause 20–100% yield loss if not controlled urgently.', findings: [{ title: 'Purple/pink flowers visible', detail: 'Striga above ground when 80% root damage has already occurred.' }, { title: 'Patchy crop stunting', detail: 'Classic scattered stunting pattern from Striga hotspots.' }], recommendations: ['Hand-pull Striga before seed set — bag and burn (DO NOT compost)', 'Apply Imazapyr herbicide to Striga-resistant maize varieties', 'Practice crop rotation with legumes', 'Use Striga-tolerant maize seed next season'] },
  ],
  livestock_count: [
    { diagnosis: 'Count Complete — Variance Detected', severity: 'low', summary: 'AI livestock count complete. A small variance from expected numbers was detected. Possible causes: natural mortality, stray animals, or counting overlap.', findings: [{ title: 'Count confidence: 94%', detail: 'Dense grouping in parts of the image reduced counting accuracy in those zones.' }, { title: 'Movement artefacts', detail: 'Fast-moving animals caused minor double-count risk. Recommend still-image or time-lapse for better accuracy.' }], recommendations: ['Cross-reference with daily mortality records', 'Conduct manual count if variance exceeds 3%', 'Schedule evening counts when animals are calmer'] },
  ],
  field_survey: [
    { diagnosis: 'Field Health: Fair — 61%', severity: 'medium', summary: 'Overall field shows patchy growth with some areas of good canopy coverage and others showing stress. NDVI-equivalent analysis suggests 18% of the area needs intervention.', findings: [{ title: 'Uneven canopy closure', detail: 'North section shows good density; south section approximately 35% sparse.' }, { title: 'Yellowing visible in centre rows', detail: 'Possible nitrogen deficiency or waterlogging in low-lying centre area.' }], recommendations: ['Apply top-dress nitrogen to struggling sections', 'Check soil moisture in centre rows — possible waterlogging', 'Rogue out gaps and re-plant if < 50% establishment'] },
  ],
  soil_assessment: [
    { diagnosis: 'Compaction risk — possible hardpan layer', severity: 'medium', summary: 'Surface cracking patterns and limited root penetration visible suggest sub-soil compaction. Common after repeated tractor passes on wet soil.', findings: [{ title: 'Surface cracking', detail: 'Polygonal surface cracks visible in bare areas — classic compaction sign.' }, { title: 'Shallow rooting', detail: 'Where roots visible, they are shallow — compaction limiting depth.' }], recommendations: ['Deep rip compacted zones before next season', 'Avoid field operations when soil is wet', 'Apply organic matter to improve soil structure'] },
  ],
  general: [
    { diagnosis: 'No major issues detected', severity: 'none', summary: 'General AI scan complete. No obvious disease, pest, or structural problems detected in the image area. Conditions appear normal.', findings: [{ title: 'Visual scan complete', detail: 'AI processed 12 detection categories across the image.' }], recommendations: ['Continue regular monitoring', 'Consider more specific scan type for targeted diagnosis'] },
  ],
};

function simulateAI(analysisType: string): VisionAnalysis['findings'] extends object ? any : any {
  const options = AI_DIAGNOSES[analysisType] || AI_DIAGNOSES['general'];
  return options[Math.floor(Math.random() * options.length)];
}

// ─── Utility ─────────────────────────────────────────────────────────────────

function ls<T>(key: string, seed: T): T {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : seed; } catch { return seed; }
}
function lsSet<T>(key: string, v: T) { try { localStorage.setItem(key, JSON.stringify(v)); } catch {} }
function uid() { return Math.random().toString(36).slice(2, 10); }
function fmtTs(iso: string) {
  const d = new Date(iso), diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  return d.toLocaleDateString();
}

// ─── Sub-components ──────────────────────────────────────────────────────────

const ANALYSIS_TYPES = [
  { value: 'crop_disease',     label: 'Crop Disease',      icon: Sprout  },
  { value: 'pest_identification', label: 'Pest ID',         icon: Bug     },
  { value: 'livestock_health', label: 'Livestock Health',  icon: Heart   },
  { value: 'livestock_count',  label: 'Animal Count',      icon: Users   },
  { value: 'field_survey',     label: 'Field Survey',      icon: Scan    },
  { value: 'weed_detection',   label: 'Weed Detection',    icon: Sprout  },
  { value: 'soil_assessment',  label: 'Soil Assessment',   icon: MapPin  },
  { value: 'general',          label: 'General Scan',      icon: Brain   },
];

const CAT_COLORS: Record<string, string> = {
  crop_disease:   'bg-green-100 text-green-700',
  pest:           'bg-orange-100 text-orange-700',
  animal_disease: 'bg-red-100 text-red-700',
  nutritional:    'bg-yellow-100 text-yellow-700',
  yield_issue:    'bg-blue-100 text-blue-700',
  weed:           'bg-lime-100 text-lime-700',
  soil:           'bg-amber-100 text-amber-700',
  success:        'bg-emerald-100 text-emerald-700',
  other:          'bg-slate-100 text-slate-600',
};

function SevBadge({ sev }: { sev: string }) {
  const cfg: Record<string,string> = { none:'bg-green-100 text-green-700', low:'bg-blue-100 text-blue-700', medium:'bg-amber-100 text-amber-700', high:'bg-orange-100 text-orange-700', critical:'bg-red-100 text-red-700' };
  return <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize ${cfg[sev]||'bg-slate-100 text-slate-500'}`}>{sev}</span>;
}

function CamStatusDot({ status }: { status: CCTVCamera['status'] }) {
  const cfg = { online:'bg-green-500', recording:'bg-red-500 animate-pulse', offline:'bg-slate-300' }[status];
  return <span className={`w-2.5 h-2.5 rounded-full inline-block flex-shrink-0 ${cfg}`} />;
}

// ─── Camera card ──────────────────────────────────────────────────────────────

function CamCard({ cam, onDelete }: { cam: CCTVCamera; onDelete: () => void }) {
  const isLive = cam.status !== 'offline';
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
      {/* Simulated feed area */}
      <div className={`h-28 flex items-center justify-center relative ${isLive ? 'bg-slate-900' : 'bg-slate-100'}`}>
        {cam.status === 'recording' && (
          <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-red-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> REC
          </div>
        )}
        {cam.aiEnabled && isLive && (
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-violet-600/80 text-white text-[9px] px-1.5 py-0.5 rounded-full">
            <Brain className="w-2.5 h-2.5" /> AI
          </div>
        )}
        {isLive ? (
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-green-400 rounded-full flex items-center justify-center mx-auto mb-1">
              <Video className="w-4 h-4 text-green-400" />
            </div>
            <span className="text-[10px] text-green-400 font-mono">{cam.resolution} LIVE</span>
          </div>
        ) : (
          <div className="text-center text-slate-400">
            <WifiOff className="w-7 h-7 mx-auto mb-1 opacity-40" />
            <span className="text-xs">Offline</span>
          </div>
        )}
      </div>
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <CamStatusDot status={cam.status} />
              <span className="text-sm font-semibold text-slate-800 truncate">{cam.name}</span>
            </div>
            <div className="text-[10px] text-slate-400 truncate">{cam.location}</div>
          </div>
          <button onClick={onDelete} className="p-1 text-slate-300 hover:text-red-500 flex-shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      </div>
    </div>
  );
}

// ─── Add Camera Modal ─────────────────────────────────────────────────────────

function AddCameraModal({ enterprises, onSave, onClose }: {
  enterprises: {id:string;name:string}[];
  onSave: (c: CCTVCamera) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [enterpriseId, setEnt] = useState(enterprises[0]?.id ?? '');
  const [location, setLoc] = useState('');
  const [resolution, setRes] = useState('1080p');
  const [aiEnabled, setAI] = useState(true);

  function save() {
    if (!name.trim()) return;
    onSave({ id: `cam-${uid()}`, name: name.trim(), enterpriseId, location: location.trim(), status: 'offline', resolution, aiEnabled, addedAt: new Date().toISOString() });
    onClose();
  }
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h3 className="font-bold text-slate-900">Add CCTV Camera</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-1">Camera Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Broiler House 2 — Entry" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-1">Enterprise</label>
              <select value={enterpriseId} onChange={e => setEnt(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
                <option value="">— none —</option>
                {enterprises.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-1">Resolution</label>
              <select value={resolution} onChange={e => setRes(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
                <option>720p</option><option>1080p</option><option>4K</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-1">Location / Mount Point</label>
            <input value={location} onChange={e => setLoc(e.target.value)} placeholder="e.g. Overhead, centre aisle" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={aiEnabled} onChange={e => setAI(e.target.checked)} className="w-4 h-4 rounded accent-violet-600" />
            <span className="text-sm text-slate-700">Enable AI analysis (counting, behaviour, health detection)</span>
          </label>
        </div>
        <div className="flex gap-2 px-5 py-4 border-t border-slate-100">
          <button onClick={onClose} className="flex-1 border border-slate-200 rounded-xl py-2 text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
          <button onClick={save} disabled={!name.trim()} className="flex-1 bg-violet-600 text-white rounded-xl py-2 text-sm font-medium hover:bg-violet-700 disabled:opacity-40">Add Camera</button>
        </div>
      </div>
    </div>
  );
}

// ─── CAMERA WATCH TAB ─────────────────────────────────────────────────────────

function CameraWatchTab({ cameras, counts, alerts, enterprises, addCamera, deleteCamera, addCount, resolveAlert, activeCycles }: {
  cameras: CCTVCamera[]; counts: StockCount[]; alerts: AlertItem[];
  enterprises: {id:string;name:string}[]; activeCycles: any[];
  addCamera: (c: CCTVCamera) => void;
  deleteCamera: (id: string) => void;
  addCount: (c: StockCount) => void;
  resolveAlert: (id: string) => void;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [showCount, setShowCount] = useState(false);
  const [countForm, setCountForm] = useState({ cameraId: cameras[0]?.id ?? '', enterpriseId: '', countedQty: '', notes: '' });

  const unresolvedAlerts = alerts.filter(a => !a.resolved);

  function submitCount(e: React.FormEvent) {
    e.preventDefault();
    const cam = cameras.find(c => c.id === countForm.cameraId);
    // Get expected quantity from active cycle's productionUnits
    const cycle = activeCycles.find(c => c.enterpriseId === countForm.enterpriseId);
    const expected = cycle ? (cycle.productionUnits ?? []).reduce((s: number, u: any) => s + (u.quantity ?? 0), 0) : 0;
    const counted = parseInt(countForm.countedQty, 10);
    const discrepancy = expected > 0 ? expected - counted : 0;
    const pct = expected > 0 ? (discrepancy / expected) * 100 : 0;
    const status: StockCount['status'] = Math.abs(pct) < 1 ? 'ok' : 'discrepancy';
    addCount({
      id: `cnt-${uid()}`,
      cameraId: countForm.cameraId || null,
      enterpriseId: countForm.enterpriseId,
      expectedQty: expected,
      countedQty: counted,
      discrepancy,
      discrepancyPct: pct,
      status,
      notes: countForm.notes,
      countedAt: new Date().toISOString(),
    });
    setShowCount(false);
    setCountForm({ cameraId: cameras[0]?.id ?? '', enterpriseId: '', countedQty: '', notes: '' });
  }

  return (
    <div className="space-y-5">
      {/* Unresolved alert banner */}
      {unresolvedAlerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <span className="font-semibold text-red-700">{unresolvedAlerts.length} Camera Alert{unresolvedAlerts.length > 1 ? 's' : ''} — Needs Attention</span>
          </div>
          {unresolvedAlerts.map(a => (
            <div key={a.id} className={`flex items-start gap-3 bg-white rounded-xl border px-4 py-3 ${a.severity === 'critical' ? 'border-red-200' : a.severity === 'high' ? 'border-orange-200' : 'border-amber-200'}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <span className="text-sm font-semibold text-slate-800">{a.title}</span>
                  <SevBadge sev={a.severity} />
                </div>
                <p className="text-xs text-slate-600">{a.detail}</p>
                <div className="text-[10px] text-slate-400 mt-1">{a.cameraName} · {fmtTs(a.timestamp)}</div>
              </div>
              <button onClick={() => resolveAlert(a.id)} className="flex items-center gap-1 text-xs px-2 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 flex-shrink-0">
                <CheckCircle className="w-3 h-3" /> Resolve
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Camera grid header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Video className="w-4 h-4 text-violet-600" />
          <span className="font-semibold text-slate-800">Camera Feeds ({cameras.length})</span>
          <span className="text-xs text-green-600 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> {cameras.filter(c => c.status !== 'offline').length} live
          </span>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowCount(v => !v)} className="flex items-center gap-1.5 px-3 py-1.5 border border-violet-200 text-violet-700 bg-violet-50 text-sm rounded-lg hover:bg-violet-100 font-medium">
            <Hash className="w-4 h-4" /> Log Count
          </button>
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 text-white text-sm rounded-lg hover:bg-violet-700 font-medium">
            <Plus className="w-4 h-4" /> Add Camera
          </button>
        </div>
      </div>

      {/* Camera grid */}
      {cameras.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
          <Camera className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">No cameras registered. Click "Add Camera" to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {cameras.map(cam => (
            <CamCard key={cam.id} cam={cam} onDelete={() => { if (confirm(`Remove camera "${cam.name}"?`)) deleteCamera(cam.id); }} />
          ))}
        </div>
      )}

      {/* Log count form */}
      {showCount && (
        <form onSubmit={submitCount} className="bg-white border border-violet-200 rounded-xl p-5 space-y-4">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2"><Hash className="w-4 h-4 text-violet-600" /> Log Stock Count</h3>
          <p className="text-xs text-slate-500">Compare CCTV or manual count against expected quantity from production cycle records.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-xs text-slate-500 block mb-1">Camera (optional)</label>
              <select value={countForm.cameraId} onChange={e => setCountForm(f => ({...f, cameraId: e.target.value}))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">
                <option value="">Manual count</option>
                {cameras.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Enterprise *</label>
              <select value={countForm.enterpriseId} onChange={e => setCountForm(f => ({...f, enterpriseId: e.target.value}))} required className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">
                <option value="">Select…</option>
                {enterprises.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Counted Qty *</label>
              <input type="number" required value={countForm.countedQty} onChange={e => setCountForm(f => ({...f, countedQty: e.target.value}))} placeholder="e.g. 488" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Notes</label>
              <input value={countForm.notes} onChange={e => setCountForm(f => ({...f, notes: e.target.value}))} placeholder="Any observations" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 text-white rounded-lg text-sm hover:bg-violet-700">
              <Shield className="w-4 h-4" /> Submit Count
            </button>
            <button type="button" onClick={() => setShowCount(false)} className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
          </div>
        </form>
      )}

      {/* Recent counts */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 font-semibold text-sm text-slate-800">Recent Stock Counts</div>
        {counts.length === 0 ? (
          <div className="px-5 py-6 text-slate-400 text-sm text-center">No counts logged yet.</div>
        ) : (
          counts.slice().reverse().map(cnt => (
            <div key={cnt.id} className={`flex items-center gap-4 px-5 py-3 border-b border-slate-50 last:border-0 ${cnt.status === 'discrepancy' ? 'bg-red-50' : ''}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <span className="text-sm font-medium text-slate-800">{enterprises.find(e => e.id === cnt.enterpriseId)?.name ?? 'Unknown'}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium capitalize ${cnt.status === 'ok' ? 'bg-green-100 text-green-700' : cnt.status === 'discrepancy' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{cnt.status}</span>
                </div>
                <div className="text-xs text-slate-500">
                  Counted <strong>{cnt.countedQty}</strong>
                  {cnt.expectedQty > 0 && <> · Expected <strong>{cnt.expectedQty}</strong></>}
                  {cnt.discrepancy !== 0 && cnt.expectedQty > 0 && (
                    <span className={cnt.discrepancy > 0 ? 'text-red-600' : 'text-green-600'}>
                      {' '}· {cnt.discrepancy > 0 ? <ArrowDown className="inline w-3 h-3" /> : <ArrowUp className="inline w-3 h-3" />} {Math.abs(cnt.discrepancy)} ({Math.abs(cnt.discrepancyPct).toFixed(1)}%)
                    </span>
                  )}
                </div>
                {cnt.notes && <div className="text-[10px] text-slate-400 mt-0.5">{cnt.notes}</div>}
                <div className="text-[10px] text-slate-400">{fmtTs(cnt.countedAt)}</div>
              </div>
            </div>
          ))
        )}
      </div>

      {showAdd && <AddCameraModal enterprises={enterprises} onSave={c => { addCamera(c); setShowAdd(false); }} onClose={() => setShowAdd(false)} />}
    </div>
  );
}

// ─── AI VISION DOCTOR TAB ─────────────────────────────────────────────────────

function AIDoctorTab({ enterprises, analyses, addAnalysis }: {
  enterprises: {id:string;name:string}[];
  analyses: VisionAnalysis[];
  addAnalysis: (a: VisionAnalysis) => void;
}) {
  const [form, setForm] = useState({ imageUrl: '', analysisType: 'crop_disease', description: '', enterpriseId: '', isPublic: false });
  const [result, setResult] = useState<VisionAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  function runAnalysis(e: React.FormEvent) {
    e.preventDefault();
    if (!form.imageUrl.trim()) { alert('Please enter an image URL'); return; }
    setAnalyzing(true);
    setResult(null);
    // Simulate AI processing delay
    setTimeout(() => {
      const sim = simulateAI(form.analysisType);
      const analysis: VisionAnalysis = {
        id: `va-${uid()}`,
        imageUrl: form.imageUrl,
        analysisType: form.analysisType,
        enterpriseId: form.enterpriseId,
        diagnosis: sim.diagnosis,
        severity: sim.severity,
        confidencePct: 72 + Math.floor(Math.random() * 22),
        aiSummary: sim.summary,
        findings: sim.findings,
        recommendations: sim.recommendations,
        createdAt: new Date().toISOString(),
        isPublic: form.isPublic,
      };
      setResult(analysis);
      addAnalysis(analysis);
      setAnalyzing(false);
    }, 2200);
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Input panel */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Upload className="w-4 h-4 text-violet-600" /> Upload & Analyse
            </h3>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {ANALYSIS_TYPES.map(t => {
                const Icon = t.icon;
                return (
                  <button key={t.value} type="button" onClick={() => setForm(f => ({...f, analysisType: t.value}))}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-left transition-colors ${form.analysisType === t.value ? 'bg-violet-600 text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                    <Icon className="w-3.5 h-3.5 flex-shrink-0" />{t.label}
                  </button>
                );
              })}
            </div>
            <form onSubmit={runAnalysis} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Image URL *</label>
                <input type="url" value={form.imageUrl} onChange={e => setForm(f => ({...f, imageUrl: e.target.value}))}
                  placeholder="https://… (imgbb.com, imgur.com, etc.)" required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                <p className="text-[10px] text-slate-400 mt-1">Upload your photo to imgbb.com or similar and paste the direct URL here.</p>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Describe what you see (optional)</label>
                <textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} rows={3}
                  placeholder="e.g. Yellow spots on tomato leaves, started 3 days ago…"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Enterprise</label>
                  <select value={form.enterpriseId} onChange={e => setForm(f => ({...f, enterpriseId: e.target.value}))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                    <option value="">None</option>
                    {enterprises.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </div>
                <label className="flex items-center gap-2 cursor-pointer pt-5">
                  <input type="checkbox" checked={form.isPublic} onChange={e => setForm(f => ({...f, isPublic: e.target.checked}))} className="w-4 h-4 rounded accent-violet-600" />
                  <span className="text-xs text-slate-600">Share with community</span>
                </label>
              </div>
              <button type="submit" disabled={analyzing}
                className="w-full py-2.5 bg-violet-600 text-white rounded-xl font-medium text-sm hover:bg-violet-700 disabled:opacity-60 flex items-center justify-center gap-2">
                {analyzing ? <><Loader2 className="w-4 h-4 animate-spin" /> Analysing with AI…</> : <><Brain className="w-4 h-4" /> Run AI Analysis</>}
              </button>
            </form>
          </div>
        </div>

        {/* Results panel */}
        <div className="lg:col-span-3">
          {analyzing && (
            <div className="bg-violet-50 border border-violet-200 rounded-xl p-10 text-center">
              <div className="w-14 h-14 bg-violet-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Brain className="w-8 h-8 text-violet-600 animate-pulse" />
              </div>
              <p className="text-violet-700 font-semibold text-lg">AI is analysing your image…</p>
              <p className="text-violet-500 text-sm mt-1">Consulting agricultural knowledge base</p>
              <div className="mt-4 flex gap-1 justify-center">
                {[0,1,2].map(i => <span key={i} className={`w-2 h-2 rounded-full bg-violet-400 animate-bounce`} style={{animationDelay:`${i*150}ms`}} />)}
              </div>
            </div>
          )}
          {result && !analyzing && (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-bold text-slate-900">{result.diagnosis}</h3>
                      <SevBadge sev={result.severity} />
                    </div>
                    <div className="text-xs text-slate-500">AI Confidence: <strong>{result.confidencePct}%</strong> · <span className="text-violet-500">AgroNexus AI v2</span></div>
                  </div>
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${result.severity === 'critical' ? 'bg-red-100' : result.severity === 'high' ? 'bg-orange-100' : result.severity === 'medium' ? 'bg-amber-100' : result.severity === 'low' ? 'bg-blue-100' : 'bg-green-100'}`}>
                    {result.severity === 'none' ? <CheckCircle className="w-6 h-6 text-green-600" /> : <AlertTriangle className={`w-6 h-6 ${result.severity === 'critical' ? 'text-red-600' : result.severity === 'high' ? 'text-orange-600' : 'text-amber-600'}`} />}
                  </div>
                </div>
              </div>
              {result.aiSummary && (
                <div className="px-5 py-4 bg-violet-50 border-b border-slate-100">
                  <p className="text-sm text-slate-700 leading-relaxed">{result.aiSummary}</p>
                </div>
              )}
              {result.findings.length > 0 && (
                <div className="px-5 py-4 border-b border-slate-100">
                  <div className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wide">Findings</div>
                  <div className="space-y-3">
                    {result.findings.map((f, i) => (
                      <div key={i}>
                        <div className="text-sm font-medium text-slate-800 flex items-center gap-1.5"><Eye className="w-3.5 h-3.5 text-violet-500" /> {f.title}</div>
                        <div className="text-xs text-slate-600 mt-0.5 ml-5">{f.detail}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {result.recommendations.length > 0 && (
                <div className="px-5 py-4">
                  <div className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wide">Recommended Actions</div>
                  <div className="space-y-2">
                    {result.recommendations.map((r, i) => (
                      <div key={i} className="flex gap-2 text-sm">
                        <span className="text-green-500 font-bold flex-shrink-0">{i+1}.</span>
                        <span className="text-slate-700">{r}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          {!result && !analyzing && (
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2"><Clock className="w-4 h-4 text-slate-400" /> Recent Analyses</h3>
              {analyses.length === 0 ? (
                <p className="text-sm text-slate-400">No analyses yet. Upload an image to get started.</p>
              ) : (
                analyses.slice().reverse().slice(0, 8).map(h => (
                  <div key={h.id} className="flex items-start gap-3 py-3 border-b border-slate-50 last:border-0 cursor-pointer hover:bg-slate-50 rounded-lg px-2" onClick={() => setResult(h)}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-slate-800 truncate">{h.diagnosis}</span>
                        <SevBadge sev={h.severity} />
                      </div>
                      <div className="text-xs text-slate-500 capitalize mt-0.5">{h.analysisType.replace(/_/g,' ')} · {h.confidencePct}% confidence · {fmtTs(h.createdAt)}</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0 mt-1" />
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── DRONE INTEL TAB ──────────────────────────────────────────────────────────

function DroneIntelTab({ enterprises, flights, addFlight, updateFlight }: {
  enterprises: {id:string;name:string}[];
  flights: DroneFlight[];
  addFlight: (f: DroneFlight) => void;
  updateFlight: (id: string, patch: Partial<DroneFlight>) => void;
}) {
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ enterpriseId: '', flightType: 'survey', notes: '' });

  function create(e: React.FormEvent) {
    e.preventDefault();
    addFlight({ id: `fl-${uid()}`, enterpriseId: form.enterpriseId, flightType: form.flightType, status: 'planned', notes: form.notes, createdAt: new Date().toISOString() });
    setShowNew(false);
    setForm({ enterpriseId: '', flightType: 'survey', notes: '' });
  }

  function complete(id: string) {
    const hs = [45, 61, 72, 78, 85, 90];
    const score = hs[Math.floor(Math.random() * hs.length)];
    const health = score >= 80 ? 'excellent' : score >= 65 ? 'good' : score >= 50 ? 'fair' : 'poor';
    const issues = score < 70 ? ['Patchy canopy in north section', 'Yellowing visible in row 3–5'] : score < 80 ? ['Minor weed pressure in headlands'] : [];
    updateFlight(id, { status: 'completed', areaCoveredHa: parseFloat((1 + Math.random() * 5).toFixed(1)), healthScore: score, overallHealth: health, aiSummary: `AI field analysis complete. Overall health: ${health} (${score}%). ${issues.length > 0 ? 'Issues detected: ' + issues.join('; ') + '.' : 'No significant issues detected.'}`, detectedIssues: issues });
  }

  const healthColor: Record<string,string> = { excellent:'bg-green-100 text-green-700', good:'bg-emerald-100 text-emerald-700', fair:'bg-amber-100 text-amber-700', poor:'bg-red-100 text-red-700' };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Plane className="w-4 h-4 text-violet-600" />
          <span className="font-semibold text-slate-800">Drone Operations</span>
        </div>
        <button onClick={() => setShowNew(v => !v)} className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 text-white text-sm rounded-lg hover:bg-violet-700 font-medium">
          <Plane className="w-4 h-4" /> Schedule Flight
        </button>
      </div>
      {showNew && (
        <form onSubmit={create} className="bg-white border border-violet-200 rounded-xl p-5 space-y-3">
          <h3 className="font-semibold text-slate-800">New Drone Flight</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Enterprise</label>
              <select value={form.enterpriseId} onChange={e => setForm(f => ({...f, enterpriseId: e.target.value}))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">
                <option value="">All / General</option>
                {enterprises.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Flight Type</label>
              <select value={form.flightType} onChange={e => setForm(f => ({...f, flightType: e.target.value}))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">
                <option value="survey">Survey</option>
                <option value="spray">Spray</option>
                <option value="inspection">Inspection</option>
                <option value="count">Livestock Count</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Notes</label>
              <input value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} placeholder="Optional" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm hover:bg-violet-700 flex items-center gap-1.5"><Plane className="w-4 h-4" /> Create Flight</button>
            <button type="button" onClick={() => setShowNew(false)} className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600">Cancel</button>
          </div>
        </form>
      )}
      {flights.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-slate-400 text-sm">No drone flights recorded yet.</div>
      ) : (
        <div className="space-y-3">
          {flights.slice().reverse().map(f => (
            <div key={f.id} className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-sm font-semibold text-slate-800 capitalize">{f.flightType} flight</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium capitalize ${f.status === 'completed' ? 'bg-green-100 text-green-700' : f.status === 'in_flight' ? 'bg-blue-100 text-blue-700' : f.status === 'aborted' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500'}`}>{f.status.replace('_',' ')}</span>
                    {f.overallHealth && <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium capitalize ${healthColor[f.overallHealth]}`}>{f.overallHealth} · {f.healthScore}%</span>}
                  </div>
                  <div className="text-xs text-slate-500 flex gap-3 flex-wrap">
                    {f.enterpriseId && <span>{enterprises.find(e => e.id === f.enterpriseId)?.name}</span>}
                    {f.areaCoveredHa && <span>{f.areaCoveredHa} ha covered</span>}
                    <span>{fmtTs(f.createdAt)}</span>
                  </div>
                  {f.aiSummary && <p className="text-xs text-slate-600 mt-2 leading-relaxed">{f.aiSummary}</p>}
                  {(f.detectedIssues ?? []).length > 0 && (
                    <div className="mt-2 space-y-1">
                      {f.detectedIssues!.map((issue, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-xs text-amber-700"><span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />{issue}</div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  {f.status === 'planned' && (
                    <button onClick={() => updateFlight(f.id, { status: 'in_flight' })} className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200">Start</button>
                  )}
                  {f.status === 'in_flight' && (
                    <button onClick={() => complete(f.id)} className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200">Complete + AI Analyse</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── COMMUNITY INTEL TAB ──────────────────────────────────────────────────────

function CommunityIntelTab({ reports, addReport, markHelpful }: {
  reports: CommunityReport[];
  addReport: (r: CommunityReport) => void;
  markHelpful: (id: string) => void;
}) {
  const [showSubmit, setShowSubmit] = useState(false);
  const [filterCat, setFilterCat] = useState('');
  const [form, setForm] = useState({ title:'', category:'crop_disease', description:'', cropOrAnimal:'', locationHint:'', imageUrl:'' });

  const CATS = [
    { value:'crop_disease', label:'Crop Disease' }, { value:'pest', label:'Pest/Insect' },
    { value:'animal_disease', label:'Animal Disease' }, { value:'nutritional', label:'Nutritional' },
    { value:'yield_issue', label:'Yield Problem' }, { value:'weed', label:'Weed' },
    { value:'soil', label:'Soil Issue' }, { value:'success', label:'Best Practice' }, { value:'other', label:'Other' },
  ];

  function submit(e: React.FormEvent) {
    e.preventDefault();
    addReport({ id: `cr-${uid()}`, ...form, isResolved: false, helpfulCount: 0, createdAt: new Date().toISOString() });
    setShowSubmit(false);
    setForm({ title:'', category:'crop_disease', description:'', cropOrAnimal:'', locationHint:'', imageUrl:'' });
  }

  const filtered = filterCat ? reports.filter(r => r.category === filterCat) : reports;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="font-semibold text-slate-800">Community Farm Intelligence</h3>
          <p className="text-xs text-slate-500">Cross-farm disease reports, pest alerts, and best practices</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm">
            <option value="">All categories</option>
            {CATS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <button onClick={() => setShowSubmit(v => !v)} className="flex items-center gap-1.5 px-3 py-2 bg-violet-600 text-white rounded-lg text-sm hover:bg-violet-700">
            <MessageCircle className="w-4 h-4" /> Submit Report
          </button>
        </div>
      </div>
      {showSubmit && (
        <form onSubmit={submit} className="bg-white border border-violet-200 rounded-xl p-5 space-y-3">
          <h3 className="font-semibold text-slate-800">Submit Field Report</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="col-span-2 md:col-span-3">
              <label className="block text-xs text-slate-500 mb-1">Title *</label>
              <input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} required placeholder="e.g. Yellowing leaves on maize — drought?" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Category</label>
              <select value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">
                {CATS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Crop / Animal</label>
              <input value={form.cropOrAnimal} onChange={e => setForm(f => ({...f, cropOrAnimal: e.target.value}))} placeholder="e.g. Maize, Broiler" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Location Hint</label>
              <input value={form.locationHint} onChange={e => setForm(f => ({...f, locationHint: e.target.value}))} placeholder="e.g. Lusaka district" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="col-span-2 md:col-span-3">
              <label className="block text-xs text-slate-500 mb-1">Description</label>
              <textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} rows={3} placeholder="Describe the problem in detail…" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm hover:bg-violet-700 flex items-center gap-1.5"><MessageCircle className="w-4 h-4" /> Submit</button>
            <button type="button" onClick={() => setShowSubmit(false)} className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600">Cancel</button>
          </div>
        </form>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-2 bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-400">
            <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No reports yet. Be the first to share!</p>
          </div>
        ) : (
          filtered.map(r => (
            <div key={r.id} className={`bg-white border rounded-xl p-5 ${r.isResolved ? 'border-green-200 bg-green-50/30' : 'border-slate-200'}`}>
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium capitalize ${CAT_COLORS[r.category] || 'bg-slate-100 text-slate-600'}`}>{r.category.replace('_',' ')}</span>
                    {r.isResolved && <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">Resolved</span>}
                    {r.severity && <SevBadge sev={r.severity} />}
                  </div>
                  <h4 className="font-medium text-slate-800 text-sm leading-snug">{r.title}</h4>
                  <div className="text-xs text-slate-500 mt-0.5 flex gap-2 flex-wrap">
                    {r.cropOrAnimal && <span>{r.cropOrAnimal}</span>}
                    {r.locationHint && <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" />{r.locationHint}</span>}
                    <span>{fmtTs(r.createdAt)}</span>
                  </div>
                </div>
                <button onClick={() => markHelpful(r.id)} className="flex items-center gap-1 text-xs text-slate-400 hover:text-violet-600 flex-shrink-0">
                  <ThumbsUp className="w-3.5 h-3.5" /> {r.helpfulCount}
                </button>
              </div>
              {r.description && <p className="text-xs text-slate-600 mb-3 leading-relaxed">{r.description}</p>}
              {r.diagnosis && (
                <div className="bg-violet-50 border border-violet-100 rounded-lg p-3 space-y-2">
                  <div className="text-[10px] font-semibold text-violet-600 uppercase">AI Diagnosis</div>
                  <div className="text-sm font-medium text-slate-800">{r.diagnosis}</div>
                  {r.recommendations && r.recommendations.length > 0 && (
                    <div className="space-y-1">
                      {r.recommendations.slice(0, 2).map((rec, i) => (
                        <div key={i} className="text-xs text-slate-700 flex gap-1"><span className="text-green-500">→</span>{rec}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function SmartVisionModule() {
  const { org, cycles } = useOrg();
  const [tab, setTab] = useState<'camera' | 'drone' | 'doctor' | 'community'>('camera');

  const [cameras,   setCameras]   = useState<CCTVCamera[]>(() => ls(LS_CAMERAS, SEED_CAMERAS));
  const [counts,    setCounts]    = useState<StockCount[]>(() => ls(LS_COUNTS, SEED_COUNTS));
  const [alerts,    setAlerts]    = useState<AlertItem[]>(() => ls(LS_ALERTS, SEED_ALERTS));
  const [analyses,  setAnalyses]  = useState<VisionAnalysis[]>(() => ls(LS_ANALYSES, []));
  const [flights,   setFlights]   = useState<DroneFlight[]>(() => ls(LS_FLIGHTS, []));
  const [community, setCommunity] = useState<CommunityReport[]>(() => ls(LS_COMMUNITY, SEED_COMMUNITY));

  const save = useCallback(<T,>(key: string, setter: React.Dispatch<React.SetStateAction<T>>) => (val: T) => { setter(val); lsSet(key, val); }, []);

  const enterprises = (org?.enterprises ?? []).map(e => ({ id: e.id, name: e.name }));
  const activeCycles = cycles.filter(c => c.status === 'active');

  const unresolvedAlerts = alerts.filter(a => !a.resolved).length;

  const stats = useMemo(() => ({
    cameras: cameras.length,
    live: cameras.filter(c => c.status !== 'offline').length,
    aiCams: cameras.filter(c => c.aiEnabled).length,
    alerts: unresolvedAlerts,
  }), [cameras, unresolvedAlerts]);

  const tabs = [
    { id: 'camera',    label: 'Camera Watch',   icon: Camera, badge: unresolvedAlerts },
    { id: 'drone',     label: 'Drone Intel',    icon: Plane },
    { id: 'doctor',    label: 'AI Vision',      icon: Brain },
    { id: 'community', label: 'Community Intel',icon: Users },
  ] as const;

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-700 via-purple-600 to-indigo-600 rounded-xl p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Smart Vision & AI Intelligence</h1>
            <p className="text-violet-200 text-sm">CCTV counting · problem detection · drone analysis · AI diagnosis · community intel</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
          {[
            { label: 'Cameras', value: stats.cameras, icon: Camera },
            { label: 'Live / Recording', value: stats.live, icon: Video },
            { label: 'AI-Enabled Cams', value: stats.aiCams, icon: Brain },
            { label: 'Open Alerts', value: stats.alerts, icon: AlertTriangle, hl: stats.alerts > 0 },
          ].map(s => {
            const Icon = s.icon;
            return (
              <div key={s.label} className={`rounded-lg p-3 ${s.hl ? 'bg-red-500/30 border border-red-400/40' : 'bg-white/10'}`}>
                <div className="flex items-center gap-2 mb-1"><Icon className="w-4 h-4 text-white/80" /><span className="text-xs text-white/70">{s.label}</span></div>
                <div className="text-2xl font-bold">{s.value}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map(t => {
          const Icon = t.icon;
          const badge = 'badge' in t ? t.badge : 0;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all relative ${tab === t.id ? 'bg-violet-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}>
              <Icon className="w-4 h-4" />
              <span className="hidden sm:block">{t.label}</span>
              {badge != null && badge > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${tab === t.id ? 'bg-white text-violet-700' : 'bg-red-500 text-white'}`}>{badge}</span>
              )}
            </button>
          );
        })}
      </div>

      {tab === 'camera' && (
        <CameraWatchTab
          cameras={cameras} counts={counts} alerts={alerts}
          enterprises={enterprises} activeCycles={activeCycles}
          addCamera={c => { const n = [...cameras, c]; setCameras(n); lsSet(LS_CAMERAS, n); }}
          deleteCamera={id => { const n = cameras.filter(c => c.id !== id); setCameras(n); lsSet(LS_CAMERAS, n); }}
          addCount={c => { const n = [...counts, c]; setCounts(n); lsSet(LS_COUNTS, n); }}
          resolveAlert={id => { const n = alerts.map(a => a.id === id ? {...a, resolved: true} : a); setAlerts(n); lsSet(LS_ALERTS, n); }}
        />
      )}
      {tab === 'drone' && (
        <DroneIntelTab
          enterprises={enterprises} flights={flights}
          addFlight={f => { const n = [...flights, f]; setFlights(n); lsSet(LS_FLIGHTS, n); }}
          updateFlight={(id, patch) => { const n = flights.map(f => f.id === id ? {...f, ...patch} : f); setFlights(n); lsSet(LS_FLIGHTS, n); }}
        />
      )}
      {tab === 'doctor' && (
        <AIDoctorTab
          enterprises={enterprises} analyses={analyses}
          addAnalysis={a => { const n = [...analyses, a]; setAnalyses(n); lsSet(LS_ANALYSES, n); }}
        />
      )}
      {tab === 'community' && (
        <CommunityIntelTab
          reports={community}
          addReport={r => { const n = [...community, r]; setCommunity(n); lsSet(LS_COMMUNITY, n); }}
          markHelpful={id => { const n = community.map(r => r.id === id ? {...r, helpfulCount: r.helpfulCount + 1} : r); setCommunity(n); lsSet(LS_COMMUNITY, n); }}
        />
      )}
    </div>
  );
}
