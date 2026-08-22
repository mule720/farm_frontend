/** Export any array of objects to a CSV file and trigger browser download */
export function exportCSV(filename: string, rows: Record<string, any>[]): void {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(','),
    ...rows.map(r => headers.map(h => {
      const v = r[h] ?? '';
      const s = String(v);
      return s.includes(',') || s.includes('"') || s.includes('\n')
        ? `"${s.replace(/"/g, '""')}"` : s;
    }).join(','))
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

/** Export array of objects to JSON file */
export function exportJSON(filename: string, data: any): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

/** Backup all agronexus_v2_* localStorage keys to a JSON file */
export function backupAll(): void {
  const data: Record<string, any> = { _meta: { exportedAt: new Date().toISOString(), version: 'agronexus_v2' } };
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('agronexus_v2_')) {
      try { data[key] = JSON.parse(localStorage.getItem(key) ?? 'null'); }
      catch { data[key] = localStorage.getItem(key); }
    }
  }
  exportJSON(`agronexus_backup_${new Date().toISOString().slice(0,10)}.json`, data);
}

/** Restore from a backup JSON (returns number of keys restored) */
export function restoreBackup(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const data = JSON.parse(e.target?.result as string);
        let count = 0;
        for (const [key, value] of Object.entries(data)) {
          if (key.startsWith('agronexus_v2_')) {
            localStorage.setItem(key, JSON.stringify(value));
            count++;
          }
        }
        resolve(count);
      } catch (err) { reject(err); }
    };
    reader.readAsText(file);
  });
}
