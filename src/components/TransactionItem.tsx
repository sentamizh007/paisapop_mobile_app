import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../theme/colors';
import { Transaction, getCategoryIcon, getCategoryColor } from '../utils/mockData';

interface TransactionItemProps {
  transaction: Transaction;
  onPress?: (id: string) => void;
}

export const TransactionItem = ({ transaction, onPress }: TransactionItemProps) => {
  const bgColor = getCategoryColor(transaction.category);

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={() => onPress?.(transaction.id)}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      <View style={styles.leftContent}>
        <View style={[styles.iconContainer, { backgroundColor: bgColor + '33' }]}> 
          {/* + '33' adds 20% opacity in hex */}
          {getCategoryIcon(transaction.category, bgColor, 20)}
        </View>
        <View style={styles.detailsContainer}>
          <Text style={styles.title}>{transaction.title}</Text>
          <Text style={styles.category}>{transaction.category === 'Food' ? 'Food & Dining' : transaction.category}</Text>
        </View>
      </View>
      
      <View style={styles.rightContent}>
        <Text style={styles.amount}>₹{transaction.amount.toLocaleString('en-IN')}</Text>
        <Text style={styles.date}>{transaction.date}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  detailsContainer: {
    flex: 1,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  category: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  rightContent: {
    alignItems: 'flex-end',
  },
  amount: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  date: {
    color: colors.textSecondary,
    fontSize: 13,
  },
});
