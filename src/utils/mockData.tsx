import React from 'react';
import { Utensils, MonitorPlay, Car, ShoppingBag, Zap, HeartPulse, Film, BookOpen, Airplay, ShoppingCart, Coffee, Gift, Home, PiggyBank, MoreHorizontal } from 'lucide-react-native';

export type Category =
  | 'Food'
  | 'Transport'
  | 'Shopping'
  | 'Bills'
  | 'Subscriptions'
  | 'Health'
  | 'Entertainment'
  | 'Education'
  | 'Travel'
  | 'Groceries'
  | 'Coffee'
  | 'Gifts'
  | 'Rent'
  | 'Savings'
  | 'Other'
  | string; // Allow any custom category

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  category: Category;
  date: string;
  time?: string;
  type: 'expense' | 'income';
  paymentMethod?: string;
  notes?: string;
}

export const getCategoryIcon = (category: Category, color: string, size: number) => {
  switch (category) {
    case 'Food': return <Utensils color={color} size={size} />;
    case 'Transport': return <Car color={color} size={size} />;
    case 'Shopping': return <ShoppingBag color={color} size={size} />;
    case 'Bills': return <Zap color={color} size={size} />;
    case 'Subscriptions': return <MonitorPlay color={color} size={size} />;
    case 'Health': return <HeartPulse color={color} size={size} />;
    case 'Entertainment': return <Film color={color} size={size} />;
    case 'Education': return <BookOpen color={color} size={size} />;
    case 'Travel': return <Airplay color={color} size={size} />;
    case 'Groceries': return <ShoppingCart color={color} size={size} />;
    case 'Coffee': return <Coffee color={color} size={size} />;
    case 'Gifts': return <Gift color={color} size={size} />;
    case 'Rent': return <Home color={color} size={size} />;
    case 'Savings': return <PiggyBank color={color} size={size} />;
    case 'Other': return <MoreHorizontal color={color} size={size} />;
    default: return <MoreHorizontal color={color} size={size} />; // Fallback for custom
  }
};

export const getCategoryColor = (category: Category) => {
  switch (category) {
    case 'Food': return '#F97316';
    case 'Transport': return '#2563EB';
    case 'Shopping': return '#8B5CF6';
    case 'Bills': return '#F59E0B';
    case 'Subscriptions': return '#10B981';
    case 'Health': return '#EC4899';
    case 'Entertainment': return '#6366F1';
    case 'Education': return '#0EA5E9';
    case 'Travel': return '#14B8A6';
    case 'Groceries': return '#22C55E';
    case 'Coffee': return '#A855F7';
    case 'Gifts': return '#F43F5E';
    case 'Rent': return '#F97316';
    case 'Savings': return '#0F766E';
    case 'Other': return '#64748B';
    default: return '#6366F1'; // Default indigo for custom categories
  }
};
