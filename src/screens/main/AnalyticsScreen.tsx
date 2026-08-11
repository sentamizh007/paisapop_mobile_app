import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, Platform, StatusBar as RNStatusBar, ScrollView, TouchableOpacity } from 'react-native';
import { ChevronLeft, ChevronRight, ArrowUp, ArrowDown } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { Card } from '../../components/Card';
import { DonutChart } from '../../components/DonutChart';
import { BarChart } from '../../components/BarChart';
import { useStore } from '../../store/useStore';

export const AnalyticsScreen = () => {
  const transactions = useStore(state => state.transactions);
  
  // Calculate total spent for all time (simplified for demonstration)
  const totalSpent = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  // Simple mock calculation for trend data (would typically group by day)
  const trendData = [0, 0, 0, 0, 0, 0, totalSpent > 0 ? totalSpent : 100]; // Just placing total on the last day if exists
  const trendLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Analytics</Text>
        <View style={styles.monthSelector}>
          <TouchableOpacity style={styles.iconBtn}>
            <ChevronLeft size={16} color={colors.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.monthText}>All Time</Text>
          <TouchableOpacity style={styles.iconBtn}>
            <ChevronRight size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <Card style={styles.mainCard}>
          <View style={styles.donutContainer}>
            <DonutChart total={totalSpent} />
          </View>
          {totalSpent > 0 ? (
            <View style={styles.trendPill}>
              <ArrowUp size={14} color={colors.danger} />
              <Text style={styles.trendText}>+12% vs Last Month</Text>
            </View>
          ) : (
            <View style={[styles.trendPill, { backgroundColor: colors.successBg }]}>
              <ArrowDown size={14} color={colors.success} />
              <Text style={[styles.trendText, { color: colors.success }]}>No spending yet</Text>
            </View>
          )}
        </Card>

        <Card style={styles.chartCard}>
          <Text style={styles.chartTitle}>Spending Trend (7 Days)</Text>
          <BarChart data={trendData} labels={trendLabels} />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '700',
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 8,
  },
  monthText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  iconBtn: {
    padding: 2,
  },
  container: {
    padding: 24,
    paddingBottom: 40,
  },
  mainCard: {
    alignItems: 'center',
    paddingVertical: 32,
    marginBottom: 24,
  },
  donutContainer: {
    marginBottom: 24,
  },
  trendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dangerBg,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  trendText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '600',
  },
  chartCard: {
    padding: 20,
  },
  chartTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 24,
  },
});
