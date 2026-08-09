import React from 'react';
import {
  LayoutDashboard, Bird, Egg, Fish, Sprout, Package, ShoppingCart,
  DollarSign, Users, Truck, Stethoscope, BarChart3, Plane, Wrench,
  Smartphone, Settings, Brain, ClipboardList, ChevronLeft, ChevronRight,
  Leaf, ShieldCheck, ScanEye, Droplets, Tractor, Tag, Store, Cloud,
  BarChart2, Landmark, Flower2, UserCheck, Cpu, Link2,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useAgroNexus } from '@/components/AppLayout';
import { Lock } from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  collapsed: boolean;
  onToggle: () => void;
}

const navGroups = [
  {
    label: 'Overview',
    items: [
      { id: 'dashboard',      label: 'Dashboard',         icon: LayoutDashboard },
      { id: 'smart-engine',   label: 'Smart AI Engine',   icon: Brain           },
      { id: 'smart-vision',   label: 'Vision & AI',       icon: ScanEye         },
      { id: 'predictive-ai',  label: 'Predictive AI',     icon: Cpu             },
      { id: 'planner',        label: 'Plans & Budgets',   icon: ClipboardList   },
      { id: 'weather',        label: 'Weather & NDVI',    icon: Cloud           },
    ],
  },
  {
    label: 'Production',
    items: [
      { id: 'poultry',         label: 'Broiler Poultry',  icon: Bird   },
      { id: 'village-chicken', label: 'Village Chicken',  icon: Egg    },
      { id: 'piggery',         label: 'Piggery',          icon: Bird   },
      { id: 'fish',            label: 'Fish Farming',     icon: Fish   },
      { id: 'duck',            label: 'Duck Management',  icon: Bird   },
      { id: 'goat-sheep',      label: 'Goats & Sheep',    icon: Sprout },
      { id: 'horticulture',    label: 'Horticulture',     icon: Leaf   },
    ],
  },
  {
    label: 'Smart Farm',
    items: [
      { id: 'irrigation',  label: 'Smart Irrigation',  icon: Droplets   },
      { id: 'equipment',   label: 'Fleet & Equipment', icon: Tractor    },
      { id: 'tracking',    label: 'Animal Tracking',   icon: Tag        },
      { id: 'greenhouse',  label: 'Greenhouse',        icon: Flower2    },
      { id: 'labor',       label: 'Labor & HR',        icon: UserCheck  },
    ],
  },
  {
    label: 'Operations',
    items: [
      { id: 'inventory',       label: 'Feed & Inventory',     icon: Package     },
      { id: 'sales',           label: 'Sales & Customers',    icon: ShoppingCart},
      { id: 'finance',         label: 'Financial Mgmt',       icon: DollarSign  },
      { id: 'financial-ai',    label: 'P&L & Financial AI',   icon: BarChart2   },
      { id: 'hr',              label: 'Human Resources',      icon: Users       },
      { id: 'procurement',     label: 'Procurement',          icon: Truck       },
      { id: 'biosecurity',     label: 'Biosecurity & Vet',    icon: Stethoscope },
      { id: 'sustainability',  label: 'Sustainability',       icon: Leaf        },
    ],
  },
  {
    label: 'Markets',
    items: [
      { id: 'marketplace', label: 'Commodity Market', icon: Store },
    ],
  },
  {
    label: 'Strategy',
    items: [
      { id: 'reports',       label: 'Reports & BI',       icon: BarChart3  },
      { id: 'export',        label: 'Export & Logistics', icon: Plane      },
      { id: 'integrations',  label: 'Integrations',       icon: Link2      },
      { id: 'assets',        label: 'Assets & Infra',     icon: Wrench     },
      { id: 'mobile',        label: 'Mobile App',         icon: Smartphone },
      { id: 'settings',      label: 'Settings',           icon: Settings   },
    ],
  },
];

export default function Sidebar({ currentView, onNavigate, collapsed, onToggle }: SidebarProps) {
  const { hasPermission } = useAuth();
  const { isModuleEnabled } = useSubscription();
  const { openUpgrade } = useAgroNexus();

  return (
    <aside className={`${collapsed ? 'w-16' : 'w-64'} bg-slate-900 text-slate-100 transition-all duration-300 flex flex-col h-screen sticky top-0 overflow-y-auto`}>
      <div className="p-4 border-b border-slate-700 flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-bold text-white text-sm">AgroNexus</div>
              <div className="text-[10px] text-slate-400">Operations Suite</div>
            </div>
          </div>
        )}
        <button onClick={onToggle} className="p-1.5 hover:bg-slate-800 rounded-md text-slate-400">
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      <nav className="flex-1 py-4 px-2">
        {navGroups.map(group => {
          const visibleItems = group.items.filter(item => hasPermission(item.id));
          if (visibleItems.length === 0) return null;
          return (
            <div key={group.label} className="mb-6">
              {!collapsed && (
                <div className="px-3 mb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                  {group.label}
                </div>
              )}
              <ul className="space-y-1">
                {visibleItems.map(item => {
                  const Icon = item.icon;
                  const active = currentView === item.id;
                  const locked = !isModuleEnabled(item.id);
                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => {
                          if (locked) { openUpgrade(item.id); return; }
                          onNavigate(item.id);
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                          active ? 'bg-green-600 text-white'
                          : locked ? 'text-slate-600 hover:bg-slate-800/50 cursor-pointer'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`}
                        title={collapsed ? item.label : undefined}
                      >
                        <Icon className={`w-4 h-4 flex-shrink-0 ${locked ? 'text-slate-600' : ''}`} />
                        {!collapsed && (
                          <>
                            <span className={`truncate flex-1 ${locked ? 'text-slate-500' : ''}`}>{item.label}</span>
                            {locked && <Lock className="w-3 h-3 text-slate-600 flex-shrink-0" />}
                          </>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      {!collapsed && (
        <div className="p-3 border-t border-slate-700">
          <div className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-lg p-3 text-xs">
            <div className="font-semibold text-white mb-1">Pro Tip</div>
            <div className="text-green-50">Enable IoT sensors to automate feed & water tracking.</div>
          </div>
        </div>
      )}
    </aside>
  );
}
