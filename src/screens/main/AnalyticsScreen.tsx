import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, Platform,
  StatusBar as RNStatusBar, ScrollView, TouchableOpacity, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useStore } from '../../store/useStore';
import { useThemeColors } from '../../theme/colors';
import { getCategoryColor, getCategoryIcon, Category, getCurrencySymbol } from '../../utils/mockData';
import { DonutChart } from '../../components/DonutChart';
import { ChevronLeft, ChevronRight, ReceiptText, Activity, Briefcase, Wallet, PieChart, ArrowDown } from 'lucide-react-native';
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
const SpendingLineChart = ({ data, labels, color, gridColor, textColor }: { data: number[]; labels: string[]; color: string; gridColor: string; textColor: string; }) => {
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
        <Path d={`M ${padX} ${padY} L ${W} ${padY}`} stroke={gridColor} strokeWidth={1} />
        <Path d={`M ${padX} ${padY + chartH / 2} L ${W} ${padY + chartH / 2}`} stroke={gridColor} strokeWidth={1} />
        <Path d={`M ${padX} ${padY + chartH} L ${W} ${padY + chartH}`} stroke={gridColor} strokeWidth={1} />

        {hasData && <Path d={areaPath} fill="url(#lg)" />}
        <Path d={linePath} fill="none" stroke={hasData ? color : gridColor} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />

        {hasData && pts.filter((_, i) => i === 0 || i === Math.floor(pts.length / 2) || i === pts.length - 1).map((p, i) => (
          <Circle key={i} cx={p.x} cy={p.y} r={4} fill={color} stroke="#FFF" strokeWidth={2} />
        ))}
      </Svg>

      <View style={{ position: 'absolute', top: padY - 8, left: 0 }}>
        <Text style={{ color: textColor, fontSize: 10 }}>{formatY(max)}</Text>
      </View>
      <View style={{ position: 'absolute', top: padY + chartH / 2 - 8, left: 0 }}>
        <Text style={{ color: textColor, fontSize: 10 }}>{formatY(max / 2)}</Text>
      </View>
      <View style={{ position: 'absolute', top: padY + chartH - 8, left: 0 }}>
        <Text style={{ color: textColor, fontSize: 10 }}>0</Text>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginLeft: padX, marginTop: 4 }}>
        {labels.map((l, i) => (
          <Text key={i} style={{ color: textColor, fontSize: 10 }}>{l}</Text>
        ))}
      </View>
    </View>
  );
};

