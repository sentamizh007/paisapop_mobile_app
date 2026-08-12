import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Transaction } from './mockData';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const parseDate = (ds: string): Date => {
  if (!ds) return new Date(NaN);
  const n = ds.toLowerCase().trim();
  const now = new Date();
  if (n === 'today') return now;
  if (n === 'yesterday') { const d = new Date(now); d.setDate(now.getDate() - 1); return d; }
  const m = n.match(/^(\d+)\s+days?\s+ago$/);
  if (m) { const d = new Date(now); d.setDate(now.getDate() - parseInt(m[1], 10)); return d; }
  const p = new Date(ds);
  return isNaN(p.getTime()) ? new Date(NaN) : p;
};

/** Format currency for CSV */
const fmt = (amount: number) => amount.toFixed(2);

/**
 * Build CSV string from transactions.
 * @param transactions All transactions
 * @param month  0-indexed month (0=Jan) or undefined for all data
 * @param year   Full year e.g. 2026
 */
export const buildCSV = (
  transactions: Transaction[],
  month?: number,
  year?: number
): string => {
  let rows = transactions;

  if (month !== undefined && year !== undefined) {
    rows = transactions.filter(tx => {
      const d = parseDate(tx.date);
      if (isNaN(d.getTime())) return false;
      return d.getMonth() === month && d.getFullYear() === year;
    });
  }

  // Sort oldest first for readability
  rows = [...rows].sort((a, b) => parseDate(a.date).getTime() - parseDate(b.date).getTime());

  const header = 'Date,Time,Category,Type,Amount,Notes\n';
  const body = rows.map(tx => {
    const date = tx.date;
    const time = tx.time ?? '';
    const category = `"${tx.category}"`;
    const type = tx.type;
    const amount = fmt(tx.amount);
    const notes = tx.notes ? `"${tx.notes.replace(/"/g, '""')}"` : '';
    return `${date},${time},${category},${type},${amount},${notes}`;
  }).join('\n');

  return header + body;
};

export const exportAndShare = async (
  transactions: Transaction[],
  month?: number,
  year?: number
): Promise<{ success: boolean; error?: string }> => {
  try {
    const csv = buildCSV(transactions, month, year);

    let label = 'all';
    if (month !== undefined && year !== undefined) {
      label = `${MONTH_NAMES[month]}_${year}`;
    }

    const docDir = Paths.document;
    if (!docDir) {
      return { success: false, error: 'Document directory is not accessible on this device.' };
    }

    const filename = `expenses_${label}.csv`;
    const file = new File(docDir, filename);

    file.write(csv);
    const fileUri = file.uri;

    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) {
      return { success: false, error: 'Sharing is not available on this device.' };
    }

    await Sharing.shareAsync(fileUri, {
      mimeType: 'text/csv',
      dialogTitle: `Export Expenses — ${label}`,
      UTI: 'public.comma-separated-values-text',
    });

    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message ?? 'Export failed' };
  }
};

export { MONTH_NAMES };
