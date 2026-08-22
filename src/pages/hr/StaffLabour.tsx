import React, { useState } from 'react';
import { Plus, X, Users, Shield, Edit2, Trash2, CheckCircle, XCircle, ToggleLeft, ToggleRight, Key, UserCheck } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useOrg } from '@/store/orgStore';

type StaffRole = 'farmhand' | 'supervisor' | 'driver' | 'vet_officer' | 'accountant' | 'manager' | 'farm_admin' | 'owner';

interface Permission {
  key: string;
  label: string;
  description: string;
  group: 'Operations' | 'Finance' | 'IoT & Data' | 'Administration';
}

interface Employee {
  id: string;
  name: string;
  role: StaffRole;
  email: string;
  phone: string;
  hiredDate: string;
  active: boolean;
  enterpriseIds: string[];
  permissions: string[];
}

const ALL_PERMISSIONS: Permission[] = [
  { key: 'view_dashboard',    label: 'View Dashboard',       description: 'Access the main farm dashboard',                  group: 'Operations' },
  { key: 'manage_production', label: 'Manage Production',    description: 'Create and manage production cycles',             group: 'Operations' },
  { key: 'manage_inventory',  label: 'Manage Inventory',     description: 'Add, edit, remove inventory items',               group: 'Operations' },
  { key: 'manage_sales',      label: 'Manage Sales',         description: 'Create and manage sales orders',                  group: 'Operations' },
  { key: 'manage_procurement',label: 'Manage Procurement',   description: 'Create and manage purchase orders',               group: 'Operations' },
  { key: 'manage_health',     label: 'Animal Health',        description: 'Add vaccination and treatment records',           group: 'Operations' },
  { key: 'view_finance',      label: 'View Finance',         description: 'See financial transactions and reports',          group: 'Finance' },
  { key: 'view_reports',      label: 'View Reports',         description: 'Access the reports & analytics module',           group: 'Finance' },
  { key: 'manage_expenses',   label: 'Log Production Costs', description: 'Enter feed, vet, and production expenses',        group: 'Finance' },
  { key: 'manage_iot',        label: 'IoT & Sensors',        description: 'Access and control IoT devices and rules',        group: 'IoT & Data' },
  { key: 'view_activity_log', label: 'Activity Log',         description: 'View the audit trail of all actions',            group: 'IoT & Data' },
  { key: 'manage_marketplace',label: 'Marketplace',          description: 'Post and manage marketplace listings',            group: 'IoT & Data' },
  { key: 'manage_staff',      label: 'Manage Staff',         description: 'Add, edit, deactivate employees',                group: 'Administration' },
  { key: 'manage_settings',   label: 'Farm Settings',        description: 'Change farm configuration and org settings',     group: 'Administration' },
  { key: 'system_admin',      label: 'System Administrator', description: 'Full access to all modules and settings',        group: 'Administration' },
];

const ROLE_DEFAULTS: Record<StaffRole, string[]> = {
  farmhand:    ['view_dashboard', 'manage_production', 'manage_health'],
  supervisor:  ['view_dashboard', 'manage_production', 'manage_inventory', 'manage_health', 'view_reports'],
  driver:      ['view_dashboard', 'manage_procurement'],
  vet_officer: ['view_dashboard', 'manage_health', 'manage_inventory'],
  accountant:  ['view_dashboard', 'view_finance', 'view_reports', 'manage_expenses'],
  manager:     ['view_dashboard', 'manage_production', 'manage_inventory', 'manage_sales', 'manage_procurement', 'manage_health', 'view_finance', 'view_reports', 'manage_expenses', 'view_activity_log'],
  farm_admin:  ['view_dashboard', 'manage_production', 'manage_inventory', 'manage_sales', 'manage_procurement', 'manage_health', 'view_finance', 'view_reports', 'manage_expenses', 'view_activity_log', 'manage_staff', 'manage_settings', 'manage_iot', 'manage_marketplace'],
  owner:       ['view_dashboard', 'manage_production', 'manage_inventory', 'manage_sales', 'manage_procurement', 'manage_health', 'view_finance', 'view_reports', 'manage_expenses', 'view_activity_log', 'manage_staff', 'manage_settings', 'manage_iot', 'manage_marketplace', 'system_admin'],
};

