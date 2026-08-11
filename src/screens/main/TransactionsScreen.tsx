import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Platform, StatusBar as RNStatusBar, TouchableOpacity, ScrollView } from 'react-native';
import { Download } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { TransactionItem } from '../../components/TransactionItem';
import { useNavigation } from '@react-navigation/native';
import { useStore } from '../../store/useStore';
import { Transaction } from '../../utils/mockData';

export const TransactionsScreen = () => {
  const navigation = useNavigation<any>();
  const transactions = useStore(state => state.transactions);
  const [activeTab, setActiveTab] = useState('All');
  
  const tabs = ['All', 'This Week', 'This Month'];

  // Basic grouping logic for UI demonstration
  const groupTransactions = (txs: Transaction[]) => {
    const grouped: { [key: string]: Transaction[] } = {};
    txs.forEach(tx => {
      if (!grouped[tx.date]) {
        grouped[tx.date] = [];
      }
      grouped[tx.date].push(tx);
    });
    return Object.keys(grouped).map(date => ({
      title: date,
      data: grouped[date]
    }));
  };

  const sections = groupTransactions(transactions);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Transactions</Text>
        <TouchableOpacity style={styles.iconBtn}>
          <Download color={colors.textPrimary} size={24} />
        </TouchableOpacity>
      </View>

      <View style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity 
            key={tab} 
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {sections.length === 0 ? (
          <Text style={styles.emptyText}>No transactions found.</Text>
        ) : (
          sections.map((section, index) => (
            <View key={index} style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <Text style={styles.sectionAmount}>
                  ₹{section.data.reduce((sum, tx) => sum + tx.amount, 0).toLocaleString('en-IN')}
                </Text>
              </View>
              {section.data.map(tx => (
                <TransactionItem 
                  key={tx.id} 
                  transaction={tx} 
                  onPress={(id) => navigation.navigate('TransactionDetails', { id })}
                />
              ))}
            </View>
          ))
        )}
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
  iconBtn: {
    padding: 4,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 16,
    gap: 12,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: colors.surface,
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  tabText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  activeTabText: {
    color: colors.background, // Dark text on primary button
    fontWeight: '600',
  },
  container: {
    padding: 24,
    paddingTop: 8,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  sectionAmount: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  emptyText: {
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
  }
});
