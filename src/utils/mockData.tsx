import { Utensils, MonitorPlay, Car, ShoppingBag, Zap } from 'lucide-react-native';

export type Category = 'Food' | 'Subscriptions' | 'Transport' | 'Shopping' | 'Bills';

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

export const mockTransactions: Transaction[] = [
  {
    id: 't1',
    title: 'Swiggy Food Delivery',
    category: 'Food',
    amount: 486,
    date: 'Today',
    time: '1:15 PM',
    type: 'expense',
  },
  {
    id: 't2',
    title: 'Amazon Prime',
    category: 'Subscriptions',
    amount: 1499,
    date: 'Yesterday',
    type: 'expense',
  },
  {
    id: 't3',
    title: 'Uber Ride',
    category: 'Transport',
    amount: 342,
    date: 'Yesterday',
    type: 'expense',
  },
  {
    id: 't4',
    title: 'BigBasket Groceries',
    category: 'Shopping',
    amount: 2180,
    date: '2 days ago',
    type: 'expense',
  },
  {
    id: 't5',
    title: 'Jio Recharge',
    category: 'Bills',
    amount: 599,
    date: '3 days ago',
    type: 'expense',
  },
];

export const getCategoryIcon = (category: Category, color: string, size: number) => {
  switch (category) {
    case 'Food': return <Utensils color={color} size={size} />;
    case 'Subscriptions': return <MonitorPlay color={color} size={size} />;
    case 'Transport': return <Car color={color} size={size} />;
    case 'Shopping': return <ShoppingBag color={color} size={size} />;
    case 'Bills': return <Zap color={color} size={size} />;
    default: return <ShoppingBag color={color} size={size} />;
  }
};

export const getCategoryColor = (category: Category) => {
  switch (category) {
    case 'Food': return '#EF4444'; // Red
    case 'Subscriptions': return '#10B981'; // Teal/Green
    case 'Transport': return '#64748B'; // Slate
    case 'Shopping': return '#059669'; // Darker green
    case 'Bills': return '#F59E0B'; // Orange
    default: return '#3B82F6';
  }
};
