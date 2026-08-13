import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform,
  SafeAreaView, StatusBar as RNStatusBar, Modal, TextInput, Alert, Dimensions,
} from 'react-native';
import { Delete, FileText, X, ArrowDown, ArrowUp } from 'lucide-react-native';
import { useThemeColors } from '../../theme/colors';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { TabParamList } from '../../navigation/TabNavigator';
import { Category, getCategoryIcon, getCategoryColor } from '../../utils/mockData';
import { useStore } from '../../store/useStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: W, height: H } = Dimensions.get('window');
const isSmall = H < 700;

// Tab bar height constant — must match TabNavigator's TAB_H
const TAB_BAR_H = 60;

type TxType = 'expense' | 'income';

export const AddExpenseScreen = () => {
  const storeCategories = useStore(s => s.categories);
  const categoryMeta = useStore(s => s.categoryMeta);
  const categoryBudgets = useStore(s => s.categoryBudgets);
  const transactions = useStore(s => s.transactions);
  const addTransaction = useStore(s => s.addTransaction);
  const { isLoading, currency } = useStore();
  const C = useThemeColors();

  const navigation = useNavigation<BottomTabNavigationProp<TabParamList>>();

  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, Platform.OS === 'android' ? 6 : 0);

  const [amountStr, setAmountStr] = useState('0');
  const [selectedCategory, setSelectedCategory] = useState<string>(storeCategories[0] ?? 'Food');
  const [note, setNote] = useState('');
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [tempNote, setTempNote] = useState('');
  const [savedOk, setSavedOk] = useState(false);
  const [txType, setTxType] = useState<TxType>('expense');

  const sym = currency === 'USD' ? '$' : '₹';
  const isExpense = txType === 'expense';
  const accentColor = isExpense ? C.expense : C.income;

  // ── Keypad handler ─────────────────────────────────────────────────────────
  const handleKey = (key: string) => {
    setAmountStr(prev => {
      if (key === 'backspace') return prev.length > 1 ? prev.slice(0, -1) : '0';
      if (key === '.') return prev.includes('.') ? prev : prev + '.';
      if (prev === '0') return key;
      // Guard: max 10 chars, max 2 decimal places
      if (prev.includes('.') && prev.split('.')[1].length >= 2) return prev;
      if (prev.length >= 10) return prev;
      return prev + key;
    });
  };

  // ── Save ───────────────────────────────────────────────────────────────────
  const performSave = async (amt: number, dStr: string, tStr: string) => {
    try {
      await addTransaction({
        title: selectedCategory,
        amount: amt,
        category: selectedCategory as Category,
        date: dStr,
        time: tStr,
        type: txType,
        notes: note.trim() || undefined,
      });
      setAmountStr('0');
      setNote('');
      setSavedOk(true);
      setTimeout(() => {
        setSavedOk(false);
        navigation.navigate('History');
      }, 700);
    } catch {
      Alert.alert('Error', 'Failed to save. Please try again.');
    }
  };

  const handleSave = async () => {
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter an amount greater than zero.');
      return;
    }
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (txType === 'expense') {
      const budget = categoryBudgets[selectedCategory];
      if (budget) {
        const spent = transactions
          .filter(t => t.type === 'expense' && t.category === selectedCategory && new Date(t.date).getMonth() === now.getMonth() && new Date(t.date).getFullYear() === now.getFullYear())
          .reduce((acc, t) => acc + t.amount, 0);
        const limit = budget.period === 'weekly' ? budget.amount * 4 : budget.amount;
        if (spent + amount > limit) {
          if (Platform.OS === 'web') {
            const proceed = window.confirm(`This puts you over your limit for ${selectedCategory}. Save anyway?`);
            if (!proceed) return;
          } else {
            Alert.alert(
              'Over Budget',
              `This puts you over your limit for ${selectedCategory}. Save anyway?`,
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Save', onPress: () => performSave(amount, dateStr, timeStr) }
              ]
            );
            return;
          }
        }
      }
    }

    await performSave(amount, dateStr, timeStr);
  };

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'backspace'];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: C.background }]}>
      <RNStatusBar barStyle="light-content" backgroundColor={C.background} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: C.textPrimary }]}>Add Expense</Text>
      </View>

      {/* ── Amount card ── */}
      <View style={[styles.amountCard, { backgroundColor: C.surface }]}>
        {/* Amount — centered */}
        <Text style={[styles.amountLabel, { color: C.textSecondary }]}>
          {isExpense ? 'Amount to debit' : 'Amount to credit'}
        </Text>
        <Text
          style={[styles.amountText, { color: isExpense ? C.textPrimary : C.income }]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.5}
        >
          {sym}{amountStr}
        </Text>

        {/* Debit/Credit toggle + Note button — row */}
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={[styles.typeToggle, {
              backgroundColor: isExpense ? C.expense + '1A' : C.income + '1A',
              borderColor: accentColor + '40',
            }]}
            onPress={() => setTxType(p => p === 'expense' ? 'income' : 'expense')}
            activeOpacity={0.7}
          >
            {isExpense
              ? <ArrowDown size={13} color={C.expense} strokeWidth={2.5} />
              : <ArrowUp size={13} color={C.income} strokeWidth={2.5} />
            }
            <Text style={[styles.typeToggleText, { color: accentColor }]}>
              {isExpense ? 'Debit' : 'Credit'}
            </Text>
          </TouchableOpacity>

          {note ? (
            <Text style={[styles.notePreview, { color: C.textSecondary }]} numberOfLines={1}>
              📝 {note}
            </Text>
          ) : null}

          <TouchableOpacity
            style={[styles.noteBtn, {
              backgroundColor: note ? C.primary + '20' : C.surfaceMid,
              borderColor: note ? C.primary + '50' : 'transparent',
            }]}
            onPress={() => { setTempNote(note); setShowNoteModal(true); }}
            activeOpacity={0.7}
          >
            <FileText size={14} color={note ? C.primary : C.textSecondary} />
            <Text style={[styles.noteBtnLabel, { color: note ? C.primary : C.textSecondary }]}>
              {note ? '✓' : 'Note'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Category pills ── */}
      <View style={styles.categoryWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {storeCategories.map(item => {
            const meta = categoryMeta?.[item];
            const col = meta?.color ?? getCategoryColor(item as Category) ?? C.primary;
            const active = selectedCategory === item;
            return (
              <TouchableOpacity
                key={item}
                style={[
                  styles.categoryPill,
                  { backgroundColor: active ? col + '22' : C.surfaceMid },
                  active && { borderColor: col + '80' },
                ]}
                onPress={() => setSelectedCategory(item)}
                activeOpacity={0.65}
              >
                <View style={[styles.catIcon, { backgroundColor: col + '28' }]}>
                  {meta?.emoji ? (
                    <Text style={{ fontSize: 13 }}>{meta.emoji}</Text>
                  ) : (
                    getCategoryIcon(item as Category, col, 13)
                  )}
                </View>
                <Text style={[styles.catLabel, { color: active ? col : C.textSecondary }]}>
                  {item}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Keypad ── */}
      <View style={styles.keypad}>
        {keys.map(k => {
          const isDecimal = k === '.';
          const isBack = k === 'backspace';
          return (
            <TouchableOpacity
              key={k}
              style={[
                styles.key,
                { backgroundColor: isBack ? C.surfaceMid : C.surface },
              ]}
              onPress={() => handleKey(k)}
              activeOpacity={0.5}
            >
              {isBack
                ? <Delete color={C.textSecondary} size={18} strokeWidth={2} />
                : <Text style={[
                  styles.keyText,
                  { color: isDecimal ? C.textSecondary : C.textPrimary },
                ]}>
                  {k}
                </Text>
              }
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Save button ── */}
      <View style={[styles.footer, { paddingBottom: bottomPad + TAB_BAR_H + 8 }]}>
        <TouchableOpacity
          style={[styles.saveBtn, {
            backgroundColor: C.textPrimary,
            opacity: isLoading ? 0.7 : 1,
          }]}
          onPress={handleSave}
          disabled={isLoading || savedOk}
          activeOpacity={0.82}
        >
          <Text style={[styles.saveBtnText, { color: C.background }]}>
            {savedOk ? '✓  Saved!' : isLoading ? 'Saving…' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Note modal ── */}
      <Modal
        visible={showNoteModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowNoteModal(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: C.overlay }]}>
          <View style={[styles.noteSheet, { backgroundColor: C.surfaceElevated }]}>
            <View style={[styles.noteSheetHandle, { backgroundColor: C.border }]} />
            <View style={styles.noteSheetHeader}>
              <Text style={[styles.noteSheetTitle, { color: C.textPrimary }]}>Add a note</Text>
              <TouchableOpacity
                style={[styles.closeBtn, { backgroundColor: C.surfaceMid }]}
                onPress={() => setShowNoteModal(false)}
              >
                <X color={C.textSecondary} size={16} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={[styles.noteInput, {
                color: C.textPrimary,
                borderColor: C.border,
                backgroundColor: C.surfaceMid,
              }]}
              value={tempNote}
              onChangeText={setTempNote}
              placeholder="What was this for?"
              placeholderTextColor={C.textMuted}
              multiline
              maxLength={300}
              autoFocus
            />
            <Text style={[styles.charCount, { color: C.textMuted }]}>{tempNote.length}/300</Text>
            <View style={styles.noteActions}>
              {tempNote.length > 0 && (
                <TouchableOpacity
                  style={[styles.clearBtn, { borderColor: C.border }]}
                  onPress={() => { setNote(''); setTempNote(''); setShowNoteModal(false); }}
                >
                  <Text style={[styles.clearBtnText, { color: C.textSecondary }]}>Clear</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.saveNoteBtn, { backgroundColor: C.textPrimary }]}
                onPress={() => { setNote(tempNote); setShowNoteModal(false); }}
              >
                <Text style={[styles.saveNoteBtnText, { color: C.background }]}>Save Note</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// ── Dimensions ─────────────────────────────────────────────────────────────
const KEY_COLS = 3;
const KEYPAD_GAP = 6;
const KEYPAD_PX = 16;
const KEY_W = Math.floor((W - KEYPAD_PX * 2 - KEYPAD_GAP * (KEY_COLS - 1)) / KEY_COLS);
const KEY_H = isSmall ? 46 : 52;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
  },

  // ── Header ──
  header: {
    paddingHorizontal: 20,
    paddingTop: isSmall ? 4 : 8,
    paddingBottom: isSmall ? 4 : 6,
  },
  headerTitle: {
    fontSize: isSmall ? 17 : 19,
    fontWeight: '700',
    letterSpacing: -0.3,
  },

  // ── Amount card ──
  amountCard: {
    marginHorizontal: 16,
    borderRadius: 18,
    paddingHorizontal: isSmall ? 14 : 18,
    paddingTop: isSmall ? 14 : 18,
    paddingBottom: isSmall ? 12 : 14,
    marginBottom: isSmall ? 8 : 10,
  },
  amountLabel: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.3,
    textAlign: 'center',
    marginBottom: 2,
  },
  amountText: {
    fontSize: isSmall ? 36 : 42,
    fontWeight: '800',
    letterSpacing: -1.5,
    lineHeight: isSmall ? 42 : 50,
    textAlign: 'center',
    marginBottom: isSmall ? 8 : 10,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  typeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
    borderWidth: 1,
  },
  typeToggleText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.2 },
  notePreview: {
    fontSize: 11,
    fontStyle: 'italic',
    flex: 1,
    marginHorizontal: 8,
  },
  noteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
    borderWidth: 1,
  },
  noteBtnLabel: { fontSize: 11, fontWeight: '700' },

  // ── Categories ──
  categoryWrapper: {
    marginBottom: isSmall ? 6 : 8,
  },
  categoryScroll: { paddingHorizontal: 16, gap: 8 },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  catIcon: {
    width: 22,
    height: 22,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 5,
    overflow: 'hidden',
  },
  catLabel: { fontSize: 12, fontWeight: '600' },

  // ── Keypad ──
  keypad: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: KEYPAD_PX,
    gap: KEYPAD_GAP,
    alignContent: 'center',
    justifyContent: 'center',
  },
  key: {
    width: KEY_W,
    height: KEY_H,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyText: { fontSize: isSmall ? 20 : 22, fontWeight: '400' },

  // ── Save footer ──
  footer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  saveBtn: {
    borderRadius: 14,
    paddingVertical: isSmall ? 13 : 15,
    alignItems: 'center',
    width: '100%',
  },
  saveBtnText: { fontSize: 16, fontWeight: '700', letterSpacing: 0.2 },

  // ── Note modal ──
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  noteSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 44 : 28,
  },
  noteSheetHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  noteSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  noteSheetTitle: { fontSize: 18, fontWeight: '700' },
  closeBtn: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  noteInput: {
    minHeight: 100,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
    lineHeight: 22,
    textAlignVertical: 'top',
  },
  charCount: { fontSize: 11, textAlign: 'right', marginTop: 6, marginBottom: 18 },
  noteActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  clearBtn: { paddingHorizontal: 20, paddingVertical: 13, borderRadius: 12, borderWidth: 1 },
  clearBtnText: { fontSize: 14, fontWeight: '600' },
  saveNoteBtn: { paddingHorizontal: 24, paddingVertical: 13, borderRadius: 12 },
  saveNoteBtnText: { fontSize: 14, fontWeight: '700' },
});
