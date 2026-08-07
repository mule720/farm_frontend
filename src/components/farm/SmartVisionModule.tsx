import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Camera, Plane, Leaf, Users, AlertTriangle, CheckCircle, Loader2,
  Upload, Eye, Shield, Zap, TrendingUp, Activity, BarChart3,
  MapPin, Clock, ThumbsUp, MessageCircle, RefreshCw, X, Wifi,
  WifiOff, Video, Scan, Brain, Bug, Sprout, Heart,
} from 'lucide-react';
import { gqlRequest } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

// ─── helpers ──────────────────────────────────────────────────────────────────

function Tab({ id, active, icon: Icon, label, badge, onClick }: {
  id: string; active: boolean; icon: React.ElementType; label: string;
  badge?: number; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all relative ${
        active
          ? 'bg-violet-600 text-white shadow-md'
          : 'text-slate-600 hover:bg-slate-100'
      }`}
    >
      <Icon className="w-4 h-4" />
      <span className="hidden sm:block">{label}</span>
      {badge != null && badge > 0 && (
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
          active ? 'bg-white text-violet-700' : 'bg-red-500 text-white'
        }`}>
          {badge}
        </span>
      )}
    </button>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const map: Record<string, string> = {
    none: 'bg-green-100 text-green-700',
    low: 'bg-blue-100 text-blue-700',
    medium: 'bg-amber-100 text-amber-700',
    high: 'bg-orange-100 text-orange-700',
    critical: 'bg-red-100 text-red-700',
  };
  const icons: Record<string, React.ElementType> = {
    none: CheckCircle, low: Activity, medium: AlertTriangle,
    high: AlertTriangle, critical: Zap,
  };
  const Icon = icons[severity] || Activity;
  return (
    <span className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize ${map[severity] || 'bg-slate-100 text-slate-600'}`}>
      <Icon className="w-3 h-3" />
      {severity}
    </span>
  );
}

function HealthBar({ score }: { score: number }) {
  const color = score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-amber-400' : score >= 40 ? 'bg-orange-400' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-semibold text-slate-700 w-8">{score}%</span>
    </div>
  );
}

const ANALYSIS_TYPES = [
  { value: 'crop_disease', label: 'Crop Disease Detection', icon: Leaf },
  { value: 'pest_identification', label: 'Pest Identification', icon: Bug },
  { value: 'livestock_health', label: 'Livestock Health', icon: Heart },
  { value: 'livestock_count', label: 'Livestock Count', icon: Users },
  { value: 'field_survey', label: 'Field Survey', icon: Scan },
  { value: 'weed_detection', label: 'Weed Detection', icon: Sprout },
  { value: 'soil_assessment', label: 'Soil Assessment', icon: MapPin },
  { value: 'general', label: 'General Analysis', icon: Brain },
];

const REPORT_CATEGORIES = [
  { value: 'crop_disease', label: 'Crop Disease' },
  { value: 'pest', label: 'Pest / Insect' },
  { value: 'animal_disease', label: 'Animal Disease' },
  { value: 'nutritional', label: 'Nutritional Deficiency' },
  { value: 'yield_issue', label: 'Yield Problem' },
  { value: 'weed', label: 'Weed / Invasive' },
  { value: 'soil', label: 'Soil Issue' },
  { value: 'water', label: 'Water / Irrigation' },
  { value: 'success', label: 'Best Practice / Success' },
  { value: 'other', label: 'Other' },
];

// ─── Main Module ──────────────────────────────────────────────────────────────

export default function SmartVisionModule() {
  const { profile } = useAuth();
  const [tab, setTab] = useState<'camera' | 'drone' | 'doctor' | 'community'>('doctor');
  const [enterprises, setEnterprises] = useState<any[]>([]);
  const [devices, setDevices] = useState<any[]>([]);
  const [stockAlerts, setStockAlerts] = useState<any[]>([]);
  const [loadingShared, setLoadingShared] = useState(true);

  const isManager = ['director', 'production_manager', 'supervisor', 'saas_admin'].includes(profile?.role || '');

  const loadShared = useCallback(async () => {
    setLoadingShared(true);
    try {
      const [entData, devData, alertData] = await Promise.all([
        gqlRequest<{ enterprises: any[] }>(`query { enterprises(isActive: true) { id name category } }`),
        gqlRequest<{ devices: any[] }>(`query { devices { id name deviceType status location enterprise { id name } } }`),
        gqlRequest<{ stockCountAlerts: any[] }>(`query { stockCountAlerts { id enterprise { id name } countedQuantity expectedQuantity discrepancy discrepancyPct status countedAt } }`),
      ]);
      setEnterprises(entData.enterprises || []);
      setDevices(devData.devices || []);
      setStockAlerts(alertData.stockCountAlerts || []);
    } catch { }
    finally { setLoadingShared(false); }
  }, []);

  useEffect(() => { loadShared(); }, [loadShared]);

  const tabs = [
    { id: 'camera', label: 'Camera Watch', icon: Camera, badge: stockAlerts.length },
    { id: 'drone', label: 'Drone Intel', icon: Plane, badge: 0 },
    { id: 'doctor', label: 'AI Vision Doctor', icon: Brain, badge: 0 },
    { id: 'community', label: 'Community Intel', icon: Users, badge: 0 },
  ] as const;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-700 via-purple-600 to-indigo-600 rounded-xl p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Smart Vision & AI Intelligence</h1>
            <p className="text-violet-200 text-sm">CCTV stock monitoring · Drone field analysis · AI crop & livestock doctor · Community knowledge</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
          <StatCard label="Camera Devices" value={devices.filter(d => d.deviceType === 'camera').length} icon={Camera} />
          <StatCard label="Drones Paired" value={devices.filter(d => d.deviceType === 'drone').length} icon={Plane} />
          <StatCard label="Stock Alerts" value={stockAlerts.length} icon={AlertTriangle} highlight={stockAlerts.length > 0} />
          <StatCard label="Devices Online" value={devices.filter(d => d.status === 'online').length} icon={Wifi} />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map(t => (
          <Tab key={t.id} id={t.id} active={tab === t.id} icon={t.icon} label={t.label} badge={t.badge} onClick={() => setTab(t.id)} />
        ))}
      </div>

      {loadingShared ? (
        <div className="flex items-center gap-2 text-slate-500 p-4"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>
      ) : (
        <>
          {tab === 'camera'    && <CameraWatchTab devices={devices} enterprises={enterprises} stockAlerts={stockAlerts} isManager={isManager} onRefresh={loadShared} />}
          {tab === 'drone'     && <DroneIntelTab devices={devices} enterprises={enterprises} isManager={isManager} />}
          {tab === 'doctor'    && <AIDoctorTab enterprises={enterprises} profile={profile} />}
          {tab === 'community' && <CommunityIntelTab />}
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, highlight }: {
  label: string; value: number; icon: React.ElementType; highlight?: boolean;
}) {
  return (
    <div className={`rounded-lg p-3 ${highlight ? 'bg-red-500/30 border border-red-400/40' : 'bg-white/10'}`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-4 h-4 text-white/80" />
        <span className="text-xs text-white/70">{label}</span>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CAMERA WATCH TAB
// ═══════════════════════════════════════════════════════════════════════════════

function CameraWatchTab({ devices, enterprises, stockAlerts, isManager, onRefresh }: {
  devices: any[]; enterprises: any[]; stockAlerts: any[];
  isManager: boolean; onRefresh: () => void;
}) {
  const [showCount, setShowCount] = useState(false);
  const [countForm, setCountForm] = useState({ enterprise_id: '', batch_id: '', counted_quantity: '', snapshot_url: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [recentCounts, setRecentCounts] = useState<any[]>([]);
  const cameras = devices.filter(d => d.deviceType === 'camera');

  const loadCounts = useCallback(async () => {
    try {
      const data = await gqlRequest<{ stockCountLogs: any[] }>(`
        query { stockCountLogs(limit: 20) {
          id status countedQuantity expectedQuantity discrepancy discrepancyPct
          countedAt isAuthorized authorizationRef
          enterprise { id name } batch { id name } device { id name }
        }}
      `);
      setRecentCounts(data.stockCountLogs || []);
    } catch { }
  }, []);

  useEffect(() => { loadCounts(); }, [loadCounts]);

  async function submitCount(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await gqlRequest(`
        mutation($eid: ID!, $qty: Float!, $snap: String, $notes: String, $bid: ID) {
          logStockCount(enterpriseId: $eid, countedQuantity: $qty, snapshotUrl: $snap, notes: $notes, batchId: $bid) {
            log { id status discrepancy }
            alertCreated
          }
        }
      `, {
        eid: countForm.enterprise_id,
        qty: parseFloat(countForm.counted_quantity),
        snap: countForm.snapshot_url || null,
        notes: countForm.notes || null,
        bid: countForm.batch_id || null,
      });
      setShowCount(false);
      setCountForm({ enterprise_id: '', batch_id: '', counted_quantity: '', snapshot_url: '', notes: '' });
      await loadCounts();
      onRefresh();
    } catch (err: any) { alert(err.message); }
    finally { setSaving(false); }
  }

  async function authorizeMovement(logId: string) {
    const ref = prompt('Enter authorization reference (e.g. Sales Order #, Transfer Memo):');
    if (!ref) return;
    try {
      await gqlRequest(`
        mutation($id: ID!, $ref: String!) { authorizeStockMovement(logId: $id, authorizationRef: $ref) { log { id status } } }
      `, { id: logId, ref });
      await loadCounts();
      onRefresh();
    } catch (err: any) { alert(err.message); }
  }

  return (
    <div className="space-y-4">
      {/* Active alerts banner */}
      {stockAlerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <span className="font-semibold text-red-700">{stockAlerts.length} Unauthorized Stock Movement Alert{stockAlerts.length > 1 ? 's' : ''}</span>
          </div>
          <div className="space-y-2">
            {stockAlerts.map(a => (
              <div key={a.id} className="flex items-center justify-between gap-3 bg-white border border-red-100 rounded-lg px-4 py-3">
                <div>
                  <div className="text-sm font-medium text-red-800">{a.enterprise?.name}</div>
                  <div className="text-xs text-red-600">
                    Counted {a.countedQuantity} · Expected {a.expectedQuantity} · Missing {a.discrepancy} ({parseFloat(a.discrepancyPct).toFixed(1)}%)
                  </div>
                  <div className="text-[10px] text-slate-400">{new Date(a.countedAt).toLocaleString()}</div>
                </div>
                {isManager && (
                  <button onClick={() => authorizeMovement(a.id)} className="px-3 py-1.5 text-xs bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 whitespace-nowrap">
                    Authorize
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Camera grid */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <Video className="w-4 h-4 text-violet-600" /> Camera Feeds ({cameras.length})
          </h3>
          <div className="flex gap-2">
            <button onClick={onRefresh} className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50"><RefreshCw className="w-4 h-4" /></button>
            {isManager && (
              <button onClick={() => setShowCount(v => !v)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700">
                <Users className="w-4 h-4" /> Log Count
              </button>
            )}
          </div>
        </div>

        {cameras.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <Camera className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No cameras paired. Go to Settings → Devices to add a camera.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cameras.map(cam => (
              <CameraCard key={cam.id} camera={cam} />
            ))}
          </div>
        )}
      </div>

      {/* Log count form */}
      {showCount && (
        <form onSubmit={submitCount} className="bg-white border border-violet-200 rounded-xl p-5 space-y-3">
          <h3 className="font-semibold text-slate-800">Log Stock Count</h3>
          <p className="text-xs text-slate-500">Record a camera or manual count. The system will automatically compare against batch records and flag any discrepancy.</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="col-span-2 md:col-span-1">
              <label className="block text-xs text-slate-500 mb-1">Enterprise *</label>
              <select value={countForm.enterprise_id} onChange={e => setCountForm(f => ({ ...f, enterprise_id: e.target.value }))} required className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                <option value="">Select enterprise</option>
                {enterprises.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Counted Quantity *</label>
              <input type="number" value={countForm.counted_quantity} onChange={e => setCountForm(f => ({ ...f, counted_quantity: e.target.value }))} required placeholder="e.g. 450" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
            </div>
            <div className="col-span-2 md:col-span-3">
              <label className="block text-xs text-slate-500 mb-1">Notes</label>
              <input type="text" value={countForm.notes} onChange={e => setCountForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any observations…" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm hover:bg-violet-700 disabled:opacity-60 flex items-center gap-1.5">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />} Submit Count
            </button>
            <button type="button" onClick={() => setShowCount(false)} className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
          </div>
        </form>
      )}

      {/* Recent counts */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 font-semibold text-sm text-slate-800">Recent Stock Counts</div>
        {recentCounts.length === 0 ? (
          <div className="px-5 py-6 text-slate-400 text-sm text-center">No counts logged yet.</div>
        ) : (
          recentCounts.map(log => (
            <div key={log.id} className={`flex items-center gap-4 px-5 py-3 border-b border-slate-50 ${log.status === 'discrepancy' ? 'bg-red-50' : ''}`}>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-800">{log.enterprise?.name}</div>
                <div className="text-xs text-slate-500">
                  Counted: <strong>{log.countedQuantity}</strong> · Expected: <strong>{log.expectedQuantity}</strong>
                  {log.discrepancy > 0 && <span className="text-red-600"> · Missing: {log.discrepancy} ({parseFloat(log.discrepancyPct).toFixed(1)}%)</span>}
                </div>
                <div className="text-[10px] text-slate-400">{new Date(log.countedAt).toLocaleString()}</div>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium capitalize ${
                log.status === 'ok' ? 'bg-green-100 text-green-700' :
                log.status === 'discrepancy' ? 'bg-red-100 text-red-700' :
                log.status === 'authorized' ? 'bg-blue-100 text-blue-700' :
                'bg-slate-100 text-slate-500'
              }`}>{log.status.replace('_', ' ')}</span>
              {log.status === 'discrepancy' && isManager && (
                <button onClick={() => authorizeMovement(log.id)} className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded hover:bg-amber-200">Authorize</button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function CameraCard({ camera }: { camera: any }) {
  const isOnline = camera.status === 'online';
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <div className={`h-32 flex items-center justify-center ${isOnline ? 'bg-slate-900' : 'bg-slate-100'}`}>
        {isOnline ? (
          <div className="text-center">
            <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse mx-auto mb-2" />
            <span className="text-xs text-green-400">LIVE</span>
          </div>
        ) : (
          <div className="text-center text-slate-400">
            <WifiOff className="w-8 h-8 mx-auto mb-1 opacity-40" />
            <span className="text-xs">Offline</span>
          </div>
        )}
      </div>
      <div className="p-3">
        <div className="flex items-center justify-between">
          <div className="font-medium text-sm text-slate-800">{camera.name}</div>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isOnline ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
            {camera.status}
          </span>
        </div>
        <div className="text-xs text-slate-500 mt-0.5">{camera.location || 'No location set'}</div>
        {camera.enterprise && <div className="text-[10px] text-violet-600 mt-0.5">{camera.enterprise.name}</div>}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DRONE INTEL TAB
// ═══════════════════════════════════════════════════════════════════════════════

function DroneIntelTab({ devices, enterprises, isManager }: {
  devices: any[]; enterprises: any[]; isManager: boolean;
}) {
  const [flights, setFlights] = useState<any[]>([]);
  const [fieldReports, setFieldReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewFlight, setShowNewFlight] = useState(false);
  const [showAnalyze, setShowAnalyze] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [flightForm, setFlightForm] = useState({ device_id: '', enterprise_id: '', flight_type: 'survey', notes: '' });
  const [analyzeForm, setAnalyzeForm] = useState({ image_url: '', user_notes: '' });
  const drones = devices.filter(d => d.deviceType === 'drone');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [flData, frData] = await Promise.all([
        gqlRequest<{ droneFlights: any[] }>(`
          query { droneFlights {
            id flightType status areaCoveredHa altitudeM notes createdAt
            device { id name } enterprise { id name }
            findings fieldReport { id overallHealth healthScore aiSummary detectedIssues }
          }}
        `),
        gqlRequest<{ droneFieldReports: any[] }>(`
          query { droneFieldReports(limit: 10) {
            id overallHealth healthScore aiSummary estimatedYieldImpactPct generatedAt
            enterprise { id name } actionPlan detectedIssues
          }}
        `),
      ]);
      setFlights(flData.droneFlights || []);
      setFieldReports(frData.droneFieldReports || []);
    } catch { }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function createFlight(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await gqlRequest(`
        mutation($input: DroneFlightInput!) { createDroneFlight(input: $input) { flight { id } } }
      `, { input: { deviceId: flightForm.device_id || null, enterpriseId: flightForm.enterprise_id || null, flightType: flightForm.flight_type, notes: flightForm.notes } });
      setShowNewFlight(false);
      await load();
    } catch (err: any) { alert(err.message); }
    finally { setSaving(false); }
  }

  async function setStatus(id: string, status: string) {
    try {
      await gqlRequest(`mutation($id: ID!, $status: String!) { updateDroneFlight(id: $id, status: $status) { flight { id } } }`, { id, status });
      await load();
    } catch (err: any) { alert(err.message); }
  }

  async function analyzeFlightImage(flightId: string) {
    if (!analyzeForm.image_url) { alert('Please enter an image URL'); return; }
    setAnalyzing(true);
    try {
      await gqlRequest(`
        mutation($fid: ID!, $url: String!, $notes: String) {
          analyzeDroneFlight(flightId: $fid, imageUrl: $url, userNotes: $notes) {
            fieldReport { id overallHealth healthScore aiSummary }
          }
        }
      `, { fid: flightId, url: analyzeForm.image_url, notes: analyzeForm.user_notes });
      setShowAnalyze(null);
      setAnalyzeForm({ image_url: '', user_notes: '' });
      await load();
    } catch (err: any) { alert(err.message); }
    finally { setAnalyzing(false); }
  }

  const healthColor: Record<string, string> = {
    excellent: 'text-green-700 bg-green-100',
    good: 'text-emerald-700 bg-emerald-100',
    fair: 'text-amber-700 bg-amber-100',
    poor: 'text-orange-700 bg-orange-100',
    critical: 'text-red-700 bg-red-100',
  };

  return (
    <div className="space-y-4">
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap gap-3 items-center justify-between">
        <div className="flex items-center gap-2">
          <Plane className="w-4 h-4 text-violet-600" />
          <span className="font-medium text-slate-700">Drone Operations — {drones.length} drone{drones.length !== 1 ? 's' : ''} paired</span>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50"><RefreshCw className="w-4 h-4" /></button>
          {isManager && (
            <button onClick={() => setShowNewFlight(v => !v)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700">
              <Plane className="w-4 h-4" /> Schedule Flight
            </button>
          )}
        </div>
      </div>

      {showNewFlight && (
        <form onSubmit={createFlight} className="bg-white border border-violet-200 rounded-xl p-5 space-y-3">
          <h3 className="font-semibold text-slate-800">New Drone Flight</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Drone</label>
              <select value={flightForm.device_id} onChange={e => setFlightForm(f => ({ ...f, device_id: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                <option value="">None paired</option>
                {drones.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Enterprise</label>
              <select value={flightForm.enterprise_id} onChange={e => setFlightForm(f => ({ ...f, enterprise_id: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                <option value="">All / General</option>
                {enterprises.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Flight Type</label>
              <select value={flightForm.flight_type} onChange={e => setFlightForm(f => ({ ...f, flight_type: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                <option value="survey">Survey</option>
                <option value="spray">Spray</option>
                <option value="inspection">Inspection</option>
                <option value="count">Livestock Count</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Notes</label>
              <input value={flightForm.notes} onChange={e => setFlightForm(f => ({ ...f, notes: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="Optional notes" />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm hover:bg-violet-700 disabled:opacity-60 flex items-center gap-1.5">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plane className="w-4 h-4" />} Create Flight
            </button>
            <button type="button" onClick={() => setShowNewFlight(false)} className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-slate-500 p-4"><Loader2 className="w-4 h-4 animate-spin" /> Loading flights…</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Flights list */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 font-semibold text-sm text-slate-800">Flight Log</div>
            {flights.length === 0 ? (
              <div className="px-5 py-8 text-center text-slate-400 text-sm">No drone flights recorded.</div>
            ) : (
              flights.map(flight => (
                <div key={flight.id} className="border-b border-slate-50 last:border-0 px-5 py-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-slate-800 capitalize">{flight.flightType} flight</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full capitalize ${
                          flight.status === 'completed' ? 'bg-green-100 text-green-700' :
                          flight.status === 'in_flight' ? 'bg-blue-100 text-blue-700' :
                          flight.status === 'aborted' ? 'bg-red-100 text-red-700' :
                          'bg-slate-100 text-slate-500'
                        }`}>{flight.status.replace('_', ' ')}</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 flex gap-3 flex-wrap">
                        {flight.enterprise && <span>{flight.enterprise.name}</span>}
                        {flight.areaCoveredHa && <span>{flight.areaCoveredHa} ha</span>}
                        <span>{new Date(flight.createdAt).toLocaleDateString()}</span>
                      </div>
                      {flight.fieldReport && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full capitalize mt-1 inline-block ${healthColor[flight.fieldReport.overallHealth] || 'bg-slate-100 text-slate-500'}`}>
                          Field: {flight.fieldReport.overallHealth} ({flight.fieldReport.healthScore}%)
                        </span>
                      )}
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      {flight.status === 'planned' && isManager && (
                        <button onClick={() => setStatus(flight.id, 'in_flight')} className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200">Start</button>
                      )}
                      {flight.status === 'in_flight' && isManager && (
                        <button onClick={() => setStatus(flight.id, 'completed')} className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200">Complete</button>
                      )}
                      {flight.status === 'completed' && !flight.fieldReport && isManager && (
                        <button onClick={() => setShowAnalyze(flight.id)} className="text-xs px-2 py-1 bg-violet-100 text-violet-700 rounded hover:bg-violet-200">Analyse</button>
                      )}
                    </div>
                  </div>

                  {/* Analyze form */}
                  {showAnalyze === flight.id && (
                    <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                      <div className="text-xs text-slate-600 font-medium">Run AI Field Analysis</div>
                      <input
                        value={analyzeForm.image_url}
                        onChange={e => setAnalyzeForm(f => ({ ...f, image_url: e.target.value }))}
                        placeholder="Paste drone image URL (publicly accessible)"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                      />
                      <input
                        value={analyzeForm.user_notes}
                        onChange={e => setAnalyzeForm(f => ({ ...f, user_notes: e.target.value }))}
                        placeholder="Observations (crop type, concerns…)"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                      />
                      <div className="flex gap-2">
                        <button onClick={() => analyzeFlightImage(flight.id)} disabled={analyzing} className="px-3 py-1.5 text-xs bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-60 flex items-center gap-1">
                          {analyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Brain className="w-3 h-3" />} Run AI
                        </button>
                        <button onClick={() => setShowAnalyze(null)} className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-600">Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Field reports */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 font-semibold text-sm text-slate-800">Field Analysis Reports</div>
            {fieldReports.length === 0 ? (
              <div className="px-5 py-8 text-center text-slate-400 text-sm">No field reports yet. Complete a drone flight and run AI analysis.</div>
            ) : (
              fieldReports.map(fr => (
                <div key={fr.id} className="border-b border-slate-50 last:border-0 px-5 py-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${healthColor[fr.overallHealth] || 'bg-slate-100 text-slate-500'}`}>
                          {fr.overallHealth}
                        </span>
                        {fr.enterprise && <span className="text-sm font-medium text-slate-800">{fr.enterprise.name}</span>}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">{new Date(fr.generatedAt).toLocaleString()}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-slate-800">{fr.healthScore}%</div>
                      <div className="text-[10px] text-slate-400">Field health</div>
                    </div>
                  </div>
                  <HealthBar score={fr.healthScore} />
                  {fr.aiSummary && <p className="text-xs text-slate-600 leading-relaxed">{fr.aiSummary}</p>}
                  {(fr.detectedIssues || []).length > 0 && (
                    <div className="space-y-1">
                      {fr.detectedIssues.map((issue: any, i: number) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
                          <span className="text-slate-700">{issue.issue}</span>
                          <span className="text-slate-400">— {issue.area_estimate}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {(fr.actionPlan || []).length > 0 && (
                    <div>
                      <div className="text-[10px] font-semibold text-slate-500 mb-1">RECOMMENDED ACTIONS</div>
                      {fr.actionPlan.slice(0, 3).map((a: string, i: number) => (
                        <div key={i} className="text-xs text-slate-700 flex gap-1.5"><span className="text-green-500">→</span>{a}</div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// AI VISION DOCTOR TAB
// ═══════════════════════════════════════════════════════════════════════════════

function AIDoctorTab({ enterprises, profile }: { enterprises: any[]; profile: any }) {
  const [form, setForm] = useState({
    image_url: '', analysis_type: 'crop_disease', user_description: '',
    enterprise_id: '', is_public: false,
  });
  const [result, setResult] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const loadHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const data = await gqlRequest<{ visionAnalyses: any[] }>(`
        query { visionAnalyses(limit: 10) {
          id analysisType diagnosis severity confidencePct aiSummary
          recommendations findings createdAt isPublic
          enterprise { id name }
        }}
      `);
      setHistory(data.visionAnalyses || []);
    } catch { }
    finally { setLoadingHistory(false); }
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  async function runAnalysis(e: React.FormEvent) {
    e.preventDefault();
    if (!form.image_url) { alert('Please enter a publicly accessible image URL.'); return; }
    setAnalyzing(true);
    setResult(null);
    try {
      const data = await gqlRequest<{ analyzeImage: { analysis: any } }>(`
        mutation($url: String!, $type: String!, $desc: String, $eid: ID, $pub: Boolean) {
          analyzeImage(imageUrl: $url, analysisType: $type, userDescription: $desc, enterpriseId: $eid, isPublic: $pub) {
            analysis {
              id diagnosis severity confidencePct findings recommendations aiSummary extraData aiModelUsed
            }
          }
        }
      `, {
        url: form.image_url,
        type: form.analysis_type,
        desc: form.user_description || null,
        eid: form.enterprise_id || null,
        pub: form.is_public,
      });
      setResult(data.analyzeImage.analysis);
      loadHistory();
    } catch (err: any) { alert('Analysis failed: ' + err.message); }
    finally { setAnalyzing(false); }
  }

  const selectedType = ANALYSIS_TYPES.find(t => t.value === form.analysis_type);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Input panel */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Upload className="w-4 h-4 text-violet-600" /> Upload & Analyse
            </h3>

            {/* Analysis type selector */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {ANALYSIS_TYPES.map(t => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, analysis_type: t.value }))}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-left transition-colors ${
                      form.analysis_type === t.value
                        ? 'bg-violet-600 text-white'
                        : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                    {t.label}
                  </button>
                );
              })}
            </div>

            <form onSubmit={runAnalysis} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Image URL *</label>
                <input
                  type="url"
                  value={form.image_url}
                  onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))}
                  placeholder="https://… (must be publicly accessible)"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  required
                />
                <p className="text-[10px] text-slate-400 mt-1">Upload your photo to any image host (imgbb.com, imgur.com, etc.) and paste the direct link here.</p>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Describe what you see (optional)</label>
                <textarea
                  value={form.user_description}
                  onChange={e => setForm(f => ({ ...f, user_description: e.target.value }))}
                  rows={3}
                  placeholder="e.g. Yellow spots on tomato leaves, started 3 days ago…"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Enterprise (optional)</label>
                <select value={form.enterprise_id} onChange={e => setForm(f => ({ ...f, enterprise_id: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                  <option value="">None</option>
                  {enterprises.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="public"
                  type="checkbox"
                  checked={form.is_public}
                  onChange={e => setForm(f => ({ ...f, is_public: e.target.checked }))}
                  className="w-4 h-4 text-violet-600 rounded"
                />
                <label htmlFor="public" className="text-xs text-slate-600">Share with community (anonymized)</label>
              </div>
              <button
                type="submit"
                disabled={analyzing}
                className="w-full py-2.5 bg-violet-600 text-white rounded-xl font-medium text-sm hover:bg-violet-700 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {analyzing ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Analysing with AI…</>
                ) : (
                  <><Brain className="w-4 h-4" /> Run AI Analysis</>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Results panel */}
        <div className="lg:col-span-3 space-y-4">
          {analyzing && (
            <div className="bg-violet-50 border border-violet-200 rounded-xl p-8 text-center">
              <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Brain className="w-6 h-6 text-violet-600 animate-pulse" />
              </div>
              <p className="text-violet-700 font-medium">AI is analysing your image…</p>
              <p className="text-violet-500 text-sm mt-1">Consulting agricultural knowledge base</p>
            </div>
          )}

          {result && !analyzing && (
            <AIResultCard result={result} />
          )}

          {!result && !analyzing && (
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" /> Recent Analyses
              </h3>
              {loadingHistory ? (
                <div className="flex items-center gap-2 text-slate-400 text-sm"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>
              ) : history.length === 0 ? (
                <p className="text-sm text-slate-400">No analyses yet. Upload an image to get started.</p>
              ) : (
                history.map(h => (
                  <div key={h.id} className="flex items-start gap-3 py-3 border-b border-slate-50 last:border-0 cursor-pointer hover:bg-slate-50 rounded-lg px-2" onClick={() => setResult(h)}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-slate-800 truncate">{h.diagnosis || 'Pending'}</span>
                        <SeverityBadge severity={h.severity} />
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 capitalize">{(h.analysisType || '').replace('_', ' ')} · {h.confidencePct}% confidence</div>
                      {h.enterprise && <div className="text-[10px] text-violet-600">{h.enterprise.name}</div>}
                      <div className="text-[10px] text-slate-400">{new Date(h.createdAt).toLocaleString()}</div>
                    </div>
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

function AIResultCard({ result }: { result: any }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      {/* Diagnosis header */}
      <div className="px-5 py-4 border-b border-slate-100">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="font-bold text-slate-900">{result.diagnosis}</h3>
              <SeverityBadge severity={result.severity} />
            </div>
            <div className="text-xs text-slate-500">
              AI Confidence: <strong>{result.confidencePct}%</strong>
              {result.aiModelUsed && <span className="ml-2 text-violet-500">· {result.aiModelUsed}</span>}
            </div>
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
            result.severity === 'critical' ? 'bg-red-100' :
            result.severity === 'high' ? 'bg-orange-100' :
            result.severity === 'medium' ? 'bg-amber-100' :
            result.severity === 'low' ? 'bg-blue-100' : 'bg-green-100'
          }`}>
            {result.severity === 'none' ? <CheckCircle className="w-6 h-6 text-green-600" /> : <AlertTriangle className={`w-6 h-6 ${result.severity === 'critical' ? 'text-red-600' : result.severity === 'high' ? 'text-orange-600' : 'text-amber-600'}`} />}
          </div>
        </div>
      </div>

      {/* Summary */}
      {result.aiSummary && (
        <div className="px-5 py-4 bg-violet-50 border-b border-slate-100">
          <p className="text-sm text-slate-700 leading-relaxed">{result.aiSummary}</p>
        </div>
      )}

      {/* Findings */}
      {(result.findings || []).length > 0 && (
        <div className="px-5 py-4 border-b border-slate-100">
          <div className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wide">Findings</div>
          <div className="space-y-3">
            {result.findings.map((f: any, i: number) => (
              <div key={i}>
                <div className="text-sm font-medium text-slate-800 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-violet-500" /> {f.title}
                </div>
                <div className="text-xs text-slate-600 mt-0.5 ml-5">{f.detail}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {(result.recommendations || []).length > 0 && (
        <div className="px-5 py-4 border-b border-slate-100">
          <div className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wide">Recommended Actions</div>
          <div className="space-y-2">
            {result.recommendations.map((r: string, i: number) => (
              <div key={i} className="flex gap-2 text-sm">
                <span className="text-green-500 font-bold flex-shrink-0">{i + 1}.</span>
                <span className="text-slate-700">{r}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Extra data */}
      {result.extraData && Object.keys(result.extraData).length > 0 && (
        <div className="px-5 py-4">
          <div className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wide">Additional Details</div>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(result.extraData).map(([k, v]) => {
              if (!v || (Array.isArray(v) && v.length === 0)) return null;
              return (
                <div key={k} className="text-xs">
                  <div className="text-slate-400 capitalize">{k.replace(/_/g, ' ')}</div>
                  <div className="text-slate-700 font-medium">
                    {Array.isArray(v) ? v.join(', ') : String(v)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMMUNITY INTEL TAB
// ═══════════════════════════════════════════════════════════════════════════════

function CommunityIntelTab() {
  const [reports, setReports] = useState<any[]>([]);
  const [myReports, setMyReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCat, setFilterCat] = useState('');
  const [showSubmit, setShowSubmit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitForm, setSubmitForm] = useState({
    title: '', category: 'crop_disease', description: '', crop_or_animal: '',
    location_hint: '', image_url: '', visibility: 'community',
  });
  const { profile } = useAuth();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [communityData, myData] = await Promise.all([
        gqlRequest<{ communityReports: any[] }>(`
          query($cat: String) { communityReports(category: $cat, limit: 30) {
            id category title description cropOrAnimal locationHint
            isResolved helpfulCount createdAt
            visionAnalysis { diagnosis severity confidencePct aiSummary recommendations }
          }}
        `, { cat: filterCat || null }),
        gqlRequest<{ farmerReports: any[] }>(`
          query { farmerReports(limit: 10) {
            id category title isResolved visibility helpfulCount createdAt
            visionAnalysis { diagnosis severity confidencePct }
          }}
        `),
      ]);
      setReports(communityData.communityReports || []);
      setMyReports(myData.farmerReports || []);
    } catch { }
    finally { setLoading(false); }
  }, [filterCat]);

  useEffect(() => { load(); }, [load]);

  async function submitReport(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await gqlRequest(`
        mutation($cat: String!, $title: String!, $desc: String, $crop: String, $loc: String, $url: String, $vis: String) {
          submitFarmerReport(category: $cat, title: $title, description: $desc, cropOrAnimal: $crop, locationHint: $loc, imageUrl: $url, visibility: $vis) {
            report { id }
          }
        }
      `, {
        cat: submitForm.category,
        title: submitForm.title,
        desc: submitForm.description || null,
        crop: submitForm.crop_or_animal || null,
        loc: submitForm.location_hint || null,
        url: submitForm.image_url || null,
        vis: submitForm.visibility,
      });
      setShowSubmit(false);
      setSubmitForm({ title: '', category: 'crop_disease', description: '', crop_or_animal: '', location_hint: '', image_url: '', visibility: 'community' });
      await load();
    } catch (err: any) { alert(err.message); }
    finally { setSaving(false); }
  }

  async function markHelpful(id: string) {
    try {
      await gqlRequest(`mutation($id: ID!) { markReportHelpful(reportId: $id) { report { id helpfulCount } } }`, { id });
      setReports(r => r.map(x => x.id === id ? { ...x, helpfulCount: x.helpfulCount + 1 } : x));
    } catch { }
  }

  const catColors: Record<string, string> = {
    crop_disease: 'bg-green-100 text-green-700',
    pest: 'bg-orange-100 text-orange-700',
    animal_disease: 'bg-red-100 text-red-700',
    nutritional: 'bg-yellow-100 text-yellow-700',
    yield_issue: 'bg-blue-100 text-blue-700',
    weed: 'bg-lime-100 text-lime-700',
    soil: 'bg-amber-100 text-amber-700',
    success: 'bg-emerald-100 text-emerald-700',
    other: 'bg-slate-100 text-slate-600',
  };

  return (
    <div className="space-y-4">
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap gap-3 items-center justify-between">
        <div>
          <h3 className="font-semibold text-slate-800">Community Farm Intelligence</h3>
          <p className="text-xs text-slate-500">Cross-farm disease reports, pest alerts, and best practices — powered by AI</p>
        </div>
        <div className="flex gap-2">
          <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg text-sm">
            <option value="">All categories</option>
            {REPORT_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <button onClick={() => setShowSubmit(v => !v)} className="flex items-center gap-1.5 px-3 py-2 bg-violet-600 text-white rounded-lg text-sm hover:bg-violet-700">
            <MessageCircle className="w-4 h-4" /> Submit Report
          </button>
        </div>
      </div>

      {/* Submit form */}
      {showSubmit && (
        <form onSubmit={submitReport} className="bg-white border border-violet-200 rounded-xl p-5 space-y-3">
          <h3 className="font-semibold text-slate-800">Submit Field Report</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="col-span-2 md:col-span-3">
              <label className="block text-xs text-slate-500 mb-1">Title *</label>
              <input value={submitForm.title} onChange={e => setSubmitForm(f => ({ ...f, title: e.target.value }))} required placeholder="e.g. Yellowing leaves on maize — drought?" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Category</label>
              <select value={submitForm.category} onChange={e => setSubmitForm(f => ({ ...f, category: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                {REPORT_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Crop / Animal</label>
              <input value={submitForm.crop_or_animal} onChange={e => setSubmitForm(f => ({ ...f, crop_or_animal: e.target.value }))} placeholder="e.g. Maize, Broiler chicken" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Visibility</label>
              <select value={submitForm.visibility} onChange={e => setSubmitForm(f => ({ ...f, visibility: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                <option value="community">Community (public)</option>
                <option value="private">Private</option>
              </select>
            </div>
            <div className="col-span-2 md:col-span-3">
              <label className="block text-xs text-slate-500 mb-1">Image URL (optional — for AI diagnosis)</label>
              <input value={submitForm.image_url} onChange={e => setSubmitForm(f => ({ ...f, image_url: e.target.value }))} placeholder="https://… paste image link" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
            </div>
            <div className="col-span-2 md:col-span-3">
              <label className="block text-xs text-slate-500 mb-1">Description</label>
              <textarea value={submitForm.description} onChange={e => setSubmitForm(f => ({ ...f, description: e.target.value }))} rows={3} placeholder="Describe the problem in detail…" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm hover:bg-violet-700 disabled:opacity-60 flex items-center gap-1.5">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />} Submit
            </button>
            <button type="button" onClick={() => setShowSubmit(false)} className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-slate-500 p-4"><Loader2 className="w-4 h-4 animate-spin" /> Loading community reports…</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reports.length === 0 ? (
            <div className="col-span-2 bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-400">
              <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No community reports yet. Be the first to share!</p>
            </div>
          ) : (
            reports.map(r => {
              const va = r.visionAnalysis;
              return (
                <div key={r.id} className={`bg-white border rounded-xl p-5 ${r.isResolved ? 'border-green-200 bg-green-50/30' : 'border-slate-200'}`}>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium capitalize ${catColors[r.category] || 'bg-slate-100 text-slate-600'}`}>
                          {(r.category || '').replace('_', ' ')}
                        </span>
                        {r.isResolved && <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">Resolved</span>}
                        {va && <SeverityBadge severity={va.severity} />}
                      </div>
                      <h4 className="font-medium text-slate-800 text-sm leading-snug">{r.title}</h4>
                      <div className="text-xs text-slate-500 mt-0.5 flex gap-2 flex-wrap">
                        {r.cropOrAnimal && <span>{r.cropOrAnimal}</span>}
                        {r.locationHint && <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" />{r.locationHint}</span>}
                        <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <button onClick={() => markHelpful(r.id)} className="flex items-center gap-1 text-xs text-slate-400 hover:text-violet-600 flex-shrink-0">
                      <ThumbsUp className="w-3.5 h-3.5" /> {r.helpfulCount}
                    </button>
                  </div>

                  {r.description && <p className="text-xs text-slate-600 mb-3 leading-relaxed">{r.description}</p>}

                  {va && (
                    <div className="bg-violet-50 border border-violet-100 rounded-lg p-3 space-y-2">
                      <div className="text-[10px] font-semibold text-violet-600 uppercase">AI Diagnosis</div>
                      <div className="text-sm font-medium text-slate-800">{va.diagnosis}</div>
                      {va.aiSummary && <p className="text-xs text-slate-600 leading-relaxed">{va.aiSummary}</p>}
                      {(va.recommendations || []).length > 0 && (
                        <div className="space-y-1">
                          {va.recommendations.slice(0, 2).map((rec: string, i: number) => (
                            <div key={i} className="text-xs text-slate-700 flex gap-1"><span className="text-green-500">→</span>{rec}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
