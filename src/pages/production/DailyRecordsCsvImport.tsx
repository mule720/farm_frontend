// ─────────────────────────────────────────────────────────────────────────────
// AgroNexus v2 — Bulk daily-record import from CSV
// Lets a farm upload a spreadsheet of daily records (one row per day) for a
// production cycle instead of typing each day into the Daily Log form.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useMemo, useRef, useState } from 'react';
import { Upload, Download, X, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useOrg } from '@/store/orgStore';
import type { ProductionCycle, DailyRecord } from '@/lib/types';
import type { DailyField } from './ProductionEngine';

interface Props {
  cycle: ProductionCycle;
  fields: DailyField[];
  defaultStageId: string;
  onImported?: (count: number) => void;
}

// ─── CSV parsing (RFC 4180-ish: quoted cells, escaped quotes, CRLF) ──────────

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;
  const src = text.replace(/^﻿/, ''); // strip BOM (Excel)
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') { cell += '"'; i++; }
        else inQuotes = false;
      } else cell += ch;
      continue;
    }
    if (ch === '"') inQuotes = true;
    else if (ch === ',' || ch === ';' || ch === '\t') { row.push(cell); cell = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++;
      row.push(cell); cell = '';
      if (row.some(c => c.trim() !== '')) rows.push(row);
      row = [];
    } else cell += ch;
  }
  row.push(cell);
  if (row.some(c => c.trim() !== '')) rows.push(row);
  return rows;
}

/** Accept ISO (2026-10-06), day-first (06/10/2026, 6-10-26) and Excel-style (10/6/2026 is ambiguous → treated day-first). */
export function normaliseDate(raw: string): string | null {
  const s = raw.trim();
  if (!s) return null;
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return valid(+m[1], +m[2], +m[3]);
  m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/);
  if (m) {
    const year = m[3].length === 2 ? 2000 + +m[3] : +m[3];
    return valid(year, +m[2], +m[1]);
  }
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);

  function valid(y: number, mo: number, d: number): string | null {
    if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
    return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }
}

const norm = (s: string) => s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

/** Fill computed fields (same rules as the Daily Log form). */
export function applyComputed(values: Record<string, string>, fields: DailyField[]) {
  const next = { ...values };
  fields.forEach(f => {
    if (f.type !== 'computed' || !f.computedFrom) return;
    const all = f.computedFrom.every(src => next[src] !== undefined && next[src] !== '');
    if (!all) return;
    if (f.id === 'milk_total') {
      next[f.id] = f.computedFrom.reduce((s, src) => s + (parseFloat(next[src] ?? '0') || 0), 0).toFixed(1);
    } else if (f.id === 'yield_pct') {
      const out = parseFloat(next['output_kg'] ?? '0') || 0;
      const inp = parseFloat(next['input_kg'] ?? '0') || 1;
      next[f.id] = ((out / inp) * 100).toFixed(1);
    }
  });
  return next;
}

