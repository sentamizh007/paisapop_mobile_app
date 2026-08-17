import React, { useMemo, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, Platform, StatusBar as RNStatusBar,
  TouchableOpacity, TextInput, Alert, SectionList,
  ActivityIndicator, Modal, ScrollView,
} from 'react-native';
import { useStore } from '../../store/useStore';
import { useThemeColors } from '../../theme/colors';
import { X, Search, Filter, Calendar, ChevronDown, ChevronLeft, ChevronRight, PieChart, ArrowDown, ArrowUp } from 'lucide-react-native';
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

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return { text: 'Good Morning', icon: '🌅' };
  if (hour < 17) return { text: 'Good Afternoon', icon: '☀️' };
  return { text: 'Good Evening', icon: '🌙' };
};

export const HistoryScreen = () => {
  const C = useThemeColors();
  const { transactions, removeTransaction, categoryMeta, isLoading, userName } = useStore();

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

  const { summarySpent, summaryIncome, netBalance } = useMemo(() => {
    let spent = 0, income = 0;
    transactions.forEach(tx => {
      const d = parseDate(tx.date);
      if (!isNaN(d.getTime()) && d.getFullYear() === activeMonth.getFullYear() && d.getMonth() === activeMonth.getMonth()) {
        if (tx.type === 'expense') spent += tx.amount;
        else if (tx.type === 'income') income += tx.amount;
      }
    });
    return { summarySpent: spent, summaryIncome: income, netBalance: income - spent };
  }, [transactions, activeMonth]);

  const confirmDelete = useCallback((id: string, name: string) => {
    Alert.alert('Delete Entry', `Remove "${name}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => removeTransaction(id) },
    ]);
  }, [removeTransaction]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: '#09090B' }]}>
      <RNStatusBar barStyle="light-content" backgroundColor="#09090B" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={{ color: '#A1A1AA', fontSize: 13, marginBottom: 4, fontWeight: '500' }}>
            {getGreeting().text} {getGreeting().icon}
          </Text>
          <Text style={{ color: '#FFF', fontSize: 22, fontWeight: '700' }}>
            {userName || 'User'} 👋
          </Text>
        </View>
      </View>

      {/* Analytics-Style Month Selector */}
      <View style={styles.dateSelectorWrap}>
        <TouchableOpacity style={styles.dateBtn} onPress={prevMonth}>
          <ChevronLeft size={20} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.dateLabel}>{monthLabel}</Text>
        <TouchableOpacity style={styles.dateBtn} onPress={nextMonth} disabled={activeMonth.getMonth() === now.getMonth() && activeMonth.getFullYear() === now.getFullYear()}>
          <ChevronRight size={20} color={activeMonth.getMonth() === now.getMonth() && activeMonth.getFullYear() === now.getFullYear() ? '#333' : '#FFF'} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchWrap}>
        <Search size={18} color="#888" style={{ marginLeft: 12 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search transactions"
          placeholderTextColor="#888"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Filter Pills */}
      <View style={styles.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
          <TouchableOpacity
            style={[styles.pill, typeFilter === 'All' && styles.pillActiveAll]}
            onPress={() => setTypeFilter('All')}
          >
            <Text style={[styles.pillText, typeFilter === 'All' && { color: '#22C55E' }]}>All</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.pill, typeFilter === 'expense' && styles.pillActive]}
            onPress={() => setTypeFilter('expense')}
          >
            <ArrowDown size={14} color="#EF4444" />
            <Text style={styles.pillText}>Expenses</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.pill, typeFilter === 'income' && styles.pillActive]}
            onPress={() => setTypeFilter('income')}
          >
            <ArrowUp size={14} color="#22C55E" />
            <Text style={styles.pillText}>Income</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Summary Card */}
      <View style={styles.summaryWrapper}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <View>
              <Text style={styles.summaryHeaderLabel}>Summary for</Text>
              <Text style={[styles.summaryDateText, { marginTop: 2, color: '#FFF' }]}>{monthLabel}</Text>
            </View>
          </View>
          <View style={styles.summaryRow}>
            <View style={styles.summaryCol}>
              <Text style={styles.summaryLabel}>Total Expenses</Text>
              <View style={styles.summaryValWrap}>
                <Text style={styles.summaryVal}>{sym}{summarySpent.toLocaleString('en-IN')}</Text>
                <ArrowDown size={12} color="#EF4444" />
              </View>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryCol}>
              <Text style={styles.summaryLabel}>Total Income</Text>
              <View style={styles.summaryValWrap}>
                <Text style={styles.summaryVal}>{sym}{summaryIncome.toLocaleString('en-IN')}</Text>
                <ArrowUp size={12} color="#22C55E" />
              </View>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryCol}>
              <Text style={styles.summaryLabel}>Net Balance</Text>
              <View style={styles.summaryValWrap}>
                <Text style={[styles.summaryVal, { color: '#22C55E' }]}>{sym}{Math.abs(netBalance).toLocaleString('en-IN')}</Text>
                <ArrowUp size={12} color="#22C55E" />
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Transaction List */}
      {isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color="#22C55E" />
        </View>
      ) : sections.length === 0 ? (
        <View style={styles.centerState}>
          <Text style={{ fontSize: 40, marginBottom: 12 }}>{search ? '🔍' : '🗂️'}</Text>
          <Text style={{ color: '#FFF', fontSize: 18, fontWeight: '700' }}>No transactions found</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={tx => tx.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 110 }}
          renderSectionHeader={({ section: { title } }) => (
            <Text style={styles.sectionTitle}>{title}</Text>
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
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#FFF' },

  dateSelectorWrap: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 16, marginBottom: 12 },
  dateBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#131315', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#27272A' },
  dateLabel: { color: '#FFF', fontSize: 16, fontWeight: '700', minWidth: 100, textAlign: 'center' },

  searchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#131315', marginHorizontal: 16, borderRadius: 12, paddingRight: 12, marginBottom: 16, borderWidth: 1, borderColor: '#27272A', height: 44 },
  searchInput: { flex: 1, height: '100%', color: '#FFF', fontSize: 15, paddingHorizontal: 10 },

  filterRow: { marginBottom: 16 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#131315', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#27272A' },
  pillActiveAll: { borderColor: '#22C55E' },
  pillActive: { borderColor: '#555' },
  pillText: { color: '#A0A0A0', fontSize: 13, fontWeight: '600' },

  summaryWrapper: { paddingHorizontal: 16, marginBottom: 16 },
  summaryCard: { backgroundColor: '#131315', borderRadius: 16, borderWidth: 1, borderColor: '#27272A', padding: 16 },
  summaryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  summaryHeaderLabel: { color: '#888', fontSize: 12, fontWeight: '500', marginBottom: 2 },
  summaryDateSel: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  summaryDateText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
  summaryBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: '#1A2E20', backgroundColor: '#0B1F11' },
  summaryBtnText: { color: '#22C55E', fontSize: 12, fontWeight: '600' },

  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryCol: { flex: 1 },
  summaryLabel: { color: '#888', fontSize: 12, marginBottom: 4 },
  summaryValWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  summaryVal: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  summaryDivider: { width: 1, height: 30, backgroundColor: '#27272A', marginHorizontal: 12 },

  sectionTitle: { color: '#888', fontSize: 13, fontWeight: '600', marginTop: 16, marginBottom: 8 },

  centerState: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#131315', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '60%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#FFF' },
  modalClose: { padding: 4, backgroundColor: '#27272A', borderRadius: 12 },
  modalItem: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#27272A' },
  modalItemActive: { backgroundColor: '#1A2E20' },
  modalItemText: { fontSize: 16, color: '#FFF', textAlign: 'center' },
  modalItemTextActive: { color: '#22C55E', fontWeight: '700' },
});
