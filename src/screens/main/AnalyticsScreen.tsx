import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, Platform,
  StatusBar as RNStatusBar, ScrollView, TouchableOpacity, Dimensions,
} from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useStore } from '../../store/useStore';
import { getCategoryColor, getCategoryIcon, Category, getCurrencySymbol } from '../../utils/mockData';
import { DonutChart } from '../../components/DonutChart';
import { ChevronLeft, ChevronRight, ChevronDown, ReceiptText, Activity, Briefcase, Wallet, PieChart, ArrowDown, TrendingUp } from 'lucide-react-native';
import { MONTH_NAMES } from '../../utils/exportUtils';

const { width: SW } = Dimensions.get('window');
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

// ── Line Chart ───────────────────────────────────────────────────────────────
const SpendingLineChart = ({ data, labels, color }: { data: number[]; labels: string[]; color: string; }) => {
  const W = SW - 64;
  const H = 160;
  const padX = 30;
  const padY = 20;
  const chartW = W - padX;
  const chartH = H - padY * 2;
  const max = Math.max(...data, 1);
  const hasData = data.some(v => v > 0);

  const pts = data.map((v, i) => ({
    x: padX + (chartW / Math.max(data.length - 1, 1)) * i,
    y: padY + chartH - (v / max) * chartH,
  }));

  const getBezierPath = (points: { x: number, y: number }[]) => {
    if (points.length === 0) return '';
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i === 0 ? 0 : i - 1];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2 < points.length ? i + 2 : i + 1];
      const t = 0.2;
      const cp1x = p1.x + (p2.x - p0.x) * t;
      const cp1y = p1.y + (p2.y - p0.y) * t;
      const cp2x = p2.x - (p3.x - p1.x) * t;
      const cp2y = p2.y - (p3.y - p1.y) * t;
      d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    return d;
  };

  const linePath = hasData ? getBezierPath(pts) : `M ${padX} ${padY + chartH} L ${W} ${padY + chartH}`;
  const areaPath = hasData ? `${linePath} L ${pts[pts.length - 1].x} ${H} L ${pts[0].x} ${H} Z` : '';

  const formatY = (val: number) => {
    if (val >= 1000) return (val / 1000).toFixed(1) + 'k';
    return Math.round(val).toString();
  };

  return (
    <View style={{ marginTop: 10 }}>
      <Svg width={W} height={H}>
        <Defs>
          <LinearGradient id="lg" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity="0.4" />
            <Stop offset="1" stopColor={color} stopOpacity="0.0" />
          </LinearGradient>
        </Defs>
        {/* Horizontal grid lines */}
        <Path d={`M ${padX} ${padY} L ${W} ${padY}`} stroke="#27272A" strokeWidth={1} />
        <Path d={`M ${padX} ${padY + chartH / 2} L ${W} ${padY + chartH / 2}`} stroke="#27272A" strokeWidth={1} />
        <Path d={`M ${padX} ${padY + chartH} L ${W} ${padY + chartH}`} stroke="#27272A" strokeWidth={1} />

        {/* Area & Line */}
        {hasData && <Path d={areaPath} fill="url(#lg)" />}
        <Path d={linePath} fill="none" stroke={hasData ? color : '#333'} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />

        {/* Peaks dots */}
        {hasData && pts.filter((_, i) => i === 0 || i === Math.floor(pts.length / 2) || i === pts.length - 1).map((p, i) => (
          <Circle key={i} cx={p.x} cy={p.y} r={4} fill={color} stroke="#131315" strokeWidth={2} />
        ))}
      </Svg>

      {/* Y Axis Labels (Absolute positioning) */}
      <View style={{ position: 'absolute', top: padY - 8, left: 0 }}>
        <Text style={{ color: '#888', fontSize: 10 }}>{formatY(max)}</Text>
      </View>
      <View style={{ position: 'absolute', top: padY + chartH / 2 - 8, left: 0 }}>
        <Text style={{ color: '#888', fontSize: 10 }}>{formatY(max / 2)}</Text>
      </View>
      <View style={{ position: 'absolute', top: padY + chartH - 8, left: 0 }}>
        <Text style={{ color: '#888', fontSize: 10 }}>0</Text>
      </View>

      {/* X Axis Labels */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginLeft: padX, marginTop: 4 }}>
        {labels.map((l, i) => (
          <Text key={i} style={{ color: '#888', fontSize: 10 }}>{l}</Text>
        ))}
      </View>
    </View>
  );
};

