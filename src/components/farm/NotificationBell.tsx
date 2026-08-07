import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Bell, X, CheckCheck, Trash2, AlertTriangle, Info, Zap,
  CloudRain, BarChart2, Droplets, Beef, Wrench, DollarSign,
  Users, Package, TrendingUp, ShieldCheck, Eye,
} from 'lucide-react';
import { gqlRequest } from '@/lib/api';
import {
  NOTIFICATIONS_QUERY,
  MARK_READ_MUTATION,
  MARK_ALL_READ_MUTATION,
  DELETE_NOTIFICATION_MUTATION,
  CLEAR_ALL_MUTATION,
} from '@/lib/notificationQueries';

interface Notification {
  id: string;
  title: string;
  message: string;
  category: string;
  priority: 'critical' | 'warning' | 'info';
  isRead: boolean;
  readAt: string | null;
  actionUrl: string;
  createdAt: string;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  alert:      <AlertTriangle className="w-4 h-4" />,
  automation: <Zap className="w-4 h-4" />,
  weather:    <CloudRain className="w-4 h-4" />,
  kpi:        <BarChart2 className="w-4 h-4" />,
  irrigation: <Droplets className="w-4 h-4" />,
  livestock:  <Beef className="w-4 h-4" />,
  equipment:  <Wrench className="w-4 h-4" />,
  financial:  <DollarSign className="w-4 h-4" />,
  labor:      <Users className="w-4 h-4" />,
  inventory:  <Package className="w-4 h-4" />,
  market:     <TrendingUp className="w-4 h-4" />,
  compliance: <ShieldCheck className="w-4 h-4" />,
  vision:     <Eye className="w-4 h-4" />,
  system:     <Info className="w-4 h-4" />,
};

