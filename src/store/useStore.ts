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

export type Currency = string;
type Language = 'English' | 'Tamil' | 'Hindi' | 'Spanish' | 'French';
export type Theme = 'dark' | 'light';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  time: string;
  date: string;
  read: boolean;
  type?: 'budget' | 'system' | 'reminder' | 'tip';
}

const SETTINGS_KEY = 'spendwise_settings';

export interface Account {
  id: string;
  name: string;
  type: 'cash' | 'upi' | 'bank' | 'credit' | 'wallet';
  initialBalance: number;
  color: string;
  details?: string;
}

interface Settings {
  currency: Currency;
  language: Language;
  theme: Theme;
  monthlyBudget: number;
  yearlyBudget: number;
  categories: string[];
  categoryMeta: Record<string, { emoji: string; color: string }>;
  categoryBudgets: Record<string, { amount: number; period: 'monthly' | 'yearly' | 'weekly' }>;
  userName: string | null;
  shakeToAdd: boolean;
  accounts: Account[];
  notifications: AppNotification[];
  budgetAlertsSent: Record<string, { reached90?: boolean; reached100?: boolean }>;
}

const DEFAULT_CATEGORIES = [
  'Food', 'Transport', 'Shopping', 'Bills', 'Subscriptions',
  'Health', 'Entertainment', 'Education', 'Travel', 'Groceries',
  'Coffee', 'Gifts', 'Rent', 'Savings', 'Other',
];

const DEFAULT_ACCOUNTS: Account[] = [
  { id: 'acc_cash', name: 'Cash', type: 'cash', initialBalance: 0, color: '#22C55E', details: 'Physical Cash' },
  { id: 'acc_upi', name: 'UPI', type: 'upi', initialBalance: 0, color: '#A855F7', details: 'Google Pay, PhonePe' },
  { id: 'acc_bank', name: 'Bank Account', type: 'bank', initialBalance: 0, color: '#3B82F6', details: 'HDFC Bank' },
  { id: 'acc_credit', name: 'Credit Card', type: 'credit', initialBalance: 0, color: '#F59E0B', details: 'SBI Card' },
  { id: 'acc_wallet', name: 'Wallet', type: 'wallet', initialBalance: 0, color: '#EC4899', details: 'Paisa Pop Wallet' },
];

const DEFAULT_NOTIFICATIONS: AppNotification[] = [];

const DEFAULT_SETTINGS: Settings = {
  currency: 'INR',
  language: 'English',
  theme: 'dark',
  monthlyBudget: 0,
  yearlyBudget: 0,
  categories: DEFAULT_CATEGORIES,
  categoryMeta: {},
  categoryBudgets: {},
  userName: null,
  shakeToAdd: true,
  accounts: DEFAULT_ACCOUNTS,
  notifications: DEFAULT_NOTIFICATIONS,
  budgetAlertsSent: {},
};

interface StoreState extends Settings {
  transactions: Transaction[];
  isLoading: boolean;

  // Auth
  login: (name: string) => void;
  logout: () => void;

  // Accounts
  setAccounts: (accounts: Account[]) => void;

  // Notifications
  addAppNotification: (notif: { title: string; body: string; type?: 'budget' | 'system' | 'reminder' | 'tip' }) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  clearNotifications: () => void;

  // Transactions
  loadTransactions: () => Promise<void>;
  addTransaction: (
    tx: Omit<Transaction, 'id'> & { paymentMethod?: string; toPaymentMethod?: string; notes?: string }
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
  setYearlyBudget: (budget: number) => void;
  addCategory: (category: string, meta?: { emoji: string; color: string }) => void;
  setCategoryBudget: (category: string, budget: { amount: number; period?: 'monthly' | 'yearly' | 'weekly' }) => void;
  removeCategoryBudget: (category: string) => void;
  setShakeToAdd: (enabled: boolean) => void;

  // Settings persistence
  loadSettings: () => Promise<void>;
};

const persistSettings = async (partial: Partial<Settings>) => {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    const prev = raw ? JSON.parse(raw) : {};
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...prev, ...partial }));
  } catch (e) {
    console.error('persistSettings error:', e);
  }
};

