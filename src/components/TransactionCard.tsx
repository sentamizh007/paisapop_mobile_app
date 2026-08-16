import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FileText, ArrowRightLeft } from 'lucide-react-native';
import { getCategoryColor, getCategoryIcon, Category, Transaction } from '../utils/mockData';

interface Props {
  tx: Transaction;
  colors: any;
  currencySymbol: string;
  confirmDelete: (id: string, name: string) => void;
  formatDisplayDate: (d: string) => string;
  categoryMeta?: Record<string, {emoji: string; color: string}>;
  isOverBudget?: boolean;
}

export const TransactionCard = React.memo(({
  tx, colors, currencySymbol, confirmDelete, formatDisplayDate, categoryMeta, isOverBudget
}: Props) => {
  const isIncome   = tx.type === 'income';
  const isTransfer = tx.type === 'transfer';
  const amtPrefix  = isIncome ? '+' : isTransfer ? '' : '';
  const amtColor   = isIncome ? colors.income : isTransfer ? '#14B8A6' : colors.expense;
  const meta = categoryMeta?.[tx.category];
  const col  = isTransfer ? '#14B8A6' : (meta?.color ?? getCategoryColor(tx.category as Category) ?? '#FFFFFF');

  const getPaymentEmoji = (method?: string) => {
    switch (method) {
      case 'Cash': return '💵';
      case 'Card': return '💳';
      case 'UPI': return '📱';
      case 'Bank': return '🏦';
      default: return '';
    }
  };

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.surface }]}
      onLongPress={() => confirmDelete(tx.id, tx.category)}
      activeOpacity={0.78}
      delayLongPress={280}
    >
      {/* ── Icon ── */}
      <View style={[styles.iconWrap, { backgroundColor: col + '1E' }]}>
        {isTransfer ? (
          <ArrowRightLeft size={19} color="#14B8A6" strokeWidth={2} />
        ) : meta?.emoji ? (
          <Text style={{ fontSize: 19 }}>{meta.emoji}</Text>
        ) : (
          getCategoryIcon(tx.category as Category, col, 19)
        )}
      </View>

      {/* ── Center info ── */}
      <View style={styles.info}>
        <View style={styles.titleRow}>
          <Text style={[styles.category, { color: colors.textPrimary }]} numberOfLines={1}>
            {tx.category}
          </Text>
          {isOverBudget && !isIncome && !isTransfer ? (
            <View style={[styles.badge, { backgroundColor: colors.expense + '20', marginRight: 6 }]}>
              <Text style={[styles.badgeText, { color: colors.expense }]}>Over Limit</Text>
            </View>
          ) : null}
          {/* Credit / Debit / Transfer badge */}
          <View style={[styles.badge, {
            backgroundColor: isTransfer ? '#14B8A6' + '20' : isIncome ? colors.income + '18' : colors.expense + '18',
          }]}>
            <Text style={[styles.badgeText, { color: amtColor }]}>
              {isTransfer ? '⇄ Transfer' : isIncome ? 'Income' : 'Expense'}
            </Text>
          </View>
        </View>
        <Text style={[styles.time, { color: colors.textSecondary }]}>
          {tx.paymentMethod ? `${getPaymentEmoji(tx.paymentMethod)} ${tx.paymentMethod} • ` : ''}
          {tx.time ? tx.time : formatDisplayDate(tx.date)}
        </Text>
      </View>

      {/* ── Right: amount + note ── */}
      <View style={styles.right}>
        <Text style={[styles.amount, { color: amtColor }]} numberOfLines={1}>
          {amtPrefix}{currencySymbol}
          {tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Text>
        {tx.notes ? (
          <View style={styles.noteRow}>
            <FileText size={10} color={colors.textMuted ?? colors.textSecondary} />
            <Text
              style={[styles.noteText, { color: colors.textSecondary }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {tx.notes}
            </Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 16,
    marginBottom: 8,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  info: { flex: 1, minWidth: 0 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 3 },
  category: { fontSize: 14, fontWeight: '600', flexShrink: 1 },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    flexShrink: 0,
  },
  badgeText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.3 },
  time: { fontSize: 12, fontWeight: '500' },

  // Right column — no maxWidth so note text can use available space
  right: { alignItems: 'flex-end', justifyContent: 'center', paddingLeft: 8, flexShrink: 0, maxWidth: 130 },
  amount: { fontSize: 14, fontWeight: '700', letterSpacing: -0.3 },
  noteRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 3 },
  noteText: { fontSize: 11, fontStyle: 'italic', flexShrink: 1 },
});
