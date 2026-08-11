import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, Platform, StatusBar as RNStatusBar, ScrollView, TouchableOpacity } from 'react-native';
import { Bell, Search, Plus, ArrowUpRight, ArrowDownRight, MoreHorizontal } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { Card } from '../../components/Card';
import { TransactionItem } from '../../components/TransactionItem';
import { useNavigation } from '@react-navigation/native';
import { useStore } from '../../store/useStore';

export const HomeScreen = () => {
  const navigation = useNavigation<any>();
  const transactions = useStore(state => state.transactions);
  const userName = useStore(state => state.userName) || 'User';

  const totalSpent = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

  // Simplified circular progress logic just for UI effect
  const progressPercent = 75; // Mock for now, would be (totalSpent / budget) * 100

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{userName.charAt(0).toUpperCase()}</Text>
          </View>
          <View>
            <Text style={styles.greeting}>Good Morning,</Text>
            <Text style={styles.name}>{userName}</Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => navigation.navigate('Search')} style={styles.iconBtn}>
            <Search color={colors.textPrimary} size={24} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
            <Bell color={colors.textPrimary} size={24} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <Card style={styles.summaryCard}>
          <View style={styles.summaryTop}>
            <View>
              <Text style={styles.summaryLabel}>Total Spent (Aug)</Text>
              <Text style={styles.summaryAmount}>₹{totalSpent.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.progressCircle}>
              {/* This would be an SVG circular progress in reality */}
              <View style={styles.progressInner}>
                <Text style={styles.progressText}>{progressPercent}%</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={styles.actionBtn}
              onPress={() => navigation.navigate('AddExpense')}
            >
              <View style={[styles.actionIcon, { backgroundColor: colors.dangerBg }]}>
                <ArrowUpRight color={colors.danger} size={20} />
              </View>
              <Text style={styles.actionText}>Expense</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('AddExpense')}>
              <View style={[styles.actionIcon, { backgroundColor: colors.successBg }]}>
                <ArrowDownRight color={colors.success} size={20} />
              </View>
              <Text style={styles.actionText}>Income</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn}>
              <View style={[styles.actionIcon, { backgroundColor: colors.surfaceLight }]}>
                <MoreHorizontal color={colors.textPrimary} size={20} />
              </View>
              <Text style={styles.actionText}>More</Text>
            </TouchableOpacity>
          </View>
        </Card>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Transactions')}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.transactionsList}>
          {transactions.slice(0, 5).map((tx) => (
            <TransactionItem 
              key={tx.id} 
              transaction={tx} 
              onPress={(id) => navigation.navigate('TransactionDetails', { id })}
            />
          ))}
          {transactions.length === 0 && (
            <Text style={styles.emptyText}>No transactions yet. Add one!</Text>
          )}
        </View>
      </ScrollView>

      <TouchableOpacity 
        style={styles.fab}
        onPress={() => navigation.navigate('AddExpense')}
      >
        <Plus color={colors.textPrimary} size={32} />
      </TouchableOpacity>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  greeting: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  name: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 16,
  },
  iconBtn: {
    padding: 4,
  },
  container: {
    padding: 24,
    paddingBottom: 100, // For FAB
  },
  summaryCard: {
    marginBottom: 32,
  },
  summaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  summaryLabel: {
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: 4,
  },
  summaryAmount: {
    color: colors.textPrimary,
    fontSize: 32,
    fontWeight: '700',
  },
  progressCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 4,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderLeftColor: colors.surfaceLight, // mock progress
    borderBottomColor: colors.surfaceLight,
    transform: [{ rotate: '45deg' }],
  },
  progressInner: {
    transform: [{ rotate: '-45deg' }],
  },
  progressText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionBtn: {
    alignItems: 'center',
    gap: 8,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '500',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
  },
  seeAll: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  transactionsList: {
    gap: 12,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 20,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});
