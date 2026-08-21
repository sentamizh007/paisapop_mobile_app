import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Image, Dimensions } from 'react-native';
import { ArrowRightLeft, Receipt as ReceiptIcon, X } from 'lucide-react-native';
import { getCategoryColor, getCategoryIcon, Category, Transaction } from '../utils/mockData';

const { width: W } = Dimensions.get('window');

interface Props {
  tx: Transaction;
  colors?: any;
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
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  const isIncome   = tx.type === 'income';
  const isTransfer = tx.type === 'transfer';
  const amtPrefix  = isIncome ? '+' : isTransfer ? '' : '-';
  const amtColor   = isIncome ? '#22C55E' : isTransfer ? '#A855F7' : '#EF4444';
  const meta = categoryMeta?.[tx.category];
  const col  = isTransfer ? '#A855F7' : (meta?.color ?? getCategoryColor(tx.category as Category) ?? '#333');

  const bg = colors?.surface || '#131315';
  const border = colors?.border || '#27272A';
  const textPrimary = colors?.textPrimary || '#FFFFFF';
  const textSecondary = colors?.textSecondary || '#888888';
  const textMuted = colors?.textMuted || '#666666';

  return (
    <>
      <TouchableOpacity
        style={[
          styles.card,
          { backgroundColor: bg, borderColor: border },
          isFirst && styles.cardFirst,
          isLast && styles.cardLast,
          !isLast && { borderBottomWidth: 1, borderBottomColor: border }
        ]}
        onLongPress={() => confirmDelete(tx.id, tx.title || tx.category)}
        onPress={() => {
          if (tx.receipt) setShowReceiptModal(true);
        }}
        activeOpacity={0.78}
        delayLongPress={280}
      >
        {/* ── Icon ── */}
        <View style={[styles.iconWrap, { backgroundColor: isIncome ? 'rgba(34,197,94,0.15)' : isTransfer ? 'rgba(168,85,247,0.15)' : (meta?.color ? meta.color + '20' : 'rgba(99,102,241,0.15)') }]}>
          {isTransfer ? (
            <ArrowRightLeft size={19} color="#A855F7" strokeWidth={2} />
          ) : meta?.emoji ? (
            <Text style={{ fontSize: 19 }}>{meta.emoji}</Text>
          ) : (
            getCategoryIcon(tx.category as Category, isIncome ? '#22C55E' : '#A0A0A0', 19)
          )}
        </View>

        {/* ── Center info ── */}
        <View style={styles.info}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={[styles.title, { color: textPrimary }]} numberOfLines={1}>
              {tx.title || (isTransfer ? 'Transfer' : tx.category)}
            </Text>
            {!!tx.receipt && (
              <TouchableOpacity onPress={() => setShowReceiptModal(true)} style={styles.receiptBadge}>
                <ReceiptIcon size={11} color="#22C55E" />
              </TouchableOpacity>
            )}
          </View>
          <Text style={[styles.subtitle, { color: textSecondary }]} numberOfLines={1}>
            {isTransfer ? (
              tx.toPaymentMethod ? `${tx.paymentMethod || 'Wallet'} → ${tx.toPaymentMethod}` : (tx.paymentMethod ? `From: ${tx.paymentMethod}` : (tx.notes || 'Transfer'))
            ) : (
              `${tx.paymentMethod ? `${tx.paymentMethod} • ` : ''}${tx.notes ? tx.notes : tx.category}`
            )}
          </Text>
        </View>

        {/* ── Right info (Stacked Amount & Time) ── */}
        <View style={styles.right}>
          <Text
            style={[
              styles.amount,
              { color: isIncome ? '#22C55E' : isTransfer ? '#A855F7' : textPrimary }
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {amtPrefix} {currencySymbol}{tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
          </Text>
          <Text style={[styles.timeText, { color: textMuted }]}>
            {tx.time ? tx.time : '12:00 PM'}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Fullscreen Receipt Modal */}
      {!!tx.receipt && (
        <Modal visible={showReceiptModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalBox, { backgroundColor: bg, borderColor: border }]}>
              <View style={[styles.modalHead, { borderBottomColor: border }]}>
                <View>
                  <Text style={[styles.modalTitle, { color: textPrimary }]}>{tx.title || tx.category}</Text>
                  <Text style={{ color: textSecondary, fontSize: 12 }}>Receipt Image</Text>
                </View>
                <TouchableOpacity onPress={() => setShowReceiptModal(false)} style={styles.closeBtn}>
                  <X size={22} color={textPrimary} />
                </TouchableOpacity>
              </View>
              <Image source={{ uri: tx.receipt }} style={styles.fullReceiptImg} resizeMode="contain" />
            </View>
          </View>
        </Modal>
      )}
    </>
  );
});

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderLeftWidth: 1,
    borderRightWidth: 1,
  },
  cardFirst: { borderTopWidth: 1, borderTopLeftRadius: 16, borderTopRightRadius: 16, marginTop: 6 },
  cardLast: { borderBottomWidth: 1, borderBottomLeftRadius: 16, borderBottomRightRadius: 16, marginBottom: 14 },
  
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  info: { flex: 1, minWidth: 0, justifyContent: 'center' },
  title: { fontSize: 14.5, fontWeight: '600', marginBottom: 3 },
  subtitle: { fontSize: 11.5, fontWeight: '500' },

  right: { alignItems: 'flex-end', justifyContent: 'center', paddingLeft: 8, minWidth: 85 },
  timeText: { fontSize: 11, fontWeight: '500', marginTop: 3 },
  amount: { fontSize: 14.5, fontWeight: '700', letterSpacing: -0.3 },

  receiptBadge: { width: 18, height: 18, borderRadius: 5, backgroundColor: 'rgba(34,197,94,0.15)', justifyContent: 'center', alignItems: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalBox: { width: '100%', maxWidth: 450, maxHeight: '85%', borderRadius: 20, overflow: 'hidden', borderWidth: 1 },
  modalHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  modalTitle: { fontSize: 16, fontWeight: '700' },
  closeBtn: { padding: 4 },
  fullReceiptImg: { width: '100%', height: 380, marginVertical: 12 },
});