// ── Metric Card ──────────────────────────────────────────────────────────────
const MetricCard = ({ icon, title, value, subtitle, badgeText, badgeColor, colors }: any) => (
  <View style={[styles.metricCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
    <View style={[styles.metricIconWrap, { backgroundColor: 'rgba(34,197,94,0.1)' }]}>{icon}</View>
    <Text style={[styles.metricTitle, { color: colors.textSecondary }]}>{title}</Text>
    <Text style={[styles.metricValue, { color: colors.textPrimary }]}>{value}</Text>
    {badgeText ? (
      <View style={styles.metricBadgeRow}>
        <View style={styles.metricBadge}>
          <ArrowDown size={10} color={badgeColor || "#22C55E"} />
          <Text style={[styles.metricBadgeText, { color: badgeColor || "#22C55E" }]}>{badgeText}</Text>
        </View>
        <Text style={[styles.metricSub, { color: colors.textSecondary }]} numberOfLines={2}>{subtitle}</Text>
      </View>
    ) : (
      <Text style={[styles.metricSubColored, { color: colors.textSecondary }]} numberOfLines={2}>{subtitle}</Text>
    )}
  </View>
);

// ── Main ─────────────────────────────────────────────────────────────────────
export const AnalyticsScreen = () => {
  const C = useThemeColors();
  const theme = useStore(s => s.theme);
  const transactions = useStore(s => s.transactions);
  const currency = useStore(s => s.currency);
  const categoryMeta = useStore(s => s.categoryMeta);
  const monthlyBudget = useStore(s => s.monthlyBudget);
  const sym = getCurrencySymbol(currency);

  const [activeMonth, setActiveMonth] = useState(new Date());
  const monthLabel = `${MONTH_NAMES[activeMonth.getMonth()]} ${activeMonth.getFullYear()}`;

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

  const prevMonthTotal = useMemo(() => {
    const pm = new Date(activeMonth.getFullYear(), activeMonth.getMonth() - 1, 1);
    return transactions.filter(tx => {
      if (tx.type !== 'expense') return false;
      const d = parseDate(tx.date);
      return !isNaN(d.getTime()) && d.getFullYear() === pm.getFullYear() && d.getMonth() === pm.getMonth();
    }).reduce((s, tx) => s + tx.amount, 0);
  }, [transactions, activeMonth]);

  const pctChange = prevMonthTotal > 0 ? Math.round(((totalSpent - prevMonthTotal) / prevMonthTotal) * 100) : 0;
  const pctChangeStr = `${Math.abs(pctChange)}%`;

  const daysInMonth = new Date(activeMonth.getFullYear(), activeMonth.getMonth() + 1, 0).getDate();
  const currentDay = (activeMonth.getFullYear() === now.getFullYear() && activeMonth.getMonth() === now.getMonth()) ? now.getDate() : daysInMonth;
  const dailyAvg = totalSpent / Math.max(currentDay, 1);

  const biggestExpense = useMemo(() => {
    if (monthExpenses.length === 0) return null;
    return [...monthExpenses].sort((a, b) => b.amount - a.amount)[0];
  }, [monthExpenses]);

  const categoryTotals = useMemo(() => {
    const map: Record<string, number> = {};
    monthExpenses.forEach(tx => { map[tx.category] = (map[tx.category] ?? 0) + tx.amount; });
    return Object.entries(map).map(([k, v]) => ({
      category: k,
      amount: v,
      color: categoryMeta[k]?.color ?? getCategoryColor(k as any),
    })).sort((a, b) => b.amount - a.amount);
  }, [monthExpenses, categoryMeta]);

  const topCat = categoryTotals[0] || null;

  const donutSegments = useMemo(() => {
    if (totalSpent === 0) return [];
    return categoryTotals.slice(0, 5).map(c => ({
      label: c.category,
      value: c.amount,
      color: c.color,
      percent: Math.round((c.amount / totalSpent) * 100),
    }));
  }, [categoryTotals, totalSpent]);

  const trendData = useMemo(() => {
    const weeks = [0, 0, 0, 0];
    monthExpenses.forEach(tx => {
      const d = parseDate(tx.date);
      if (!isNaN(d.getTime())) {
        const day = d.getDate();
        const wIdx = Math.min(Math.floor((day - 1) / 7), 3);
        weeks[wIdx] += tx.amount;
      }
    });
    return weeks;
  }, [monthExpenses]);
  const trendLabels = ['W1', 'W2', 'W3', 'W4'];

  const budgetLeft = monthlyBudget - totalSpent;
  const budgetPct = monthlyBudget > 0 ? Math.round((totalSpent / monthlyBudget) * 100) : 0;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: C.background }]} edges={['top', 'bottom']}>
      <RNStatusBar barStyle={theme === 'light' ? 'dark-content' : 'light-content'} backgroundColor={C.background} />

      <View style={styles.header}>
        <View style={{ width: 36 }} />
        <Text style={[styles.headerTitle, { color: C.textPrimary }]}>Analytics</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.dateSelectorWrap}>
        <TouchableOpacity style={[styles.dateArrow, { backgroundColor: C.surface, borderColor: C.border }]} onPress={prevMonth}>
          <ChevronLeft size={16} color={C.textPrimary} />
        </TouchableOpacity>
        <View style={[styles.datePill, { backgroundColor: C.surface, borderColor: C.border }]}>
          <Text style={[styles.dateText, { color: C.textPrimary }]}>{monthLabel}</Text>
        </View>
        <TouchableOpacity style={[styles.dateArrow, { backgroundColor: C.surface, borderColor: C.border }]} onPress={nextMonth} disabled={isFutureMonth}>
          <ChevronRight size={16} color={isFutureMonth ? C.textMuted : C.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={[styles.card, { backgroundColor: C.surface, borderColor: C.border }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: C.textPrimary }]}>Monthly Spending Trend</Text>
          </View>

          <Text style={[styles.trendValue, { color: C.textPrimary }]}>{sym}{totalSpent.toLocaleString('en-IN')}</Text>
          <Text style={[styles.trendSub, { color: C.textSecondary }]}>Total Spent in {MONTH_SHORT[activeMonth.getMonth()]}</Text>

          <View style={styles.trendBadgeRow}>
            <View style={[styles.badge, { backgroundColor: 'rgba(34,197,94,0.1)', borderColor: '#22C55E' }]}>
              <ArrowDown size={12} color="#22C55E" />
              <Text style={styles.badgeText}>{pctChangeStr}</Text>
            </View>
            <Text style={[styles.trendSubText, { color: C.textSecondary }]}>vs {MONTH_SHORT[activeMonth.getMonth() === 0 ? 11 : activeMonth.getMonth() - 1]} {activeMonth.getFullYear()}</Text>
          </View>

          <SpendingLineChart data={trendData} labels={trendLabels} color="#22C55E" gridColor={C.border} textColor={C.textSecondary} />
        </View>

        <View style={styles.grid}>
          <MetricCard
            icon={<Activity size={20} color="#22C55E" />}
            title="Daily Average"
            value={`${sym}${Math.round(dailyAvg).toLocaleString('en-IN')}`}
            badgeText="10%" badgeColor="#22C55E" subtitle="vs Apr"
            colors={C}
          />
          <MetricCard
            icon={<Briefcase size={20} color="#A855F7" />}
            title="Biggest Expense"
            value={biggestExpense ? `${sym}${biggestExpense.amount.toLocaleString('en-IN')}` : `${sym}0`}
            subtitle={biggestExpense ? `${biggestExpense.category} • ${parseDate(biggestExpense.date).getDate()} ${MONTH_SHORT[parseDate(biggestExpense.date).getMonth()]}${biggestExpense.time ? '\n' + biggestExpense.time : ''}` : "None"}
            colors={C}
          />
          <MetricCard
            icon={<Wallet size={20} color="#EAB308" />}
            title="Budget Left"
            value={monthlyBudget > 0 ? `${sym}${Math.max(0, budgetLeft).toLocaleString('en-IN')}` : "No Budget"}
            subtitle={monthlyBudget > 0 ? `${100 - budgetPct}% of ${sym}${monthlyBudget.toLocaleString('en-IN')}` : "Set a budget"}
            colors={C}
          />
          <MetricCard
            icon={<PieChart size={20} color="#3B82F6" />}
            title="Top Category"
            value={topCat ? topCat.category : "None"}
            subtitle={topCat ? `${sym}${topCat.amount.toLocaleString('en-IN')} • ${totalSpent > 0 ? Math.round((topCat.amount / totalSpent) * 100) : 0}%` : ""}
            colors={C}
          />
        </View>

        <View style={[styles.card, { backgroundColor: C.surface, borderColor: C.border }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: C.textPrimary }]}>Category Breakdown</Text>
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
                      <Text style={[styles.breakdownName, { color: C.textPrimary }]} numberOfLines={1}>{seg.label}</Text>
                    </View>
                    <View style={styles.breakdownRight}>
                      <Text style={[styles.breakdownAmt, { color: C.textPrimary }]}>{sym}{seg.value.toLocaleString('en-IN')}</Text>
                      <Text style={[styles.breakdownPct, { color: C.textSecondary }]}>{seg.percent}%</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  headerTitle: { fontSize: 20, fontWeight: '700' },

  dateSelectorWrap: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 16, marginBottom: 20 },
  dateArrow: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  datePill: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  dateText: { fontSize: 14, fontWeight: '600' },

  scroll: { paddingHorizontal: 16, paddingBottom: 110 },

  card: { borderRadius: 20, padding: 16, marginBottom: 16, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardTitle: { fontSize: 15, fontWeight: '600' },

  trendValue: { fontSize: 32, fontWeight: '800', letterSpacing: -1, marginBottom: 4 },
  trendSub: { fontSize: 13, marginBottom: 12 },
  trendBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, borderWidth: 1 },
  badgeText: { color: '#22C55E', fontSize: 12, fontWeight: '700' },
  trendSubText: { fontSize: 12 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  metricCard: { flex: 1, minWidth: '45%', borderRadius: 20, padding: 16, borderWidth: 1 },
  metricIconWrap: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  metricTitle: { fontSize: 12, marginBottom: 6 },
  metricValue: { fontSize: 20, fontWeight: '700', marginBottom: 6 },
  metricBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metricBadge: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  metricBadgeText: { fontSize: 11, fontWeight: '700' },
  metricSub: { fontSize: 11, lineHeight: 15 },
  metricSubColored: { fontSize: 11, lineHeight: 15 },

  breakdownContent: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  breakdownList: { flex: 1.2, paddingLeft: 14, gap: 12 },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  breakdownLeft: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  breakdownDot: { width: 10, height: 10, borderRadius: 5 },
  breakdownName: { fontSize: 13, fontWeight: '500', flex: 1 },
  breakdownRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  breakdownAmt: { fontSize: 13, fontWeight: '700' },
  breakdownPct: { fontSize: 12.5, fontWeight: '600', minWidth: 42, textAlign: 'right' },
});
