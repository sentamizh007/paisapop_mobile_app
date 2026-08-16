import React, { useMemo, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, Platform, StatusBar as RNStatusBar,
  TouchableOpacity, TextInput, Alert, SectionList,
  ActivityIndicator,
} from 'react-native';
import { useStore } from '../../store/useStore';
import { useThemeColors } from '../../theme/colors';
import { X, Search, TrendingDown, AlertCircle } from 'lucide-react-native';
import { MONTH_NAMES } from '../../utils/exportUtils';
import { TransactionCard } from '../../components/TransactionCard';
import { getCurrencySymbol } from '../../utils/mockData';
type FilterType = 'Today' | 'This Week' | 'This Month' | 'All';
const FILTERS: FilterType[] = ['Today', 'This Week', 'This Month', 'All'];

// ── Date helpers ────────────────────────────────────────────────────────────
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
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

// ── Component ────────────────────────────────────────────────────────────────
export const HistoryScreen = () => {
  const C = useThemeColors();
  const {
    transactions, removeTransaction, clearAllTransactions,
    monthlyBudget,
    categoryBudgets, categoryMeta,
    isLoading, userName,
  } = useStore();

  const [filter, setFilter] = useState<FilterType>('Today');
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const currency = useStore(s => s.currency);
  const sym = getCurrencySymbol(currency);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: 'Good morning', icon: '☀️' };
    if (hour < 17) return { text: 'Good afternoon', icon: '🌤️' };
    if (hour < 21) return { text: 'Good evening', icon: '🌙' };
    return { text: 'Good night', icon: '🌌' };
  };
  const greeting = getGreeting();

  // ── Filtering ──────────────────────────────────────────────────────────────
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

  // ── Group by date ─────────────────────────────────────────────────────────
  const sections = useMemo(() => {
    const groups: Record<string, typeof filtered> = {};
    filtered.forEach(tx => {
      const label = formatDisplayDate(tx.date);
      if (!groups[label]) groups[label] = [];
      groups[label].push(tx);
    });
    return Object.entries(groups).map(([title, data]) => ({ title, data }));
  }, [filtered]);

