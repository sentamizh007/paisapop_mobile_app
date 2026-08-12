import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FileText } from 'lucide-react-native';
import { getCategoryColor, getCategoryIcon, Category, Transaction } from '../utils/mockData';

interface Props {
  tx: Transaction;
  colors: any;
  currencySymbol: string;
  confirmDelete: (id: string, name: string) => void;
  formatDisplayDate: (ds: string) => string;
}

export const TransactionCard = ({
  tx,
  colors,
  currencySymbol,
  confirmDelete,
  formatDisplayDate,
}: Props) => {
  const col = getCategoryColor(tx.category as Category) ?? '#6366F1';

  return (
    <TouchableOpacity
      style={[styles.txCard, { backgroundColor: colors.surface }]}
      onLongPress={() => confirmDelete(tx.id, tx.category)}
      activeOpacity={0.8}
      delayLongPress={300}
    >
      <View style={[styles.txIcon, { backgroundColor: col + '15' }]}>
        {getCategoryIcon(tx.category as Category, col, 22)}
      </View>
      <View style={styles.txInfo}>
        <Text style={[styles.txCategory, { color: colors.textPrimary }]} numberOfLines={1}>
          {tx.category}
        </Text>
        <View style={styles.txMeta}>
          <Text style={[styles.txTime, { color: colors.textSecondary }]}>
            {tx.time ? tx.time : formatDisplayDate(tx.date)}
          </Text>
          {tx.notes ? (
            <View style={[styles.noteBadge, { backgroundColor: colors.primary + '15' }]}>
              <FileText size={10} color={colors.primary} />
            </View>
          ) : null}
        </View>
        {tx.notes ? (
          <Text style={[styles.txNote, { color: colors.textSecondary }]} numberOfLines={1}>
            {tx.notes}
          </Text>
        ) : null}
      </View>
      <View style={styles.txRight}>
        <Text style={[styles.txAmount, { color: colors.textPrimary }]}>
          {currencySymbol}{tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  txCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 24,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  txIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  txInfo: { flex: 1, justifyContent: 'center' },
  txCategory: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  txMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  txTime: { fontSize: 13, fontWeight: '500' },
  noteBadge: { paddingHorizontal: 6, paddingVertical: 3, borderRadius: 8 },
  txNote: { fontSize: 13, marginTop: 6, fontStyle: 'italic' },
  txRight: { alignItems: 'flex-end', justifyContent: 'center' },
  txAmount: { fontSize: 17, fontWeight: '800' },
});
