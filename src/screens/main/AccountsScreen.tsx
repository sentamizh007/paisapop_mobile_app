import React, { useMemo, useState } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Platform, Modal, TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Wallet, ArrowUpRight, Plus, CreditCard, Banknote, Smartphone, Landmark, Search, X } from 'lucide-react-native';
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

const PREDEFINED_ACCOUNTS: { name: string; type: Account['type']; color: string; details?: string }[] = [
  { name: 'State Bank of India (SBI)', type: 'bank', color: '#005b9f' },
  { name: 'HDFC Bank', type: 'bank', color: '#004c8f' },
  { name: 'ICICI Bank', type: 'bank', color: '#f58220' },
  { name: 'Axis Bank', type: 'bank', color: '#97144d' },
  { name: 'Kotak Mahindra Bank', type: 'bank', color: '#ed1c24' },
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
  const { accounts, transactions, currency, setAccounts } = useStore();
  const sym = getCurrencySymbol(currency);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
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

        <View style={[styles.listContainer, { backgroundColor: C.surface, borderColor: C.border }]}>
          {accountBalances.map((acc, idx) => (
            <View key={acc.id} style={[styles.accountRow, idx > 0 && { borderTopWidth: 1, borderTopColor: C.border }]}>
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
            </View>
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

      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: C.surface, borderColor: C.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: C.textPrimary }]}>Add Account / Bank</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)} style={[styles.modalClose, { backgroundColor: C.surfaceElevated }]}>
                <X size={20} color={C.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={[styles.searchWrap, { backgroundColor: C.surfaceElevated, borderColor: C.border }]}>
              <Search size={18} color={C.textSecondary} style={{ marginLeft: 12 }} />
              <TextInput
                style={[styles.searchInput, { color: C.textPrimary }]}
                placeholder="Search bank or wallet"
                placeholderTextColor={C.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            <ScrollView style={styles.bankList}>
              {PREDEFINED_ACCOUNTS.filter(a => a.name.toLowerCase().includes(searchQuery.toLowerCase())).map((bank, i) => (
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
              ))}
            </ScrollView>
          </View>
        </View>
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
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '80%', borderWidth: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  modalClose: { padding: 4, borderRadius: 12 },
  searchWrap: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingRight: 12, marginBottom: 16, borderWidth: 1, height: 44 },
  searchInput: { flex: 1, height: '100%', fontSize: 15, paddingHorizontal: 10 },
  bankList: { flexGrow: 0 },
  bankItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
  bankItemText: { fontSize: 15, flex: 1, marginLeft: 12 },
});
