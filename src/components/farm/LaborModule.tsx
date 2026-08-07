import React, { useState } from 'react';
import {
  Users, Clock, MapPin, CheckCircle, AlertTriangle, Plus, DollarSign,
  BarChart2, Calendar, Fingerprint, Star, TrendingUp, FileText,
} from 'lucide-react';

interface Worker {
  id: string;
  full_name: string;
  employee_id: string;
  job_title: string;
  department: string;
  contract_type: string;
  pay_type: string;
  daily_rate: number;
  attendance_today: 'present' | 'absent' | 'late' | 'pending';
  clock_in?: string;
  tasks_today: number;
  tasks_done: number;
  avg_quality: number;
  is_active: boolean;
}

const MOCK_WORKERS: Worker[] = [
  { id: '1', full_name: 'Mwape Bwalya', employee_id: 'EMP-001', job_title: 'Senior Farmhand', department: 'Crop Production', contract_type: 'permanent', pay_type: 'daily', daily_rate: 85, attendance_today: 'present', clock_in: '06:12', tasks_today: 4, tasks_done: 3, avg_quality: 4.5, is_active: true },
  { id: '2', full_name: 'Chanda Mutale', employee_id: 'EMP-002', job_title: 'Irrigation Tech', department: 'Smart Farm', contract_type: 'permanent', pay_type: 'monthly', daily_rate: 120, attendance_today: 'present', clock_in: '06:05', tasks_today: 3, tasks_done: 3, avg_quality: 4.8, is_active: true },
  { id: '3', full_name: 'Nsama Phiri', employee_id: 'EMP-003', job_title: 'Livestock Handler', department: 'Animal Production', contract_type: 'seasonal', pay_type: 'daily', daily_rate: 70, attendance_today: 'late', clock_in: '07:45', tasks_today: 5, tasks_done: 2, avg_quality: 3.9, is_active: true },
  { id: '4', full_name: 'Kaonga Musonda', employee_id: 'EMP-004', job_title: 'Greenhouse Operator', department: 'Greenhouse', contract_type: 'permanent', pay_type: 'daily', daily_rate: 95, attendance_today: 'present', clock_in: '06:00', tasks_today: 6, tasks_done: 5, avg_quality: 4.7, is_active: true },
  { id: '5', full_name: 'Temwa Nkole', employee_id: 'EMP-005', job_title: 'General Labour', department: 'Crop Production', contract_type: 'casual', pay_type: 'daily', daily_rate: 60, attendance_today: 'absent', tasks_today: 0, tasks_done: 0, avg_quality: 3.5, is_active: true },
];

const MOCK_TASKS = [
  { id: '1', worker: 'Mwape Bwalya', title: 'Irrigation check — Field A', status: 'done', priority: 'high', field: 'Field A', time: '07:00', gps_verified: true },
  { id: '2', worker: 'Mwape Bwalya', title: 'Apply foliar feed — Tomatoes', status: 'in_progress', priority: 'medium', field: 'Tunnel 1', time: '10:00', gps_verified: true },
  { id: '3', worker: 'Chanda Mutale', title: 'Hydroponic EC/pH check', status: 'done', priority: 'high', field: 'NFT Bay', time: '07:30', gps_verified: true },
  { id: '4', worker: 'Nsama Phiri', title: 'Feed cattle — Pen 3', status: 'in_progress', priority: 'high', field: 'Pen 3', time: '08:00', gps_verified: false },
  { id: '5', worker: 'Kaonga Musonda', title: 'Harvest lettuce — NFT Bay', status: 'done', priority: 'medium', field: 'NFT Bay', time: '09:00', gps_verified: true },
  { id: '6', worker: 'Kaonga Musonda', title: 'Transplant seedlings', status: 'todo', priority: 'low', field: 'Nursery', time: '14:00', gps_verified: false },
];

const PAYROLL_SUMMARY = {
  period: 'June 2026', status: 'draft', workers: 5, total_gross: 7820,
  total_napsa: 390, total_nhima: 234, total_paye: 620, total_net: 6576,
};

function AttendanceBadge({ status }: { status: Worker['attendance_today'] }) {
  const cfg = {
    present: 'bg-green-100 text-green-700',
    late: 'bg-amber-100 text-amber-700',
    absent: 'bg-red-100 text-red-700',
    pending: 'bg-slate-100 text-slate-500',
  }[status];
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${cfg}`}>{status}</span>;
}

function QualityStars({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={`w-3 h-3 ${i <= Math.round(score) ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
      ))}
      <span className="text-xs text-slate-500 ml-1">{score.toFixed(1)}</span>
    </div>
  );
}

