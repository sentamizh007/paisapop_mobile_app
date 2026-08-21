import React, { useMemo, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, Platform, StatusBar as RNStatusBar,
  TouchableOpacity, TextInput, Alert, SectionList,
  ActivityIndicator, ScrollView, useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../../store/useStore';
import { useThemeColors } from '../../theme/colors';
import { X, Search, ChevronLeft, ChevronRight, ArrowDown, ArrowUp, ArrowRightLeft } from 'lucide-react-native';
import { MONTH_NAMES } from '../../utils/exportUtils';
import { TransactionCard } from '../../components/TransactionCard';
import { getCurrencySymbol } from '../../utils/mockData';

type TypeFilter = 'All' | 'expense' | 'income' | 'transfer';

const parseDate = (ds: string): Date => {
  if (!ds) return new Date(NaN);
  const n = ds.toLowerCase().trim();
  const now = new Date();
  if (n === 'today') return now;
  if (n === 'yesterday') { const d = new Date(now); d.setDate(now.getDate() - 1); return d; }
  const m = n.match(/^(\d+)\s+days?\s+ago$/);
  if (m) { const d = new Date(now); d.setDate(now.getDate() - parseInt(m[1], 10)); return d; }
  const parts = ds.split('-');
  if (parts.length === 3) {
    return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  }
  const p = new Date(ds);
  return isNaN(p.getTime()) ? new Date(NaN) : p;
};

const formatDisplayDate = (ds: string): string => {
  const d = parseDate(ds);
  if (isNaN(d.getTime())) return ds;
  const now = new Date();
  const dateStr = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  if (d.toDateString() === now.toDateString()) return `Today, ${dateStr}`;
  const yest = new Date(now); yest.setDate(now.getDate() - 1);
  if (d.toDateString() === yest.toDateString()) return `Yesterday, ${dateStr}`;
  return dateStr;
};

export const HistoryScreen = () => {
  const C = useThemeColors();
  const theme = useStore(s => s.theme);
  const { transactions, removeTransaction, categoryMeta, isLoading } = useStore();

  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, Platform.OS === 'android' ? 6 : 0);
  const { width: windowWidth } = useWindowDimensions();

  const [typeFilter, setTypeFilter] = useState<TypeFilter>('All');
  const [activeMonth, setActiveMonth] = useState(new Date());
  const [search, setSearch] = useState('');

  const currency = useStore(s => s.currency);
  const sym = getCurrencySymbol(currency);

  const monthLabel = `${MONTH_NAMES[activeMonth.getMonth()]} ${activeMonth.getFullYear()}`;
  const now = new Date();

  const prevMonth = () => setActiveMonth(p => new Date(p.getFullYear(), p.getMonth() - 1, 1));
  const nextMonth = () => setActiveMonth(p => new Date(p.getFullYear(), p.getMonth() + 1, 1));

  const filtered = useMemo(() => {
    let rows = transactions.filter(tx => {
      if (typeFilter !== 'All' && tx.type !== typeFilter) return false;
      const d = parseDate(tx.date);
      if (isNaN(d.getTime())) return false;
      return d.getFullYear() === activeMonth.getFullYear() && d.getMonth() === activeMonth.getMonth();
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
  }, [transactions, typeFilter, activeMonth, search]);

  const sections = useMemo(() => {
    const groups: Record<string, typeof filtered> = {};
    filtered.forEach(tx => {
      const label = formatDisplayDate(tx.date);
      if (!groups[label]) groups[label] = [];
      groups[label].push(tx);
    });
    return Object.entries(groups).map(([title, data]) => ({ title, data }));
  }, [filtered]);

  const { summarySpent, summaryIncome, summaryTransfer, netBalance } = useMemo(() => {
    let spent = 0, income = 0, transfer = 0;
    transactions.forEach(tx => {
      const d = parseDate(tx.date);
      if (!isNaN(d.getTime()) && d.getFullYear() === activeMonth.getFullYear() && d.getMonth() === activeMonth.getMonth()) {
        if (tx.type === 'expense') spent += tx.amount;
        else if (tx.type === 'income') income += tx.amount;
        else if (tx.type === 'transfer') transfer += tx.amount;
      }
    });
    return { summarySpent: spent, summaryIncome: income, summaryTransfer: transfer, netBalance: income - spent };
  }, [transactions, activeMonth]);

  const confirmDelete = useCallback((id: string, name: string) => {
    Alert.alert('Delete Entry', `Remove "${name}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => removeTransaction(id) },
    ]);
  }, [removeTransaction]);

  const renderHeader = () => (
    <View style={{ paddingBottom: 8 }}>
      {/* Analytics-Style Month Selector */}
      <View style={styles.dateSelectorWrap}>
        <TouchableOpacity
          style={[styles.dateBtn, { backgroundColor: C.surface, borderColor: C.border }]}
          onPress={prevMonth}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <ChevronLeft size={18} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.dateLabel, { color: C.textPrimary }]}>{monthLabel}</Text>
        <TouchableOpacity 
          style={[styles.dateBtn, { backgroundColor: C.surface, borderColor: C.border }]} 
          onPress={nextMonth} 
          disabled={activeMonth.getMonth() === now.getMonth() && activeMonth.getFullYear() === now.getFullYear()}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <ChevronRight
            size={18}
            color={activeMonth.getMonth() === now.getMonth() && activeMonth.getFullYear() === now.getFullYear() ? C.textMuted : C.textPrimary}
          />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchWrap, { backgroundColor: C.surface, borderColor: C.border }]}>
        <Search size={16} color={C.textSecondary} style={{ marginLeft: 12 }} />
        <TextInput
          style={[styles.searchInput, { color: C.textPrimary }]}
          placeholder="Search transactions, notes, payees..."
          placeholderTextColor={C.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} style={{ padding: 8 }}>
            <X size={16} color={C.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Pills */}
      <View style={styles.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 0 }}>
          <TouchableOpacity
            style={[
              styles.pill,
              { backgroundColor: C.surface, borderColor: typeFilter === 'All' ? '#22C55E' : C.border },
              typeFilter === 'All' && { backgroundColor: 'rgba(34,197,94,0.12)' }
            ]}
            onPress={() => setTypeFilter('All')}
            activeOpacity={0.7}
          >
            <Text style={[styles.pillText, { color: typeFilter === 'All' ? '#22C55E' : C.textSecondary, fontWeight: typeFilter === 'All' ? '700' : '600' }]}>
              All
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.pill,
              { backgroundColor: C.surface, borderColor: typeFilter === 'expense' ? '#EF4444' : C.border },
              typeFilter === 'expense' && { backgroundColor: 'rgba(239,68,68,0.12)' }
            ]}
            onPress={() => setTypeFilter('expense')}
            activeOpacity={0.7}
          >
            <ArrowDown size={13} color={typeFilter === 'expense' ? '#EF4444' : C.textSecondary} />
            <Text style={[styles.pillText, { color: typeFilter === 'expense' ? '#EF4444' : C.textSecondary, fontWeight: typeFilter === 'expense' ? '700' : '600' }]}>
              Expenses
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.pill,
              { backgroundColor: C.surface, borderColor: typeFilter === 'income' ? '#22C55E' : C.border },
              typeFilter === 'income' && { backgroundColor: 'rgba(34,197,94,0.12)' }
            ]}
            onPress={() => setTypeFilter('income')}
            activeOpacity={0.7}
          >
            <ArrowUp size={13} color={typeFilter === 'income' ? '#22C55E' : C.textSecondary} />
            <Text style={[styles.pillText, { color: typeFilter === 'income' ? '#22C55E' : C.textSecondary, fontWeight: typeFilter === 'income' ? '700' : '600' }]}>
              Income
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.pill,
              { backgroundColor: C.surface, borderColor: typeFilter === 'transfer' ? '#A855F7' : C.border },
              typeFilter === 'transfer' && { backgroundColor: 'rgba(168,85,247,0.12)' }
            ]}
            onPress={() => setTypeFilter('transfer')}
            activeOpacity={0.7}
          >
            <ArrowRightLeft size={13} color={typeFilter === 'transfer' ? '#A855F7' : C.textSecondary} />
            <Text style={[styles.pillText, { color: typeFilter === 'transfer' ? '#A855F7' : C.textSecondary, fontWeight: typeFilter === 'transfer' ? '700' : '600' }]}>
              Transfers
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Summary Card (2x2 Grid) */}
      <View style={[styles.summaryCard, { backgroundColor: C.surface, borderColor: C.border }]}>
        <View style={styles.summaryHeader}>
          <Text style={[styles.summaryHeaderLabel, { color: C.textSecondary }]}>Monthly Summary</Text>
          <Text style={[styles.summaryDateText, { color: C.textPrimary }]}>{monthLabel}</Text>
        </View>

        {/* Row 1: Expenses & Income */}
        <View style={styles.summaryGridRow}>
          {/* Expenses */}
          <View style={styles.summaryGridCol}>
            <View style={styles.summaryItemHeader}>
              <View style={[styles.summaryIconDot, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                <ArrowDown size={11} color="#EF4444" />
              </View>
              <Text style={[styles.summaryLabel, { color: C.textSecondary }]}>Expenses</Text>
            </View>
            <Text
              style={[styles.summaryVal, { color: C.textPrimary }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.5}
            >
              {sym}{summarySpent.toLocaleString('en-IN')}
            </Text>
          </View>

          <View style={[styles.summaryVertDivider, { backgroundColor: C.border }]} />

          {/* Income */}
          <View style={styles.summaryGridCol}>
            <View style={styles.summaryItemHeader}>
              <View style={[styles.summaryIconDot, { backgroundColor: 'rgba(34, 197, 94, 0.15)' }]}>
                <ArrowUp size={11} color="#22C55E" />
              </View>
              <Text style={[styles.summaryLabel, { color: C.textSecondary }]}>Income</Text>
            </View>
            <Text
              style={[styles.summaryVal, { color: C.textPrimary }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.5}
            >
              {sym}{summaryIncome.toLocaleString('en-IN')}
            </Text>
          </View>
        </View>

        <View style={[styles.summaryHorizDivider, { backgroundColor: C.border }]} />

        {/* Row 2: Transfers & Net Balance */}
        <View style={styles.summaryGridRow}>
          {/* Transfers */}
          <View style={styles.summaryGridCol}>
            <View style={styles.summaryItemHeader}>
              <View style={[styles.summaryIconDot, { backgroundColor: 'rgba(168, 85, 247, 0.15)' }]}>
                <ArrowRightLeft size={11} color="#A855F7" />
              </View>
              <Text style={[styles.summaryLabel, { color: C.textSecondary }]}>Transfer</Text>
            </View>
            <Text
              style={[styles.summaryVal, { color: C.textPrimary }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.5}
            >
              {sym}{summaryTransfer.toLocaleString('en-IN')}
            </Text>
          </View>

          <View style={[styles.summaryVertDivider, { backgroundColor: C.border }]} />

          {/* Net Balance */}
          <View style={styles.summaryGridCol}>
            <View style={styles.summaryItemHeader}>
              <View style={[styles.summaryIconDot, { backgroundColor: netBalance >= 0 ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)' }]}>
                {netBalance >= 0 ? <ArrowUp size={11} color="#22C55E" /> : <ArrowDown size={11} color="#EF4444" />}
              </View>
              <Text style={[styles.summaryLabel, { color: C.textSecondary }]}>Net Balance</Text>
            </View>
            <Text
              style={[
                styles.summaryVal,
                { color: netBalance >= 0 ? '#22C55E' : '#EF4444' }
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.5}
            >
              {netBalance < 0 ? '-' : ''}{sym}{Math.abs(netBalance).toLocaleString('en-IN')}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: C.background }]} edges={['top', 'bottom']}>
      <RNStatusBar barStyle={theme === 'light' ? 'dark-content' : 'light-content'} backgroundColor={C.background} />

      {/* Fixed Top Bar */}
      <View style={styles.header}>
        <View style={{ width: 36 }} />
        <Text style={[styles.headerTitle, { color: C.textPrimary }]}>History</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Scrollable Content Container */}
      {isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color="#22C55E" />
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={tx => tx.id}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: 60 + bottomPad + 30,
          }}
          renderSectionHeader={({ section: { title } }) => (
            <Text style={[styles.sectionTitle, { color: C.textSecondary }]}>{title}</Text>
          )}
          renderItem={({ item, index, section }) => (
            <TransactionCard
              tx={item}
              colors={C}
              currencySymbol={sym}
              confirmDelete={confirmDelete}
              formatDisplayDate={formatDisplayDate}
              categoryMeta={categoryMeta}
              isFirst={index === 0}
              isLast={index === section.data.length - 1}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={{ fontSize: 36, marginBottom: 8 }}>{search ? '🔍' : '🗂️'}</Text>
              <Text style={[styles.emptyTitle, { color: C.textPrimary }]}>
                {search ? 'No matching transactions' : 'No transactions found'}
              </Text>
              <Text style={[styles.emptySub, { color: C.textSecondary }]}>
                {search
                  ? `No results found for "${search}". Try searching with another keyword.`
                  : `No records found in ${monthLabel}.`}
              </Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10 },
  headerTitle: { fontSize: 18, fontWeight: '700' },

  dateSelectorWrap: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 14, marginBottom: 12 },
  dateBtn: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  dateLabel: { fontSize: 15, fontWeight: '700', minWidth: 120, textAlign: 'center' },

  searchWrap: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, paddingRight: 8, marginBottom: 12, borderWidth: 1, height: 42 },
  searchInput: { flex: 1, height: '100%', fontSize: 14, paddingHorizontal: 10 },

  filterRow: { marginBottom: 14 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 16, borderWidth: 1 },
  pillText: { fontSize: 12.5 },

  summaryCard: { borderRadius: 20, borderWidth: 1, padding: 16, marginBottom: 14 },
  summaryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  summaryHeaderLabel: { fontSize: 11.5, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  summaryDateText: { fontSize: 13, fontWeight: '600' },

  summaryGridRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  summaryGridCol: { flex: 1, minWidth: 0, paddingHorizontal: 4 },
  summaryItemHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  summaryIconDot: { width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  summaryLabel: { fontSize: 11.5, fontWeight: '500' },
  summaryVal: { fontSize: 15, fontWeight: '800', letterSpacing: -0.3 },
  summaryVertDivider: { width: 1, height: 36, marginHorizontal: 8 },
  summaryHorizDivider: { height: 1, width: '100%', marginVertical: 10 },

  sectionTitle: { fontSize: 12.5, fontWeight: '600', marginTop: 14, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.4 },

  centerState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyWrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 36, paddingHorizontal: 20 },
  emptyTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4, textAlign: 'center' },
  emptySub: { fontSize: 12.5, textAlign: 'center', lineHeight: 17 },
});