const processBudgetMilestones = (
  transactions: Transaction[],
  state: StoreState,
  dateStr?: string
): { updatedAlerts: Record<string, { reached90?: boolean; reached100?: boolean }>; hasChanges: boolean } => {
  const d = dateStr ? new Date(dateStr) : new Date();
  const monthKey = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
  const curSym = state.currency === 'USD' ? '$' : (state.currency === 'INR' ? '₹' : state.currency + ' ');
  let updatedAlerts = { ...(state.budgetAlertsSent || {}) };
  let hasChanges = false;

  // 1. Overall Monthly Budget Check
  if (state.monthlyBudget > 0) {
    const monthExpenses = (transactions || []).filter(t => {
      if (t.type !== 'expense') return false;
      const td = new Date(t.date);
      return !isNaN(td.getTime()) && td.getFullYear() === d.getFullYear() && td.getMonth() === d.getMonth();
    }).reduce((sum, t) => sum + t.amount, 0);

    const pct = (monthExpenses / state.monthlyBudget) * 100;
    const alertsSent = updatedAlerts[monthKey] || {};

    if (pct >= 100 && !alertsSent.reached100) {
      import('../utils/notifications').then(({ sendLocalNotification }) => {
        sendLocalNotification(
          '🚨 100% Total Budget Limit Reached!',
          `You have reached 100% of your ${curSym}${state.monthlyBudget.toLocaleString('en-IN')} monthly budget! Total spent: ${curSym}${monthExpenses.toLocaleString('en-IN')}.`,
          'budget'
        );
      });
      updatedAlerts[monthKey] = { ...alertsSent, reached90: true, reached100: true };
      hasChanges = true;
    } else if (pct >= 90 && pct < 100 && !alertsSent.reached90) {
      const remaining = Math.max(0, state.monthlyBudget - monthExpenses);
      import('../utils/notifications').then(({ sendLocalNotification }) => {
        sendLocalNotification(
          '🔔 90% Total Budget Warning!',
          `You have spent ${curSym}${monthExpenses.toLocaleString('en-IN')} (${Math.round(pct)}%) of your ${curSym}${state.monthlyBudget.toLocaleString('en-IN')} budget. Only ${curSym}${remaining.toLocaleString('en-IN')} left!`,
          'budget'
        );
      });
      updatedAlerts[monthKey] = { ...alertsSent, reached90: true };
      hasChanges = true;
    }
  }

  // 2. Category Budgets Check
  const categoryBudgets = state.categoryBudgets || {};
  for (const cat of Object.keys(categoryBudgets)) {
    const catBudgetInfo = categoryBudgets[cat];
    if (!catBudgetInfo || !catBudgetInfo.amount || catBudgetInfo.amount <= 0) continue;

    const catExpenses = (transactions || []).filter(t => {
      if (t.type !== 'expense') return false;
      if (t.category !== cat) return false;
      const td = new Date(t.date);
      return !isNaN(td.getTime()) && td.getFullYear() === d.getFullYear() && td.getMonth() === d.getMonth();
    }).reduce((sum, t) => sum + t.amount, 0);

    const catPct = (catExpenses / catBudgetInfo.amount) * 100;
    const catAlertKey = `${monthKey}_cat_${cat}`;
    const catAlertsSent = updatedAlerts[catAlertKey] || {};

    if (catPct >= 100 && !catAlertsSent.reached100) {
      import('../utils/notifications').then(({ sendLocalNotification }) => {
        sendLocalNotification(
          `🚨 100% ${cat} Budget Reached!`,
          `You have reached 100% of your ${curSym}${catBudgetInfo.amount.toLocaleString('en-IN')} budget for ${cat}! Total spent: ${curSym}${catExpenses.toLocaleString('en-IN')}.`,
          'budget'
        );
      });
      updatedAlerts[catAlertKey] = { ...catAlertsSent, reached90: true, reached100: true };
      hasChanges = true;
    } else if (catPct >= 90 && catPct < 100 && !catAlertsSent.reached90) {
      const remaining = Math.max(0, catBudgetInfo.amount - catExpenses);
      import('../utils/notifications').then(({ sendLocalNotification }) => {
        sendLocalNotification(
          `🔔 90% ${cat} Budget Warning!`,
          `You have spent ${curSym}${catExpenses.toLocaleString('en-IN')} (${Math.round(catPct)}%) of your ${curSym}${catBudgetInfo.amount.toLocaleString('en-IN')} ${cat} budget. Only ${curSym}${remaining.toLocaleString('en-IN')} left!`,
          'budget'
        );
      });
      updatedAlerts[catAlertKey] = { ...catAlertsSent, reached90: true };
      hasChanges = true;
    }
  }

  return { updatedAlerts, hasChanges };
};

