// ─────────────────────────────────────────────────────────────────────────────
// AgroNexus v2 — Data Backup & Restore
// Export/import all agronexus_v2_* localStorage keys
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useRef } from 'react';
import { Download, Upload, ShieldCheck, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { backupAll, restoreBackup } from '@/lib/exportUtils';

const LAST_BACKUP_KEY = 'agronexus_v2_last_backup';

function countBackupKeys(): number {
  let count = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('agronexus_v2_')) count++;
  }
  return count;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: 'medium', timeStyle: 'short',
    });
  } catch { return iso; }
}

export default function BackupRestore() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [restoreResult, setRestoreResult] = useState<{ count: number } | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [lastBackup, setLastBackup] = useState<string>(
    () => localStorage.getItem(LAST_BACKUP_KEY) ?? '',
  );

  const keyCount = countBackupKeys();

  function handleDownloadBackup() {
    backupAll();
    const now = new Date().toISOString();
    localStorage.setItem(LAST_BACKUP_KEY, now);
    setLastBackup(now);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setSelectedFile(file);
    setRestoreResult(null);
    setRestoreError(null);
  }

  async function handleRestore() {
    if (!selectedFile) return;
    setRestoring(true);
    setRestoreResult(null);
    setRestoreError(null);
    try {
      const count = await restoreBackup(selectedFile);
      setRestoreResult({ count });
      setTimeout(() => window.location.reload(), 1500);
    } catch (err: any) {
      setRestoreError(err?.message ?? 'Failed to parse backup file. Make sure it is a valid AgroNexus JSON backup.');
    } finally {
      setRestoring(false);
    }
  }

  return (
    <div className="max-w-lg space-y-6 p-6">
      <h2 className="text-xl font-bold text-slate-800">Data Backup &amp; Restore</h2>

      {/* ── Backup card ──────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
            <Download className="w-4.5 h-4.5 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Export Backup</h3>
            <p className="text-sm text-slate-500 mt-0.5">
              Downloads the farm data kept in this browser (modules, IoT readings and similar)
              as a JSON file. Save this somewhere safe. Your Finance ledger, Sales, Inventory,
              production cycles and records are stored in your company account, not in this file.
            </p>
          </div>
        </div>

        <div className="bg-slate-50 rounded-xl p-3 space-y-1 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Keys to back up</span>
            <span className="font-medium text-slate-700">{keyCount} keys</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Last backup</span>
            <span className={`font-medium ${lastBackup ? 'text-emerald-600' : 'text-slate-400'}`}>
              {lastBackup ? formatDate(lastBackup) : 'Never'}
            </span>
          </div>
        </div>

        <button
          onClick={handleDownloadBackup}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          Download Backup
        </button>
      </div>

      {/* ── Restore card ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-amber-200 shadow-sm p-5 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
            <Upload className="w-4.5 h-4.5 text-amber-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Restore from Backup</h3>
            <div className="flex items-start gap-1.5 mt-1">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 font-medium">
                Restoring will OVERWRITE current data. This cannot be undone.
              </p>
            </div>
          </div>
        </div>

        {/* File input */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Select backup file</label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileSelect}
            className="block w-full text-sm text-slate-600
              file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0
              file:text-sm file:font-medium file:bg-slate-100 file:text-slate-700
              hover:file:bg-slate-200 file:cursor-pointer cursor-pointer"
          />
          {selectedFile && !restoreResult && !restoreError && (
            <p className="mt-1.5 text-xs text-slate-500">
              {selectedFile.name} &nbsp;·&nbsp; {formatBytes(selectedFile.size)}
            </p>
          )}
        </div>

        {/* Status messages */}
        {restoreResult && (
          <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 rounded-xl px-4 py-3 text-sm">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>
              Successfully restored <strong>{restoreResult.count}</strong> keys.
              Reloading page…
            </span>
          </div>
        )}
        {restoreError && (
          <div className="flex items-start gap-2 text-red-700 bg-red-50 rounded-xl px-4 py-3 text-sm">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{restoreError}</span>
          </div>
        )}

        <button
          onClick={handleRestore}
          disabled={!selectedFile || restoring || !!restoreResult}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-medium hover:bg-amber-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {restoring ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Restoring…
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Restore Data
            </>
          )}
        </button>
      </div>

      {/* ── Info card ────────────────────────────────────────────────────── */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-600">What gets backed up</h3>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-slate-700">Included in backup</p>
              <p className="text-slate-500 mt-0.5">
                All <code className="text-xs bg-slate-200 px-1 rounded">agronexus_v2_*</code> keys
                (approx. 49 keys) — enterprises, production cycles, inventory, finance records,
                IoT readings, procurement orders, sales, HR, processing batches, reports,
                and all module settings.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-slate-700">Not included</p>
              <ul className="text-slate-500 mt-0.5 space-y-0.5 list-disc list-inside">
                <li>Authentication tokens (<code className="text-xs bg-slate-200 px-1 rounded">farmpulse_*</code> keys)</li>
                <li>Supabase org &amp; cycle data — already synced to cloud</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
