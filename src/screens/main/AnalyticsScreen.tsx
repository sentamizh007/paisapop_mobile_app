import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, Platform,
  StatusBar as RNStatusBar, ScrollView, TouchableOpacity, Dimensions,
} from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useThemeColors } from '../../theme/colors';
import { useStore } from '../../store/useStore';
import { getCategoryColor, getCategoryIcon, Category, getCurrencySymbol } from '../../utils/mockData';
import { DonutChart } from '../../components/DonutChart';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { MONTH_NAMES } from '../../utils/exportUtils';

const { width: SW } = Dimensions.get('window');

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const parseDate = (ds: string) => {
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

// ── Line Chart ───────────────────────────────────────────────────────────────
const SpendingLineChart = ({
  data,
  labels,
  color,
  textColor,
}: {
  data: number[];
  labels: string[];
  color: string;
  textColor: string;
}) => {
  const W = SW - 72;
  const H = 110;
  const padX = 8;
  const padY = 8;
  const chartW = W - padX * 2;
  const chartH = H - padY * 2;
  const max = Math.max(...data, 1);
  const hasData = data.some(v => v > 0);

  const pts = data.map((v, i) => ({
    x: padX + (chartW / Math.max(data.length - 1, 1)) * i,
    y: padY + chartH - (v / max) * chartH,
  }));
  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L ${pts[pts.length - 1].x.toFixed(1)} ${H} L ${pts[0].x.toFixed(1)} ${H} Z`;

  if (!hasData) {
    return (
      <View style={{ height: H + 30, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: textColor, fontSize: 13 }}>No data for this month</Text>
      </View>
    );
  }

  return (
    <View>
      <Svg width={W} height={H}>
        <Defs>
          <LinearGradient id="lg" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity="0.3" />
            <Stop offset="1" stopColor={color} stopOpacity="0.0" />
          </LinearGradient>
        </Defs>
        <Path d={areaPath} fill="url(#lg)" />
        <Path d={linePath} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        {pts.filter((_, i) => i === 0 || i === Math.floor(pts.length / 2) || i === pts.length - 1).map((p, i) => (
          <Circle key={i} cx={p.x} cy={p.y} r={4} fill={color} />
        ))}
      </Svg>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: padX, marginTop: 8 }}>
        {[labels[0], labels.length > 2 ? labels[Math.floor(labels.length / 2)] : null, labels[labels.length - 1]]
          .filter(Boolean).map((l, i) => (
            <Text key={i} style={{ color: textColor, fontSize: 11, fontWeight: '500' }}>{l}</Text>
          ))}
      </View>
    </View>
  );
};

// ── Main ─────────────────────────────────────────────────────────────────────
export const AnalyticsScreen = () => {
  const C = useThemeColors();
  const transactions = useStore(s => s.transactions);
  const currency = useStore(s => s.currency);
  const categoryMeta = useStore(s => s.categoryMeta);
  const categoryBudgets = useStore(s => s.categoryBudgets);
  const sym = getCurrencySymbol(currency);

  const [activeMonth, setActiveMonth] = useState(new Date());
  const monthLabel = `${MONTH_NAMES[activeMonth.getMonth()]} ${activeMonth.getFullYear()}`;

  const prevMonth = () => setActiveMonth(p => new Date(p.getFullYear(), p.getMonth() - 1, 1));
  const nextMonth = () => setActiveMonth(p => new Date(p.getFullYear(), p.getMonth() + 1, 1));

  // Block future navigation
  const now = new Date();
  const isFutureMonth =
    activeMonth.getFullYear() > now.getFullYear() ||
    (activeMonth.getFullYear() === now.getFullYear() && activeMonth.getMonth() >= now.getMonth());

  const monthExpenses = useMemo(() =>
    transactions.filter(tx => {
      if (tx.type !== 'expense') return false;
      const d = parseDate(tx.date);
      return !isNaN(d.getTime()) &&
        d.getFullYear() === activeMonth.getFullYear() &&
        d.getMonth() === activeMonth.getMonth();
    }),
    [transactions, activeMonth]
  );

  const monthIncome = useMemo(() =>
    transactions.filter(tx => {
      if (tx.type !== 'income') return false;
      const d = parseDate(tx.date);
      return !isNaN(d.getTime()) &&
        d.getFullYear() === activeMonth.getFullYear() &&
        d.getMonth() === activeMonth.getMonth();
    }),
    [transactions, activeMonth]
  );

  const monthTransfer = useMemo(() =>
    transactions.filter(tx => {
      if (tx.type !== 'transfer') return false;
      const d = parseDate(tx.date);
      return !isNaN(d.getTime()) &&
        d.getFullYear() === activeMonth.getFullYear() &&
        d.getMonth() === activeMonth.getMonth();
    }),
    [transactions, activeMonth]
  );

  const totalSpent = useMemo(() => monthExpenses.reduce((s, tx) => s + tx.amount, 0), [monthExpenses]);
  const totalIncome = useMemo(() => monthIncome.reduce((s, tx) => s + tx.amount, 0), [monthIncome]);
  const totalTransfer = useMemo(() => monthTransfer.reduce((s, tx) => s + tx.amount, 0), [monthTransfer]);
  const netBalance = totalIncome - totalSpent;

  const categoryTotals = useMemo(() => {
    const map: Record<string, number> = {};
    monthExpenses.forEach(tx => { map[tx.category] = (map[tx.category] ?? 0) + tx.amount; });
    return Object.entries(map)
      .map(([cat, amt]) => ({ category: cat as Category, amount: amt }))
      .sort((a, b) => b.amount - a.amount);
  }, [monthExpenses]);

  const activeBudgets = useMemo(() => {
    const keys = Object.keys(categoryBudgets);
    if (keys.length === 0) return [];
    return keys.map(cat => {
      const budget = categoryBudgets[cat];
      const spent = categoryTotals.find(c => c.category === cat)?.amount || 0;
      const limit = budget.period === 'weekly' ? budget.amount * 4 : budget.amount;
      const pct = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
      const isExceeded = limit > 0 && spent > limit;
      return { category: cat as Category, limit, spent, pct, isExceeded, period: budget.period };
    }).sort((a, b) => b.spent - a.spent);
  }, [categoryBudgets, categoryTotals]);

  const donutSegments = useMemo(() =>
    categoryTotals.slice(0, 5).map(item => ({
      value: item.amount,
      color: getCategoryColor(item.category),
      label: item.category,
      percent: totalSpent > 0 ? Math.round((item.amount / totalSpent) * 100) : 0,
    })),
    [categoryTotals, totalSpent]
  );

  const { trendData, trendLabels } = useMemo(() => {
    const yr = activeMonth.getFullYear();
    const mo = activeMonth.getMonth();
    const daysInMonth = new Date(yr, mo + 1, 0).getDate();
    const daily = new Array(daysInMonth).fill(0);
    monthExpenses.forEach(tx => {
      const d = parseDate(tx.date);
      if (!isNaN(d.getTime())) {
        const day = d.getDate() - 1;
        if (day >= 0 && day < daysInMonth) daily[day] += tx.amount;
      }
    });
    const labels = [
      `${MONTH_SHORT[mo]} 1`,
      `${MONTH_SHORT[mo]} ${Math.ceil(daysInMonth / 2)}`,
      `${MONTH_SHORT[mo]} ${daysInMonth}`,
    ];
    return { trendData: daily, trendLabels: labels };
  }, [monthExpenses, activeMonth]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: C.background }]}>
      <RNStatusBar barStyle="light-content" backgroundColor={C.background} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: C.textPrimary }]}>Analytics</Text>
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={prevMonth} style={[styles.navBtn, { backgroundColor: C.surface }]}>
            <ChevronLeft size={18} color={C.primary} strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={[styles.monthLabel, { color: C.textPrimary }]}>{monthLabel}</Text>
          <TouchableOpacity
            onPress={nextMonth}
            style={[styles.navBtn, { backgroundColor: C.surface }]}
            disabled={isFutureMonth}
          >
            <ChevronRight size={18} color={isFutureMonth ? C.textMuted : C.primary} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Net summary strip ── */}
        <View style={[styles.netCard, { backgroundColor: C.surface }]}>
          <View style={styles.netItem}>
            <Text style={[styles.netLabel, { color: C.textSecondary }]}>Expenses</Text>
            <Text style={[styles.netValue, { color: '#FFFFFF' }]}>
              -{sym}{totalSpent.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>
          <View style={[styles.netDivider, { backgroundColor: C.border }]} />
          <View style={styles.netItem}>
            <Text style={[styles.netLabel, { color: C.textSecondary }]}>Income</Text>
            <Text style={[styles.netValue, { color: C.income }]}>
              +{sym}{totalIncome.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>
          <View style={[styles.netDivider, { backgroundColor: C.border }]} />
          <View style={styles.netItem}>
            <Text style={[styles.netLabel, { color: C.textSecondary }]}>Transfers</Text>
            <Text style={[styles.netValue, { color: '#14B8A6' }]}>
              {sym}{totalTransfer.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>

        </View>

        {/* ── Donut chart ── */}
        {donutSegments.length > 0 ? (
          <View style={[styles.card, { backgroundColor: C.surface }]}>
            <DonutChart
              segments={donutSegments}
              total={totalSpent}
              currencySymbol={sym}
              colors={C}
            />
          </View>
        ) : null}

        {/* ── Spending trend ── */}
        <View style={[styles.card, { backgroundColor: C.surface }]}>
          <Text style={[styles.cardTitle, { color: C.textPrimary }]}>Daily Spending Trend</Text>
          <SpendingLineChart
            data={trendData}
            labels={trendLabels}
            color={C.expense}
            textColor={C.textSecondary}
          />
        </View>

        {/* ── Top categories ── */}
        {categoryTotals.length > 0 ? (
          <View style={[styles.card, { backgroundColor: C.surface }]}>
            <Text style={[styles.cardTitle, { color: C.textPrimary }]}>Top Categories</Text>
            {categoryTotals.slice(0, 10).map((item, idx) => {
              const pct = totalSpent > 0 ? (item.amount / totalSpent) * 100 : 0;
              const meta = categoryMeta[item.category];
              const col = meta?.color ?? getCategoryColor(item.category);
              return (
                <View key={item.category} style={[styles.catRow, idx > 0 && { marginTop: 14 }]}>
                  <View style={[styles.catIcon, { backgroundColor: col + '22' }]}>
                    {meta?.emoji ? (
                      <Text style={{ fontSize: 17 }}>{meta.emoji}</Text>
                    ) : (
                      getCategoryIcon(item.category, col, 17)
                    )}
                  </View>
                  <View style={styles.catInfo}>
                    <View style={styles.catLabelRow}>
                      <Text style={[styles.catName, { color: C.textPrimary }]}>{item.category}</Text>
                      <Text style={[styles.catPct, { color: C.textSecondary }]}>{Math.round(pct)}%</Text>
                    </View>
                    <View style={[styles.barTrack, { backgroundColor: C.surfaceMid }]}>
                      <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: col }]} />
                    </View>
                  </View>
                  <Text style={[styles.catAmount, { color: C.textPrimary }]}>
                    {sym}{item.amount.toLocaleString('en-IN')}
                  </Text>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📊</Text>
            <Text style={[styles.emptyText, { color: C.textSecondary }]}>No expenses in {monthLabel}</Text>
          </View>
        )}
        {/* ── Category Budgets ── */}
        {activeBudgets.length > 0 ? (
          <View style={[styles.card, { backgroundColor: C.surface }]}>
            <Text style={[styles.cardTitle, { color: C.textPrimary }]}>Category Budgets</Text>
            {activeBudgets.map((item, idx) => {
              const meta = categoryMeta[item.category];
              const col = meta?.color ?? getCategoryColor(item.category);
              return (
                <View key={item.category} style={[styles.catRow, idx > 0 && { marginTop: 14 }]}>
                  <View style={[styles.catIcon, { backgroundColor: col + '22' }]}>
                    {meta?.emoji ? (
                      <Text style={{ fontSize: 17 }}>{meta.emoji}</Text>
                    ) : (
                      getCategoryIcon(item.category, col, 17)
                    )}
                  </View>
                  <View style={styles.catInfo}>
                    <View style={styles.catLabelRow}>
                      <Text style={[styles.catName, { color: item.isExceeded ? C.expense : C.textPrimary }]}>
                        {item.category} {item.isExceeded ? '(Over)' : ''}
                      </Text>
                      <Text style={[styles.catPct, { color: item.isExceeded ? C.expense : C.textSecondary }]}>
                        {sym}{item.spent.toLocaleString('en-IN')} / {sym}{item.limit.toLocaleString('en-IN')}
                      </Text>
                    </View>
                    <View style={[styles.barTrack, { backgroundColor: C.surfaceMid }]}>
                      <View style={[styles.barFill, { width: `${item.pct}%`, backgroundColor: item.isExceeded ? C.expense : col }]} />
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        ) : null}

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitle: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  monthNav: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  navBtn: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  monthLabel: { fontSize: 13, fontWeight: '600', minWidth: 100, textAlign: 'center' },

  scroll: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 110 },

  // Net card
  netCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
  },
  netItem: { flex: 1, alignItems: 'center' },
  netLabel: { fontSize: 11, fontWeight: '600', marginBottom: 5, letterSpacing: 0.3 },
  netValue: { fontSize: 15, fontWeight: '800', letterSpacing: -0.3 },
  netDivider: { width: 1, height: 32, marginHorizontal: 8 },

  // Card
  card: {
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', marginBottom: 16, letterSpacing: -0.2 },

  // Category rows
  catRow: { flexDirection: 'row', alignItems: 'center' },
  catIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  catInfo: { flex: 1 },
  catLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  catName: { fontSize: 13, fontWeight: '600' },
  catPct: { fontSize: 12, fontWeight: '600' },
  barTrack: { height: 5, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
  catAmount: { fontSize: 13, fontWeight: '700', marginLeft: 14, flexShrink: 0 },

  // Empty
  emptyState: { alignItems: 'center', paddingVertical: 48 },
  emptyEmoji: { fontSize: 44, marginBottom: 12 },
  emptyText: { fontSize: 14, fontWeight: '500' },
});
