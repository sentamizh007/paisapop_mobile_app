import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Switch, TextInput,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  ChevronRight, Download, Trash2, LogOut, User,
  Bell, FileDown, Lock, Cloud, Moon, HelpCircle, Info, LayoutGrid, IndianRupee, Crown, Edit2, Check, Wallet
} from 'lucide-react-native';
import { MONTH_NAMES } from '../../utils/exportUtils';
import { exportAndShare } from '../../utils/exportUtils';
import { Currency, Theme, useStore } from '../../store/useStore';
import { useThemeColors } from '../../theme/colors';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar as RNStatusBar } from 'react-native';

const CURRENCIES: { label: string; value: Currency; symbol: string }[] = [
  { label: 'US Dollar ($)', value: 'USD', symbol: '$' },
  { label: 'Euro (€)', value: 'EUR', symbol: '€' },
  { label: 'British Pound (£)', value: 'GBP', symbol: '£' },
  { label: 'Indian Rupee (₹)', value: 'INR', symbol: '₹' },
  { label: 'Japanese Yen (¥)', value: 'JPY', symbol: '¥' },
  { label: 'Canadian Dollar (C$)', value: 'CAD', symbol: 'C$' },
  { label: 'Australian Dollar (A$)', value: 'AUD', symbol: 'A$' },
  { label: 'Swiss Franc (CHF)', value: 'CHF', symbol: 'CHF' },
  { label: 'Chinese Yuan (¥)', value: 'CNY', symbol: '¥' },
  { label: 'Hong Kong Dollar (HK$)', value: 'HKD', symbol: 'HK$' },
  { label: 'New Zealand Dollar (NZ$)', value: 'NZD', symbol: 'NZ$' },
  { label: 'Singapore Dollar (S$)', value: 'SGD', symbol: 'S$' },
  { label: 'South Korean Won (₩)', value: 'KRW', symbol: '₩' },
  { label: 'Mexican Peso ($)', value: 'MXN', symbol: '$' },
  { label: 'Brazilian Real (R$)', value: 'BRL', symbol: 'R$' },
  { label: 'South African Rand (R)', value: 'ZAR', symbol: 'R' },
  { label: 'UAE Dirham (د.إ)', value: 'AED', symbol: 'د.إ' },
  { label: 'Saudi Riyal (﷼)', value: 'SAR', symbol: '﷼' },
  { label: 'Russian Ruble (₽)', value: 'RUB', symbol: '₽' },
];

