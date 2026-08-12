import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, Platform,
  StatusBar as RNStatusBar, ScrollView, TouchableOpacity, Dimensions
} from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useThemeColors } from '../../theme/colors';
import { useStore } from '../../store/useStore';
import { getCategoryColor, getCategoryIcon, Category } from '../../utils/mockData';
import { DonutChart } from '../../components/DonutChart';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];
const monthShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const parseTransactionDate = (ds: string) => {
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
const SpendingLineChart = ({ data, labels, color }: { data: number[]; labels: string[]; color: string }) => {
  const W = SCREEN_WIDTH - 80;
  const H = 120;
  const padX = 10;
  const padY = 10;
  const chartW = W - padX * 2;
  const chartH = H - padY * 2;
  const max = Math.max(...data, 1);

  const pts = data.map((v, i) => ({
    x: padX + (chartW / Math.max(data.length - 1, 1)) * i,
    y: padY + chartH - (v / max) * chartH,
  }));

  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  // Smooth area fill
  const areaPath = `${linePath} L ${pts[pts.length - 1].x} ${H} L ${pts[0].x} ${H} Z`;

  return (
    <View>
      <Svg width={W} height={H}>
        <Defs>
          <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity="0.25" />
            <Stop offset="1" stopColor={color} stopOpacity="0.0" />
          </LinearGradient>
        </Defs>
        <Path d={areaPath} fill="url(#grad)" />
        <Path d={linePath} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((p, i) => (
          <Circle key={i} cx={p.x} cy={p.y} r={3.5} fill={color} />
        ))}
      </Svg>
      {/* X axis labels — only show first, mid, last */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: padX, marginTop: 6 }}>
        <Text style={{ color: '#94A3B8', fontSize: 11 }}>{labels[0]}</Text>
        {labels.length > 2 && (
          <Text style={{ color: '#94A3B8', fontSize: 11 }}>{labels[Math.floor(labels.length / 2)]}</Text>
        )}
        <Text style={{ color: '#94A3B8', fontSize: 11 }}>{labels[labels.length - 1]}</Text>
      </View>
    </View>
  );
};