// ── Metric Card ──────────────────────────────────────────────────────────────
const MetricCard = ({ icon, title, value, subtitle, badgeText, badgeColor }: any) => (
  <View style={styles.metricCard}>
    <View style={styles.metricIconWrap}>{icon}</View>
    <Text style={styles.metricTitle}>{title}</Text>
    <Text style={styles.metricValue}>{value}</Text>
    {badgeText ? (
      <View style={styles.metricBadgeRow}>
        <View style={styles.metricBadge}>
          <ArrowDown size={10} color={badgeColor || "#22C55E"} />
          <Text style={[styles.metricBadgeText, { color: badgeColor || "#22C55E" }]}>{badgeText}</Text>
        </View>
        <Text style={styles.metricSub}>{subtitle}</Text>
      </View>
    ) : (
      <Text style={styles.metricSubColored} numberOfLines={1}>{subtitle}</Text>
    )}
  </View>
);

// ── Main ─────────────────────────────────────────────────────────────────────
export const AnalyticsScreen = () => {
  const transactions = useStore(s => s.transactions);
  const currency = useStore(s => s.currency);
  const categoryMeta = useStore(s => s.categoryMeta);
  const monthlyBudget = useStore(s => s.monthlyBudget);
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

  const prevMonthExpenses = useMemo(() => {
    const prev = new Date(activeMonth.getFullYear(), activeMonth.getMonth() - 1, 1);
    return transactions.filter(tx => {
      if (tx.type !== 'expense') return false;
      const d = parseDate(tx.date);
      return !isNaN(d.getTime()) && d.getFullYear() === prev.getFullYear() && d.getMonth() === prev.getMonth();
    });
  }, [transactions, activeMonth]);

  const totalSpent = useMemo(() => monthExpenses.reduce((s, tx) => s + tx.amount, 0), [monthExpenses]);
  const prevTotalSpent = useMemo(() => prevMonthExpenses.reduce((s, tx) => s + tx.amount, 0), [prevMonthExpenses]);

  const pctChange = prevTotalSpent > 0 ? ((totalSpent - prevTotalSpent) / prevTotalSpent) * 100 : 0;
  const pctChangeStr = Math.abs(Math.round(pctChange)) + '%';

  const categoryTotals = useMemo(() => {
    const map: Record<string, number> = {};
    monthExpenses.forEach(tx => { map[tx.category] = (map[tx.category] ?? 0) + tx.amount; });
    return Object.entries(map)
      .map(([cat, amt]) => ({ category: cat as Category, amount: amt }))
      .sort((a, b) => b.amount - a.amount);
  }, [monthExpenses]);

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

    // Group by ~5 intervals to make a smooth chart
    const intervals = 5;
    const intervalSize = Math.ceil(daysInMonth / intervals);
    const aggregatedData = new Array(intervals).fill(0);

    monthExpenses.forEach(tx => {
      const d = parseDate(tx.date);
      if (!isNaN(d.getTime())) {
        const day = d.getDate() - 1;
        const bucket = Math.min(Math.floor(day / intervalSize), intervals - 1);
        aggregatedData[bucket] += tx.amount;
      }
    });

    const labels = [
      `1 ${MONTH_SHORT[mo]}`,
      `8 ${MONTH_SHORT[mo]}`,
      `15 ${MONTH_SHORT[mo]}`,
      `22 ${MONTH_SHORT[mo]}`,
      `31 ${MONTH_SHORT[mo]}`,
    ];

    return { trendData: aggregatedData, trendLabels: labels };
  }, [monthExpenses, activeMonth]);

  // Metrics Logic
  const daysPassed = (activeMonth.getMonth() === now.getMonth() && activeMonth.getFullYear() === now.getFullYear()) ? now.getDate() : new Date(activeMonth.getFullYear(), activeMonth.getMonth() + 1, 0).getDate();
  const dailyAvg = totalSpent / Math.max(daysPassed, 1);

  let biggestExpense = null;
  if (monthExpenses.length > 0) {
    biggestExpense = monthExpenses.reduce((prev, current) => (prev.amount > current.amount) ? prev : current);
  }

  const budgetLeft = monthlyBudget - totalSpent;
  const budgetPct = monthlyBudget > 0 ? Math.round((totalSpent / monthlyBudget) * 100) : 0;
  const topCat = categoryTotals[0];

  return (
    <SafeAreaView style={styles.safe}>
      <RNStatusBar barStyle="light-content" backgroundColor="#09090B" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={{ width: 36 }} />
        <Text style={styles.headerTitle}>Analytics</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* ── Date Selector ── */}
      <View style={styles.dateSelectorWrap}>
        <TouchableOpacity style={styles.dateArrow} onPress={prevMonth}>
          <ChevronLeft size={16} color="#FFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.datePill}>
          <Text style={styles.dateText}>{monthLabel}</Text>
          <ChevronDown size={14} color="#888" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.dateArrow} onPress={nextMonth} disabled={isFutureMonth}>
          <ChevronRight size={16} color={isFutureMonth ? '#333' : '#FFF'} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Trend Card ── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Monthly Spending Trend</Text>
          </View>

          <Text style={styles.trendValue}>{sym}{totalSpent.toLocaleString('en-IN')}</Text>
          <Text style={styles.trendSub}>Total Spent in {MONTH_SHORT[activeMonth.getMonth()]}</Text>

          <View style={styles.trendBadgeRow}>
            <View style={[styles.badge, { backgroundColor: '#1A2E20', borderColor: '#22C55E' }]}>
              <ArrowDown size={12} color="#22C55E" />
              <Text style={styles.badgeText}>{pctChangeStr}</Text>
            </View>
            <Text style={styles.trendSubText}>vs {MONTH_SHORT[activeMonth.getMonth() === 0 ? 11 : activeMonth.getMonth() - 1]} {activeMonth.getFullYear()}</Text>
          </View>

          <SpendingLineChart data={trendData} labels={trendLabels} color="#22C55E" />
        </View>

        {/* ── Grid Cards ── */}
        <View style={styles.grid}>
          <MetricCard
            icon={<Activity size={20} color="#22C55E" />}
            title="Daily Average"
            value={`${sym}${Math.round(dailyAvg).toLocaleString('en-IN')}`}
            badgeText="10%" badgeColor="#22C55E" subtitle="vs Apr"
          />
          <MetricCard
            icon={<Briefcase size={20} color="#A855F7" />}
            title="Biggest Expense"
            value={biggestExpense ? `${sym}${biggestExpense.amount.toLocaleString('en-IN')}` : `${sym}0`}
            subtitle={biggestExpense ? <Text><Text style={{ color: '#A855F7' }}>{biggestExpense.category}</Text> • {parseDate(biggestExpense.date).getDate()} {MONTH_SHORT[parseDate(biggestExpense.date).getMonth()]}</Text> : "None"}
          />
          <MetricCard
            icon={<Wallet size={20} color="#EAB308" />}
            title="Budget Left"
            value={monthlyBudget > 0 ? `${sym}${Math.max(0, budgetLeft).toLocaleString('en-IN')}` : "No Budget"}
            subtitle={monthlyBudget > 0 ? <Text><Text style={{ color: '#22C55E' }}>{100 - budgetPct}%</Text> of {sym}{monthlyBudget.toLocaleString('en-IN')}</Text> : "Set a budget"}
          />
          <MetricCard
            icon={<PieChart size={20} color="#3B82F6" />}
            title="Top Category"
            value={topCat ? topCat.category : "None"}
            subtitle={topCat ? <Text><Text style={{ color: '#A855F7' }}>{sym}{topCat.amount.toLocaleString('en-IN')}</Text> • {totalSpent > 0 ? Math.round((topCat.amount / totalSpent) * 100) : 0}%</Text> : ""}
          />
        </View>

        {/* ── Category Breakdown ── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Category Breakdown</Text>
            <TouchableOpacity style={styles.filterBtn}>
              <Text style={styles.filterBtnText}>By Amount</Text>
              <ChevronDown size={14} color="#888" />
            </TouchableOpacity>
          </View>

          <View style={styles.breakdownContent}>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <DonutChart segments={donutSegments} total={totalSpent} currencySymbol={sym} />
            </View>

            <View style={styles.breakdownList}>
              {donutSegments.map((seg, i) => {
                const meta = categoryMeta[seg.label];
                return (
                  <View key={i} style={styles.breakdownRow}>
                    <View style={styles.breakdownLeft}>
                      {meta?.emoji ? <Text style={{ fontSize: 14, width: 20 }}>{meta.emoji}</Text> : <View style={[styles.breakdownDot, { backgroundColor: seg.color }]} />}
                      <Text style={styles.breakdownName} numberOfLines={1}>{seg.label}</Text>
                    </View>
                    <View style={styles.breakdownRight}>
                      <Text style={styles.breakdownAmt}>{sym}{seg.value.toLocaleString('en-IN')}</Text>
                      <Text style={styles.breakdownPct}>{seg.percent}%</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* ── Insight Card ── */}
        <View style={styles.insightCard}>
          <View style={styles.insightIcon}>
            <TrendingUp size={20} color="#22C55E" />
          </View>
          <View style={styles.insightTextWrap}>
            <Text style={styles.insightTitle}>Great job! 🎉</Text>
            <Text style={styles.insightSub}>You spent {pctChangeStr} less than last month.</Text>
          </View>
          <TouchableOpacity style={styles.insightBtn}>
            <Text style={styles.insightBtnText}>View Insights</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#09090B', paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#FFF' },
  headerIcon: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center', borderRadius: 18, backgroundColor: '#131315', borderWidth: 1, borderColor: '#27272A' },

  dateSelectorWrap: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 16, marginBottom: 20 },
  dateArrow: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#131315', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#27272A' },
  datePill: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#131315', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#27272A' },
  dateText: { color: '#FFF', fontSize: 14, fontWeight: '600' },

  scroll: { paddingHorizontal: 16, paddingBottom: 110 },

  card: { backgroundColor: '#131315', borderRadius: 20, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#27272A' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardTitle: { color: '#FFF', fontSize: 15, fontWeight: '600' },
  filterBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#09090B', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: '#27272A' },
  filterBtnText: { color: '#888', fontSize: 12, fontWeight: '500' },

  trendValue: { color: '#FFF', fontSize: 32, fontWeight: '800', letterSpacing: -1, marginBottom: 4 },
  trendSub: { color: '#888', fontSize: 13, marginBottom: 12 },
  trendBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, borderWidth: 1 },
  badgeText: { color: '#22C55E', fontSize: 12, fontWeight: '700' },
  trendSubText: { color: '#888', fontSize: 12 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  metricCard: { flex: 1, minWidth: '45%', backgroundColor: '#131315', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#27272A' },
  metricIconWrap: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#1A2E20', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  metricTitle: { color: '#888', fontSize: 12, marginBottom: 6 },
  metricValue: { color: '#FFF', fontSize: 20, fontWeight: '700', marginBottom: 6 },
  metricBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metricBadge: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  metricBadgeText: { fontSize: 11, fontWeight: '700' },
  metricSub: { color: '#888', fontSize: 11 },
  metricSubColored: { color: '#888', fontSize: 11 },

  breakdownContent: { flexDirection: 'row', alignItems: 'center', marginTop: 16 },
  breakdownList: { flex: 1, paddingLeft: 10, gap: 16 },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  breakdownLeft: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  breakdownDot: { width: 10, height: 10, borderRadius: 5 },
  breakdownName: { color: '#FFF', fontSize: 13, flex: 1 },
  breakdownRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  breakdownAmt: { color: '#FFF', fontSize: 13, fontWeight: '600' },
  breakdownPct: { color: '#888', fontSize: 13, width: 30, textAlign: 'right' },

  insightCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#131315', padding: 16, borderRadius: 20, borderWidth: 1, borderColor: '#27272A' },
  insightIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1A2E20', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  insightTextWrap: { flex: 1 },
  insightTitle: { color: '#22C55E', fontSize: 14, fontWeight: '700', marginBottom: 2 },
  insightSub: { color: '#888', fontSize: 12 },
  insightBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: '#1A2E20', backgroundColor: '#0B1F11' },
  insightBtnText: { color: '#22C55E', fontSize: 12, fontWeight: '600' },
});