const { monthSpent, monthIncome, monthTransfer, monthCategoryTotals } = useMemo(() => {
    const now = new Date();
    let spent = 0, income = 0, transfer = 0;
    const categorySpentMap: Record<string, number> = {};
    transactions.forEach(tx => {
      const d = parseDate(tx.date);
      if (!isNaN(d.getTime()) &&
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth()) {
        if (tx.type === 'expense') {
          spent += tx.amount;
          categorySpentMap[tx.category] = (categorySpentMap[tx.category] || 0) + tx.amount;
        } else if (tx.type === 'transfer') {
          transfer += tx.amount;
        } else {
          income += tx.amount;
        }
      }
    });
    return { monthSpent: spent, monthIncome: income, monthTransfer: transfer, monthCategoryTotals: categorySpentMap };
  }, [transactions]);

  const budgetProgress = monthlyBudget > 0 ? Math.min(monthSpent / monthlyBudget, 1) : 0;
  const overBudget = monthlyBudget > 0 && monthSpent > monthlyBudget;

  const overBudgetMap = useMemo(() => {
    const map: Record<string, boolean> = {};
    for (const cat of Object.keys(categoryBudgets)) {
      const budget = categoryBudgets[cat];
      const spent = monthCategoryTotals[cat] || 0;
      const limit = budget.period === 'weekly' ? budget.amount * 4 : budget.amount;
      map[cat] = limit > 0 && spent > limit;
    }
    return map;
  }, [categoryBudgets, monthCategoryTotals]);

  // ── Delete / Clear ────────────────────────────────────────────────────────
  const confirmDelete = useCallback((id: string, name: string) => {
    if (Platform.OS === 'web') {
      if (window.confirm(`Delete Entry\n\nRemove "${name}"? This cannot be undone.`)) {
        removeTransaction(id);
      }
      return;
    }
    Alert.alert(
      'Delete Entry',
      `Remove "${name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => removeTransaction(id) },
      ]
    );
  }, [removeTransaction]);

  // ── Section list item ─────────────────────────────────────────────────────
  const renderItem = ({ item: tx }: { item: typeof transactions[0] }) => (
    <TransactionCard
      tx={tx}
      colors={C}
      currencySymbol={sym}
      confirmDelete={confirmDelete}
      formatDisplayDate={formatDisplayDate}
      categoryMeta={categoryMeta}
      isOverBudget={overBudgetMap[tx.category]}
    />
  );

  const renderSectionHeader = ({ section: { title } }: any) => (
    <View style={[styles.sectionHeader, { backgroundColor: C.background }]}>
      <View style={[styles.sectionDivider, { backgroundColor: C.border }]} />
      <Text style={[styles.sectionLabel, { color: C.textSecondary }]}>{title}</Text>
      <View style={[styles.sectionDivider, { backgroundColor: C.border }]} />
    </View>
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: C.background }]}>
      <RNStatusBar barStyle="light-content" backgroundColor={C.background} />

      {/* ── Header ── */}
      <View style={styles.header}>
        {showSearch ? (
          <View style={[styles.searchBar, { backgroundColor: C.surface, borderColor: C.border }]}>
            <Search size={15} color={C.textSecondary} strokeWidth={2} />
            <TextInput
              style={[styles.searchInput, { color: C.textPrimary }]}
              placeholder="Search transactions…"
              placeholderTextColor={C.textMuted}
              value={search}
              onChangeText={setSearch}
              autoFocus
            />
            <TouchableOpacity onPress={() => { setSearch(''); setShowSearch(false); }}>
              <X size={15} color={C.textSecondary} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View>
              <Text style={{ fontSize: 13, color: C.textSecondary, fontWeight: '600', marginBottom: 2 }}>
                {greeting.text} {greeting.icon}
              </Text>
              <Text style={[styles.headerTitle, { color: C.textPrimary }]}>
                {userName || 'Guest'}
              </Text>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity
                style={[styles.iconBtn, { backgroundColor: C.surface }]}
                onPress={() => setShowSearch(true)}
              >
                <Search size={16} color={C.textPrimary} strokeWidth={2} />
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      {/* ── Month summary card ── */}
      <View style={[styles.summaryCard, { backgroundColor: C.surface }]}>
        <View style={styles.summaryRow}>
          {/* Expenses */}
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: C.textSecondary }]}>
              {MONTH_NAMES[new Date().getMonth()]} Expenses
            </Text>
            <Text style={[styles.summaryAmount, { color: '#FFFFFF' }]}>
              {sym}{monthSpent.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>
          {/* Divider */}
          <View style={[styles.summaryDivider, { backgroundColor: C.border }]} />
          {/* Transfer */}
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: C.textSecondary }]}>Transfer</Text>
            <Text style={[styles.summaryAmount, { color: '#14B8A6' }]}>
              {sym}{monthTransfer.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>
          {/* Divider */}
          <View style={[styles.summaryDivider, { backgroundColor: C.border }]} />
          {/* Income */}
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: C.textSecondary }]}>Income</Text>
            <Text style={[styles.summaryAmount, { color: C.income }]}>
              {sym}{monthIncome.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>
        </View>

        {/* Budget progress */}
        {monthlyBudget > 0 && (
          <View style={styles.budgetSection}>
            <View style={styles.budgetHeaderRow}>
              <View style={styles.budgetLabelRow}>
                <TrendingDown size={12} color={overBudget ? C.expense : C.textSecondary} strokeWidth={2} />
                <Text style={[styles.budgetLabel, { color: overBudget ? C.expense : C.textSecondary }]}>
                  Budget: {sym}{monthlyBudget.toLocaleString('en-IN')}
                </Text>
              </View>
              <Text style={[styles.budgetPct, { color: overBudget ? C.expense : C.textSecondary }]}>
                {Math.round(budgetProgress * 100)}%
              </Text>
            </View>
            <View style={[styles.progressTrack, { backgroundColor: C.surfaceMid }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: overBudget ? C.expense : C.primary,
                    width: `${budgetProgress * 100}%`,
                  },
                ]}
              />
            </View>
            {overBudget && (
              <View style={styles.overBudgetRow}>
                <AlertCircle size={11} color={C.expense} />
                <Text style={[styles.overBudgetText, { color: C.expense }]}>
                  Over budget by {sym}
                  {(monthSpent - monthlyBudget).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </Text>
              </View>
            )}
          </View>
        )}
        {monthlyBudget <= 0 && (
          <View style={styles.setBudgetBtn}>
            <Text style={[styles.setBudgetText, { color: C.textSecondary }]}>No monthly budget set (Set in Profile)</Text>
          </View>
        )}
      </View>

      {/* ── Filter pills ── */}
      <View style={styles.filters}>
        {FILTERS.map(f => {
          const active = f === filter;
          return (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f)}
              style={[
                styles.filterPill,
                { backgroundColor: active ? '#FFFFFF' : C.surface },
              ]}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterText, { color: active ? '#000000' : C.textSecondary }]}>
                {f}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Transaction list ── */}
      {isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      ) : sections.length === 0 ? (
        <View style={styles.centerState}>
          <Text style={styles.emptyEmoji}>{search ? '🔍' : '🗂️'}</Text>
          <Text style={[styles.emptyTitle, { color: C.textPrimary }]}>
            {search ? 'No results' : 'Nothing here yet'}
          </Text>
          <Text style={[styles.emptyHint, { color: C.textSecondary }]}>
            {search
              ? `No matches for "${search}"`
              : 'Tap Add to record your first transaction'}
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={tx => tx.id}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          contentContainerStyle={[styles.listContent, { paddingBottom: 110 }]}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0 },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 8,
  },
  headerTitle: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  headerRight: { flexDirection: 'row', gap: 8 },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 42,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 14, fontWeight: '500' },

  // Summary card
  summaryCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 20,
    padding: 18,
  },
  summaryRow: { flexDirection: 'row', alignItems: 'center' },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryDivider: { width: 1, height: 36, marginHorizontal: 16 },
  summaryLabel: { fontSize: 11, fontWeight: '600', marginBottom: 4, letterSpacing: 0.3 },
  summaryAmount: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },

  // Budget
  budgetSection: { marginTop: 16 },
  budgetHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  budgetLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  budgetLabel: { fontSize: 12, fontWeight: '600' },
  budgetPct: { fontSize: 12, fontWeight: '700' },
  progressTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  overBudgetRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 },
  overBudgetText: { fontSize: 12, fontWeight: '600' },
  setBudgetBtn: { marginTop: 12, alignSelf: 'flex-start' },
  setBudgetText: { fontSize: 13, fontWeight: '700' },

  // Filters
  filters: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 10,
  },
  filterPill: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
  },
  filterText: { fontSize: 12, fontWeight: '700' },

  // Section headers
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 10,
  },
  sectionDivider: { flex: 1, height: StyleSheet.hairlineWidth },
  sectionLabel: { fontSize: 12, fontWeight: '600', letterSpacing: 0.4 },

  // List
  listContent: { paddingHorizontal: 16 },

  // Empty / loading
  centerState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 80 },
  emptyEmoji: { fontSize: 48, marginBottom: 14 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginBottom: 6 },
  emptyHint: { fontSize: 14, textAlign: 'center', paddingHorizontal: 36, lineHeight: 20 },
});
