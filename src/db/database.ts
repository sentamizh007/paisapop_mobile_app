import * as SQLite from 'expo-sqlite';
import { Transaction } from '../utils/mockData';

import { Platform } from 'react-native';

// Lazy singleton: only opens the DB on first call, retries on failure
let _dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

const getDb = (): Promise<SQLite.SQLiteDatabase> => {
  if (_dbPromise) return _dbPromise;

  _dbPromise = (async () => {
    try {
      if (Platform.OS === 'web') {
        // expo-sqlite uses OPFS on web which can fail with various errors
        // (Invalid VFS state, NoModificationAllowedError, etc.)
        // Always try real DB first, fall back to in-memory on any failure.
        try {
          return await SQLite.openDatabaseAsync('spendwise.db');
        } catch (e: any) {
          console.warn('SQLite web error, using in-memory DB:', e.message);
          return await SQLite.openDatabaseAsync(':memory:');
        }
      }
      return await SQLite.openDatabaseAsync('spendwise.db');
    } catch (err) {
      // Clear the cached promise so the next call retries
      _dbPromise = null;
      throw err;
    }
  })();

  return _dbPromise;
};


export const initDB = async () => {
  const db = await getDb();
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      amount REAL NOT NULL,
      category TEXT NOT NULL,
      date TEXT NOT NULL,
      time TEXT,
      type TEXT NOT NULL DEFAULT 'expense',
      paymentMethod TEXT,
      toPaymentMethod TEXT,
      notes TEXT,
      receipt TEXT,
      splitWith TEXT
    );
  `);
  // Attempt to add column to existing databases safely
  try { await db.execAsync('ALTER TABLE transactions ADD COLUMN paymentMethod TEXT;'); } catch {}
  try { await db.execAsync('ALTER TABLE transactions ADD COLUMN toPaymentMethod TEXT;'); } catch {}
  try { await db.execAsync('ALTER TABLE transactions ADD COLUMN notes TEXT;'); } catch {}
  try { await db.execAsync('ALTER TABLE transactions ADD COLUMN receipt TEXT;'); } catch {}
  try { await db.execAsync('ALTER TABLE transactions ADD COLUMN splitWith TEXT;'); } catch {}
};

export const addTransactionToDB = async (
  transaction: Transaction & { paymentMethod?: string; toPaymentMethod?: string; notes?: string; receipt?: string; splitWith?: string }
) => {
  const db = await getDb();
  await db.runAsync(
    `INSERT OR REPLACE INTO transactions (id, title, amount, category, date, time, type, paymentMethod, toPaymentMethod, notes, receipt, splitWith)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      transaction.id,
      transaction.title,
      transaction.amount,
      transaction.category,
      transaction.date,
      transaction.time ?? null,
      transaction.type,
      transaction.paymentMethod ?? null,
      transaction.toPaymentMethod ?? null,
      transaction.notes ?? null,
      transaction.receipt ?? null,
      transaction.splitWith ?? null,
    ]
  );
};

export const updateTransactionInDB = async (
  id: string,
  updates: Partial<Pick<Transaction, 'title' | 'amount' | 'category' | 'notes' | 'type'>>
) => {
  const db = await getDb();
  const fields = Object.keys(updates).map(k => `${k} = ?`).join(', ');
  const values = [...Object.values(updates), id];
  await db.runAsync(`UPDATE transactions SET ${fields} WHERE id = ?`, values);
};

export const getTransactionsFromDB = async (): Promise<Transaction[]> => {
  const db = await getDb();
  // Sort newest first using ISO date strings
  const rows = await db.getAllAsync(
    `SELECT * FROM transactions ORDER BY date DESC, time DESC`
  );
  return rows as Transaction[];
};

export const deleteTransactionFromDB = async (id: string) => {
  const db = await getDb();
  await db.runAsync('DELETE FROM transactions WHERE id = ?', [id]);
};

export const clearAllTransactionsFromDB = async () => {
  const db = await getDb();
  await db.runAsync('DELETE FROM transactions');
};