interface ParsedRow {
  line: number;
  date: string | null;
  stageId: string | null;
  stageLabel: string;
  values: Record<string, string>;
  notes: string;
  errors: string[];
  warnings: string[];
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DailyRecordsCsvImport({ cycle, fields, defaultStageId, onImported }: Props) {
  const { addDailyRecord } = useOrg();
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [fileName, setFileName] = useState('');
  const [rows, setRows] = useState<ParsedRow[] | null>(null);
  const [unmatched, setUnmatched] = useState<string[]>([]);
  const [done, setDone] = useState<number | null>(null);

  const inputFields = fields.filter(f => f.type !== 'computed');
  const stages = cycle.stages.filter(s => s.status !== 'pending');

  // Existing dates per stage — a second record for the same day is flagged, not blocked
  const existingDates = useMemo(() => {
    const m = new Map<string, Set<string>>();
    cycle.stages.forEach(s => m.set(s.id, new Set(s.dailyRecords.map(r => r.date))));
    return m;
  }, [cycle]);

  function downloadTemplate() {
    const header = ['date', 'stage', ...inputFields.map(f => f.id), 'notes'];
    const labels = ['# YYYY-MM-DD', '# ' + (stages.map(s => s.name).join(' | ') || 'stage name'),
      ...inputFields.map(f => '# ' + f.label + (f.unit ? ` (${f.unit})` : '') + (f.options ? `: ${f.options.join(' | ')}` : '') + (f.required ? ' *' : '')),
      '# free text'];
    const today = new Date().toISOString().slice(0, 10);
    const sample = [today, stages[0]?.name ?? '', ...inputFields.map(f => f.type === 'select' ? (f.options?.[0] ?? '') : f.type === 'number' ? '0' : ''), ''];
    const q = (v: string) => /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
    const csv = [header, labels, sample].map(r => r.map(q).join(',')).join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = `${cycle.name.replace(/[^a-z0-9]+/gi, '_')}_daily_records_template.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function handleFile(file: File) {
    setFileName(file.name);
    setDone(null);
    const reader = new FileReader();
    reader.onload = () => parse(String(reader.result ?? ''));
    reader.readAsText(file);
  }

  function parse(text: string) {
    const table = parseCsv(text);
    if (table.length < 2) { setRows([]); setUnmatched([]); return; }
    const header = table[0].map(norm);

    // Map each column to a field by id or label (case/spacing-insensitive)
    const colField: (DailyField | null)[] = header.map(h => {
      if (!h) return null;
      return inputFields.find(f => norm(f.id) === h)
        ?? inputFields.find(f => norm(f.label) === h || norm(f.label.replace(/\(.*\)/, '')) === h)
        ?? null;
    });
    const dateCol = header.findIndex(h => ['date', 'day', 'record_date'].includes(h));
    const stageCol = header.findIndex(h => ['stage', 'phase'].includes(h));
    const notesCol = header.findIndex(h => ['notes', 'note', 'observations', 'comments', 'remarks'].includes(h));
    setUnmatched(header.filter((h, i) => h && i !== dateCol && i !== stageCol && i !== notesCol && !colField[i]).map(h => table[0][header.indexOf(h)]));

    const parsed: ParsedRow[] = [];
    table.slice(1).forEach((cells, idx) => {
      if (cells[0]?.trim().startsWith('#')) return; // template guidance line
      const errors: string[] = [];
      const warnings: string[] = [];
      const date = dateCol >= 0 ? normaliseDate(cells[dateCol] ?? '') : null;
      if (dateCol < 0) errors.push('No "date" column');
      else if (!date) errors.push(`Unreadable date "${cells[dateCol] ?? ''}"`);

      let stageId: string | null = defaultStageId || null;
      let stageLabel = stages.find(s => s.id === defaultStageId)?.name ?? '';
      const stageRaw = stageCol >= 0 ? (cells[stageCol] ?? '').trim() : '';
      if (stageRaw) {
        const st = cycle.stages.find(s => norm(s.name) === norm(stageRaw));
        if (!st) errors.push(`Unknown stage "${stageRaw}"`);
        else { stageId = st.id; stageLabel = st.name; if (st.status === 'pending') warnings.push('Stage not started yet'); }
      }
      if (!stageId) errors.push('No stage');

      let values: Record<string, string> = {};
      cells.forEach((raw, i) => {
        const f = colField[i];
        if (!f) return;
        const v = raw.trim();
        if (!v) return;
        if (f.type === 'number') {
          const n = parseFloat(v.replace(/,/g, ''));
          if (isNaN(n)) { errors.push(`${f.label}: "${v}" is not a number`); return; }
          values[f.id] = String(n);
          if (f.benchmark && ((f.benchmark.min !== undefined && n < f.benchmark.min) || (f.benchmark.max !== undefined && n > f.benchmark.max))) {
            warnings.push(`${f.label} ${n} outside expected ${f.benchmark.min ?? ''}–${f.benchmark.max ?? ''}`);
          }
        } else if (f.type === 'select') {
          const opt = f.options?.find(o => norm(o) === norm(v));
          if (!opt) { warnings.push(`${f.label}: "${v}" is not one of ${f.options?.join(', ')}`); values[f.id] = v; }
          else values[f.id] = opt;
        } else values[f.id] = v;
      });
      values = applyComputed(values, fields);
      inputFields.filter(f => f.required).forEach(f => { if (!values[f.id]) errors.push(`${f.label} is required`); });
      if (Object.keys(values).length === 0 && errors.length === 0) errors.push('No measurements on this row');
      if (date && stageId && existingDates.get(stageId)?.has(date)) warnings.push('A record for this day already exists');

      parsed.push({ line: idx + 2, date, stageId, stageLabel, values, notes: notesCol >= 0 ? (cells[notesCol] ?? '').trim() : '', errors, warnings });
    });
    setRows(parsed);
  }

  function importRows() {
    if (!rows) return;
    const good = rows.filter(r => r.errors.length === 0 && r.date && r.stageId);
    good.forEach(r => {
      const measurements: Record<string, number> = {};
      const data: Record<string, string> = {};
      fields.forEach(f => {
        const v = r.values[f.id];
        if (v === undefined || v === '') return;
        if (f.type === 'number' || f.type === 'computed') { const n = parseFloat(v); if (!isNaN(n)) measurements[f.id] = n; }
        else data[f.id] = v;
      });
      const record: Omit<DailyRecord, 'id'> = {
        date: r.date!, measurements,
        data: Object.keys(data).length ? data : undefined,
        notes: r.notes || undefined,
        recordedBy: 'csv-import',
      };
      addDailyRecord(cycle.id, r.stageId!, record);
    });
    setDone(good.length);
    setRows(null);
    onImported?.(good.length);
  }

  function reset() { setRows(null); setFileName(''); setDone(null); setUnmatched([]); if (fileRef.current) fileRef.current.value = ''; }

  const valid = rows?.filter(r => r.errors.length === 0).length ?? 0;
  const invalid = (rows?.length ?? 0) - valid;
  const previewFields = inputFields.slice(0, 4);

  return (
    <>
      <div className="flex gap-2">
        <button type="button" onClick={() => { setOpen(true); setDone(null); }}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium border border-slate-300 bg-white text-slate-700 hover:bg-slate-50">
          <Upload className="w-4 h-4" /> Import CSV
        </button>
        <button type="button" onClick={downloadTemplate} title="Download a CSV template with the right columns for this enterprise"
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-slate-300 bg-white text-slate-700 hover:bg-slate-50">
          <Download className="w-4 h-4" /> Template
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => { setOpen(false); reset(); }}>
          <div className="bg-white w-full sm:max-w-3xl max-h-[92vh] rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
              <div>
                <h3 className="text-base font-semibold text-slate-800">Import daily records</h3>
                <p className="text-xs text-slate-500">{cycle.name} · one row per day</p>
              </div>
              <button onClick={() => { setOpen(false); reset(); }} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-5 h-5 text-slate-500" /></button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              {done !== null && (
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-800 rounded-xl p-3 text-sm">
                  <CheckCircle2 className="w-5 h-5" /> Imported {done} record{done === 1 ? '' : 's'}.
                </div>
              )}

              {!rows && (
                <div className="space-y-3">
                  <label className="block border-2 border-dashed border-slate-300 rounded-xl p-6 text-center cursor-pointer hover:border-green-500 hover:bg-green-50/40"
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f); }}>
                    <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                    <div className="text-sm font-medium text-slate-700">Drop a CSV here or click to choose</div>
                    <div className="text-xs text-slate-400 mt-1">Exported from Excel, Google Sheets or the template</div>
                    <input ref={fileRef} type="file" accept=".csv,text/csv,.txt" className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
                  </label>
                  <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-600 space-y-1">
                    <div className="font-semibold text-slate-700">Expected columns</div>
                    <div><span className="font-mono">date</span> (YYYY-MM-DD or DD/MM/YYYY), <span className="font-mono">stage</span> (optional — defaults to the selected stage), <span className="font-mono">notes</span> (optional), plus any of:</div>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {inputFields.map(f => (
                        <span key={f.id} className="px-1.5 py-0.5 rounded bg-white border border-slate-200 font-mono">
                          {f.id}{f.required && <span className="text-red-500">*</span>}
                        </span>
                      ))}
                    </div>
                    <div className="pt-1">Column headers may use the field id or its label (e.g. “Mortality” or “mortality”). Use <b>Template</b> to download a ready-made header.</div>
                  </div>
                </div>
              )}

              {rows && (
                <>
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <span className="text-slate-600 truncate max-w-[14rem]">{fileName}</span>
                    <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-semibold">{valid} ready</span>
                    {invalid > 0 && <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-semibold">{invalid} with errors (skipped)</span>}
                    <button onClick={reset} className="text-xs text-slate-500 underline ml-auto">Choose another file</button>
                  </div>
                  {unmatched.length > 0 && (
                    <div className="flex gap-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-3 text-xs">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>Ignored columns not recognised for this enterprise: <b>{unmatched.join(', ')}</b></div>
                    </div>
                  )}
                  {rows.length === 0 && <p className="text-sm text-slate-500">No data rows found in this file.</p>}
                  {rows.length > 0 && (
                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                      <table className="min-w-full text-xs">
                        <thead className="bg-slate-50 text-slate-500">
                          <tr>
                            <th className="px-2 py-2 text-left">#</th>
                            <th className="px-2 py-2 text-left">Date</th>
                            <th className="px-2 py-2 text-left">Stage</th>
                            {previewFields.map(f => <th key={f.id} className="px-2 py-2 text-left whitespace-nowrap">{f.label}</th>)}
                            <th className="px-2 py-2 text-left">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rows.slice(0, 200).map(r => (
                            <tr key={r.line} className={`border-t border-slate-100 ${r.errors.length ? 'bg-red-50/60' : ''}`}>
                              <td className="px-2 py-1.5 text-slate-400">{r.line}</td>
                              <td className="px-2 py-1.5 whitespace-nowrap">{r.date ?? '—'}</td>
                              <td className="px-2 py-1.5 whitespace-nowrap">{r.stageLabel || '—'}</td>
                              {previewFields.map(f => <td key={f.id} className="px-2 py-1.5">{r.values[f.id] ?? ''}</td>)}
                              <td className="px-2 py-1.5">
                                {r.errors.length > 0
                                  ? <span className="text-red-700">{r.errors.join('; ')}</span>
                                  : r.warnings.length > 0
                                    ? <span className="text-amber-700">{r.warnings.join('; ')}</span>
                                    : <span className="text-green-700">OK</span>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {rows.length > 200 && <div className="px-3 py-2 text-xs text-slate-500 bg-slate-50">Showing first 200 of {rows.length} rows — all valid rows will be imported.</div>}
                    </div>
                  )}
                </>
              )}
            </div>

            {rows && rows.length > 0 && (
              <div className="px-5 py-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <button onClick={() => { setOpen(false); reset(); }} className="px-4 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100">Cancel</button>
                <button onClick={importRows} disabled={valid === 0}
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-green-600 text-white hover:bg-green-700 disabled:opacity-40">
                  Import {valid} record{valid === 1 ? '' : 's'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