export const ProfileScreen = () => {
  const navigation = useNavigation<any>();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, Platform.OS === 'android' ? 6 : 0);
  const TAB_BAR_H = 60;

  const {
    theme, setTheme, currency, setCurrency, monthlyBudget, setMonthlyBudget,
    categories, addCategory, categoryBudgets, setCategoryBudget,
    transactions, clearAllTransactions, logout, userName, login
  } = useStore();

  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState(userName || '');

  const currencySymbol = CURRENCIES.find(c => c.value === currency)?.symbol ?? '$';

  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [showBudget, setShowBudget] = useState(false);
  const [budgetStr, setBudgetStr] = useState('');
  const [showAddCat, setShowAddCat] = useState(false);
  const [newCat, setNewCat] = useState('');
  const [newCatEmoji, setNewCatEmoji] = useState('✨');
  const [newCatColor, setNewCatColor] = useState('#6366F1');

  const [showCatBudget, setShowCatBudget] = useState(false);
  const [budgetCat, setBudgetCat] = useState('');
  const [catBudgetAmount, setCatBudgetAmount] = useState('');
  const [catBudgetPeriod, setCatBudgetPeriod] = useState<'monthly' | 'weekly'>('monthly');

  const EMOJIS = ['🛒', '🍔', '🚕', '🎬', '💡', '👕', '🏥', '✈️', '📚', '🎁', '🐶', '🔧', '🪴', '🎸', '🎮'];
  const COLORS = ['#F97316', '#2563EB', '#8B5CF6', '#F59E0B', '#10B981', '#EC4899', '#6366F1', '#0EA5E9', '#14B8A6', '#22C55E', '#A855F7', '#F43F5E', '#0F766E', '#64748B'];

  // Export state
  const [showExport, setShowExport] = useState(false);
  const [exportMonth, setExportMonth] = useState(new Date().getMonth());
  const [exportYear, setExportYear] = useState(new Date().getFullYear());
  const [exportAll, setExportAll] = useState(false);
  const [exporting, setExporting] = useState(false);

  // New UI Toggles
  const [reminders, setReminders] = useState(true);
  const [notifications, setNotifications] = useState(true);

  const handleExport = async () => {
    setExporting(true);
    try {
      const result = await exportAndShare(transactions, exportAll ? undefined : exportMonth, exportAll ? undefined : exportYear);
      if (!result.success) Alert.alert('Export Failed', result.error ?? 'Unknown error');
    } finally {
      setExporting(false);
    }
  };

  const confirmClearAll = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to delete all transactions?')) {
        clearAllTransactions();
      }
      return;
    }
    Alert.alert('Clear All Data', 'Are you sure you want to delete all transactions?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: clearAllTransactions }
    ]);
  };

  const confirmLogout = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to log out?')) {
        logout();
      }
      return;
    }
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: logout }
    ]);
  };

  const SettingRow = ({ icon, title, subtitle, right, onPress, isLast = false, isDanger = false }: any) => (
    <TouchableOpacity style={[styles.row, !isLast && styles.rowBorder]} onPress={onPress} disabled={!onPress} activeOpacity={0.7}>
      <View style={styles.rowIconWrap}>{icon}</View>
      <View style={styles.rowTextWrap}>
        <Text style={[styles.rowTitle, isDanger && { color: '#EF4444' }]}>{title}</Text>
        {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
      </View>
      <View style={styles.rowRightWrap}>{right}</View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: '#09090B' }]}>
      <RNStatusBar barStyle="light-content" backgroundColor="#09090B" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: bottomPad + TAB_BAR_H + 40 }}>

          {/* PROFILE CARD */}
          <TouchableOpacity style={styles.profileCard} onPress={() => setIsEditingName(!isEditingName)} activeOpacity={0.8}>
            <View style={styles.profileAvatar}>
              <Text style={styles.profileAvatarText}>{userName ? userName.substring(0, 2).toUpperCase() : 'PP'}</Text>
              <View style={styles.profileEditBadge}>
                <Edit2 size={10} color="#000" />
              </View>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{userName || 'Paisa Pop User'}</Text>
            </View>
            <ChevronRight size={20} color="#888" />
          </TouchableOpacity>

          {/* Name Edit Modal (Inline for now) */}
          {isEditingName && (
            <View style={styles.inlineRow}>
              <TextInput style={styles.inlineInput} value={editNameValue} onChangeText={setEditNameValue} placeholder="Your Name" placeholderTextColor="#888" autoFocus />
              <TouchableOpacity style={styles.inlineSave} onPress={() => { login(editNameValue.trim() || 'User'); setIsEditingName(false); }}>
                <Text style={styles.inlineSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          )}

          <Text style={styles.sectionHeader}>Preferences</Text>
          <View style={styles.card}>
            <SettingRow
              icon={<Wallet size={18} color="#22C55E" />}
              title="Accounts & Wallets" subtitle="Manage your balances and transfers"
              right={<ChevronRight size={18} color="#888" />} onPress={() => navigation.navigate('Accounts')}
            />

            <SettingRow
              icon={<IndianRupee size={18} color="#22C55E" />}
              title="Currency" subtitle={CURRENCIES.find(c => c.value === currency)?.label ?? currency}
              right={<ChevronRight size={18} color="#888" />} onPress={() => setShowCurrencyPicker(!showCurrencyPicker)}
            />
            {showCurrencyPicker && (
              <ScrollView style={[styles.inlineExpansion, { maxHeight: 250 }]} nestedScrollEnabled={true}>
                {CURRENCIES.map(c => (
                  <TouchableOpacity key={c.value} style={styles.pickerRow} onPress={() => { setCurrency(c.value); setShowCurrencyPicker(false); }}>
                    <Text style={{ color: currency === c.value ? '#22C55E' : '#FFF', fontSize: 15 }}>{c.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <SettingRow
              icon={<LayoutGrid size={18} color="#22C55E" />}
              title="Categories" subtitle="Manage expense categories"
              right={<ChevronRight size={18} color="#888" />} onPress={() => setShowAddCat(!showAddCat)}
            />
            {showAddCat && (
              <View style={styles.inlineExpansion}>
                <Text style={{ color: '#FFF', fontSize: 13, marginBottom: 12 }}>You have {categories.length} categories.</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 }}>
                  <TouchableOpacity
                    style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: newCatColor + '20', alignItems: 'center', justifyContent: 'center' }}
                    onPress={() => setNewCatEmoji(EMOJIS[Math.floor(Math.random() * EMOJIS.length)])}
                  >
                    <Text style={{ fontSize: 20 }}>{newCatEmoji}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: newCatColor }}
                    onPress={() => setNewCatColor(COLORS[Math.floor(Math.random() * COLORS.length)])}
                  />
                  <TextInput
                    style={styles.inlineInput}
                    value={newCat} onChangeText={setNewCat} placeholder="e.g. Pet Care" placeholderTextColor="#888"
                  />
                </View>
                <TouchableOpacity
                  style={styles.inlineSave}
                  onPress={() => {
                    const t = newCat.trim();
                    if (t && !categories.includes(t)) {
                      addCategory(t, { emoji: newCatEmoji, color: newCatColor });
                      setNewCat(''); setShowAddCat(false);
                    }
                  }}
                >
                  <Text style={styles.inlineSaveText}>Add Category</Text>
                </TouchableOpacity>
              </View>
            )}

            <SettingRow
              icon={<Bell size={18} color="#22C55E" />}
              title="Monthly Budget" subtitle={monthlyBudget > 0 ? `${currencySymbol}${monthlyBudget.toLocaleString()}` : "Set a monthly budget limit"}
              right={<ChevronRight size={18} color="#888" />} onPress={() => setShowBudget(!showBudget)}
            />
            {showBudget && (
              <View style={styles.inlineExpansion}>
                <View style={styles.inlineRow}>
                  <TextInput
                    style={styles.inlineInput} keyboardType="numeric" value={budgetStr} onChangeText={setBudgetStr}
                    placeholder="e.g. 50000" placeholderTextColor="#888" autoFocus
                  />
                  <TouchableOpacity
                    style={styles.inlineSave}
                    onPress={() => {
                      const v = parseFloat(budgetStr);
                      if (!isNaN(v) && v >= 0) { setMonthlyBudget(v); setShowBudget(false); }
                    }}
                  >
                    <Text style={styles.inlineSaveText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <SettingRow
              icon={<Bell size={18} color="#22C55E" />}
              title="Reminders" subtitle="Get reminded for bills & budgets"
              right={<Switch value={reminders} onValueChange={setReminders} trackColor={{ true: '#22C55E', false: '#3F3F46' }} />}
            />

            <SettingRow
              icon={<Bell size={18} color="#22C55E" />}
              title="Notifications" subtitle="Account activity & updates" isLast={true}
              right={<Switch value={notifications} onValueChange={setNotifications} trackColor={{ true: '#22C55E', false: '#3F3F46' }} />}
            />
          </View>

          <Text style={styles.sectionHeader}>Data & Security</Text>
          <View style={styles.card}>
            <SettingRow
              icon={<FileDown size={18} color="#22C55E" />}
              title="Data Export" subtitle="Export your expenses & reports" isLast={true}
              right={<ChevronRight size={18} color="#888" />} onPress={() => setShowExport(!showExport)}
            />
            {showExport && (
              <View style={styles.inlineExpansion}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ color: '#FFF', fontSize: 15, fontWeight: '600' }}>Export All Data</Text>
                  <Switch value={exportAll} onValueChange={setExportAll} trackColor={{ false: '#3F3F46', true: '#22C55E' }} thumbColor="#FFF" />
                </View>
                {!exportAll && (
                  <View style={{ marginTop: 12 }}>
                    <Text style={{ color: '#888', fontSize: 13, fontWeight: '600', marginBottom: 12 }}>Select Month</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {MONTH_NAMES.map((mn, i) => (
                        <TouchableOpacity
                          key={mn}
                          style={[styles.monthPill, { backgroundColor: exportMonth === i ? '#22C55E' : '#27272A' }]}
                          onPress={() => setExportMonth(i)}
                        >
                          <Text style={{ color: exportMonth === i ? '#000' : '#888', fontWeight: exportMonth === i ? '700' : '400', fontSize: 13 }}>
                            {mn.slice(0, 3)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                    <View style={styles.yearRow}>
                      <TouchableOpacity onPress={() => setExportYear(y => y - 1)}><Text style={styles.yearBtn}>← </Text></TouchableOpacity>
                      <Text style={styles.yearLabel}>{exportYear}</Text>
                      <TouchableOpacity onPress={() => setExportYear(y => y + 1)}><Text style={styles.yearBtn}> →</Text></TouchableOpacity>
                    </View>
                  </View>
                )}
                <TouchableOpacity style={[styles.inlineSave, { marginTop: 20, width: '100%' }]} onPress={handleExport} disabled={exporting}>
                  {exporting ? <ActivityIndicator color="#000" size="small" /> : <Text style={styles.inlineSaveText}>Share / Download CSV</Text>}
                </TouchableOpacity>
              </View>
            )}
          </View>

          <Text style={styles.sectionHeader}>App</Text>
          <View style={styles.card}>
            <SettingRow
              icon={<Moon size={18} color="#22C55E" />}
              title="Theme" subtitle="Choose your preferred theme"
              right={
                <View style={styles.themeToggle}>
                  <TouchableOpacity style={theme === 'dark' ? styles.themeToggleBtnActive : styles.themeToggleBtn} onPress={() => setTheme('dark')}>
                    <Text style={theme === 'dark' ? styles.themeToggleTextActive : styles.themeToggleText}>Dark</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={theme === 'light' ? styles.themeToggleBtnActive : styles.themeToggleBtn} onPress={() => setTheme('light')}>
                    <Text style={theme === 'light' ? styles.themeToggleTextActive : styles.themeToggleText}>Light</Text>
                  </TouchableOpacity>
                </View>
              }
            />

            <SettingRow
              icon={<HelpCircle size={18} color="#22C55E" />}
              title="Help & Support" subtitle="FAQs, contact us"
              right={<ChevronRight size={18} color="#888" />} onPress={() => {
                import('react-native').then(({ Linking }) => {
                  Linking.openURL('mailto:saleskerplunkmedia@gmail.com').catch(() => {
                    import('react-native').then(({ Alert, Platform }) => {
                      if (Platform.OS === 'web') window.alert('Could not open email client. Please email us at saleskerplunkmedia@gmail.com');
                      else Alert.alert('Error', 'Could not open email client. Please email us at saleskerplunkmedia@gmail.com');
                    });
                  });
                });
              }}
            />

            <SettingRow
              icon={<Info size={18} color="#22C55E" />}
              title="About App" subtitle="Version 1.0.0" isLast={true}
              right={<ChevronRight size={18} color="#888" />} onPress={() => {
                navigation.navigate('About');
              }}
            />
          </View>

          <Text style={styles.sectionHeader}>Danger Zone</Text>
          <View style={[styles.card, { marginBottom: 20 }]}>
            <SettingRow
              icon={<Trash2 size={18} color="#EF4444" />}
              title="Clear All Data" subtitle="Delete all transactions permanently" isDanger={true}
              right={<ChevronRight size={18} color="#EF4444" />} onPress={confirmClearAll}
            />
            <SettingRow
              icon={<LogOut size={18} color="#EF4444" />}
              title="Log Out" subtitle="Sign out of your account" isDanger={true} isLast={true}
              right={<ChevronRight size={18} color="#EF4444" />} onPress={confirmLogout}
            />
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { alignItems: 'center', paddingVertical: 16 },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: '700' },

  profileCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#131315',
    borderWidth: 1, borderColor: '#1F2937', borderRadius: 16, padding: 16, marginTop: 10,
    shadowColor: '#22C55E', shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }
  },
  profileAvatar: {
    width: 60, height: 60, borderRadius: 30, borderWidth: 1, borderColor: '#22C55E',
    justifyContent: 'center', alignItems: 'center', backgroundColor: '#09090B'
  },
  profileAvatarText: { color: '#22C55E', fontSize: 24, fontWeight: '800', fontStyle: 'italic' },
  profileEditBadge: {
    position: 'absolute', bottom: -2, right: -2, backgroundColor: '#22C55E',
    width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#131315'
  },
  profileInfo: { flex: 1, marginLeft: 16 },
  profileName: { color: '#FFF', fontSize: 18, fontWeight: '700', marginBottom: 2 },
  profileEmail: { color: '#888', fontSize: 13, marginBottom: 8 },
  premiumBadge: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A2E20',
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start', gap: 4
  },
  premiumText: { color: '#22C55E', fontSize: 11, fontWeight: '600' },

  sectionHeader: { color: '#666', fontSize: 13, fontWeight: '600', marginLeft: 4, marginTop: 24, marginBottom: 8 },
  card: { backgroundColor: '#131315', borderRadius: 16, borderWidth: 1, borderColor: '#27272A', overflow: 'hidden' },

  row: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: '#27272A' },
  rowIconWrap: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#1A2E20', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  rowTextWrap: { flex: 1 },
  rowTitle: { color: '#FFF', fontSize: 15, fontWeight: '600', marginBottom: 2 },
  rowSubtitle: { color: '#888', fontSize: 13 },
  rowRightWrap: { marginLeft: 12 },

  themeToggle: { flexDirection: 'row', backgroundColor: '#09090B', borderRadius: 20, padding: 2, borderWidth: 1, borderColor: '#27272A' },
  themeToggleBtnActive: { backgroundColor: '#1A2E20', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 6, borderWidth: 1, borderColor: '#22C55E' },
  themeToggleTextActive: { color: '#22C55E', fontSize: 12, fontWeight: '600' },
  themeToggleBtn: { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 6 },
  themeToggleText: { color: '#888', fontSize: 12, fontWeight: '600' },

  inlineExpansion: { padding: 16, backgroundColor: '#0D0D0F', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#27272A' },
  pickerRow: { paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#27272A' },

  inlineRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
  inlineInput: { flex: 1, height: 48, borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, fontSize: 15, color: '#FFF', backgroundColor: '#131315', borderColor: '#27272A' },
  inlineSave: { height: 48, paddingHorizontal: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: '#22C55E' },
  inlineSaveText: { color: '#000', fontSize: 15, fontWeight: '800' },

  monthPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 8 },
  yearRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16, gap: 24 },
  yearLabel: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  yearBtn: { color: '#22C55E', fontSize: 20, fontWeight: '700', padding: 8 },
});