// ── Main Screen ──────────────────────────────────────────────────────────────
export const AnalyticsScreen = () => {
  const colors = useThemeColors();
  const transactions = useStore(s => s.transactions);
  const currency = useStore(s => s.currency);
  const currencySymbol = currency === 'USD' ? '$' : '₹';

  const [activeMonth, setActiveMonth] = useState(new Date());
  const monthLabel = `${monthNames[activeMonth.getMonth()]} ${activeMonth.getFullYear()}`;

  const filteredExpenses = useMemo(() => {
    return transactions.filter(tx => {
      if (tx.type !== 'expense') return false;
      const d = parseTransactionDate(tx.date);
      if (isNaN(d.getTime())) return false;
      return d.getFullYear() === activeMonth.getFullYear() && d.getMonth() === activeMonth.getMonth();
    });
  }, [transactions, activeMonth]);

  const totalSpent = useMemo(() =>
    filteredExpenses.reduce((s, tx) => s + tx.amount, 0),
    [filteredExpenses]
  );

  const categoryTotals = useMemo(() => {
    const map: Record<string, number> = {};
    filteredExpenses.forEach(tx => { map[tx.category] = (map[tx.category] ?? 0) + tx.amount; });
    return Object.entries(map)
      .map(([cat, amt]) => ({ category: cat as Category, amount: amt }))
      .sort((a, b) => b.amount - a.amount);
  }, [filteredExpenses]);

  const donutSegments = useMemo(() =>
    categoryTotals.slice(0, 4).map(item => ({
      value: item.amount,
      color: getCategoryColor(item.category),
      label: item.category,
      percent: totalSpent > 0 ? Math.round((item.amount / totalSpent) * 100) : 0,
    })),
    [categoryTotals, totalSpent]
  );

  // Build daily trend for the month (1 point per day that has data, or weekly buckets)
  const { trendData, trendLabels } = useMemo(() => {
    const year = activeMonth.getFullYear();
    const month = activeMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const dailyTotals = new Array(daysInMonth).fill(0);
    filteredExpenses.forEach(tx => {
      const d = parseTransactionDate(tx.date);
      if (!isNaN(d.getTime())) {
        const day = d.getDate() - 1;
        if (day >= 0 && day < daysInMonth) dailyTotals[day] += tx.amount;
      }
    });
    // Use just key dates for labels
    const labels = [`${monthShort[month]} 1`, `${monthShort[month]} 15`, `${monthShort[month]} ${daysInMonth}`];
    return { trendData: dailyTotals, trendLabels: labels };
  }, [filteredExpenses, activeMonth]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Analytics</Text>
        <View style={styles.monthNav}>
          <TouchableOpacity
            onPress={() => setActiveMonth(p => new Date(p.getFullYear(), p.getMonth() - 1, 1))}
            style={styles.navBtn}
          >
            <Text style={[styles.navArrow, { color: colors.primary }]}>←</Text>
          </TouchableOpacity>
          <Text style={[styles.monthLabel, { color: colors.textPrimary }]}>{monthLabel}</Text>
          <TouchableOpacity
            onPress={() => setActiveMonth(p => new Date(p.getFullYear(), p.getMonth() + 1, 1))}
            style={styles.navBtn}
          >
            <Text style={[styles.navArrow, { color: colors.primary }]}>→</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Donut Chart Card */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <DonutChart 
              segments={donutSegments} 
              total={totalSpent} 
              currencySymbol={currencySymbol} 
              colors={colors} 
            />
        </View>

        {/* Spending Trend Card */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Spending Trend</Text>
          <SpendingLineChart
            data={trendData}
            labels={trendLabels}
            color={colors.primary}
          />
        </View>

        {/* Top Categories */}
        {categoryTotals.length > 0 && (
          <View>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Top Categories</Text>
            {categoryTotals.slice(0, 5).map((item, idx) => {
              const pct = totalSpent > 0 ? Math.round((item.amount / totalSpent) * 100) : 0;
              const col = getCategoryColor(item.category);
              return (
                <View key={item.category} style={[styles.catRow, { backgroundColor: colors.surface }]}>
                  {/* Rank badge */}
                  <View style={[styles.rankBadge, { backgroundColor: colors.surfaceLight }]}>
                    <Text style={[styles.rankText, { color: colors.textSecondary }]}>#{idx + 1}</Text>
                  </View>
                  {/* Icon */}
                  <View style={[styles.catIcon, { backgroundColor: col + '22' }]}>
                    {getCategoryIcon(item.category, col, 18)}
                  </View>
                  {/* Info */}
                  <View style={styles.catInfo}>
                    <Text style={[styles.catName, { color: colors.textPrimary }]}>
                      {item.category === 'Food' ? 'Food & Dining' : item.category}
                    </Text>
                    {/* Progress bar */}
                    <View style={[styles.barTrack, { backgroundColor: colors.surfaceLight }]}>
                      <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: col }]} />
                    </View>
                  </View>
                  {/* Amount */}
                  <Text style={[styles.catAmount, { color: colors.textPrimary }]}>
                    {currencySymbol}{item.amount.toLocaleString('en-IN')}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {categoryTotals.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📊</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No expenses for {monthLabel}</Text>
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16,
  },
  headerTitle: { fontSize: 26, fontWeight: '800' },
  monthNav: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  navBtn: { padding: 6 },
  navArrow: { fontSize: 18, fontWeight: '700' },
  monthLabel: { fontSize: 14, fontWeight: '600', minWidth: 110, textAlign: 'center' },
  scroll: { paddingHorizontal: 20, paddingTop: 8 },
  card: {
    borderRadius: 20, padding: 20, marginBottom: 16,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.07, shadowRadius: 10, elevation: 3,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 14 },
  sectionTitle: { fontSize: 17, fontWeight: '800', marginBottom: 12, marginTop: 4 },
  catRow: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 16,
    padding: 14, marginBottom: 10,
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  rankBadge: {
    width: 32, height: 32, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center', marginRight: 10,
  },
  rankText: { fontSize: 12, fontWeight: '700' },
  catIcon: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  catInfo: { flex: 1 },
  catName: { fontSize: 14, fontWeight: '700', marginBottom: 6 },
  barTrack: { height: 5, borderRadius: 999, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 999 },
  catAmount: { fontSize: 14, fontWeight: '700', marginLeft: 10 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 15 },
});
