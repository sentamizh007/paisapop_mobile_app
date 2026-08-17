import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ArrowRightLeft } from 'lucide-react-native';
import { getCategoryColor, getCategoryIcon, Category, Transaction } from '../utils/mockData';

interface Props {
  tx: Transaction;
  colors: any;
  currencySymbol: string;
  confirmDelete: (id: string, name: string) => void;
  formatDisplayDate: (d: string) => string;
  categoryMeta?: Record<string, {emoji: string; color: string}>;
  isFirst?: boolean;
  isLast?: boolean;
}

export const TransactionCard = React.memo(({
  tx, colors, currencySymbol, confirmDelete, formatDisplayDate, categoryMeta, isFirst, isLast
}: Props) => {
  const isIncome   = tx.type === 'income';
  const isTransfer = tx.type === 'transfer';
  const amtPrefix  = isIncome ? '+' : isTransfer ? '' : '-';
  const amtColor   = isIncome ? '#22C55E' : isTransfer ? '#14B8A6' : '#EF4444';
  const meta = categoryMeta?.[tx.category];
  const col  = isTransfer ? '#14B8A6' : (meta?.color ?? getCategoryColor(tx.category as Category) ?? '#333');

  return (
    <TouchableOpacity
      style={[
        styles.card,
        isFirst && styles.cardFirst,
        isLast && styles.cardLast,
        !isLast && styles.cardBorder
      ]}
      onLongPress={() => confirmDelete(tx.id, tx.title || tx.category)}
      activeOpacity={0.78}
      delayLongPress={280}
    >
      {/* ── Icon ── */}
      <View style={[styles.iconWrap, { backgroundColor: isIncome ? '#1A2E20' : (meta?.color ? meta.color + '20' : '#1F2937') }]}>
        {isTransfer ? (
          <ArrowRightLeft size={20} color="#14B8A6" strokeWidth={2} />
        ) : meta?.emoji ? (
          <Text style={{ fontSize: 20 }}>{meta.emoji}</Text>
        ) : (
          getCategoryIcon(tx.category as Category, isIncome ? '#22C55E' : '#A0A0A0', 20)
        )}
      </View>

      {/* ── Center info ── */}
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>
          {tx.title || tx.category}
        </Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {tx.paymentMethod ? `${tx.paymentMethod} • ` : ''}
          {tx.notes ? tx.notes : tx.category}
        </Text>
      </View>

      {/* ── Right info ── */}
      <View style={styles.right}>
        <Text style={styles.timeText}>{tx.time ? tx.time : '12:00 PM'}</Text>
        <View style={styles.amountWrap}>
          <Text style={styles.amount} numberOfLines={1}>
            {amtPrefix} {currencySymbol}{tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
          </Text>
          <View style={[styles.dot, { backgroundColor: amtColor }]} />
        </View>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#131315',
    borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#27272A',
  },
  cardFirst: { borderTopWidth: 1, borderTopLeftRadius: 16, borderTopRightRadius: 16, marginTop: 8 },
  cardLast: { borderBottomWidth: 1, borderBottomLeftRadius: 16, borderBottomRightRadius: 16, marginBottom: 16 },
  cardBorder: { borderBottomWidth: 1, borderBottomColor: '#27272A' },
  
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  info: { flex: 1, minWidth: 0, justifyContent: 'center' },
  title: { fontSize: 15, fontWeight: '600', color: '#FFFFFF', marginBottom: 4 },
  subtitle: { fontSize: 12, color: '#888', fontWeight: '500' },

  right: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingLeft: 8, flexShrink: 0 },
  timeText: { fontSize: 12, color: '#666', fontWeight: '500' },
  amountWrap: { flexDirection: 'row', alignItems: 'center', gap: 6, minWidth: 70, justifyContent: 'flex-end' },
  amount: { fontSize: 15, fontWeight: '700', color: '#FFFFFF', letterSpacing: -0.3 },
  dot: { width: 6, height: 6, borderRadius: 3 },
});