export const useStore = create<StoreState>((set, get) => ({
  ...DEFAULT_SETTINGS,
  transactions: [],
  isLoading: false,

  // ── Auth ────────────────────────────────────────────────────────────────
  login: (name: string) => {
    set({ userName: name });
    persistSettings({ userName: name });
  },
  logout: () => {
    set({ userName: null });
    persistSettings({ userName: null });
  },

  // ── Accounts ─────────────────────────────────────────────────────────────
  setAccounts: (accounts: Account[]) => {
    set({ accounts });
    persistSettings({ accounts });
  },

  // ── Settings Persistence ─────────────────────────────────────────────────
  loadSettings: async () => {
    try {
      const raw = await AsyncStorage.getItem(SETTINGS_KEY);
      if (raw) {
        const saved: Partial<Settings> = JSON.parse(raw);
        // Deduplicate notifications on load
        const rawNotifs: AppNotification[] = (saved.notifications || []).filter(n => n.type === 'budget');
        const uniqueNotifs: AppNotification[] = [];
        const seenKeys = new Set<string>();
        for (const n of rawNotifs) {
          const key = `${n.title}_${n.date || 'unknown'}`;
          if (!seenKeys.has(key)) {
            seenKeys.add(key);
            uniqueNotifs.push(n);
          }
        }

        set({
          currency: saved.currency ?? DEFAULT_SETTINGS.currency,
          language: saved.language ?? DEFAULT_SETTINGS.language,
          theme: saved.theme ?? DEFAULT_SETTINGS.theme,
          monthlyBudget: saved.monthlyBudget ?? 0,
          categories: saved.categories ?? DEFAULT_CATEGORIES,
          categoryMeta: saved.categoryMeta ?? {},
          categoryBudgets: saved.categoryBudgets ?? {},
          userName: saved.userName ?? null,
          shakeToAdd: saved.shakeToAdd ?? true,
          accounts: saved.accounts ?? DEFAULT_ACCOUNTS,
          notifications: uniqueNotifs,
          budgetAlertsSent: saved.budgetAlertsSent ?? {},
        });
      }
    } catch (_) { }
  },

  // ── Transactions ─────────────────────────────────────────────────────────
  loadTransactions: async () => {
    set({ isLoading: true });
    try {
      const data = await getTransactionsFromDB();
      set({ transactions: data });

      // Check both overall monthly budget and category budgets on load
      const state = get();
      const { updatedAlerts, hasChanges } = processBudgetMilestones(data, state);
      if (hasChanges) {
        set({ budgetAlertsSent: updatedAlerts });
        persistSettings({ budgetAlertsSent: updatedAlerts });
      }
    } catch (e) {
      console.error('loadTransactions error:', e);
      throw e;
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

      // Check both overall monthly budget and category budgets
      const state = get();
      if (txData.type === 'expense') {
        const { updatedAlerts, hasChanges } = processBudgetMilestones(data, state, txData.date);
        if (hasChanges) {
          set({ budgetAlertsSent: updatedAlerts });
          persistSettings({ budgetAlertsSent: updatedAlerts });
        }
      }
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
      set({
        transactions: [],
        monthlyBudget: 0,
        yearlyBudget: 0,
        categoryBudgets: {},
        budgetAlertsSent: {},
        notifications: [],
      });
      persistSettings({
        monthlyBudget: 0,
        yearlyBudget: 0,
        categoryBudgets: {},
        budgetAlertsSent: {},
        notifications: [],
      });
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
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    const budgetAlertsSent = { ...get().budgetAlertsSent };
    delete budgetAlertsSent[monthKey];
    set({ monthlyBudget, budgetAlertsSent });
    persistSettings({ monthlyBudget, budgetAlertsSent });

    const state = { ...get(), monthlyBudget, budgetAlertsSent };
    const { updatedAlerts, hasChanges } = processBudgetMilestones(get().transactions, state);
    if (hasChanges) {
      set({ budgetAlertsSent: updatedAlerts });
      persistSettings({ budgetAlertsSent: updatedAlerts });
    }
  },
  setYearlyBudget: (yearlyBudget) => {
    set({ yearlyBudget });
    persistSettings({ yearlyBudget });
  },
  addCategory: (category, meta) => {
    const categories = get().categories.includes(category) ? get().categories : [...get().categories, category];
    const categoryMeta = { ...get().categoryMeta };
    if (meta) {
      categoryMeta[category] = meta;
    }
    set({ categories, categoryMeta });
    persistSettings({ categories, categoryMeta });
  },
  setCategoryBudget: (category, budget) => {
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    const catAlertKey = `${monthKey}_cat_${category}`;
    const budgetAlertsSent = { ...get().budgetAlertsSent };
    delete budgetAlertsSent[catAlertKey];

    const budgetObj = { amount: budget.amount, period: budget.period || 'monthly' as const };
    const categoryBudgets = { ...get().categoryBudgets, [category]: budgetObj };
    set({ categoryBudgets, budgetAlertsSent });
    persistSettings({ categoryBudgets, budgetAlertsSent });

    const state = { ...get(), categoryBudgets, budgetAlertsSent };
    const { updatedAlerts, hasChanges } = processBudgetMilestones(get().transactions, state);
    if (hasChanges) {
      set({ budgetAlertsSent: updatedAlerts });
      persistSettings({ budgetAlertsSent: updatedAlerts });
    }
  },
  removeCategoryBudget: (category) => {
    const categoryBudgets = { ...get().categoryBudgets };
    delete categoryBudgets[category];
    set({ categoryBudgets });
    persistSettings({ categoryBudgets });
  },
  setShakeToAdd: (shakeToAdd) => {
    set({ shakeToAdd });
    persistSettings({ shakeToAdd });
  },

  // ── Notifications ────────────────────────────────────────────────────────
  addAppNotification: ({ title, body, type = 'system' }) => {
    const existing = get().notifications || [];
    const today = new Date().toISOString().split('T')[0];

    // Prevent duplicate alert with same title for the same day
    const isDuplicate = existing.some(
      n => n.title === title && (n.date === today || (!n.read && n.body === body))
    );
    if (isDuplicate) return;

    import('../utils/notifications').then(({ playNotificationSound }) => {
      playNotificationSound();
    }).catch(() => {});

    const newNotif: AppNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      title,
      body,
      time: 'Just now',
      date: today,
      read: false,
      type,
    };
    const notifications = [newNotif, ...existing];
    set({ notifications });
    persistSettings({ notifications });
  },

  markNotificationAsRead: (id: string) => {
    const notifications = (get().notifications || []).map(n => n.id === id ? { ...n, read: true } : n);
    set({ notifications });
    persistSettings({ notifications });
  },

  markAllNotificationsAsRead: () => {
    const notifications = (get().notifications || []).map(n => ({ ...n, read: true }));
    set({ notifications });
    persistSettings({ notifications });
  },

  clearNotifications: () => {
    set({ notifications: [] });
    persistSettings({ notifications: [] });
  },
}));

