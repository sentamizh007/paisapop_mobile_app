import React, { useState, useMemo, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform,
  SafeAreaView, StatusBar as RNStatusBar, Dimensions, Alert, TextInput, Modal, Switch
} from 'react-native';
import {
  ChevronLeft, ReceiptText, ArrowDown, ArrowUp, ArrowRightLeft,
  FileText, User, CreditCard, Calendar, Clock, Tag, Receipt,
  Camera, Users, Delete, ChevronRight, X, Wallet, Banknote, Landmark, Smartphone, Check
} from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { TabParamList } from '../../navigation/TabNavigator';
import { Category, getCategoryIcon, getCategoryColor, getCurrencySymbol } from '../../utils/mockData';
import { useStore, Account } from '../../store/useStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MONTH_NAMES } from '../../utils/exportUtils';

const { width: W } = Dimensions.get('window');

type TxType = 'expense' | 'income' | 'transfer';

const formatTimeStr = (d: Date) => {
  let h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  h = h ? h : 12;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${ampm}`;
};

const getAccountIcon = (type: string, color: string, size = 20) => {
  switch (type) {
    case 'cash': return <Banknote size={size} color={color} />;
    case 'upi': return <Smartphone size={size} color={color} />;
    case 'bank': return <Landmark size={size} color={color} />;
    case 'credit': return <CreditCard size={size} color={color} />;
    case 'wallet': return <Wallet size={size} color={color} />;
    default: return <Wallet size={size} color={color} />;
  }
};

export const AddExpenseScreen = () => {
  const storeCategories = useStore(s => s.categories);
  const categoryMeta = useStore(s => s.categoryMeta);
  const addTransaction = useStore(s => s.addTransaction);
  const currency = useStore(s => s.currency);
  const transactions = useStore(s => s.transactions);
  const accounts = useStore(s => s.accounts);
  const setAccounts = useStore(s => s.setAccounts);

  const navigation = useNavigation<BottomTabNavigationProp<TabParamList>>();
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, Platform.OS === 'android' ? 6 : 0);

  const [amountStr, setAmountStr] = useState('0');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [txType, setTxType] = useState<TxType>('expense');
  const [paymentMode, setPaymentMode] = useState<string>('');
  const [toPaymentMode, setToPaymentMode] = useState<string>('');
  const [showAllCats, setShowAllCats] = useState(false);

  // New form states
  const [merchant, setMerchant] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showDateTimeDropdown, setShowDateTimeDropdown] = useState(false);
  const [useCustomTime, setUseCustomTime] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showAccountPicker, setShowAccountPicker] = useState<'from' | 'to' | 'mode' | null>(null);
  const [receiptUri, setReceiptUri] = useState<string | null>(null);
  const [splitWith, setSplitWith] = useState('');

  const sym = getCurrencySymbol(currency);
  const isExpense = txType === 'expense';
  const isIncome = txType === 'income';
  const isTransfer = txType === 'transfer';

  const suggestedMerchants = useMemo(() => {
    const defaults = [
      { name: 'Swiggy', icon: '🍔' },
      { name: 'Zomato', icon: '🍽️' },
      { name: 'Flipkart', icon: '🛍️' },
      { name: 'Amazon', icon: '📦' },
      { name: 'Uber', icon: '🚗' },
    ];

    const counts: Record<string, number> = {};
    transactions.forEach(t => {
      if (t.title && t.title !== t.category && !defaults.find(d => d.name.toLowerCase() === t.title.toLowerCase())) {
        counts[t.title] = (counts[t.title] || 0) + 1;
      }
    });

    const mostUsed = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(entry => ({ name: entry[0], icon: '🏪' }));

    return [...defaults, ...mostUsed];
  }, [transactions]);

  const mostUsedAccounts = useMemo(() => {
    const counts: Record<string, number> = {};
    transactions.forEach(t => {
      if (t.paymentMethod) counts[t.paymentMethod] = (counts[t.paymentMethod] || 0) + 1;
      if (t.toPaymentMethod) counts[t.toPaymentMethod] = (counts[t.toPaymentMethod] || 0) + 1;
    });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).map(entry => entry[0]);
    const allAccounts = accounts.map(a => a.name);
    const uniqueNames = Array.from(new Set([...sorted, ...allAccounts]));
    return uniqueNames.map(n => accounts.find(a => a.name === n)).filter(Boolean) as Account[];
  }, [transactions, accounts]);

  const getAccountIcon = (type: Account['type'], color: string, size = 14) => {
    switch (type) {
      case 'cash': return <Banknote size={size} color={color} />;
      case 'upi': return <Smartphone size={size} color={color} />;
      case 'bank': return <Landmark size={size} color={color} />;
      case 'credit': return <CreditCard size={size} color={color} />;
      case 'wallet': return <Wallet size={size} color={color} />;
      default: return <Wallet size={size} color={color} />;
    }
  };

  // ── Keypad handler ─────────────────────────────────────────────────────────
  const handleKey = (key: string) => {
    setAmountStr(prev => {
      if (key === 'backspace') return prev.length > 1 ? prev.slice(0, -1) : '0';
      if (key === '.') return prev.includes('.') ? prev : prev + '.';
      if (prev === '0') return key;
      if (prev.includes('.') && prev.split('.')[1].length >= 2) return prev;
      if (prev.length >= 10) return prev;
      return prev + key;
    });
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setReceiptUri(result.assets[0].uri);
    }
  };

  const showAlert = (title: string, msg: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${msg}`);
    } else {
      Alert.alert(title, msg);
    }
  };

  const handleSave = async () => {
    const amount = parseFloat(amountStr);

    if (isNaN(amount) || amount <= 0) {
      showAlert('Invalid Amount', 'Please enter an amount greater than zero.');
      return;
    }

    if (!paymentMode) {
      showAlert('Selection Required', 'Please select a payment account.');
      return;
    }

    if (txType === 'transfer' && !toPaymentMode) {
      showAlert('Selection Required', 'Please select the destination account.');
      return;
    }

    if (txType !== 'transfer' && !selectedCategory) {
      showAlert('Selection Required', 'Please select a category.');
      return;
    }

    const finalDate = useCustomTime ? date : new Date();
    const finalTime = useCustomTime ? time : new Date();

    const pad = (n: number) => n.toString().padStart(2, '0');
    const dateStr = `${finalDate.getFullYear()}-${pad(finalDate.getMonth() + 1)}-${pad(finalDate.getDate())}`;
    const timeStr = formatTimeStr(finalTime);

    try {
      await addTransaction({
        title: merchant.trim() || (txType === 'transfer' ? 'Transfer' : selectedCategory),
        amount,
        category: (txType === 'transfer' ? 'Transfer' : selectedCategory) as Category,
        date: dateStr,
        time: timeStr,
        type: txType,
        paymentMethod: paymentMode,
        toPaymentMethod: isTransfer ? toPaymentMode : undefined,
        notes: notes.trim() || undefined,
        receipt: receiptUri || undefined,
        splitWith: splitWith.trim() || undefined,
      });

      // Budget Warning Logic (90% threshold)
      const state = useStore.getState();
      if (txType === 'expense' && state.monthlyBudget > 0) {
        const d = new Date(dateStr);
        const monthExpenses = state.transactions.filter(t =>
          t.type === 'expense' &&
          new Date(t.date).getMonth() === d.getMonth() &&
          new Date(t.date).getFullYear() === d.getFullYear()
        ).reduce((sum, t) => sum + t.amount, 0) + amount; // including the one we just added

        const threshold = state.monthlyBudget * 0.9;

        if (monthExpenses >= threshold) {
          import('../../utils/notifications').then(({ sendLocalNotification }) => {
            const currencySymbol = state.currency === 'USD' ? '$' : (state.currency === 'INR' ? '₹' : '');
            sendLocalNotification(
              'Budget Warning!',
              `You have spent ${currencySymbol}${monthExpenses.toLocaleString()} this month, reaching over 90% of your ${currencySymbol}${state.monthlyBudget.toLocaleString()} budget limit.`
            );
          });
        }
      }

      setAmountStr('0');
      setMerchant('');
      setNotes('');
      setReceiptUri(null);
      setSelectedCategory('');
      setSplitWith('');
      navigation.navigate('History');
    } catch (e: any) {
      showAlert('Error Details', String(e.message || e));
    }
  };

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'backspace'];

  const FormRow = ({ icon, label, labelSub, value, rightIcon, rightPill, onPress }: any) => (
    <TouchableOpacity style={styles.formRow} activeOpacity={0.7} onPress={onPress}>
      <View style={styles.formRowLeft}>
        {icon}
        <Text style={styles.formRowLabel}>
          {label} {labelSub && <Text style={{ color: '#666', fontSize: 11 }}>{labelSub}</Text>}
        </Text>
      </View>
      <View style={styles.formRowRight}>
        {rightPill ? (
          <View style={styles.rightPill}>{rightPill}</View>
        ) : (
          <>
            {value && <Text style={styles.formRowValue}>{value}</Text>}
            {rightIcon ? rightIcon : <ChevronRight size={16} color="#666" />}
          </>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <RNStatusBar barStyle="light-content" backgroundColor="#09090B" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerIcon} onPress={() => navigation.navigate('History')}>
          <ChevronLeft size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Expense</Text>
        <View style={[styles.headerIcon, { opacity: 0 }]} />
      </View>

      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 80 }]} showsVerticalScrollIndicator={false}>

        {/* ── Segmented Control ── */}
        <View style={styles.segmentContainer}>
          <TouchableOpacity
            style={[styles.segmentBtn, isExpense && styles.segmentBtnActiveExpense]}
            onPress={() => setTxType('expense')}
            activeOpacity={0.7}
          >
            <ArrowDown size={14} color={isExpense ? '#22C55E' : '#888'} />
            <Text style={[styles.segmentText, isExpense ? { color: '#22C55E' } : { color: '#888' }]}>Expense</Text>
          </TouchableOpacity>

          <View style={styles.segmentDivider} />

          <TouchableOpacity
            style={[styles.segmentBtn, isIncome && styles.segmentBtnActiveIncome]}
            onPress={() => setTxType('income')}
            activeOpacity={0.7}
          >
            <ArrowUp size={14} color={isIncome ? '#3B82F6' : '#888'} />
            <Text style={[styles.segmentText, isIncome ? { color: '#3B82F6' } : { color: '#888' }]}>Income</Text>
          </TouchableOpacity>

          <View style={styles.segmentDivider} />

          <TouchableOpacity
            style={[styles.segmentBtn, isTransfer && styles.segmentBtnActiveTransfer]}
            onPress={() => setTxType('transfer')}
            activeOpacity={0.7}
          >
            <ArrowRightLeft size={14} color={isTransfer ? '#A855F7' : '#888'} />
            <Text style={[styles.segmentText, isTransfer ? { color: '#A855F7' } : { color: '#888' }]}>Transfer</Text>
          </TouchableOpacity>
        </View>

        {/* ── Amount Card ── */}
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>Amount to {isExpense ? 'debit' : isIncome ? 'credit' : 'transfer'}</Text>
          <Text style={styles.amountText} numberOfLines={1} adjustsFontSizeToFit>{sym}{amountStr}</Text>

          <View style={styles.amountActions}>
            <TouchableOpacity
              style={[
                styles.actionPillActive,
                {
                  borderColor: isTransfer ? '#A855F7' : (isExpense ? '#22C55E' : '#3B82F6'),
                  backgroundColor: isTransfer ? '#3B0764' : (isExpense ? '#1A2E20' : '#1E3A8A')
                }
              ]}
              onPress={() => setTxType(p => p === 'expense' ? 'income' : 'expense')}
            >
              {isTransfer ? <ArrowRightLeft size={12} color="#A855F7" /> : (isExpense ? <ArrowDown size={12} color="#22C55E" /> : <ArrowUp size={12} color="#3B82F6" />)}
              <Text style={[styles.actionPillActiveText, { color: isTransfer ? '#A855F7' : (isExpense ? '#22C55E' : '#3B82F6') }]}>
                {isTransfer ? 'Transfer' : (isExpense ? 'Debit' : 'Credit')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionPill, notes.length > 0 && { borderColor: '#FFF', backgroundColor: '#FFF' }]}
              onPress={() => setShowNoteModal(true)}
            >
              <FileText size={12} color={notes.length > 0 ? '#000' : '#888'} />
              <Text style={[styles.actionPillText, notes.length > 0 && { color: '#000', fontWeight: '700' }]}>{notes.length > 0 ? 'Note Added' : 'Note'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Category Scroll ── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll} contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}>
          {(showAllCats ? storeCategories : storeCategories.slice(0, 4)).map(cat => {
            const active = selectedCategory === cat;
            const meta = categoryMeta[cat];
            const col = meta?.color ?? getCategoryColor(cat as any);
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.catBtn, { backgroundColor: '#131315', borderColor: active ? col : '#27272A' }]}
                onPress={() => setSelectedCategory(cat)}
              >
                {meta?.emoji ? <Text style={{ fontSize: 14 }}>{meta.emoji}</Text> : getCategoryIcon(cat as any, col, 14)}
                <Text style={[styles.catBtnText, { color: active ? col : '#888' }]}>{cat}</Text>
              </TouchableOpacity>
            );
          })}
          {!showAllCats && storeCategories.length > 4 && (
            <TouchableOpacity style={[styles.catBtn, { backgroundColor: '#131315', borderColor: '#27272A' }]} onPress={() => setShowAllCats(true)}>
              <Text style={{ color: '#888', fontSize: 18, marginBottom: 8 }}>...</Text>
              <Text style={[styles.catBtnText, { color: '#888' }]}>More</Text>
            </TouchableOpacity>
          )}
        </ScrollView>

        {/* ── Form List ── */}
        <View style={styles.formList}>
          {/* Merchant Row */}
          <View style={{ borderBottomWidth: 1, borderBottomColor: '#27272A', paddingBottom: suggestedMerchants.length > 0 ? 12 : 0 }}>
            <View style={[styles.formRow, { borderBottomWidth: 0 }]}>
              <View style={styles.formRowLeft}>
                <User size={18} color={isTransfer ? '#A855F7' : '#22C55E'} />
                <Text style={styles.formRowLabel}>
                  Paid to / Merchant <Text style={{ color: '#666', fontSize: 11 }}>(optional)</Text>
                </Text>
              </View>
              <View style={[styles.formRowRight, { flex: 1, marginLeft: 16 }]}>
                <TextInput
                  style={[styles.formRowValue, { flex: 1, textAlign: 'right' }]}
                  value={merchant}
                  onChangeText={setMerchant}
                  placeholder="Name or Store"
                  placeholderTextColor="#666"
                />
              </View>
            </View>
            {suggestedMerchants.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingLeft: 16, marginTop: -4 }}>
                {suggestedMerchants.map(m => {
                  const isSelected = merchant === m.name;
                  const activeColor = isTransfer ? '#A855F7' : (isExpense ? '#22C55E' : '#3B82F6');
                  const activeBg = isTransfer ? 'rgba(168, 85, 247, 0.15)' : (isExpense ? 'rgba(34, 197, 94, 0.15)' : 'rgba(59, 130, 246, 0.15)');
                  return (
                    <TouchableOpacity key={m.name} style={[styles.suggestionPill, { borderColor: isSelected ? activeColor : '#3F3F46', backgroundColor: isSelected ? activeBg : '#27272A' }]} onPress={() => setMerchant(m.name)}>
                      <Text style={{ fontSize: 14, marginRight: 4 }}>{m.icon}</Text>
                      <Text style={[styles.suggestionPillText, { color: isSelected ? activeColor : '#A1A1AA' }]}>{m.name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </View>

          {isTransfer ? (
            <>
              <View style={{ paddingBottom: 12 }}>
                <FormRow
                  icon={<CreditCard size={18} color="#A855F7" />}
                  label="From Account"
                  value={paymentMode || 'Select Account'}
                  onPress={() => setShowAccountPicker('from')}
                />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingLeft: 16, marginTop: -4 }}>
                  {mostUsedAccounts.map(acc => {
                    const isSelected = paymentMode === acc.name;
                    return (
                      <TouchableOpacity key={acc.name} style={[styles.suggestionPill, { borderColor: isSelected ? '#A855F7' : '#3F3F46', backgroundColor: isSelected ? 'rgba(168, 85, 247, 0.15)' : '#27272A', flexDirection: 'row', alignItems: 'center' }]} onPress={() => setPaymentMode(acc.name)}>
                        <View style={{ marginRight: 6 }}>{getAccountIcon(acc.type, isSelected ? '#A855F7' : '#A1A1AA', 14)}</View>
                        <Text style={[styles.suggestionPillText, { color: isSelected ? '#A855F7' : '#A1A1AA' }]}>{acc.name}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
              <View style={styles.formDivider} />
              <View style={{ paddingBottom: 12 }}>
                <FormRow
                  icon={<CreditCard size={18} color="#A855F7" />}
                  label="To Account"
                  value={toPaymentMode || 'Select Account'}
                  onPress={() => setShowAccountPicker('to')}
                />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingLeft: 16, marginTop: -4 }}>
                  {mostUsedAccounts.map(acc => {
                    const isSelected = toPaymentMode === acc.name;
                    return (
                      <TouchableOpacity key={acc.name} style={[styles.suggestionPill, { borderColor: isSelected ? '#A855F7' : '#3F3F46', backgroundColor: isSelected ? 'rgba(168, 85, 247, 0.15)' : '#27272A', flexDirection: 'row', alignItems: 'center' }]} onPress={() => setToPaymentMode(acc.name)}>
                        <View style={{ marginRight: 6 }}>{getAccountIcon(acc.type, isSelected ? '#A855F7' : '#A1A1AA', 14)}</View>
                        <Text style={[styles.suggestionPillText, { color: isSelected ? '#A855F7' : '#A1A1AA' }]}>{acc.name}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </>
          ) : (
            <View style={{ paddingBottom: 12 }}>
              <FormRow
                icon={<CreditCard size={18} color={isExpense ? '#22C55E' : '#3B82F6'} />}
                label="Payment Mode"
                value={paymentMode || 'Select Account'}
                onPress={() => setShowAccountPicker('mode')}
              />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingLeft: 16, marginTop: -4 }}>
                {mostUsedAccounts.map(acc => {
                  const isSelected = paymentMode === acc.name;
                  const activeColor = isExpense ? '#22C55E' : '#3B82F6';
                  const activeBg = isExpense ? 'rgba(34, 197, 94, 0.15)' : 'rgba(59, 130, 246, 0.15)';
                  return (
                    <TouchableOpacity key={acc.name} style={[styles.suggestionPill, { borderColor: isSelected ? activeColor : '#3F3F46', backgroundColor: isSelected ? activeBg : '#27272A', flexDirection: 'row', alignItems: 'center' }]} onPress={() => setPaymentMode(acc.name)}>
                      <View style={{ marginRight: 6 }}>{getAccountIcon(acc.type, isSelected ? activeColor : '#A1A1AA', 14)}</View>
                      <Text style={[styles.suggestionPillText, { color: isSelected ? activeColor : '#A1A1AA' }]}>{acc.name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          <FormRow
            icon={<Clock size={18} color={isTransfer ? '#A855F7' : '#22C55E'} />}
            label="Custom Date & Time"
            rightPill={
              <Switch
                value={useCustomTime}
                onValueChange={setUseCustomTime}
                trackColor={{ false: '#3F3F46', true: isTransfer ? '#A855F7' : '#22C55E' }}
                thumbColor="#FFF"
              />
            }
          />

          {useCustomTime && (
            <View style={{ flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 12 }}>
              <TouchableOpacity style={styles.dateTimePill} onPress={() => setShowDatePicker(true)}>
                <Calendar size={16} color={isTransfer ? '#A855F7' : '#22C55E'} />
                <Text style={styles.dateTimeText}>
                  {`${date.getDate().toString().padStart(2, '0')} ${MONTH_NAMES[date.getMonth()]} ${date.getFullYear().toString().slice(-2)}`}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dateTimePill} onPress={() => setShowTimePicker(true)}>
                <Clock size={16} color={isTransfer ? '#A855F7' : '#22C55E'} />
                <Text style={styles.dateTimeText}>{formatTimeStr(time)}</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.formDivider} />

          <FormRow
            icon={<Receipt size={18} color={isTransfer ? '#A855F7' : '#22C55E'} />}
            label="Add Receipt" labelSub="(optional)"
            value={receiptUri ? 'Image Attached' : ''}
            rightIcon={<Camera size={20} color={isTransfer ? '#A855F7' : '#22C55E'} />}
            onPress={pickImage}
          />
          <View style={styles.formDivider} />

        </View>

        {/* ── Keypad ── */}
        <View style={styles.keypad}>
          {keys.map(k => (
            <TouchableOpacity key={k} style={styles.keyBtn} onPress={() => handleKey(k)} activeOpacity={0.7}>
              {k === 'backspace' ? <Delete size={24} color="#FFF" /> : <Text style={styles.keyText}>{k}</Text>}
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Save Button ── */}
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: parseFloat(amountStr) > 0 ? '#FFF' : '#333' }]}
          onPress={handleSave}
          disabled={parseFloat(amountStr) <= 0}
        >
          <Text style={[styles.saveBtnText, { color: parseFloat(amountStr) > 0 ? '#000' : '#888' }]}>Save</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* ── Note Modal ── */}
      <Modal visible={showNoteModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '80%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Note</Text>
              <TouchableOpacity onPress={() => setShowNoteModal(false)}>
                <X size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
            <TextInput
              style={{ backgroundColor: '#27272A', color: '#FFF', padding: 16, borderRadius: 12, fontSize: 16, minHeight: 100, textAlignVertical: 'top' }}
              placeholder="Enter your notes here..."
              placeholderTextColor="#888"
              multiline
              value={notes}
              onChangeText={setNotes}
              autoFocus
            />
            <TouchableOpacity style={[styles.saveBtn, { marginTop: 20, marginBottom: 0, backgroundColor: '#FFF' }]} onPress={() => setShowNoteModal(false)}>
              <Text style={[styles.saveBtnText, { color: '#000' }]}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Date/Time Pickers ── */}
      {Platform.OS !== 'web' && showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate && (Platform.OS === 'ios' || event.type === 'set')) {
              setDate(selectedDate);
              // Open time picker immediately after date picker
              setTimeout(() => setShowTimePicker(true), 200);
            }
          }}
        />
      )}
      {Platform.OS !== 'web' && showTimePicker && (
        <DateTimePicker
          value={time}
          mode="time"
          display="default"
          onChange={(event, selectedTime) => {
            setShowTimePicker(false);
            if (selectedTime) setTime(selectedTime);
          }}
        />
      )}

      {/* ── Account Picker Modal ── */}
      <Modal visible={!!showAccountPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Account</Text>
              <TouchableOpacity onPress={() => setShowAccountPicker(null)}>
                <X size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {accounts.map((acc, i) => {
                const isSelected = (showAccountPicker === 'from' || showAccountPicker === 'mode') ? (paymentMode === acc.name) : (toPaymentMode === acc.name);
                return (
                  <TouchableOpacity
                    key={acc.id}
                    style={[
                      styles.modalRow,
                      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14 },
                      i === accounts.length - 1 && { borderBottomWidth: 0 }
                    ]}
                    onPress={() => {
                      if (showAccountPicker === 'from' || showAccountPicker === 'mode') setPaymentMode(acc.name);
                      if (showAccountPicker === 'to') setToPaymentMode(acc.name);
                      setShowAccountPicker(null);
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#27272A', justifyContent: 'center', alignItems: 'center' }}>
                        {getAccountIcon(acc.type, acc.color || '#FFF', 18)}
                      </View>
                      <Text style={[styles.modalRowText, isSelected && { color: '#22C55E', fontWeight: 'bold' }]}>{acc.name}</Text>
                    </View>
                    {isSelected && <Check size={18} color="#22C55E" />}
                  </TouchableOpacity>
                );
              })}
              <View style={{ marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#27272A' }}>
                <Text style={{ color: '#666', fontSize: 12, marginBottom: 8 }}>Add Custom Bank / Mode</Text>
                <TextInput
                  style={{ backgroundColor: '#27272A', color: '#FFF', padding: 12, borderRadius: 8, fontSize: 16 }}
                  placeholder="e.g. State Bank"
                  placeholderTextColor="#666"
                  onSubmitEditing={(e) => {
                    const customName = e.nativeEvent.text.trim();
                    if (customName) {
                      const exists = accounts.some(acc => acc.name.toLowerCase() === customName.toLowerCase());
                      if (!exists) {
                        const newAccount = {
                          id: `acc_${Date.now()}`,
                          name: customName,
                          type: 'bank' as const,
                          initialBalance: 0,
                          color: '#22C55E'
                        };
                        setAccounts([...accounts, newAccount]);
                      }
                      if (showAccountPicker === 'from' || showAccountPicker === 'mode') setPaymentMode(customName);
                      if (showAccountPicker === 'to') setToPaymentMode(customName);
                      setShowAccountPicker(null);
                    }
                  }}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Date Picker Modal ── */}
      <Modal visible={showDatePicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '60%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Date</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <Text style={styles.modalClose}>Close</Text>
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {Array.from({ length: 30 }).map((_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const isSelected = d.getDate() === date.getDate() && d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear();
                return (
                  <TouchableOpacity
                    key={i}
                    style={[styles.modalRow, isSelected && { backgroundColor: 'rgba(34, 197, 94, 0.1)' }]}
                    onPress={() => { setDate(d); setShowDatePicker(false); }}
                  >
                    <Text style={[styles.modalRowText, isSelected && { color: '#22C55E', fontWeight: 'bold' }]}>
                      {i === 0 ? 'Today' : i === 1 ? 'Yesterday' : `${d.getDate().toString().padStart(2, '0')} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`}
                    </Text>
                    {isSelected && <Check size={18} color="#22C55E" />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Time Picker Modal ── */}
      <Modal visible={showTimePicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '60%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Time</Text>
              <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                <Text style={styles.modalClose}>Close</Text>
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {Array.from({ length: 48 }).map((_, i) => {
                const h = Math.floor(i / 2);
                const m = i % 2 === 0 ? 0 : 30;
                const d = new Date();
                d.setHours(h, m, 0);
                const tStr = formatTimeStr(d);
                const isSelected = formatTimeStr(time) === tStr;
                return (
                  <TouchableOpacity
                    key={i}
                    style={[styles.modalRow, isSelected && { backgroundColor: 'rgba(34, 197, 94, 0.1)' }]}
                    onPress={() => { setTime(d); setShowTimePicker(false); }}
                  >
                    <Text style={[styles.modalRowText, isSelected && { color: '#22C55E', fontWeight: 'bold' }]}>
                      {tStr}
                    </Text>
                    {isSelected && <Check size={18} color="#22C55E" />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

const KEY_GAP = 10;
const KEY_W = (W - 32 - KEY_GAP * 2) / 3;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#09090B', paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  headerIcon: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFF' },

  scroll: { paddingTop: 10 },

  segmentContainer: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, backgroundColor: '#131315', borderRadius: 24, borderWidth: 1, borderColor: '#27272A', padding: 4, marginBottom: 16 },
  segmentBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: 'transparent' },
  segmentBtnActiveExpense: { backgroundColor: '#1A2E20', borderColor: '#22C55E' },
  segmentBtnActiveIncome: { backgroundColor: '#1E3A8A', borderColor: '#3B82F6' },
  segmentBtnActiveTransfer: { backgroundColor: '#3B0764', borderColor: '#A855F7' },
  segmentText: { fontSize: 13, fontWeight: '600' },
  segmentDivider: { width: 1, height: '50%', backgroundColor: '#27272A' },

  amountCard: { marginHorizontal: 16, backgroundColor: '#131315', borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#27272A' },
  amountLabel: { color: '#888', fontSize: 12, textAlign: 'center', marginBottom: 8 },
  amountText: { color: '#FFF', fontSize: 48, fontWeight: '800', textAlign: 'center', letterSpacing: -1.5, marginBottom: 16 },
  amountActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  actionPillActive: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1 },
  actionPillActiveText: { fontSize: 12, fontWeight: '600' },
  actionPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: '#27272A', backgroundColor: '#09090B' },
  actionPillText: { color: '#888', fontSize: 12, fontWeight: '500' },

  categoryScroll: { marginBottom: 16 },
  catBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16, borderWidth: 1 },
  catBtnText: { fontSize: 13, fontWeight: '500' },

  formList: { marginHorizontal: 16, backgroundColor: '#131315', borderRadius: 20, borderWidth: 1, borderColor: '#27272A', marginBottom: 20 },
  formRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16 },
  formRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  formRowLabel: { color: '#FFF', fontSize: 13, fontWeight: '500' },
  formRowRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  formRowValue: { color: '#FFF', fontSize: 13 },
  rightPill: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#27272A' },
  pillText: { color: '#888', fontSize: 12 },
  formDivider: { height: 1, backgroundColor: '#27272A', marginLeft: 46, marginRight: 16 },

  keypad: { flexDirection: 'row', flexWrap: 'wrap', gap: KEY_GAP, paddingHorizontal: 16, marginBottom: 20 },
  keyBtn: { width: KEY_W, height: 50, backgroundColor: '#131315', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  keyText: { color: '#FFF', fontSize: 24, fontWeight: '500' },

  saveBtn: { marginHorizontal: 16, backgroundColor: '#FFF', paddingVertical: 16, borderRadius: 16, alignItems: 'center', marginBottom: 20 },
  saveBtnText: { color: '#000', fontSize: 16, fontWeight: '700' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#131315', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, maxHeight: '60%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  modalClose: { color: '#A855F7', fontSize: 16, fontWeight: '600' },
  modalRow: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#27272A' },
  modalRowText: { color: '#FFF', fontSize: 16 },
  dateTimePill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#27272A', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, flex: 1, gap: 8, justifyContent: 'center' },
  dateTimeText: { color: '#FFF', fontSize: 15, fontWeight: '500' },

  suggestionPill: { backgroundColor: '#1A2E20', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginRight: 8, borderWidth: 1, borderColor: '#22C55E' },
  suggestionPillText: { color: '#22C55E', fontSize: 12, fontWeight: '600' },
});
