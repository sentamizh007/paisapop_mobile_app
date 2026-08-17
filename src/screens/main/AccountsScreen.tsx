import React, { useMemo, useState } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, StatusBar, Platform, Modal, TextInput, FlatList
} from 'react-native';
import { ChevronLeft, Settings, Wallet, ArrowUpRight, ArrowDownLeft, Plus, CreditCard, Banknote, Smartphone, Landmark, Search, X } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useStore, Account } from '../../store/useStore';
import { getCurrencySymbol, Transaction } from '../../utils/mockData';
import { DonutChart } from '../../components/DonutChart';

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
  const { accounts, transactions, currency, setAccounts } = useStore();
  const sym = getCurrencySymbol(currency);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [customBankName, setCustomBankName] = useState<string | null>(null);

  // Balance calculation
  const getAccountBalance = (accountName: string) => {
    const acc = accounts.find(a => a.name === accountName);
    let balance = acc?.initialBalance || 0;

    transactions.forEach(tx => {
      // Outgoing
      if (tx.paymentMethod === accountName) {
        if (tx.type === 'expense') balance -= tx.amount;
        if (tx.type === 'transfer') balance -= tx.amount;
      }
      // Incoming
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

  const totalBalance = accountBalances.reduce((sum, acc) => {
    // Note: If credit card balance is negative, it reduces net worth, which is technically correct.
    return sum + acc.currentBalance;
  }, 0);

  // Spending Source (This Month)
  const spendingSourceData = useMemo(() => {
    const now = new Date();
    const currentMonthTx = transactions.filter(t => {
      const d = new Date(t.date);
      return t.type === 'expense' && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });

    const spentByAccount: Record<string, number> = {};
    currentMonthTx.forEach(tx => {
      if (tx.paymentMethod) {
        spentByAccount[tx.paymentMethod] = (spentByAccount[tx.paymentMethod] || 0) + tx.amount;
      }
    });

    const totalSpent = Object.values(spentByAccount).reduce((a, b) => a + b, 0);

    // Map to Donut format
    const sourceData = accounts
      .filter(acc => spentByAccount[acc.name] > 0)
      .map(acc => ({
        label: acc.name,
        value: spentByAccount[acc.name],
        color: acc.color,
        percent: Math.round((spentByAccount[acc.name] / totalSpent) * 100),
      }))
      .sort((a, b) => b.value - a.value);

    return { data: sourceData, totalSpent };
  }, [transactions, accounts]);

  // Recent Transfers
  const recentTransfers = useMemo(() => {
    return transactions
      .filter(t => t.type === 'transfer')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [transactions]);

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
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#09090B" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <ChevronLeft size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Accounts</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        
        {/* Total Balance Card */}
        <View style={styles.totalCard}>
          <View>
            <Text style={styles.totalLabel}>Total Balance</Text>
            <Text style={styles.totalValue}>{sym} {formatMoney(totalBalance)}</Text>
            <View style={styles.vsLastMonth}>
              <ArrowUpRight size={14} color="#22C55E" />
              <Text style={styles.vsText}>
                <Text style={{color: '#22C55E'}}>{sym}0.00</Text> vs last month
              </Text>
            </View>
          </View>
          <View style={styles.walletIconWrap}>
            <Wallet size={40} color="#22C55E" strokeWidth={1.5} />
            <View style={styles.walletGlow} />
          </View>
        </View>

        {/* Accounts List */}
        <View style={styles.listContainer}>
          {accountBalances.map((acc, index) => {
            const isNegative = acc.currentBalance < 0;
            return (
              <TouchableOpacity key={acc.id} style={[styles.accountRow, index !== 0 && styles.rowBorder]}>
                <View style={styles.accLeft}>
                  <View style={[styles.accIcon, { backgroundColor: acc.color + '20' }]}>
                    {getAccountIcon(acc.type, acc.color)}
                  </View>
                  <View>
                    <Text style={styles.accName}>{acc.name}</Text>
                    <Text style={styles.accDetails}>{acc.details || 'Account'}</Text>
                  </View>
                </View>
                <View style={styles.accRight}>
                  <Text style={[styles.accBalance, isNegative && { color: '#FFF' }]}>
                    {isNegative ? '-' : ''}{sym} {formatMoney(Math.abs(acc.currentBalance))}
                  </Text>
                  {acc.type === 'credit' && (
                    <Text style={styles.accLimit}>Available {sym} 0.00</Text>
                  )}
                </View>
                <ChevronLeft size={16} color="#444" style={{ transform: [{ rotate: '180deg' }], marginLeft: 12 }} />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Spending Source */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Spending Source <Text style={{color: '#888', fontWeight: '400', fontSize: 13}}>(This Month)</Text></Text>
          </View>
          <View style={styles.sourceContainer}>
            <View style={{ width: 140, height: 140 }}>
              {spendingSourceData.data.length > 0 ? (
                <View style={{ transform: [{ scale: 140 / 160 }], width: 160, height: 160, marginLeft: -10, marginTop: -10 }}>
                  <DonutChart 
                    segments={spendingSourceData.data} 
                    total={spendingSourceData.totalSpent} 
                    currencySymbol={sym}
                  />
                </View>
              ) : (
                <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center' }]}>
                  <Text style={{color: '#888'}}>No expenses</Text>
                </View>
              )}
            </View>
            <View style={styles.legend}>
              {spendingSourceData.data.map((item, idx) => {
                const percent = Math.round((item.value / spendingSourceData.totalSpent) * 100);
                return (
                  <View key={idx} style={styles.legendRow}>
                    <View style={styles.legendLeft}>
                      <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                      <Text style={styles.legendName} numberOfLines={1}>{item.label}</Text>
                    </View>
                    <View style={styles.legendRight}>
                      <Text style={styles.legendValue}>{sym} {item.value}</Text>
                      <Text style={[styles.legendPercent, { color: item.color }]}>{percent}%</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* Recent Transfers */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Recent Transfers</Text>
            <TouchableOpacity><Text style={styles.viewAllText}>View All</Text></TouchableOpacity>
          </View>
          {recentTransfers.length > 0 ? recentTransfers.map((tx, idx) => (
            <View key={tx.id} style={[styles.transferRow, idx !== 0 && styles.rowBorder]}>
              <View style={[styles.transferIcon, { backgroundColor: '#3B0764' }]}>
                <ArrowUpRight size={20} color="#A855F7" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.transferTitle}>{tx.paymentMethod} <Text style={{color: '#666'}}>→</Text> {tx.toPaymentMethod || 'Unknown'}</Text>
                <Text style={styles.transferDate}>{tx.date} • {tx.time}</Text>
              </View>
              <Text style={styles.transferAmountOut}>-{sym} {formatMoney(tx.amount)}</Text>
            </View>
          )) : (
             <Text style={{color: '#666', paddingVertical: 16, textAlign: 'center'}}>No recent transfers</Text>
          )}
        </View>

        {/* Add Account Button */}
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)}>
          <View style={styles.addBtnLeft}>
            <View style={styles.addBtnIcon}>
              <Plus size={20} color="#22C55E" />
            </View>
            <View>
              <Text style={styles.addBtnTitle}>Add Account</Text>
              <Text style={styles.addBtnSub}>Add new bank, wallet or cash account</Text>
            </View>
          </View>
          <Text style={styles.manageText}>Manage Accounts <ChevronLeft size={14} color="#22C55E" style={{ transform: [{ rotate: '180deg' }] }}/></Text>
        </TouchableOpacity>

      </ScrollView>

      {/* Add Account Modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{customBankName ? 'Select Icon' : 'Select Account to Add'}</Text>
              <TouchableOpacity onPress={() => { setShowAddModal(false); setCustomBankName(null); }} style={styles.modalClose}>
                <X size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            
            {customBankName ? (
              <View>
                <Text style={{ color: '#888', marginBottom: 16, fontSize: 14 }}>Choose an icon for "{customBankName}"</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
                  {([
                    { type: 'bank', color: '#6366F1' },
                    { type: 'wallet', color: '#00baf2' },
                    { type: 'upi', color: '#5f259f' },
                    { type: 'cash', color: '#22C55E' },
                    { type: 'credit', color: '#A855F7' }
                  ] as const).map((opt) => (
                    <TouchableOpacity 
                      key={opt.type}
                      style={{ alignItems: 'center', backgroundColor: '#27272A', padding: 16, borderRadius: 16, width: '30%' }}
                      onPress={() => {
                        const newAcc: Account = {
                          id: `acc_${Date.now()}`,
                          name: customBankName,
                          type: opt.type,
                          color: opt.color,
                          initialBalance: 0,
                        };
                        setAccounts([...accounts, newAcc]);
                        setShowAddModal(false);
                        setSearchQuery('');
                        setCustomBankName(null);
                      }}
                    >
                      <View style={[styles.accIcon, { backgroundColor: opt.color + '20', marginBottom: 8, width: 48, height: 48, borderRadius: 24 }]}>
                        {getAccountIcon(opt.type, opt.color, 24)}
                      </View>
                      <Text style={{ color: '#FFF', fontSize: 12, textTransform: 'capitalize' }}>{opt.type === 'bank' ? 'Bank' : opt.type === 'upi' ? 'UPI' : opt.type === 'credit' ? 'Credit' : opt.type === 'cash' ? 'Cash' : 'Wallet'}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ) : (
              <>
                <View style={styles.searchWrap}>
                  <Search size={18} color="#888" style={{ marginLeft: 12 }} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search banks, wallets..."
                    placeholderTextColor="#888"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                </View>

                <ScrollView style={styles.bankList} showsVerticalScrollIndicator={false}>
                  {PREDEFINED_ACCOUNTS.filter(a => a.name.toLowerCase().includes(searchQuery.toLowerCase())).map((bank, index) => (
                    <TouchableOpacity 
                      key={index} 
                      style={styles.bankItem}
                      onPress={() => {
                        const newAcc: Account = {
                          id: `acc_${Date.now()}`,
                          name: bank.name,
                          type: bank.type,
                          color: bank.color,
                          initialBalance: 0,
                        };
                        setAccounts([...accounts, newAcc]);
                        setShowAddModal(false);
                        setSearchQuery('');
                      }}
                    >
                      <View style={[styles.accIcon, { backgroundColor: bank.color + '20' }]}>
                        {getAccountIcon(bank.type, bank.color)}
                      </View>
                      <Text style={styles.bankItemText}>{bank.name}</Text>
                      <Plus size={16} color="#22C55E" />
                    </TouchableOpacity>
                  ))}
                  {searchQuery.trim() !== '' && !PREDEFINED_ACCOUNTS.some(a => a.name.toLowerCase() === searchQuery.toLowerCase()) && (
                    <TouchableOpacity 
                      style={styles.bankItem}
                      onPress={() => setCustomBankName(searchQuery)}
                    >
                      <View style={[styles.accIcon, { backgroundColor: '#6366F120' }]}>
                        <Landmark size={20} color="#6366F1" />
                      </View>
                      <Text style={styles.bankItemText}>Add "{searchQuery}"</Text>
                      <Plus size={16} color="#22C55E" />
                    </TouchableOpacity>
                  )}
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#09090B' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  iconBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFF' },
  scroll: { padding: 16, paddingBottom: 110 },

  totalCard: { backgroundColor: '#131315', borderRadius: 20, padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#27272A', marginBottom: 16 },
  totalLabel: { color: '#888', fontSize: 13, marginBottom: 6 },
  totalValue: { color: '#FFF', fontSize: 32, fontWeight: '800', marginBottom: 8, letterSpacing: -1 },
  vsLastMonth: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  vsText: { color: '#888', fontSize: 12 },
  walletIconWrap: { width: 64, height: 64, backgroundColor: '#1A2E20', borderRadius: 16, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  walletGlow: { position: 'absolute', width: 40, height: 40, backgroundColor: '#22C55E', borderRadius: 20, opacity: 0.2, filter: [{ blur: 15 }] as any },

  listContainer: { backgroundColor: '#131315', borderRadius: 20, borderWidth: 1, borderColor: '#27272A', marginBottom: 16, overflow: 'hidden' },
  accountRow: { flexDirection: 'row', alignItems: 'center', padding: 16, justifyContent: 'space-between' },
  rowBorder: { borderTopWidth: 1, borderTopColor: '#27272A' },
  accLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  accIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  accName: { color: '#FFF', fontSize: 15, fontWeight: '600', marginBottom: 2 },
  accDetails: { color: '#888', fontSize: 12 },
  accRight: { alignItems: 'flex-end' },
  accBalance: { color: '#FFF', fontSize: 15, fontWeight: '600' },
  accLimit: { color: '#888', fontSize: 11, marginTop: 2 },

  card: { backgroundColor: '#131315', borderRadius: 20, borderWidth: 1, borderColor: '#27272A', marginBottom: 16, padding: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cardTitle: { color: '#FFF', fontSize: 15, fontWeight: '600' },
  viewAllText: { color: '#22C55E', fontSize: 13, fontWeight: '600' },

  sourceContainer: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  legend: { flex: 1, gap: 10 },
  legendRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  legendLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendName: { color: '#FFF', fontSize: 12, flex: 1 },
  legendRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  legendValue: { color: '#FFF', fontSize: 12 },
  legendPercent: { fontSize: 12, fontWeight: '600', width: 32, textAlign: 'right' },

  transferRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
  transferIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  transferTitle: { color: '#FFF', fontSize: 14, fontWeight: '500', marginBottom: 4 },
  transferDate: { color: '#888', fontSize: 12 },
  transferAmountOut: { color: '#FFF', fontSize: 14, fontWeight: '600' },

  addBtn: { backgroundColor: '#131315', borderRadius: 20, borderWidth: 1, borderColor: '#27272A', padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderStyle: 'dashed' },
  addBtnLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  addBtnIcon: { width: 40, height: 40, borderRadius: 10, borderWidth: 1, borderColor: '#22C55E', justifyContent: 'center', alignItems: 'center', borderStyle: 'dashed' },
  addBtnTitle: { color: '#FFF', fontSize: 15, fontWeight: '600', marginBottom: 2 },
  addBtnSub: { color: '#888', fontSize: 12 },
  manageText: { color: '#22C55E', fontSize: 13, fontWeight: '500' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#131315', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#FFF' },
  modalClose: { padding: 4, backgroundColor: '#27272A', borderRadius: 12 },
  searchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1C1C1E', borderRadius: 12, paddingRight: 12, marginBottom: 16, borderWidth: 1, borderColor: '#27272A', height: 44 },
  searchInput: { flex: 1, height: '100%', color: '#FFF', fontSize: 15, paddingHorizontal: 10 },
  bankList: { flexGrow: 0 },
  bankItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#27272A' },
  bankItemText: { color: '#FFF', fontSize: 15, flex: 1, marginLeft: 12 },
});