function WorkerRow({ worker, onClick, active }: { worker: Worker; onClick: () => void; active: boolean }) {
  const progress = worker.tasks_today > 0 ? Math.round((worker.tasks_done / worker.tasks_today) * 100) : 0;
  return (
    <button onClick={onClick} className={`w-full text-left rounded-xl border p-3.5 transition-all ${active ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
            {worker.full_name.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-800">{worker.full_name}</div>
            <div className="text-xs text-slate-500">{worker.job_title}</div>
          </div>
        </div>
        <AttendanceBadge status={worker.attendance_today} />
      </div>
      <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
        <span>{worker.tasks_done}/{worker.tasks_today} tasks</span>
        <span className="font-medium text-slate-700">{progress}%</span>
      </div>
      <div className="mt-1.5 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${progress === 100 ? 'bg-green-500' : progress > 50 ? 'bg-blue-500' : 'bg-amber-500'}`} style={{ width: `${progress}%` }} />
      </div>
    </button>
  );
}

function statusColor(s: string) {
  return s === 'done' ? 'bg-green-100 text-green-700' : s === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500';
}
function priorityColor(p: string) {
  return p === 'high' ? 'text-red-600' : p === 'medium' ? 'text-amber-600' : 'text-slate-400';
}

export default function LaborModule() {
  const [tab, setTab] = useState<'attendance' | 'tasks' | 'payroll' | 'performance'>('attendance');
  const [selectedWorker, setSelectedWorker] = useState(MOCK_WORKERS[0]);

  const present = MOCK_WORKERS.filter(w => w.attendance_today === 'present').length;
  const late = MOCK_WORKERS.filter(w => w.attendance_today === 'late').length;
  const absent = MOCK_WORKERS.filter(w => w.attendance_today === 'absent').length;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Labor & HR</h1>
          <p className="text-sm text-slate-500 mt-1">Attendance · GPS task tracking · payroll · performance dashboards</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Plus className="w-4 h-4" /> Add Worker
        </button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Present', value: present, icon: CheckCircle, color: 'green' },
          { label: 'Late', value: late, icon: Clock, color: 'amber' },
          { label: 'Absent', value: absent, icon: AlertTriangle, color: 'red' },
          { label: 'Tasks Done', value: `${MOCK_TASKS.filter(t => t.status === 'done').length}/${MOCK_TASKS.length}`, icon: CheckCircle, color: 'blue' },
        ].map(kpi => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className={`bg-white rounded-xl border p-4 border-slate-200`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${kpi.color === 'green' ? 'bg-green-100' : kpi.color === 'amber' ? 'bg-amber-100' : kpi.color === 'red' ? 'bg-red-100' : 'bg-blue-100'}`}>
                <Icon className={`w-4 h-4 ${kpi.color === 'green' ? 'text-green-600' : kpi.color === 'amber' ? 'text-amber-600' : kpi.color === 'red' ? 'text-red-600' : 'text-blue-600'}`} />
              </div>
              <div className="text-2xl font-bold text-slate-900">{kpi.value}</div>
              <div className="text-sm text-slate-500">{kpi.label}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Worker List */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Workforce ({MOCK_WORKERS.length})</div>
          {MOCK_WORKERS.map(w => <WorkerRow key={w.id} worker={w} onClick={() => setSelectedWorker(w)} active={selectedWorker.id === w.id} />)}
        </div>

        {/* Right Panel */}
        <div className="lg:col-span-2 space-y-4">
          {/* Tabs */}
          <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
            {(['attendance', 'tasks', 'payroll', 'performance'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} className={`px-3 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${tab === t ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>
                {t}
              </button>
            ))}
          </div>

          {tab === 'attendance' && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                  {selectedWorker.full_name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <div className="font-bold text-slate-900">{selectedWorker.full_name}</div>
                  <div className="text-sm text-slate-500">{selectedWorker.employee_id} · {selectedWorker.department}</div>
                </div>
                <AttendanceBadge status={selectedWorker.attendance_today} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                  <div className="text-xs text-slate-500 mb-1">Clock In</div>
                  <div className="font-bold text-slate-800">{selectedWorker.clock_in || '—'}</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                  <div className="text-xs text-slate-500 mb-1">Clock Out</div>
                  <div className="font-bold text-slate-800">—</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                  <div className="text-xs text-slate-500 mb-1">Hours</div>
                  <div className="font-bold text-slate-800">—</div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2">
                <Fingerprint className="w-4 h-4" />
                <span>Method: Biometric · GPS verified</span>
                <MapPin className="w-3 h-3 ml-auto text-green-500" />
                <span className="text-green-600">On site</span>
              </div>
              <div className="text-sm font-semibold text-slate-700">This Week</div>
              <div className="grid grid-cols-7 gap-1">
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => {
                  const status = i < 4 ? 'present' : i === 4 ? 'today' : 'future';
                  return (
                    <div key={i} className="text-center">
                      <div className="text-[10px] text-slate-400 mb-1">{day}</div>
                      <div className={`w-7 h-7 mx-auto rounded-full flex items-center justify-center text-xs font-medium ${status === 'present' ? 'bg-green-100 text-green-700' : status === 'today' ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                        {status === 'present' ? '✓' : status === 'today' ? '•' : '–'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {tab === 'tasks' && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-slate-800">Today's Tasks</div>
                <button className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"><Plus className="w-4 h-4" />Assign</button>
              </div>
              {MOCK_TASKS.map(task => (
                <div key={task.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2.5 hover:bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className={`w-1.5 h-8 rounded-full ${task.priority === 'high' ? 'bg-red-500' : task.priority === 'medium' ? 'bg-amber-500' : 'bg-slate-300'}`} />
                    <div>
                      <div className="text-sm font-medium text-slate-800">{task.title}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-slate-500">{task.worker}</span>
                        <span className="text-[10px] text-slate-400">·</span>
                        <span className="text-xs text-slate-500">{task.field}</span>
                        <span className="text-[10px] text-slate-400">·</span>
                        <span className="text-xs text-slate-500">{task.time}</span>
                        {task.gps_verified && <MapPin className="w-3 h-3 text-green-500" />}
                      </div>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${statusColor(task.status)}`}>{task.status.replace('_', ' ')}</span>
                </div>
              ))}
            </div>
          )}

          {tab === 'payroll' && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900">Payroll Run — {PAYROLL_SUMMARY.period}</div>
                  <div className="text-sm text-slate-500">{PAYROLL_SUMMARY.workers} workers · <span className="text-amber-600 font-medium capitalize">{PAYROLL_SUMMARY.status}</span></div>
                </div>
                <button className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-sm">
                  <FileText className="w-4 h-4" /> Process
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Gross Pay', value: `ZMW ${PAYROLL_SUMMARY.total_gross.toLocaleString()}`, color: 'blue' },
                  { label: 'NAPSA (5%)', value: `ZMW ${PAYROLL_SUMMARY.total_napsa.toLocaleString()}`, color: 'slate' },
                  { label: 'NHIMA (1%)', value: `ZMW ${PAYROLL_SUMMARY.total_nhima.toLocaleString()}`, color: 'slate' },
                  { label: 'PAYE Tax', value: `ZMW ${PAYROLL_SUMMARY.total_paye.toLocaleString()}`, color: 'red' },
                ].map(item => (
                  <div key={item.label} className="bg-slate-50 rounded-lg p-3">
                    <div className="text-xs text-slate-500">{item.label}</div>
                    <div className={`font-bold mt-1 ${item.color === 'red' ? 'text-red-700' : item.color === 'blue' ? 'text-blue-700' : 'text-slate-800'}`}>{item.value}</div>
                  </div>
                ))}
              </div>
              <div className="bg-green-50 border border-green-100 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="text-sm text-green-700 font-medium">Net Pay</div>
                  <div className="text-2xl font-bold text-green-800">ZMW {PAYROLL_SUMMARY.total_net.toLocaleString()}</div>
                </div>
                <DollarSign className="w-8 h-8 text-green-300" />
              </div>
              <div className="text-xs text-slate-400 text-center">Zambian Labour Law: NAPSA 5% · NHIMA 1% · PAYE per ZRA schedule</div>
            </div>
          )}

          {tab === 'performance' && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
              <div className="font-semibold text-slate-800">Performance Summary — June 2026</div>
              <div className="space-y-3">
                {MOCK_WORKERS.map(w => (
                  <div key={w.id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:bg-slate-50">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {w.full_name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-800 truncate">{w.full_name}</div>
                      <QualityStars score={w.avg_quality} />
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-bold text-slate-800">{w.tasks_done}/{w.tasks_today}</div>
                      <div className="text-xs text-slate-400">tasks done</div>
                    </div>
                    <div className={`w-12 h-12 rounded-full border-4 flex items-center justify-center text-xs font-bold flex-shrink-0 ${w.avg_quality >= 4.5 ? 'border-green-400 text-green-700' : w.avg_quality >= 3.5 ? 'border-amber-400 text-amber-700' : 'border-red-300 text-red-600'}`}>
                      {Math.round(w.avg_quality * 20)}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
