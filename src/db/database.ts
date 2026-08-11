import * as SQLite from 'expo-sqlite';
import { Transaction } from '../utils/mockData'; // we'll use the type from here

// With the newer expo-sqlite API, openDatabaseAsync is used
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
      type TEXT NOT NULL,
      paymentMethod TEXT,
      notes TEXT
    );
  `);
};

export const addTransactionToDB = async (transaction: Transaction & { paymentMethod?: string; notes?: string }) => {
  const db = await dbPromise;
  await db.runAsync(
    `INSERT INTO transactions (id, title, amount, category, date, time, type, paymentMethod, notes) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      transaction.id, 
      transaction.title, 
      transaction.amount, 
      transaction.category, 
      transaction.date, 
      transaction.time || null, 
      transaction.type,
      transaction.paymentMethod || null,
      transaction.notes || null
    ]
  );
};

export const getTransactionsFromDB = async (): Promise<Transaction[]> => {
  const db = await dbPromise;
  const allRows = await db.getAllAsync('SELECT * FROM transactions ORDER BY date DESC, time DESC');
  return allRows as Transaction[];
};

export const deleteTransactionFromDB = async (id: string) => {
  const db = await dbPromise;
  await db.runAsync('DELETE FROM transactions WHERE id = ?', [id]);
};
