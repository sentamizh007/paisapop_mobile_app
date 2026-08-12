import * as SQLite from 'expo-sqlite';
import { Transaction } from '../utils/mockData';

const dbPromise = SQLite.openDatabaseAsync('spendwise.db');

export const initDB = async () => {
  const db = await dbPromise;
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
      notes TEXT
    );
  `);
};

export const addTransactionToDB = async (
  transaction: Transaction & { paymentMethod?: string; notes?: string }
) => {
  const db = await dbPromise;
  await db.runAsync(
    `INSERT OR REPLACE INTO transactions (id, title, amount, category, date, time, type, paymentMethod, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      transaction.id,
      transaction.title,
      transaction.amount,
      transaction.category,
      transaction.date,
      transaction.time ?? null,
      transaction.type,
      transaction.paymentMethod ?? null,
      transaction.notes ?? null,
    ]
  );
};

export const updateTransactionInDB = async (
  id: string,
  updates: Partial<Pick<Transaction, 'title' | 'amount' | 'category' | 'notes' | 'type'>>
) => {
  const db = await dbPromise;
  const fields = Object.keys(updates).map(k => `${k} = ?`).join(', ');
  const values = [...Object.values(updates), id];
  await db.runAsync(`UPDATE transactions SET ${fields} WHERE id = ?`, values);
};

export const getTransactionsFromDB = async (): Promise<Transaction[]> => {
  const db = await dbPromise;
  // Sort newest first using ISO date strings
  const rows = await db.getAllAsync(
    `SELECT * FROM transactions ORDER BY date DESC, time DESC`
  );
  return rows as Transaction[];
};

export const deleteTransactionFromDB = async (id: string) => {
  const db = await dbPromise;
  await db.runAsync('DELETE FROM transactions WHERE id = ?', [id]);
};

export const clearAllTransactionsFromDB = async () => {
  const db = await dbPromise;
  await db.runAsync('DELETE FROM transactions');
};
