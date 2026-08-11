import { create } from 'zustand';
import { Transaction } from '../utils/mockData';
import { getTransactionsFromDB, addTransactionToDB, deleteTransactionFromDB } from '../db/database';

interface StoreState {
  transactions: Transaction[];
  isLoading: boolean;
  userName: string | null;
  currency: string;
  theme: 'dark' | 'light';
  login: (name: string) => void;
  logout: () => void;
  loadTransactions: () => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, 'id'> & { paymentMethod?: string; notes?: string }) => Promise<void>;
  removeTransaction: (id: string) => Promise<void>;
  setCurrency: (currency: string) => void;
  setTheme: (theme: 'dark' | 'light') => void;
}

export const useStore = create<StoreState>((set) => ({
  transactions: [],
  isLoading: false,
  userName: null,
  currency: 'INR (₹)',
  theme: 'dark',

  login: (name: string) => set({ userName: name }),
  logout: () => set({ userName: null }),
  
  loadTransactions: async () => {
    set({ isLoading: true });
    try {
      const data = await getTransactionsFromDB();
      set({ transactions: data });
    } catch (error) {
      console.error('Failed to load transactions', error);
    } finally {
      set({ isLoading: false });
    }
  },

  addTransaction: async (txData) => {
    set({ isLoading: true });
    try {
      const newTx = {
        ...txData,
        id: Math.random().toString(36).substring(2, 9),
      } as Transaction; // simple ID generation
      await addTransactionToDB(newTx);
      
      // Refresh the list from DB to ensure sorting and consistency
      const data = await getTransactionsFromDB();
      set({ transactions: data });
    } catch (error) {
      console.error('Failed to add transaction', error);
    } finally {
      set({ isLoading: false });
    }
  },

  removeTransaction: async (id) => {
    set({ isLoading: true });
    try {
      await deleteTransactionFromDB(id);
      
      // Refresh list
      const data = await getTransactionsFromDB();
      set({ transactions: data });
    } catch (error) {
      console.error('Failed to delete transaction', error);
    } finally {
      set({ isLoading: false });
    }
  },

  setCurrency: (currency) => set({ currency }),
  setTheme: (theme) => set({ theme }),
}));
