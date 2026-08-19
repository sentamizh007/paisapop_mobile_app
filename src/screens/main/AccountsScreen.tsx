import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Platform, Modal, TextInput, Alert, useWindowDimensions, KeyboardAvoidingView
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Wallet, ArrowUpRight, Plus, CreditCard, Banknote, Smartphone, Landmark, Search, X, Trash2, Check, Sparkles } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useStore, Account } from '../../store/useStore';
import { useThemeColors } from '../../theme/colors';
import { getCurrencySymbol } from '../../utils/mockData';

const formatMoney = (amount: number) => {
  return amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const ACCOUNT_COLORS = [
  '#007AFF', // Blue
  '#22C55E', // Emerald Green
  '#A855F7', // Purple
  '#F97316', // Orange
  '#EC4899', // Pink
  '#EF4444', // Red
  '#14B8A6', // Teal
  '#6366F1', // Indigo
  '#EAB308', // Amber
  '#06B6D4', // Cyan
];

const PREDEFINED_ACCOUNTS: { name: string; type: Account['type']; color: string; details?: string }[] = [
  { name: 'State Bank of India (SBI)', type: 'bank', color: '#005b9f' },
  { name: 'HDFC Bank', type: 'bank', color: '#004c8f' },
  { name: 'ICICI Bank', type: 'bank', color: '#f58220' },
  { name: 'Axis Bank', type: 'bank', color: '#97144d' },
  { name: 'Kotak Mahindra Bank', type: 'bank', color: '#ed1c24' },
  { name: 'IndusInd Banking', type: 'bank', color: '#012345', details: 'IndusInd Bank' },
  { name: 'Punjab National Bank (PNB)', type: 'bank', color: '#a32020' },
  { name: 'Bank of Baroda', type: 'bank', color: '#f05a22' },
  { name: 'Canara Bank', type: 'bank', color: '#0e7cc1' },
  { name: 'Union Bank of India', type: 'bank', color: '#d81820' },
  { name: 'Google Pay', type: 'upi', color: '#4285F4' },
  { name: 'PhonePe', type: 'upi', color: '#5f259f' },
  { name: 'Paytm', type: 'wallet', color: '#00baf2' },
  { name: 'Amazon Pay', type: 'wallet', color: '#FF9900' },
  { name: 'Cash', type: 'cash', color: '#22C55E' },
  { name: 'Credit Card', type: 'credit', color: '#A855F7' },
];

export const AccountsScreen = () => {
  const navigation = useNavigation();
  const C = useThemeColors();
  const theme = useStore(s => s.theme);
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, Platform.OS === 'android' ? 6 : 0);
  const { height: windowHeight } = useWindowDimensions();
  const { accounts, transactions, currency, setAccounts, deleteAccount } = useStore();
  const sym = getCurrencySymbol(currency);

  const [showAddModal, setShowAddModal] = useState(false);
  const [modalTab, setModalTab] = useState<'popular' | 'custom'>('popular');
  const [searchQuery, setSearchQuery] = useState('');
  const [customName, setCustomName] = useState('');
  const [customColor, setCustomColor] = useState('#007AFF');

  const getAccountBalance = (accountName: string) => {
    const acc = accounts.find(a => a.name === accountName);
    let balance = acc?.initialBalance || 0;

    transactions.forEach(tx => {
      if (tx.paymentMethod === accountName) {
        if (tx.type === 'expense') balance -= tx.amount;
        if (tx.type === 'transfer') balance -= tx.amount;
      }
      if (tx.type === 'income' && tx.paymentMethod === accountName) {
        balance += tx.amount;
      }
      if (tx.type === 'transfer' && tx.toPaymentMethod === accountName) {
        balance += tx.amount;
      }
    });
    return balance;
  };

  const handleCreateCustom = () => {
    if (!customName.trim()) {
      Alert.alert('Account Name Required', 'Please enter a name for the account.');
      return;
    }
    const name = customName.trim();
    const exists = accounts.some(a => a.name.toLowerCase() === name.toLowerCase());
    if (exists) {
      Alert.alert('Account Exists', `An account named "${name}" already exists.`);
      return;
    }
    setAccounts([
      ...accounts,
      {
        id: `acc_${Date.now()}`,
        name,
        type: 'bank',
        initialBalance: 0,
        color: customColor,
        details: 'Bank Account',
      },
    ]);
    setShowAddModal(false);
    setCustomName('');
    setSearchQuery('');
    setModalTab('popular');
  };

  const accountBalances = useMemo(() => {
    return accounts.map(acc => ({
      ...acc,
      currentBalance: getAccountBalance(acc.name),
    }));
  }, [accounts, transactions]);

  const totalBalance = accountBalances.reduce((sum, acc) => sum + acc.currentBalance, 0);

  const getAccountIcon = (type: Account['type'], color: string, size = 20) => {
    switch (type) {
      case 'cash': return <Banknote size={size} color={color} />;
      case 'upi': return <Smartphone size={size} color={color} />;
      case 'bank': return <Landmark size={size} color={color} />;
      case 'credit': return <CreditCard size={size} color={color} />;
      case 'wallet': return <Wallet size={size} color={color} />;
      default: return <Wallet size={size} color={color} />;
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: C.background }]} edges={['top', 'bottom']}>
      <StatusBar barStyle={theme === 'light' ? 'dark-content' : 'light-content'} backgroundColor={C.background} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <ChevronLeft size={24} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: C.textPrimary }]}>Accounts</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: 60 + bottomPad + 30 }]} showsVerticalScrollIndicator={false}>

        <View style={[styles.totalCard, { backgroundColor: C.surface, borderColor: C.border }]}>
          <View>
            <Text style={[styles.totalLabel, { color: C.textSecondary }]}>Total Net Balance</Text>
            <Text style={[styles.totalValue, { color: C.textPrimary }]}>{sym}{formatMoney(totalBalance)}</Text>
            <View style={styles.vsLastMonth}>
              <ArrowUpRight size={14} color="#22C55E" />
              <Text style={[styles.vsText, { color: C.textSecondary }]}>Active across {accounts.length} accounts</Text>
            </View>
          </View>
          <View style={[styles.walletIconWrap, { backgroundColor: 'rgba(34,197,94,0.12)' }]}>
            <Wallet size={32} color="#22C55E" />
          </View>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, paddingHorizontal: 4 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: C.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 }}>Your Accounts</Text>
          <Text style={{ fontSize: 11, color: C.textMuted }}>Long press to delete</Text>
        </View>

        <View style={[styles.listContainer, { backgroundColor: C.surface, borderColor: C.border }]}>
          {accountBalances.map((acc, idx) => (
            <TouchableOpacity
              key={acc.id}
              activeOpacity={0.7}
              onLongPress={() => {
                const confirmDelete = () => {
                  deleteAccount(acc.id);
                };
                if (Platform.OS === 'web') {
                  if (window.confirm(`Delete "${acc.name}" account?`)) {
                    confirmDelete();
                  }
                } else {
                  Alert.alert(
                    'Delete Account',
                    `Are you sure you want to delete "${acc.name}"?`,
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Delete', style: 'destructive', onPress: confirmDelete }
                    ]
                  );
                }
              }}
              delayLongPress={350}
              style={[styles.accountRow, idx > 0 && { borderTopWidth: 1, borderTopColor: C.border }]}
            >
              <View style={styles.accLeft}>
                <View style={[styles.accIcon, { backgroundColor: acc.color + '20' }]}>
                  {getAccountIcon(acc.type, acc.color)}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.accName, { color: C.textPrimary }]}>{acc.name}</Text>
                  {acc.details ? <Text style={[styles.accDetails, { color: C.textSecondary }]}>{acc.details}</Text> : null}
                </View>
              </View>
              <View style={styles.accRight}>
                <Text style={[styles.accBalance, { color: C.textPrimary }]}>{sym}{formatMoney(acc.currentBalance)}</Text>
                {acc.type === 'credit' && <Text style={[styles.accLimit, { color: C.textMuted }]}>Outstanding</Text>}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: C.surface, borderColor: C.border }]}
          onPress={() => setShowAddModal(true)}
          activeOpacity={0.7}
        >
          <View style={styles.addBtnLeft}>
            <View style={styles.addBtnIcon}>
              <Plus size={20} color="#22C55E" />
            </View>
            <View>
              <Text style={[styles.addBtnTitle, { color: C.textPrimary }]}>Add New Account</Text>
              <Text style={[styles.addBtnSub, { color: C.textSecondary }]}>Bank, UPI, Credit Card, or Wallet</Text>
            </View>
          </View>
          <Text style={styles.manageText}>Add</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* Add Account Modal */}
      <Modal visible={showAddModal} transparent animationType="slide" onRequestClose={() => setShowAddModal(false)}>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: C.surface,
                borderColor: C.border,
                height: Math.min(windowHeight * 0.86, 680),
                maxHeight: '92%',
                paddingBottom: Math.max(insets.bottom, 16) + 4,
              }
            ]}
          >
            
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: C.textPrimary }]}>
                {modalTab === 'popular' ? 'Add Account / Bank' : 'Create Custom Account'}
              </Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)} style={[styles.modalClose, { backgroundColor: C.surfaceElevated }]}>
                <X size={20} color={C.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Tab Switcher */}
            <View style={[styles.tabBar, { backgroundColor: C.surfaceElevated }]}>
              <TouchableOpacity
                style={[styles.tabBtn, modalTab === 'popular' && { backgroundColor: C.surface, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4 }]}
                onPress={() => setModalTab('popular')}
                activeOpacity={0.7}
              >
                <Landmark size={15} color={modalTab === 'popular' ? '#22C55E' : C.textSecondary} />
                <Text style={[styles.tabBtnText, { color: modalTab === 'popular' ? C.textPrimary : C.textSecondary, fontWeight: modalTab === 'popular' ? '700' : '500' }]}>
                  Popular Banks
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabBtn, modalTab === 'custom' && { backgroundColor: C.surface, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4 }]}
                onPress={() => setModalTab('custom')}
                activeOpacity={0.7}
              >
                <Sparkles size={15} color={modalTab === 'custom' ? '#22C55E' : C.textSecondary} />
                <Text style={[styles.tabBtnText, { color: modalTab === 'custom' ? C.textPrimary : C.textSecondary, fontWeight: modalTab === 'custom' ? '700' : '500' }]}>
                  Custom Account
                </Text>
              </TouchableOpacity>
            </View>

            {modalTab === 'popular' ? (
              <View style={{ flex: 1 }}>
                <View style={[styles.searchWrap, { backgroundColor: C.surfaceElevated, borderColor: C.border }]}>
                  <Search size={18} color={C.textSecondary} style={{ marginLeft: 12 }} />
                  <TextInput
                    style={[styles.searchInput, { color: C.textPrimary }]}
                    placeholder="Search bank, wallet, or UPI..."
                    placeholderTextColor={C.textMuted}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    autoCapitalize="words"
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity
                      onPress={() => setSearchQuery('')}
                      style={{ padding: 6 }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <X size={16} color={C.textSecondary} />
                    </TouchableOpacity>
                  )}
                </View>

                <ScrollView style={styles.bankList} contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                  {PREDEFINED_ACCOUNTS.filter(a => 
                    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (a.details && a.details.toLowerCase().includes(searchQuery.toLowerCase()))
                  ).length > 0 ? (
                    PREDEFINED_ACCOUNTS.filter(a => 
                      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      (a.details && a.details.toLowerCase().includes(searchQuery.toLowerCase()))
                    ).map((bank, i) => (
                      <TouchableOpacity
                        key={i}
                        style={[styles.bankItem, { borderBottomColor: C.border }]}
                        onPress={() => {
                          const exists = accounts.some(a => a.name.toLowerCase() === bank.name.toLowerCase());
                          if (!exists) {
                            setAccounts([...accounts, {
                              id: `acc_${Date.now()}`,
                              name: bank.name,
                              type: bank.type,
                              initialBalance: 0,
                              color: bank.color,
                              details: bank.details || bank.name,
                            }]);
                          }
                          setShowAddModal(false);
                          setSearchQuery('');
                        }}
                      >
                        <View style={[styles.accIcon, { backgroundColor: bank.color + '20' }]}>
                          {getAccountIcon(bank.type, bank.color)}
                        </View>
                        <Text style={[styles.bankItemText, { color: C.textPrimary }]}>{bank.name}</Text>
                        <Plus size={16} color="#22C55E" />
                      </TouchableOpacity>
                    ))
                  ) : (
                    <View style={styles.emptyStateWrap}>
                      <Text style={{ fontSize: 32, marginBottom: 8 }}>🔍</Text>
                      <Text style={[styles.emptyTitle, { color: C.textPrimary }]}>No account found</Text>
                      <Text style={[styles.emptySub, { color: C.textSecondary }]}>
                        No predefined account matching "{searchQuery}".
                      </Text>
                      {searchQuery.trim().length > 0 && (
                        <TouchableOpacity
                          style={[styles.customAddBtn, { backgroundColor: '#22C55E18', borderColor: '#22C55E' }]}
                          onPress={() => {
                            setCustomName(searchQuery.trim());
                            setModalTab('custom');
                          }}
                          activeOpacity={0.7}
                        >
                          <Sparkles size={18} color="#22C55E" />
                          <Text style={styles.customAddText}>Customize & Create "{searchQuery.trim()}"</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </ScrollView>
              </View>
            ) : (
              /* Custom Account Creator with Icon & Color Picker */
              <ScrollView style={styles.customFormScroll} contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                
                {/* Live Preview Card */}
                <View style={[styles.previewCard, { backgroundColor: C.surfaceElevated, borderColor: C.border }]}>
                  <View style={[styles.previewIcon, { backgroundColor: customColor + '22' }]}>
                    <Landmark size={26} color={customColor} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text style={[styles.previewName, { color: C.textPrimary }]}>
                      {customName.trim() || 'Account Name'}
                    </Text>
                    <Text style={[styles.previewType, { color: C.textSecondary }]}>
                      Bank Account
                    </Text>
                  </View>
                </View>

                {/* Account Name */}
                <Text style={[styles.inputLabel, { color: C.textSecondary }]}>Account / Bank Name</Text>
                <View style={[styles.inputWrap, { backgroundColor: C.surfaceElevated, borderColor: C.border }]}>
                  <TextInput
                    style={[styles.formInput, { color: C.textPrimary }]}
                    placeholder="e.g. Jupiter, Salary Bank, Crypto"
                    placeholderTextColor={C.textMuted}
                    value={customName}
                    onChangeText={setCustomName}
                  />
                </View>

                {/* Select Color */}
                <Text style={[styles.inputLabel, { color: C.textSecondary }]}>Select Theme Color</Text>
                <View style={styles.colorRow}>
                  {ACCOUNT_COLORS.map(c => {
                    const isSelected = customColor === c;
                    return (
                      <TouchableOpacity
                        key={c}
                        style={[styles.colorCircle, { backgroundColor: c }]}
                        onPress={() => setCustomColor(c)}
                        activeOpacity={0.8}
                      >
                        {isSelected && <Check size={16} color="#FFFFFF" strokeWidth={3} />}
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Save Account Button */}
                <TouchableOpacity
                  style={[styles.saveBtn, { backgroundColor: theme === 'light' ? '#18181B' : '#FFFFFF' }]}
                  onPress={handleCreateCustom}
                  activeOpacity={0.8}
                >
                  <Plus size={18} color={theme === 'light' ? '#FFFFFF' : '#000000'} strokeWidth={2.5} />
                  <Text style={[styles.saveBtnText, { color: theme === 'light' ? '#FFFFFF' : '#000000' }]}>Create Account</Text>
                </TouchableOpacity>

              </ScrollView>
            )}

          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  iconBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  scroll: { padding: 16, paddingBottom: 110 },
  totalCard: { borderRadius: 20, padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, marginBottom: 16 },
  totalLabel: { fontSize: 13, marginBottom: 6 },
  totalValue: { fontSize: 32, fontWeight: '800', marginBottom: 8, letterSpacing: -1 },
  vsLastMonth: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  vsText: { fontSize: 12 },
  walletIconWrap: { width: 64, height: 64, borderRadius: 16, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  listContainer: { borderRadius: 20, borderWidth: 1, marginBottom: 16, overflow: 'hidden' },
  accountRow: { flexDirection: 'row', alignItems: 'center', padding: 16, justifyContent: 'space-between' },
  accLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  accIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  accName: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  accDetails: { fontSize: 12 },
  accRight: { alignItems: 'flex-end' },
  accBalance: { fontSize: 15, fontWeight: '600' },
  accLimit: { fontSize: 11, marginTop: 2 },
  addBtn: { borderRadius: 20, borderWidth: 1, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderStyle: 'dashed' },
  addBtnLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  addBtnIcon: { width: 40, height: 40, borderRadius: 10, borderWidth: 1, borderColor: '#22C55E', justifyContent: 'center', alignItems: 'center', borderStyle: 'dashed' },
  addBtnTitle: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  addBtnSub: { fontSize: 12 },
  manageText: { color: '#22C55E', fontSize: 13, fontWeight: '500' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, borderWidth: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  modalClose: { padding: 6, borderRadius: 12 },
  tabBar: { flexDirection: 'row', borderRadius: 14, padding: 4, marginBottom: 16 },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, borderRadius: 10 },
  tabBtnText: { fontSize: 13 },
  searchWrap: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, paddingRight: 12, marginBottom: 14, borderWidth: 1, height: 44 },
  searchInput: { flex: 1, height: '100%', fontSize: 14.5, paddingHorizontal: 12 },
  bankList: { flex: 1 },
  bankItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
  bankItemText: { fontSize: 15, flex: 1, marginLeft: 12 },
  emptyStateWrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 32, paddingHorizontal: 16 },
  emptyTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4, textAlign: 'center' },
  emptySub: { fontSize: 13, textAlign: 'center', marginBottom: 16, lineHeight: 18 },
  customAddBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 14, borderWidth: 1 },
  customAddText: { color: '#22C55E', fontSize: 14, fontWeight: '700' },
  customFormScroll: { flex: 1 },
  previewCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 16, borderWidth: 1, marginBottom: 16 },
  previewIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  previewName: { fontSize: 16, fontWeight: '700', marginBottom: 3 },
  previewType: { fontSize: 12.5, fontWeight: '500' },
  inputLabel: { fontSize: 12.5, fontWeight: '600', marginBottom: 6, marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.4 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, paddingHorizontal: 12, borderWidth: 1, height: 44, marginBottom: 14 },
  currencyPrefix: { fontSize: 15, fontWeight: '700', marginRight: 6 },
  formInput: { flex: 1, height: '100%', fontSize: 14.5 },
  typeRow: { flexDirection: 'row', gap: 8, marginBottom: 14, paddingVertical: 2 },
  typeChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12, borderWidth: 1 },
  typeChipText: { fontSize: 13 },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  colorCircle: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 16, marginTop: 6, marginBottom: 10 },
  saveBtnText: { fontSize: 15, fontWeight: '700' },
});