const ROLE_COLORS: Record<StaffRole, string> = {
  farmhand:   'bg-green-100 text-green-800',
  supervisor: 'bg-blue-100 text-blue-800',
  driver:     'bg-slate-100 text-slate-700',
  vet_officer:'bg-pink-100 text-pink-800',
  accountant: 'bg-yellow-100 text-yellow-800',
  manager:    'bg-violet-100 text-violet-800',
  farm_admin: 'bg-indigo-100 text-indigo-800',
  owner:      'bg-orange-100 text-orange-800',
};

const AVATAR_COLORS: Record<StaffRole, string> = {
  farmhand:   'bg-green-500',
  supervisor: 'bg-blue-500',
  driver:     'bg-slate-400',
  vet_officer:'bg-pink-500',
  accountant: 'bg-yellow-500',
  manager:    'bg-violet-500',
  farm_admin: 'bg-indigo-500',
  owner:      'bg-orange-500',
};

const STAFF_KEY = 'agronexus_v2_hr_staff';

function seedEmployees(): Employee[] {
  return [
    { id: uuidv4(), name: 'Alice Banda',  role: 'farmhand',   email: 'alice@farm.zam',  phone: '+260971000001', hiredDate: '2023-03-15', active: true, enterpriseIds: [], permissions: ROLE_DEFAULTS.farmhand },
    { id: uuidv4(), name: 'Bob Mwale',    role: 'supervisor', email: 'bob@farm.zam',    phone: '+260971000002', hiredDate: '2022-07-01', active: true, enterpriseIds: [], permissions: ROLE_DEFAULTS.supervisor },
    { id: uuidv4(), name: 'Carol Phiri',  role: 'manager',    email: 'carol@farm.zam',  phone: '+260971000003', hiredDate: '2024-01-10', active: true, enterpriseIds: [], permissions: ROLE_DEFAULTS.manager },
  ];
}

function initials(name: string) {
  const parts = name.trim().split(' ');
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase();
}

const GROUPS: Permission['group'][] = ['Operations', 'Finance', 'IoT & Data', 'Administration'];

const BLANK_FORM = { name: '', role: 'farmhand' as StaffRole, email: '', phone: '', hiredDate: '', active: true, enterpriseIds: [] as string[] };

