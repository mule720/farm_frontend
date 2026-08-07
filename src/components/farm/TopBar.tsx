import React, { useState } from 'react';
import { Search, ChevronDown, LogOut, User, Building2, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import NotificationBell from './NotificationBell';

interface TopBarProps {
  onAdminClick: () => void;
  onLogout: () => void;
  userName: string;
  userRole: string;
  organization: string;
}

export default function TopBar({ onAdminClick, onLogout, userName, userRole, organization }: TopBarProps) {
  const [showUser, setShowUser] = useState(false);
  const [search, setSearch]     = useState('');
  const { hasRole }             = useAuth();
  const isSaasAdmin             = hasRole('saas_admin');

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="flex items-center justify-between px-6 h-16">

        {/* Search */}
        <div className="flex items-center gap-4 flex-1 max-w-xl">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search batches, customers, inventory..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Platform Admin button (saas_admin only) */}
          {isSaasAdmin && (
            <button
              onClick={onAdminClick}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-purple-600 hover:bg-purple-700 text-white rounded-md"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Platform Admin
            </button>
          )}

          {/* ── Live notification bell (replaces hardcoded sampleAlerts) ── */}
          <NotificationBell />

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setShowUser(v => !v)}
              className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-100 rounded-lg"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                {userName.charAt(0)}
              </div>
              <div className="hidden md:block text-left">
                <div className="text-sm font-medium text-slate-900">{userName}</div>
                <div className="text-[10px] text-slate-500">{userRole}</div>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>

            {showUser && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-slate-200 z-50">
                <div className="px-4 py-3 border-b border-slate-100">
                  <div className="text-sm font-semibold">{userName}</div>
                  <div className="text-xs text-slate-500">{userRole}</div>
                  <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-600">
                    <Building2 className="w-3 h-3" />
                    {organization}
                  </div>
                </div>
                <button className="w-full px-4 py-2 text-sm text-left hover:bg-slate-50 flex items-center gap-2">
                  <User className="w-4 h-4" /> My Profile
                </button>
                <button
                  onClick={onLogout}
                  className="w-full px-4 py-2 text-sm text-left hover:bg-slate-50 flex items-center gap-2 text-red-600 border-t border-slate-100"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
