import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, Platform, StatusBar as RNStatusBar, ScrollView, TouchableOpacity } from 'react-native';
import { Search, Plus } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { getCategoryIcon, getCategoryColor } from '../../utils/mockData';
import { useStore } from '../../store/useStore';

export const CategoriesScreen = () => {
  const transactions = useStore(state => state.transactions);

  // Group transactions by category and sum amounts
  const categorySums = transactions.reduce((acc, tx) => {
    if (tx.type === 'expense') {
      if (!acc[tx.category]) {
        acc[tx.category] = 0;
      }
      acc[tx.category] += tx.amount;
    }
    return acc;
  }, {} as Record<string, number>);

  const categoryData = Object.keys(categorySums).map(catName => ({
    name: catName,
    amount: categorySums[catName],
    originalName: catName as any
  }));

  // Default categories if nothing exists
  if (categoryData.length === 0) {
    categoryData.push(
      { name: 'Food & Dining', amount: 0, originalName: 'Food' as any },
      { name: 'Transport', amount: 0, originalName: 'Transport' as any },
      { name: 'Shopping', amount: 0, originalName: 'Shopping' as any },
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Categories</Text>
        <TouchableOpacity style={styles.iconBtn}>
          <Search color={colors.textPrimary} size={24} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.grid}>
          {categoryData.map((item, index) => {
            const color = getCategoryColor(item.originalName);
            return (
              <View key={index} style={styles.card}>
                <View style={[styles.iconContainer, { backgroundColor: color + '33' }]}>
                  {getCategoryIcon(item.originalName, color, 20)}
                </View>
                <Text style={styles.categoryName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.categoryAmount}>₹{item.amount.toLocaleString('en-IN')}</Text>
              </View>
            );
          })}
        </View>

        <TouchableOpacity style={styles.addBtn}>
          <Plus size={16} color={colors.primary} style={{ marginRight: 8 }} />
          <Text style={styles.addBtnText}>Add Custom Category</Text>
        </TouchableOpacity>
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
  container: {
    padding: 24,
    paddingBottom: 40,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  card: {
    width: '30%', 
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryName: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 8,
  },
  categoryAmount: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  addBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    backgroundColor: '#10B98111', 
  },
  addBtnText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});
