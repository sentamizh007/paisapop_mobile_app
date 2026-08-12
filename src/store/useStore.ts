import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Transaction } from '../utils/mockData';
import {
  getTransactionsFromDB,
  addTransactionToDB,
  updateTransactionInDB,
  deleteTransactionFromDB,
  clearAllTransactionsFromDB,
} from '../db/database';

export type Currency = 'INR' | 'USD';
type Language = 'English' | 'Tamil' | 'Hindi' | 'Spanish' | 'French';
export type Theme = 'dark' | 'light';

const SETTINGS_KEY = 'spendwise_settings';

interface Settings {
  currency: Currency;
  language: Language;
  theme: Theme;
  monthlyBudget: number;
  categories: string[];
  userName: string | null;
}

const DEFAULT_CATEGORIES = [
  'Food', 'Transport', 'Shopping', 'Bills', 'Subscriptions',
  'Health', 'Entertainment', 'Education', 'Travel', 'Groceries',
  'Coffee', 'Gifts', 'Rent', 'Savings', 'Other',
];

const DEFAULT_SETTINGS: Settings = {
  currency: 'INR',
  language: 'English',
  theme: 'light',
  monthlyBudget: 0,
  categories: DEFAULT_CATEGORIES,
  userName: null,
};

interface StoreState extends Settings {
  transactions: Transaction[];
  isLoading: boolean;

  // Auth
  login: (name: string) => void;
  logout: () => void;

  // Transactions
  loadTransactions: () => Promise<void>;
  addTransaction: (
    tx: Omit<Transaction, 'id'> & { paymentMethod?: string; notes?: string }
  ) => Promise<void>;
  updateTransaction: (
    id: string,
    updates: Partial<Pick<Transaction, 'title' | 'amount' | 'category' | 'notes' | 'type'>>
  ) => Promise<void>;
  removeTransaction: (id: string) => Promise<void>;
  clearAllTransactions: () => Promise<void>;

  // Settings (all auto-persist)
  setCurrency: (currency: Currency) => void;
  setLanguage: (lang: Language) => void;
  setTheme: (theme: Theme) => void;
  setMonthlyBudget: (budget: number) => void;
  addCategory: (category: string) => void;

  // Settings persistence
  loadSettings: () => Promise<void>;
}

const persistSettings = async (partial: Partial<Settings>) => {
  try {
    const existing = await AsyncStorage.getItem(SETTINGS_KEY);
    const current = existing ? JSON.parse(existing) : DEFAULT_SETTINGS;
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...current, ...partial }));
  } catch (_) {}
};

export const useStore = create<StoreState>((set, get) => ({
  ...DEFAULT_SETTINGS,
  transactions: [],
  isLoading: false,

  // ── Auth ────────────────────────────────────────────────────────────────
  login: (name) => {
    set({ userName: name });
    persistSettings({ userName: name });
  },
  logout: () => {
    set({ userName: null });
    persistSettings({ userName: null });
  },

  // ── Settings Persistence ─────────────────────────────────────────────────
  loadSettings: async () => {
    try {
      const raw = await AsyncStorage.getItem(SETTINGS_KEY);
      if (raw) {
        const saved: Partial<Settings> = JSON.parse(raw);
        set({
          currency: saved.currency ?? DEFAULT_SETTINGS.currency,
          language: saved.language ?? DEFAULT_SETTINGS.language,
          theme: saved.theme ?? DEFAULT_SETTINGS.theme,
          monthlyBudget: saved.monthlyBudget ?? 0,
          categories: saved.categories ?? DEFAULT_CATEGORIES,
          userName: saved.userName ?? null,
        });
      }
    } catch (_) {}
  },

  // ── Transactions ─────────────────────────────────────────────────────────
  loadTransactions: async () => {
    set({ isLoading: true });
    try {
      const data = await getTransactionsFromDB();
      set({ transactions: data });
    } catch (e) {
      console.error('loadTransactions error:', e);
    } finally {
      set({ isLoading: false });
    }
  },

  addTransaction: async (txData) => {
    set({ isLoading: true });
    try {
      const newTx: Transaction = {
        ...txData,
        id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        category: txData.category,
        type: txData.type,
      };
      await addTransactionToDB(newTx);
      const data = await getTransactionsFromDB();
      set({ transactions: data });
    } catch (e) {
      console.error('addTransaction error:', e);
      throw e;
    } finally {
      set({ isLoading: false });
    }
  },

  updateTransaction: async (id, updates) => {
    set({ isLoading: true });
    try {
      await updateTransactionInDB(id, updates);
      const data = await getTransactionsFromDB();
      set({ transactions: data });
    } catch (e) {
      console.error('updateTransaction error:', e);
      throw e;
    } finally {
      set({ isLoading: false });
    }
  },

  removeTransaction: async (id) => {
    set({ isLoading: true });
    try {
      await deleteTransactionFromDB(id);
      const data = await getTransactionsFromDB();
      set({ transactions: data });
    } catch (e) {
      console.error('removeTransaction error:', e);
    } finally {
      set({ isLoading: false });
    }
  },

  clearAllTransactions: async () => {
    set({ isLoading: true });
    try {
      await clearAllTransactionsFromDB();
      set({ transactions: [] });
    } catch (e) {
      console.error('clearAllTransactions error:', e);
    } finally {
      set({ isLoading: false });
    }
  },

  // ── Settings Setters ─────────────────────────────────────────────────────
  setCurrency: (currency) => {
    set({ currency });
    persistSettings({ currency });
  },
  setLanguage: (language) => {
    set({ language });
    persistSettings({ language });
  },
  setTheme: (theme) => {
    set({ theme });
    persistSettings({ theme });
  },
  setMonthlyBudget: (monthlyBudget) => {
    set({ monthlyBudget });
    persistSettings({ monthlyBudget });
  },
  addCategory: (category) => {
    const categories = [...get().categories, category];
    set({ categories });
    persistSettings({ categories });
  },
}));