export default function StaffLabour() {
  const { org } = useOrg();

  const [employees, setEmployees] = useState<Employee[]>(() => {
    try {
      const raw = localStorage.getItem(STAFF_KEY);
      if (raw) { const parsed = JSON.parse(raw); if (parsed.length) return parsed; }
    } catch {}
    const seed = seedEmployees();
    localStorage.setItem(STAFF_KEY, JSON.stringify(seed));
    return seed;
  });

  const [tab, setTab] = useState<'directory' | 'permissions'>('directory');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState(BLANK_FORM);
  const [formPerms, setFormPerms] = useState<string[]>([]);
  const [savedFlash, setSavedFlash] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  function saveEmployees(list: Employee[]) {
    setEmployees(list);
    localStorage.setItem(STAFF_KEY, JSON.stringify(list));
  }

  function openAdd() {
    setEditingId(null);
    setForm(BLANK_FORM);
    setFormPerms(ROLE_DEFAULTS.farmhand);
    setShowForm(true);
  }

  function openEdit(emp: Employee) {
    setEditingId(emp.id);
    setForm({ name: emp.name, role: emp.role, email: emp.email, phone: emp.phone, hiredDate: emp.hiredDate, active: emp.active, enterpriseIds: emp.enterpriseIds });
    setFormPerms(emp.permissions);
    setShowForm(true);
  }

  function handleRoleChange(role: StaffRole) {
    setForm(f => ({ ...f, role }));
    setFormPerms(ROLE_DEFAULTS[role]);
  }

  function handleSaveForm() {
    if (!form.name.trim()) return;
    if (editingId) {
      saveEmployees(employees.map(e => e.id === editingId ? { ...e, ...form, permissions: formPerms } : e));
    } else {
      saveEmployees([...employees, { id: uuidv4(), ...form, permissions: formPerms }]);
    }
    setShowForm(false);
  }

  function toggleActive(id: string) {
    saveEmployees(employees.map(e => e.id === id ? { ...e, active: !e.active } : e));
  }

  function deleteEmployee(id: string) {
    saveEmployees(employees.filter(e => e.id !== id));
    setDeleteConfirm(null);
    if (selectedId === id) setSelectedId(null);
  }

  function openPermissions(emp: Employee) {
    setSelectedId(emp.id);
    setTab('permissions');
  }

  const selectedEmp = employees.find(e => e.id === selectedId) ?? null;

  function togglePermission(key: string) {
    if (!selectedEmp) return;
    const has = selectedEmp.permissions.includes(key);
    const next = has ? selectedEmp.permissions.filter(k => k !== key) : [...selectedEmp.permissions, key];
    saveEmployees(employees.map(e => e.id === selectedEmp.id ? { ...e, permissions: next } : e));
  }

  function resetToDefaults() {
    if (!selectedEmp) return;
    saveEmployees(employees.map(e => e.id === selectedEmp.id ? { ...e, permissions: ROLE_DEFAULTS[e.role] } : e));
  }

  function flashSave() {
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2000);
  }

  const enterprises = (org as any)?.enterprises ?? [];
  const activeCount = employees.filter(e => e.active).length;
  const roleSet = new Set(employees.map(e => e.role));

  return (
    <div className="p-6 space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        {(['directory', 'permissions'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${tab === t ? 'border-violet-600 text-violet-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            {t === 'directory' ? <><Users className="inline w-4 h-4 mr-1" />Directory</> : <><Shield className="inline w-4 h-4 mr-1" />Roles & Permissions</>}
          </button>
        ))}
      </div>

      {/* ── Tab 1: Directory ── */}
      {tab === 'directory' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2"><Users className="w-5 h-5 text-violet-600" />People & Access</h2>
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">{employees.length} employees</span>
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">{activeCount} active</span>
            <span className="text-xs bg-violet-100 text-violet-700 px-2 py-1 rounded-full">{roleSet.size} roles</span>
            <button onClick={openAdd} className="ml-auto flex items-center gap-1 bg-violet-600 hover:bg-violet-700 text-white text-sm px-3 py-1.5 rounded-lg transition-colors">
              <Plus className="w-4 h-4" /> Add Employee
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {employees.map(emp => (
              <div key={emp.id} className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-full ${AVATAR_COLORS[emp.role]} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>{initials(emp.name)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-800">{emp.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[emp.role]}`}>{emp.role.replace('_', ' ')}</span>
                      {!emp.active && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Inactive</span>}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{emp.email} · {emp.phone}</p>
                    <p className="text-xs text-slate-400">Hired {emp.hiredDate}</p>
                  </div>
                  <button onClick={() => toggleActive(emp.id)} title={emp.active ? 'Deactivate' : 'Activate'} className="text-slate-400 hover:text-slate-600 transition-colors">
                    {emp.active ? <ToggleRight className="w-6 h-6 text-green-500" /> : <ToggleLeft className="w-6 h-6" />}
                  </button>
                </div>

                {enterprises.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {emp.enterpriseIds.length === 0
                      ? <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">All enterprises</span>
                      : emp.enterpriseIds.map((eid: string) => {
                          const ent = enterprises.find((e: any) => e.id === eid);
                          return <span key={eid} className="text-xs bg-violet-50 text-violet-700 px-2 py-0.5 rounded-full">{ent?.name ?? eid}</span>;
                        })}
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                  <button onClick={() => openEdit(emp)} className="flex items-center gap-1 text-xs text-slate-600 hover:text-violet-700 transition-colors px-2 py-1 rounded hover:bg-violet-50">
                    <Edit2 className="w-3 h-3" /> Edit
                  </button>
                  <button onClick={() => openPermissions(emp)} className="flex items-center gap-1 text-xs text-slate-600 hover:text-violet-700 transition-colors px-2 py-1 rounded hover:bg-violet-50">
                    <Key className="w-3 h-3" /> Permissions
                  </button>
                  <button onClick={() => setDeleteConfirm(emp.id)} className="ml-auto flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition-colors px-2 py-1 rounded hover:bg-red-50">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>

                {deleteConfirm === emp.id && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-2 text-xs text-red-700">
                    <span>Remove {emp.name}?</span>
                    <button onClick={() => deleteEmployee(emp.id)} className="font-medium hover:underline">Yes</button>
                    <button onClick={() => setDeleteConfirm(null)} className="font-medium hover:underline">No</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Tab 2: Roles & Permissions ── */}
      {tab === 'permissions' && (
        <div className="flex gap-4 h-[calc(100vh-220px)] min-h-[480px]">
          {/* Sidebar */}
          <div className="w-1/3 bg-white border border-slate-200 rounded-xl overflow-y-auto">
            <div className="p-3 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wide">Employees</div>
            {employees.map(emp => (
              <button key={emp.id} onClick={() => setSelectedId(emp.id)}
                className={`w-full text-left px-4 py-3 flex items-center gap-3 border-b border-slate-50 transition-colors ${selectedId === emp.id ? 'bg-violet-50 border-l-2 border-l-violet-500' : 'hover:bg-slate-50'}`}>
                <div className={`w-8 h-8 rounded-full ${AVATAR_COLORS[emp.role]} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>{initials(emp.name)}</div>
                <div>
                  <div className="text-sm font-medium text-slate-800">{emp.name}</div>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${ROLE_COLORS[emp.role]}`}>{emp.role.replace('_', ' ')}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Permission panel */}
          <div className="flex-1 bg-white border border-slate-200 rounded-xl overflow-y-auto flex flex-col">
            {!selectedEmp ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-2">
                <UserCheck className="w-10 h-10" />
                <p className="text-sm">Select an employee to manage their permissions</p>
              </div>
            ) : (
              <div className="p-5 space-y-5 flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className={`w-10 h-10 rounded-full ${AVATAR_COLORS[selectedEmp.role]} flex items-center justify-center text-white font-bold`}>{initials(selectedEmp.name)}</div>
                  <div>
                    <div className="font-semibold text-slate-800">{selectedEmp.name}</div>
                    <div className="flex gap-2 mt-0.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${ROLE_COLORS[selectedEmp.role]}`}>{selectedEmp.role.replace('_', ' ')}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${selectedEmp.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>{selectedEmp.active ? 'Active' : 'Inactive'}</span>
                    </div>
                  </div>
                  <button onClick={resetToDefaults} className="ml-auto flex items-center gap-1 text-xs border border-slate-300 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors">
                    <Shield className="w-3 h-3" /> Reset to role defaults
                  </button>
                </div>

                {GROUPS.map(group => {
                  const perms = ALL_PERMISSIONS.filter(p => p.group === group);
                  return (
                    <div key={group}>
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">{group}</div>
                      <div className="space-y-1">
                        {perms.map(perm => {
                          const has = selectedEmp.permissions.includes(perm.key);
                          return (
                            <div key={perm.key} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                              <button onClick={() => togglePermission(perm.key)} className="flex-shrink-0">
                                {has ? <CheckCircle className="w-5 h-5 text-green-500" /> : <XCircle className="w-5 h-5 text-red-400" />}
                              </button>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-slate-700">{perm.label}</span>
                                  {perm.key === 'system_admin' && has && (
                                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">Grants full access to all modules</span>
                                  )}
                                </div>
                                <p className="text-xs text-slate-500">{perm.description}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                  <button onClick={flashSave} className="bg-violet-600 hover:bg-violet-700 text-white text-sm px-4 py-2 rounded-lg transition-colors">
                    Save Permissions
                  </button>
                  {savedFlash && <span className="text-sm text-green-600 flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Permissions saved</span>}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Add/Edit Modal ── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-800">{editingId ? 'Edit Employee' : 'Add Employee'}</h3>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-slate-400 hover:text-slate-600" /></button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-600">Full Name</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-violet-400" placeholder="e.g. Alice Banda" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">Role</label>
                <select value={form.role} onChange={e => handleRoleChange(e.target.value as StaffRole)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-violet-400">
                  {(Object.keys(ROLE_DEFAULTS) as StaffRole[]).map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600">Email</label>
                  <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-violet-400" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">Phone</label>
                  <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-violet-400" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">Hired Date</label>
                <input type="date" value={form.hiredDate} onChange={e => setForm(f => ({ ...f, hiredDate: e.target.value }))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-violet-400" />
              </div>
              {enterprises.length > 0 && (
                <div>
                  <label className="text-xs font-medium text-slate-600">Enterprise Access <span className="text-slate-400">(none = all)</span></label>
                  <div className="mt-1 space-y-1">
                    {enterprises.map((ent: any) => (
                      <label key={ent.id} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                        <input type="checkbox" checked={form.enterpriseIds.includes(ent.id)}
                          onChange={e => setForm(f => ({ ...f, enterpriseIds: e.target.checked ? [...f.enterpriseIds, ent.id] : f.enterpriseIds.filter(id => id !== ent.id) }))} />
                        {ent.name}
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input type="checkbox" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} />
                Active employee
              </label>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={handleSaveForm} className="flex-1 bg-violet-600 hover:bg-violet-700 text-white text-sm py-2 rounded-lg transition-colors font-medium">
                {editingId ? 'Save Changes' : 'Add Employee'}
              </button>
              <button onClick={() => setShowForm(false)} className="flex-1 border border-slate-200 text-slate-600 text-sm py-2 rounded-lg hover:bg-slate-50 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
