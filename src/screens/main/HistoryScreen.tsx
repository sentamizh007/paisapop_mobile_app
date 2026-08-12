import React, { useMemo, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, Platform, StatusBar as RNStatusBar,
  ScrollView, TouchableOpacity, Modal, Switch, TextInput, Alert, SectionList,
  KeyboardAvoidingView, ActivityIndicator, Animated
} from 'react-native';
import { useStore } from '../../store/useStore';
import { useThemeColors } from '../../theme/colors';
import {
  Settings, Moon, Sun, X, Trash2, Search, FileText,
  Download, ChevronRight, TrendingUp, AlertCircle
} from 'lucide-react-native';
import { exportAndShare, MONTH_NAMES } from '../../utils/exportUtils';
import { TransactionCard } from '../../components/TransactionCard';
import { SettingsModal } from '../../components/SettingsModal';

type FilterType = 'Today' | 'This Week' | 'This Month' | 'All';
const FILTERS: FilterType[] = ['Today', 'This Week', 'This Month', 'All'];

const CURRENCIES = [
  { label: 'Indian Rupee (₹)', value: 'INR', symbol: '₹' },
  { label: 'US Dollar ($)', value: 'USD', symbol: '$' },
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

const formatDisplayDate = (ds: string): string => {
  const d = parseDate(ds);
  if (isNaN(d.getTime())) return ds;
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return 'Today';
  const yest = new Date(now); yest.setDate(now.getDate() - 1);
  if (d.toDateString() === yest.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const HistoryScreen = () => {
  const colors = useThemeColors();
  const {
    transactions, removeTransaction, clearAllTransactions,
    currency, setCurrency, theme, setTheme,
    monthlyBudget, setMonthlyBudget,
    categories, addCategory,
    isLoading,
  } = useStore();

  const [filter, setFilter] = useState<FilterType>('This Month');
  const [search, setSearch] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const currencySymbol = currency === 'USD' ? '$' : '₹';

  // ── Filtered & searched transactions ──────────────────────────────────────
  const filtered = useMemo(() => {
    const now = new Date();
    let rows = transactions.filter(tx => {
      const d = parseDate(tx.date);
      if (isNaN(d.getTime())) return filter === 'All';
      switch (filter) {
        case 'Today': return d.toDateString() === now.toDateString();
        case 'This Week': { const w = new Date(now); w.setDate(now.getDate() - 7); return d >= w && d <= now; }
        case 'This Month': return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
        case 'All': return true;
      }
    });

    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(tx =>
        tx.category.toLowerCase().includes(q) ||
        tx.title.toLowerCase().includes(q) ||
        (tx.notes ?? '').toLowerCase().includes(q)
      );
    }

    return rows.sort((a, b) => parseDate(b.date).getTime() - parseDate(a.date).getTime());
  }, [transactions, filter, search]);

  const groupedTransactions = useMemo(() => {
    const groups: Record<string, typeof filtered> = {};
    filtered.forEach(tx => {
      const d = formatDisplayDate(tx.date);
      if (!groups[d]) groups[d] = [];
      groups[d].push(tx);
    });
    return Object.entries(groups).map(([title, data]) => ({ title, data }));
  }, [filtered]);

  // ── Monthly Budget Calculations ──────────────────────────────────────────
  // Calculate total spent strictly in the current month regardless of filter
  const currentMonthSpent = useMemo(() => {
    const now = new Date();
    return transactions.reduce((acc, tx) => {
      const d = parseDate(tx.date);
      if (
        !isNaN(d.getTime()) &&
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        tx.type === 'expense'
      ) {
        return acc + tx.amount;
      }
      return acc;
    }, 0);
  }, [transactions]);

  const budgetProgress = monthlyBudget > 0 ? Math.min(currentMonthSpent / monthlyBudget, 1) : 0;
  const isOverBudget = monthlyBudget > 0 && currentMonthSpent > monthlyBudget;

  // ── Delete transaction ────────────────────────────────────────────────────
  const confirmDelete = useCallback((id: string, name: string) => {
    Alert.alert(
      'Delete Entry',
      `Remove "${name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => removeTransaction(id) },
      ]
    );
  }, [removeTransaction]);

  // ── Clear all data ────────────────────────────────────────────────────────
  const confirmClearAll = () => {
    setShowSettings(false); // Fix Android modal issue
    setTimeout(() => {
      Alert.alert(
        'Clear All Data',
        'This will permanently delete ALL your expense records. This action cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Clear Everything', style: 'destructive',
            onPress: () => { clearAllTransactions(); }
          },
        ]
      );
    }, 400);
  };

  // ── Export ────────────────────────────────────────────────────────────────
  // Handled inside SettingsModal

  // ── Render transaction item ───────────────────────────────────────────────
  const renderItem = ({ item: tx }: { item: typeof transactions[0] }) => {
    return (
      <TransactionCard
        tx={tx}
        colors={colors}
        currencySymbol={currencySymbol}
        confirmDelete={confirmDelete}
        formatDisplayDate={formatDisplayDate}
      />
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        {showSearch ? (
          <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Search size={16} color={colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: colors.textPrimary }]}
              placeholder="Search expenses..."
              placeholderTextColor={colors.textSecondary}
              value={search}
              onChangeText={setSearch}
              autoFocus
            />
            <TouchableOpacity onPress={() => { setSearch(''); setShowSearch(false); }}>
              <X size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>History</Text>
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={[styles.iconBtn, { backgroundColor: colors.surface }]}
                onPress={() => setShowSearch(true)}
              >
                <Search size={17} color={colors.textPrimary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.iconBtn, { backgroundColor: colors.surface }]}
                onPress={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              >
                {theme === 'dark' ? <Sun size={17} color={colors.textPrimary} /> : <Moon size={17} color={colors.textPrimary} />}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.iconBtn, { backgroundColor: colors.surface }]}
                onPress={() => setShowSettings(true)}
              >
                <Settings size={17} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      {/* Monthly Budget Card */}
      <View style={[styles.budgetCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.budgetHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <TrendingUp size={16} color={colors.textSecondary} />
            <Text style={[styles.budgetTitle, { color: colors.textSecondary }]}>
              {MONTH_NAMES[new Date().getMonth()]} Budget
            </Text>
          </View>
          {monthlyBudget <= 0 ? (
            <TouchableOpacity onPress={() => setShowSettings(true)}>
              <Text style={[styles.setBudgetLink, { color: colors.primary }]}>Set Budget</Text>
            </TouchableOpacity>
          ) : (
            <Text style={[styles.budgetTitle, { color: colors.textSecondary }]}>
              {currencySymbol}{monthlyBudget.toLocaleString('en-US')}
            </Text>
          )}
        </View>

        <View style={styles.budgetAmountRow}>
          <Text style={[styles.budgetSpent, { color: isOverBudget ? '#EF4444' : colors.textPrimary }]}>
            {currencySymbol}{currentMonthSpent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
          <Text style={[styles.budgetSub, { color: colors.textSecondary }]}>spent</Text>
        </View>

        {monthlyBudget > 0 && (
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                {
                  backgroundColor: isOverBudget ? '#EF4444' : colors.primary,
                  width: `${budgetProgress * 100}%`
                }
              ]}
            />
          </View>
        )}

        {isOverBudget && (
          <View style={styles.overBudgetAlert}>
            <AlertCircle size={12} color="#EF4444" />
            <Text style={styles.overBudgetText}>You've exceeded your monthly budget!</Text>
          </View>
        )}
      </View>

      {/* Filter pills */}
      <View style={{ paddingVertical: 12 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {FILTERS.map(f => (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f)}
              style={[
                styles.filterPill,
                { backgroundColor: f === filter ? colors.primary + '15' : colors.surface },
                f === filter && { borderColor: colors.primary, borderWidth: 1 }
              ]}
            >
              <Text style={[styles.filterText, { color: f === filter ? colors.primary : colors.textSecondary }]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* List */}
      {isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : groupedTransactions.length === 0 ? (
        <View style={styles.centerState}>
          <Text style={styles.emptyEmoji}>{search ? '🔍' : '🗂️'}</Text>
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
            {search ? 'No results found' : 'No expenses yet'}
          </Text>
          <Text style={[styles.emptyHint, { color: colors.textSecondary }]}>
            {search ? `No matches for "${search}"` : 'Tap the + tab to add your first expense'}
          </Text>
        </View>
      ) : (
        <SectionList
          sections={groupedTransactions}
          keyExtractor={tx => tx.id}
          renderItem={renderItem}
          renderSectionHeader={({ section: { title } }) => (
            <View style={[styles.sectionHeader, { backgroundColor: colors.background }]}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{title}</Text>
            </View>
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={true}
          keyboardShouldPersistTaps="handled"
        />
      )}

      {/* ── Settings Bottom Sheet ──────────────────────────────────────────── */}
      <SettingsModal
        visible={showSettings}
        onClose={() => setShowSettings(false)}
        colors={colors}
        theme={theme}
        setTheme={setTheme}
        currency={currency}
        setCurrency={setCurrency}
        currencySymbol={currencySymbol}
        monthlyBudget={monthlyBudget}
        setMonthlyBudget={setMonthlyBudget}
        categories={categories}
        addCategory={addCategory}
        confirmClearAll={confirmClearAll}
        transactions={transactions}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0 },

  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4 },
  headerTitle: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  headerActions: { flexDirection: 'row', gap: 8 },
  iconBtn: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 20, paddingHorizontal: 16, height: 44, borderWidth: 1 },
  searchInput: { flex: 1, fontSize: 15 },

  // Budget card
  budgetCard: {
    marginHorizontal: 20, marginTop: 12, borderRadius: 24, padding: 22,
    borderWidth: 1, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.05, shadowRadius: 16, elevation: 3,
  },
  budgetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  budgetTitle: { fontSize: 14, fontWeight: '600' },
  setBudgetLink: { fontSize: 14, fontWeight: '700' },
  budgetAmountRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: 16 },
  budgetSpent: { fontSize: 36, fontWeight: '800', letterSpacing: -1 },
  budgetSub: { fontSize: 15, fontWeight: '600', opacity: 0.8 },
  progressBarBg: { height: 8, backgroundColor: '#E2E8F0', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 4 },
  overBudgetAlert: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  overBudgetText: { color: '#EF4444', fontSize: 12, fontWeight: '600' },

  // Filters
  filterScroll: { paddingHorizontal: 20, gap: 10 },
  filterPill: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 24, borderWidth: 1, borderColor: 'transparent' },
  filterText: { fontSize: 14, fontWeight: '700' },

  // List & Sections
  listContent: { paddingHorizontal: 20, paddingBottom: 40 },
  sectionHeader: { paddingVertical: 12, marginTop: 8 },
  sectionTitle: { fontSize: 14, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },

  centerState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 80, paddingTop: 40 },
  emptyEmoji: { fontSize: 52, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginBottom: 6 },
  emptyHint: { fontSize: 15, textAlign: 'center', paddingHorizontal: 32 },




});
