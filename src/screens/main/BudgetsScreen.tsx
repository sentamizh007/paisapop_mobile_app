import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, Platform,
  StatusBar as RNStatusBar, ScrollView, TouchableOpacity,
  Modal, TextInput,
} from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { useStore } from '../../store/useStore';
import { getCategoryColor, getCategoryIcon, getCurrencySymbol } from '../../utils/mockData';
import { ChevronLeft, ChevronRight, ChevronDown, BarChart3, PlusCircle, X } from 'lucide-react-native';
import { MONTH_NAMES } from '../../utils/exportUtils';

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const parseDate = (ds: string) => {
  if (!ds) return new Date(NaN);
  const n = ds.toLowerCase().trim();
  const now = new Date();
  if (n === 'today') return now;
  if (n === 'yesterday') { const d = new Date(now); d.setDate(now.getDate() - 1); return d; }
  const parts = ds.split('-');
  if (parts.length === 3) return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  const p = new Date(ds);
  return isNaN(p.getTime()) ? new Date(NaN) : p;
};

// ── Ring Chart ───────────────────────────────────────────────────────────────
const BudgetRingChart = ({ spent, total, colorsList }: { spent: number, total: number, colorsList: string[] }) => {
  const size = 120;
  const stroke = 12;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const circ = 2 * Math.PI * r;
  
  const pct = total > 0 ? Math.min(Math.round((spent / total) * 100), 100) : 0;
  
  // Distribute the spent percentage across the provided colors
  const segmentLength = (pct / 100) * circ;
  const numColors = colorsList.length || 1;
  const lenPerColor = segmentLength / numColors;

  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={size} height={size}>
        <G rotation="-90" origin={`${cx}, ${cx}`}>
          {/* Background track */}
          <Circle cx={cx} cy={cx} r={r} stroke="#27272A" strokeWidth={stroke} fill="none" />
          
          {/* Colored segments */}
          {total > 0 && colorsList.map((col, i) => {
            const rot = (i * lenPerColor / circ) * 360;
            return (
              <Circle
                key={i} cx={cx} cy={cx} r={r}
                stroke={col} strokeWidth={stroke} fill="none"
                strokeDasharray={`${lenPerColor} ${circ}`}
                strokeLinecap={i === colorsList.length - 1 ? 'round' : 'butt'}
                transform={`rotate(${rot} ${cx} ${cx})`}
              />
            );
          })}
        </G>
      </Svg>
      <View style={{ position: 'absolute', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#FFF', fontSize: 24, fontWeight: '800' }}>{pct}%</Text>
        <Text style={{ color: '#888', fontSize: 10, textAlign: 'center', width: 60 }}>of total budget used</Text>
      </View>
    </View>
  );
};

// ── Main ─────────────────────────────────────────────────────────────────────
export const BudgetsScreen = () => {
  const transactions = useStore(s => s.transactions);
  const currency = useStore(s => s.currency);
  const categoryMeta = useStore(s => s.categoryMeta);
  const categories = useStore(s => s.categories);
  const monthlyBudget = useStore(s => s.monthlyBudget);
  const categoryBudgets = useStore(s => s.categoryBudgets);
  const setCategoryBudget = useStore(s => s.setCategoryBudget);
  const setMonthlyBudget = useStore(s => s.setMonthlyBudget);
  const sym = getCurrencySymbol(currency);

  const [activeMonth, setActiveMonth] = useState(new Date());
  const monthLabel = `${MONTH_SHORT[activeMonth.getMonth()]} ${activeMonth.getFullYear()}`;

  const prevMonth = () => setActiveMonth(p => new Date(p.getFullYear(), p.getMonth() - 1, 1));
  const nextMonth = () => setActiveMonth(p => new Date(p.getFullYear(), p.getMonth() + 1, 1));
  const now = new Date();
  const isFutureMonth = activeMonth.getFullYear() > now.getFullYear() || (activeMonth.getFullYear() === now.getFullYear() && activeMonth.getMonth() >= now.getMonth());

  const monthExpenses = useMemo(() =>
    transactions.filter(tx => {
      if (tx.type !== 'expense') return false;
      const d = parseDate(tx.date);
      return !isNaN(d.getTime()) && d.getFullYear() === activeMonth.getFullYear() && d.getMonth() === activeMonth.getMonth();
    }),
    [transactions, activeMonth]
  );

  const totalSpent = useMemo(() => monthExpenses.reduce((s, tx) => s + tx.amount, 0), [monthExpenses]);
  const budgetRemaining = Math.max(0, monthlyBudget - totalSpent);

  const categoryTotals = useMemo(() => {
    const map: Record<string, number> = {};
    monthExpenses.forEach(tx => { map[tx.category] = (map[tx.category] ?? 0) + tx.amount; });
    return map;
  }, [monthExpenses]);

  const activeBudgets = useMemo(() => {
    const keys = Object.keys(categoryBudgets);
    return keys.map(cat => {
      const budget = categoryBudgets[cat];
      const spent = categoryTotals[cat] || 0;
      const limit = budget.period === 'weekly' ? budget.amount * 4 : budget.amount;
      const pct = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
      const isExceeded = limit > 0 && spent > limit;
      return { category: cat, limit, spent, pct, isExceeded, period: budget.period };
    }).sort((a, b) => b.pct - a.pct);
  }, [categoryBudgets, categoryTotals]);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBudgetCat, setNewBudgetCat] = useState('');
  const [newBudgetAmt, setNewBudgetAmt] = useState('');

  const handleSaveBudget = () => {
    const v = parseFloat(newBudgetAmt);
    if (!isNaN(v) && v > 0 && newBudgetCat) {
      if (newBudgetCat === 'GLOBAL_MONTHLY') {
        setMonthlyBudget(v);
      } else {
        setCategoryBudget(newBudgetCat, { amount: v, period: 'monthly' });
      }
      setShowAddModal(false);
      setNewBudgetCat('');
      setNewBudgetAmt('');
    }
  };

  const ringColors = activeBudgets.slice(0, 3).map(b => categoryMeta[b.category]?.color ?? getCategoryColor(b.category as any));
  if (ringColors.length === 0) ringColors.push('#22C55E'); // fallback green

  return (
    <SafeAreaView style={styles.safe}>
      <RNStatusBar barStyle="light-content" backgroundColor="#09090B" />

      <View style={styles.header}>
        <View style={{ width: 36 }} />
        <Text style={styles.headerTitle}>Budgets</Text>
        <View style={[styles.headerIcon, { opacity: 0 }]} />
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

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        {/* ── Total Budget Card ── */}
        <View style={styles.totalCard}>
          <View style={styles.totalCardInner}>
            <BudgetRingChart spent={totalSpent} total={monthlyBudget} colorsList={ringColors} />
            <View style={styles.totalInfo}>
              <Text style={styles.totalLabel}>Total Monthly Budget</Text>
              <Text style={styles.totalAmount}>{sym}{monthlyBudget.toLocaleString('en-IN')}</Text>
              
              <View style={styles.totalSplitRow}>
                <View>
                  <Text style={styles.splitLabel}>Spent</Text>
                  <Text style={styles.splitSpent}>{sym}{totalSpent.toLocaleString('en-IN')}</Text>
                </View>
                <View>
                  <Text style={styles.splitLabel}>Remaining</Text>
                  <Text style={styles.splitRem}>{sym}{budgetRemaining.toLocaleString('en-IN')}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>


        {/* ── Your Budgets List ── */}
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Your Budgets</Text>
          <Text style={styles.listCount}>{activeBudgets.length} Categories</Text>
        </View>

        {activeBudgets.map((item, idx) => {
          const meta = categoryMeta[item.category];
          const col = meta?.color ?? getCategoryColor(item.category as any);
          const isWarning = item.pct >= 80 && item.pct < 100;
          let statusText = "On Track";
          let statusColor = "#22C55E";
          if (item.isExceeded) { statusText = "Over Budget"; statusColor = "#EF4444"; }
          else if (isWarning) { statusText = "Getting Close"; statusColor = "#F59E0B"; }

          return (
            <View key={item.category} style={styles.budgetRow}>
              <View style={styles.budgetIconWrap}>
                <View style={[styles.budgetIcon, { backgroundColor: col + '20' }]}>
                  {meta?.emoji ? (
                     <Text style={{ fontSize: 20 }}>{meta.emoji}</Text>
                  ) : (
                     getCategoryIcon(item.category as any, col, 20)
                  )}
                </View>
              </View>
              
              <View style={styles.budgetBody}>
                <View style={styles.budgetBodyTop}>
                  <View>
                    <Text style={styles.budgetCatName}>{item.category}</Text>
                    <Text style={styles.budgetCatLimit}>{sym}{item.limit.toLocaleString('en-IN')} budget</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.budgetPct}>{Math.round(item.pct)}%</Text>
                    <Text style={[styles.budgetStatus, { color: statusColor }]}>{statusText}</Text>
                  </View>
                  <ChevronRight size={16} color="#444" style={{ marginLeft: 8 }} />
                </View>

                <View style={styles.track}>
                  <View style={[styles.fill, { width: `${item.pct}%`, backgroundColor: col }]} />
                </View>
                <Text style={styles.budgetSpent}>{sym}{item.spent.toLocaleString('en-IN')} spent</Text>
              </View>
            </View>
          );
        })}

        {activeBudgets.length === 0 && (
          <View style={{ alignItems: 'center', marginTop: 40 }}>
            <Text style={{ color: '#888', fontSize: 14 }}>No category budgets set yet.</Text>
          </View>
        )}

      </ScrollView>

      {/* ── Add Modal ── */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Set Budget</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)} style={styles.modalClose}><X size={20} color="#FFF" /></TouchableOpacity>
            </View>
            
            <Text style={styles.modalLabel}>Select Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 50, marginBottom: 20 }}>
              <TouchableOpacity 
                style={[styles.catPill, newBudgetCat === 'GLOBAL_MONTHLY' && styles.catPillActive]} 
                onPress={() => setNewBudgetCat('GLOBAL_MONTHLY')}
              >
                <Text style={[styles.catPillText, newBudgetCat === 'GLOBAL_MONTHLY' && styles.catPillTextActive]}>Global Monthly</Text>
              </TouchableOpacity>
              {categories.map(c => (
                <TouchableOpacity 
                  key={c} style={[styles.catPill, newBudgetCat === c && styles.catPillActive]} 
                  onPress={() => setNewBudgetCat(c)}
                >
                  <Text style={[styles.catPillText, newBudgetCat === c && styles.catPillTextActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.modalLabel}>Budget Amount ({sym})</Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="numeric"
              value={newBudgetAmt}
              onChangeText={setNewBudgetAmt}
              placeholder="e.g. 5000"
              placeholderTextColor="#888"
            />

            <TouchableOpacity style={styles.modalBtn} onPress={handleSaveBudget}>
              <Text style={styles.modalBtnText}>Save Budget</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#09090B', paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#FFF' },
  headerIcon: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center', borderRadius: 10, backgroundColor: '#131315', borderWidth: 1, borderColor: '#27272A' },
  
  dateSelectorWrap: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 16, marginBottom: 16 },
  dateBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#131315', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#27272A' },
  dateLabel: { color: '#FFF', fontSize: 16, fontWeight: '700', minWidth: 100, textAlign: 'center' },

  scroll: { paddingHorizontal: 16, paddingBottom: 110 },

  totalCard: { backgroundColor: '#131315', borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#27272A' },
  totalCardInner: { flexDirection: 'row', alignItems: 'center' },
  totalInfo: { flex: 1, marginLeft: 20 },
  totalLabel: { color: '#888', fontSize: 12, marginBottom: 4 },
  totalAmount: { color: '#FFF', fontSize: 28, fontWeight: '800', marginBottom: 16 },
  totalSplitRow: { flexDirection: 'row', gap: 24 },
  splitLabel: { color: '#888', fontSize: 11, marginBottom: 4 },
  splitSpent: { color: '#22C55E', fontSize: 15, fontWeight: '700' },
  splitRem: { color: '#888', fontSize: 15, fontWeight: '700' },

  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 16, borderWidth: 1, borderColor: '#1A2E20', marginBottom: 24 },
  addBtnText: { color: '#22C55E', fontSize: 15, fontWeight: '600' },

  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingHorizontal: 4 },
  listTitle: { color: '#FFF', fontSize: 15, fontWeight: '600' },
  listCount: { color: '#888', fontSize: 12 },

  budgetRow: { flexDirection: 'row', backgroundColor: '#131315', borderRadius: 20, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#27272A' },
  budgetIconWrap: { marginRight: 16 },
  budgetIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  budgetBody: { flex: 1 },
  budgetBodyTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  budgetCatName: { color: '#FFF', fontSize: 16, fontWeight: '600', marginBottom: 4 },
  budgetCatLimit: { color: '#888', fontSize: 12 },
  budgetPct: { color: '#FFF', fontSize: 15, fontWeight: '700', textAlign: 'right', marginBottom: 2 },
  budgetStatus: { fontSize: 10, fontWeight: '600', textAlign: 'right' },
  track: { height: 6, backgroundColor: '#27272A', borderRadius: 3, marginBottom: 6, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3 },
  budgetSpent: { color: '#888', fontSize: 11 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#131315', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#FFF' },
  modalClose: { padding: 4, backgroundColor: '#27272A', borderRadius: 12 },
  modalLabel: { color: '#888', fontSize: 13, fontWeight: '600', marginBottom: 8 },
  catPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#27272A', marginRight: 8, height: 36 },
  catPillActive: { backgroundColor: '#22C55E' },
  catPillText: { color: '#888', fontSize: 14, fontWeight: '500' },
  catPillTextActive: { color: '#000', fontWeight: '700' },
  modalInput: { height: 50, backgroundColor: '#09090B', borderRadius: 12, borderWidth: 1, borderColor: '#27272A', color: '#FFF', paddingHorizontal: 16, fontSize: 16, marginBottom: 24 },
  modalBtn: { backgroundColor: '#22C55E', height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  modalBtnText: { color: '#000', fontSize: 16, fontWeight: '700' },
});