const PRIORITY_STYLES = {
  critical: { dot: 'bg-red-500',   icon: 'text-red-500',   badge: 'bg-red-100 text-red-700',    row: 'border-l-2 border-red-400'    },
  warning:  { dot: 'bg-amber-500', icon: 'text-amber-500', badge: 'bg-amber-100 text-amber-700', row: 'border-l-2 border-amber-400'  },
  info:     { dot: 'bg-blue-500',  icon: 'text-blue-500',  badge: 'bg-blue-100 text-blue-700',   row: 'border-l-2 border-slate-200'  },
};

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60)    return `${diff}s ago`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function NotificationBell() {
  const [open, setOpen]                   = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount]     = useState(0);
  const [loading, setLoading]             = useState(false);
  const [filter, setFilter]               = useState<'all' | 'unread'>('all');
  const panelRef                          = useRef<HTMLDivElement>(null);
  const pollRef                           = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchNotifications = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await gqlRequest<{ notifications: Notification[]; unreadCount: number }>(
        NOTIFICATIONS_QUERY,
        { unreadOnly: filter === 'unread', limit: 60 },
      );
      setNotifications(data.notifications ?? []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch {
      // silent — don't break the UI on network errors
    } finally {
      if (!silent) setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchNotifications();
    pollRef.current = setInterval(() => fetchNotifications(true), 30_000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchNotifications]);

  // Close panel on outside click
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  // ── Actions ───────────────────────────────────────────────────────────────
  async function markRead(id: string) {
    await gqlRequest(MARK_READ_MUTATION, { id });
    setNotifications(ns => ns.map(n => n.id === id ? { ...n, isRead: true } : n));
    setUnreadCount(c => Math.max(0, c - 1));
  }

  async function markAllRead() {
    await gqlRequest(MARK_ALL_READ_MUTATION);
    setNotifications(ns => ns.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
  }

  async function deleteOne(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    const wasUnread = notifications.find(n => n.id === id)?.isRead === false;
    await gqlRequest(DELETE_NOTIFICATION_MUTATION, { id });
    setNotifications(ns => ns.filter(n => n.id !== id));
    if (wasUnread) setUnreadCount(c => Math.max(0, c - 1));
  }

  async function clearRead() {
    await gqlRequest(CLEAR_ALL_MUTATION);
    setNotifications(ns => ns.filter(n => !n.isRead));
  }

  function handleRowClick(n: Notification) {
    if (!n.isRead) markRead(n.id);
    if (n.actionUrl) {
      setOpen(false);
      window.location.hash = n.actionUrl;
    }
  }

  const displayed = filter === 'unread' ? notifications.filter(n => !n.isRead) : notifications;

  return (
    <div className="relative" ref={panelRef}>

      {/* ── Bell button ──────────────────────────────────────────────────── */}
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 hover:bg-slate-100 rounded-lg transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-slate-600" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[1rem] h-4 px-0.5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* ── Dropdown panel ───────────────────────────────────────────────── */}
      {open && (
        <div className="absolute right-0 mt-2 w-[400px] bg-white rounded-xl shadow-2xl border border-slate-200 flex flex-col max-h-[560px] z-50">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900 text-sm">Notifications</span>
              {unreadCount > 0 && (
                <span className="text-xs font-medium bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button onClick={markAllRead} title="Mark all as read"
                  className="p-1.5 hover:bg-slate-100 rounded-md text-slate-500 hover:text-green-600 transition-colors">
                  <CheckCheck className="w-4 h-4" />
                </button>
              )}
              <button onClick={clearRead} title="Clear read notifications"
                className="p-1.5 hover:bg-slate-100 rounded-md text-slate-500 hover:text-red-500 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
              <button onClick={() => setOpen(false)}
                className="p-1.5 hover:bg-slate-100 rounded-md text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filter tabs */}
          <div className="flex border-b border-slate-100 flex-shrink-0">
            {(['all', 'unread'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`flex-1 py-2 text-xs font-medium transition-colors ${
                  filter === f
                    ? 'text-green-700 border-b-2 border-green-600 bg-green-50'
                    : 'text-slate-500 hover:text-slate-700'
                }`}>
                {f === 'all' ? 'All' : `Unread (${unreadCount})`}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="flex items-center justify-center py-10 text-slate-400 text-sm">Loading…</div>
            ) : displayed.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <Bell className="w-8 h-8 mb-2 opacity-30" />
                <span className="text-sm">{filter === 'unread' ? 'All caught up!' : 'No notifications'}</span>
              </div>
            ) : (
              displayed.map(n => {
                const s    = PRIORITY_STYLES[n.priority] ?? PRIORITY_STYLES.info;
                const icon = CATEGORY_ICONS[n.category]  ?? CATEGORY_ICONS.system;
                return (
                  <div key={n.id} onClick={() => handleRowClick(n)}
                    className={`group flex items-start gap-3 px-4 py-3 border-b border-slate-50 cursor-pointer transition-colors ${
                      n.isRead
                        ? 'hover:bg-slate-50'
                        : `bg-slate-50/60 hover:bg-slate-100/80 ${s.row}`
                    }`}>

                    {/* Priority dot */}
                    <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${n.isRead ? 'bg-slate-300' : s.dot}`} />

                    {/* Category icon */}
                    <div className={`mt-0.5 flex-shrink-0 ${n.isRead ? 'text-slate-400' : s.icon}`}>
                      {icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-medium truncate ${n.isRead ? 'text-slate-500' : 'text-slate-900'}`}>
                        {n.title}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${s.badge}`}>
                          {n.priority}
                        </span>
                        <span className="text-[10px] text-slate-400">{timeAgo(n.createdAt)}</span>
                      </div>
                    </div>

                    {/* Delete on hover */}
                    <button onClick={e => deleteOne(n.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 hover:text-red-500 rounded text-slate-300 transition-all flex-shrink-0 mt-0.5">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {displayed.length > 0 && (
            <div className="px-4 py-2 border-t border-slate-100 text-center flex-shrink-0">
              <span className="text-xs text-slate-400">
                {displayed.length} notification{displayed.length !== 1 ? 's' : ''}
                {filter === 'all' && unreadCount > 0 ? ` · ${unreadCount} unread` : ''}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
