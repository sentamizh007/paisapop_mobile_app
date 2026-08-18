import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, Platform,
  StatusBar as RNStatusBar, ScrollView, TouchableOpacity,
  Modal, TextInput, Alert, KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, G } from 'react-native-svg';
import { useStore } from '../../store/useStore';
import { useThemeColors } from '../../theme/colors';
import { getCategoryColor, getCategoryIcon, getCurrencySymbol } from '../../utils/mockData';
import { ChevronLeft, ChevronRight, ChevronDown, BarChart3, PlusCircle, X, Trash2 } from 'lucide-react-native';
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
const BudgetRingChart = ({ spent, total, colorsList, trackColor, textColor, textSecColor }: { spent: number, total: number, colorsList: string[], trackColor: string, textColor: string, textSecColor: string }) => {
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
          <Circle cx={cx} cy={cx} r={r} stroke={trackColor} strokeWidth={stroke} fill="none" />
          
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
        <Text style={{ color: textColor, fontSize: 24, fontWeight: '800' }}>{pct}%</Text>
        <Text style={{ color: textSecColor, fontSize: 10, textAlign: 'center', width: 60 }}>of total budget used</Text>
      </View>
    </View>
  );
};

// ── Main ─────────────────────────────────────────────────────────────────────
export const BudgetsScreen = () => {
  const C = useThemeColors();
  const theme = useStore(s => s.theme);
  const transactions = useStore(s => s.transactions);
  const currency = useStore(s => s.currency);
  const categoryMeta = useStore(s => s.categoryMeta);
  const categories = useStore(s => s.categories);
  const monthlyBudget = useStore(s => s.monthlyBudget);
  const categoryBudgets = useStore(s => s.categoryBudgets);
  const setCategoryBudget = useStore(s => s.setCategoryBudget);
  const removeCategoryBudget = useStore(s => s.removeCategoryBudget);
  const setMonthlyBudget = useStore(s => s.setMonthlyBudget);
  const sym = getCurrencySymbol(currency);

  const [activeMonth, setActiveMonth] = useState(new Date());
  const monthLabel = `${MONTH_SHORT[activeMonth.getMonth()]} ${activeMonth.getFullYear()}`;
  const now = new Date();

  const prevMonth = () => setActiveMonth(p => new Date(p.getFullYear(), p.getMonth() - 1, 1));
  const nextMonth = () => setActiveMonth(p => new Date(p.getFullYear(), p.getMonth() + 1, 1));

  const isNextDisabled = activeMonth.getMonth() === now.getMonth() && activeMonth.getFullYear() === now.getFullYear();

  // Filter expenses for selected month
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
      const limit = budget.amount;
      const pct = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
      const isExceeded = limit > 0 && spent > limit;
      return { category: cat, limit, spent, pct, isExceeded };
    }).sort((a, b) => b.pct - a.pct);
  }, [categoryBudgets, categoryTotals]);

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBudgetCat, setNewBudgetCat] = useState('');
  const [newBudgetAmt, setNewBudgetAmt] = useState('');

  const isExistingBudget = useMemo(() => {
    if (newBudgetCat === 'GLOBAL_MONTHLY') {
      return monthlyBudget > 0;
    }
    return !!categoryBudgets[newBudgetCat];
  }, [newBudgetCat, monthlyBudget, categoryBudgets]);

  const openAddModal = (cat: string = 'GLOBAL_MONTHLY') => {
    setNewBudgetCat(cat);
    if (cat === 'GLOBAL_MONTHLY') {
      setNewBudgetAmt(monthlyBudget > 0 ? String(monthlyBudget) : '');
    } else {
      const existing = categoryBudgets[cat];
      setNewBudgetAmt(existing ? String(existing.amount) : '');
    }
    setShowAddModal(true);
  };

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

  const handleDeleteBudget = (category: string) => {
    const isGlobal = category === 'GLOBAL_MONTHLY';
    const label = isGlobal ? 'Global Monthly Budget' : `${category} Budget`;

    const doDelete = () => {
      if (isGlobal) {
        setMonthlyBudget(0);
      } else {
        removeCategoryBudget(category);
      }
      setShowAddModal(false);
      setNewBudgetCat('');
      setNewBudgetAmt('');
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Are you sure you want to delete the ${label}?`)) {
        doDelete();
      }
    } else {
      Alert.alert(
        'Delete Budget',
        `Are you sure you want to delete the ${label}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: doDelete
          }
        ]
      );
    }
  };

  const ringColors = activeBudgets.slice(0, 3).map(b => categoryMeta[b.category]?.color ?? getCategoryColor(b.category as any));
  if (ringColors.length === 0) ringColors.push('#22C55E');

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: C.background }]} edges={['top', 'bottom']}>
      <RNStatusBar barStyle={theme === 'light' ? 'dark-content' : 'light-content'} backgroundColor={C.background} />

      <View style={styles.header}>
        <View style={{ width: 36 }} />
        <Text style={[styles.headerTitle, { color: C.textPrimary }]}>Budgets</Text>
        <TouchableOpacity
          style={styles.headerAddBtn}
          onPress={() => openAddModal('GLOBAL_MONTHLY')}
          activeOpacity={0.7}
        >
          <PlusCircle size={24} color={C.primary} />
        </TouchableOpacity>
      </View>

      {/* Month Date Selector */}
      <View style={styles.dateSelectorWrap}>
        <TouchableOpacity style={[styles.dateBtn, { backgroundColor: C.surface, borderColor: C.border }]} onPress={prevMonth}>
          <ChevronLeft size={20} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.dateLabel, { color: C.textPrimary }]}>{monthLabel}</Text>
        <TouchableOpacity 
          style={[styles.dateBtn, { backgroundColor: C.surface, borderColor: C.border }]} 
          onPress={nextMonth} 
          disabled={isNextDisabled}
        >
          <ChevronRight size={20} color={isNextDisabled ? C.textMuted : C.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        {/* ── Total Monthly Budget Card ── */}
        <TouchableOpacity 
          style={[styles.totalCard, { backgroundColor: C.surface, borderColor: C.border }]}
          activeOpacity={0.8}
          onPress={() => openAddModal('GLOBAL_MONTHLY')}
          onLongPress={() => {
            if (monthlyBudget > 0) {
              handleDeleteBudget('GLOBAL_MONTHLY');
            }
          }}
          delayLongPress={300}
        >
          <View style={styles.totalCardInner}>
            <BudgetRingChart 
              spent={totalSpent} 
              total={monthlyBudget} 
              colorsList={ringColors} 
              trackColor={C.border}
              textColor={C.textPrimary}
              textSecColor={C.textSecondary}
            />
            <View style={styles.totalInfo}>
              <Text style={[styles.totalLabel, { color: C.textSecondary }]}>Total Monthly Budget</Text>
              <Text style={[styles.totalAmount, { color: C.textPrimary }]}>
                {monthlyBudget > 0 ? `${sym}${monthlyBudget.toLocaleString('en-IN')}` : 'Not Set'}
              </Text>
              
              <View style={styles.totalSplitRow}>
                <View>
                  <Text style={[styles.splitLabel, { color: C.textSecondary }]}>Spent</Text>
                  <Text style={styles.splitSpent}>{sym}{totalSpent.toLocaleString('en-IN')}</Text>
                </View>
                <View>
                  <Text style={[styles.splitLabel, { color: C.textSecondary }]}>Remaining</Text>
                  <Text style={[styles.splitRem, { color: C.textPrimary }]}>{sym}{budgetRemaining.toLocaleString('en-IN')}</Text>
                </View>
              </View>
            </View>
          </View>
        </TouchableOpacity>


        {/* ── Your Budgets List ── */}
        <View style={styles.listHeader}>
          <Text style={[styles.listTitle, { color: C.textPrimary }]}>Your Budgets</Text>
        </View>

        {activeBudgets.map((item) => {
          const meta = categoryMeta[item.category];
          const col = meta?.color ?? getCategoryColor(item.category as any);
          const isWarning = item.pct >= 80 && item.pct < 100;
          let statusText = "On Track";
          let statusColor = "#22C55E";
          if (item.isExceeded) { statusText = "Over Budget"; statusColor = "#EF4444"; }
          else if (isWarning) { statusText = "Getting Close"; statusColor = "#F59E0B"; }

          return (
            <TouchableOpacity 
              key={item.category} 
              style={[styles.budgetRow, { backgroundColor: C.surface, borderColor: C.border }]}
              activeOpacity={0.7}
              onPress={() => openAddModal(item.category)}
              onLongPress={() => handleDeleteBudget(item.category)}
              delayLongPress={300}
            >
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
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={[styles.budgetCatName, { color: C.textPrimary }]} numberOfLines={1}>{item.category}</Text>
                    <Text style={[styles.budgetCatLimit, { color: C.textSecondary }]}>
                      {sym}{item.limit.toLocaleString('en-IN')} budget
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.budgetPct, { color: C.textPrimary }]}>{Math.round(item.pct)}%</Text>
                    <Text style={[styles.budgetStatus, { color: statusColor }]}>{statusText}</Text>
                  </View>
                  <ChevronRight size={16} color={C.textMuted} style={{ marginLeft: 8 }} />
                </View>

                <View style={[styles.track, { backgroundColor: C.border }]}>
                  <View style={[styles.fill, { width: `${item.pct}%`, backgroundColor: col }]} />
                </View>
                <Text style={[styles.budgetSpent, { color: C.textSecondary }]}>{sym}{item.spent.toLocaleString('en-IN')} spent</Text>
              </View>
            </TouchableOpacity>
          );
        })}

        {activeBudgets.length === 0 && (
          <View style={{ alignItems: 'center', marginTop: 36, paddingHorizontal: 20 }}>
            <Text style={{ color: C.textMuted, fontSize: 14 }}>
              No category budgets set yet.
            </Text>
          </View>
        )}

      </ScrollView>

      {/* ── Set / Edit Budget Modal ── */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { backgroundColor: C.surface, borderColor: C.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: C.textPrimary }]}>
                {isExistingBudget ? 'Edit Budget' : 'Set Budget'}
              </Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)} style={[styles.modalClose, { backgroundColor: C.surfaceElevated }]}>
                <X size={20} color={C.textPrimary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalLabel, { color: C.textSecondary }]}>Select Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 46, marginBottom: 18 }}>
              <TouchableOpacity 
                style={[styles.catPill, { backgroundColor: C.surfaceElevated }, newBudgetCat === 'GLOBAL_MONTHLY' && styles.catPillActive]} 
                onPress={() => {
                  setNewBudgetCat('GLOBAL_MONTHLY');
                  setNewBudgetAmt(monthlyBudget > 0 ? String(monthlyBudget) : '');
                }}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 13, marginRight: 5 }}>🌐</Text>
                <Text style={[styles.catPillText, { color: C.textSecondary }, newBudgetCat === 'GLOBAL_MONTHLY' && styles.catPillTextActive]}>
                  Global Monthly
                </Text>
              </TouchableOpacity>
              {categories.map(c => {
                const meta = categoryMeta[c];
                const col = meta?.color ?? getCategoryColor(c as any);
                const isSelected = newBudgetCat === c;
                return (
                  <TouchableOpacity 
                    key={c} 
                    style={[styles.catPill, { backgroundColor: C.surfaceElevated }, isSelected && styles.catPillActive]} 
                    onPress={() => {
                      setNewBudgetCat(c);
                      const existing = categoryBudgets[c]?.amount;
                      setNewBudgetAmt(existing ? String(existing) : '');
                    }}
                    activeOpacity={0.7}
                  >
                    {meta?.emoji ? (
                      <Text style={{ fontSize: 13, marginRight: 5 }}>{meta.emoji}</Text>
                    ) : (
                      <View style={{ marginRight: 5 }}>
                        {getCategoryIcon(c as any, isSelected ? '#000000' : col, 13)}
                      </View>
                    )}
                    <Text style={[styles.catPillText, { color: C.textSecondary }, isSelected && styles.catPillTextActive]}>{c}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text style={[styles.modalLabel, { color: C.textSecondary }]}>
              Budget Amount ({sym})
            </Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: C.surfaceElevated, borderColor: C.border, color: C.textPrimary }]}
              keyboardType="numeric"
              value={newBudgetAmt}
              onChangeText={setNewBudgetAmt}
              placeholder="e.g. 5000"
              placeholderTextColor={C.textMuted}
            />

            <TouchableOpacity
              style={[
                styles.modalBtn,
                {
                  backgroundColor: theme === 'light' ? '#18181B' : '#FFFFFF',
                }
              ]}
              onPress={handleSaveBudget}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.modalBtnText,
                  {
                    color: theme === 'light' ? '#FFFFFF' : '#000000',
                  }
                ]}
              >
                {isExistingBudget ? 'Update Budget' : 'Save Budget'}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  
  dateSelectorWrap: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 16, marginBottom: 14 },
  dateBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  dateLabel: { fontSize: 16, fontWeight: '700', minWidth: 100, textAlign: 'center' },

  scroll: { paddingHorizontal: 16, paddingBottom: 110 },

  totalCard: { borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1 },
  totalCardInner: { flexDirection: 'row', alignItems: 'center' },
  totalInfo: { flex: 1, marginLeft: 20 },
  totalLabel: { fontSize: 12, marginBottom: 4 },
  totalAmount: { fontSize: 28, fontWeight: '800', marginBottom: 16 },
  totalSplitRow: { flexDirection: 'row', gap: 24 },
  splitLabel: { fontSize: 11, marginBottom: 4 },
  splitSpent: { color: '#22C55E', fontSize: 15, fontWeight: '700' },
  splitRem: { fontSize: 15, fontWeight: '700' },

  headerAddBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },

  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingHorizontal: 4 },
  listTitle: { fontSize: 15, fontWeight: '600' },

  budgetRow: { flexDirection: 'row', borderRadius: 20, padding: 16, marginBottom: 12, borderWidth: 1 },
  budgetIconWrap: { marginRight: 16 },
  budgetIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  budgetBody: { flex: 1 },
  budgetBodyTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  budgetCatName: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  budgetCatLimit: { fontSize: 12 },
  budgetPct: { fontSize: 15, fontWeight: '700', textAlign: 'right', marginBottom: 2 },
  budgetStatus: { fontSize: 10, fontWeight: '600', textAlign: 'right' },
  track: { height: 6, borderRadius: 3, marginBottom: 6, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3 },
  budgetSpent: { fontSize: 11 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, borderWidth: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  modalClose: { padding: 4, borderRadius: 12 },
  modalLabel: { fontSize: 13, fontWeight: '600', marginBottom: 8 },

  catPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 8, height: 36 },
  catPillActive: { backgroundColor: '#FFFFFF' },
  catPillText: { fontSize: 13.5, fontWeight: '500' },
  catPillTextActive: { color: '#000000', fontWeight: '700' },
  modalInput: { height: 50, borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, fontSize: 16, marginBottom: 20 },
  modalBtn: { height: 50, borderRadius: 14, justifyContent: 'center', alignItems: 'center', width: '100%' },
  modalBtnText: { fontSize: 15, fontWeight: '700' },
});
