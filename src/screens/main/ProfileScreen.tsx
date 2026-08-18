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

  type ActiveSection = 'currency' | 'categories' | 'export' | null;
  const [activeSection, setActiveSection] = useState<ActiveSection>(null);
  const toggleSection = (sec: ActiveSection) => setActiveSection(prev => (prev === sec ? null : sec));

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
      if (window.confirm('Are you sure you want to delete all transactions and reset all budgets?')) {
        clearAllTransactions();
      }
      return;
    }
    Alert.alert('Clear All Data', 'Are you sure you want to delete all transactions and reset all budgets?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete All', style: 'destructive', onPress: clearAllTransactions }
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
    <TouchableOpacity 
      style={[
        styles.row, 
        !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border }
      ]} 
      onPress={onPress} 
      disabled={!onPress} 
      activeOpacity={0.7}
    >
      <View style={[styles.rowIconWrap, { backgroundColor: theme === 'light' ? 'rgba(34,197,94,0.1)' : '#1A2E20' }]}>
        {icon}
      </View>
      <View style={styles.rowTextWrap}>
        <Text style={[styles.rowTitle, { color: isDanger ? '#EF4444' : colors.textPrimary }]}>{title}</Text>
        {subtitle ? <Text style={[styles.rowSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text> : null}
      </View>
      <View style={styles.rowRightWrap}>{right}</View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <RNStatusBar 
        barStyle={theme === 'light' ? 'dark-content' : 'light-content'} 
        backgroundColor={colors.background} 
      />

      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Settings</Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: bottomPad + TAB_BAR_H + 40 }}>

          {/* PROFILE CARD */}
          <TouchableOpacity 
            style={[styles.profileCard, { backgroundColor: colors.surface, borderColor: colors.border }]} 
            onPress={() => setIsEditingName(!isEditingName)} 
            activeOpacity={0.8}
          >
            <View style={[styles.profileAvatar, { backgroundColor: colors.background }]}>
              <Text style={styles.profileAvatarText}>{userName ? userName.substring(0, 2).toUpperCase() : 'PP'}</Text>
              <View style={[styles.profileEditBadge, { borderColor: colors.surface }]}>
                <Edit2 size={10} color="#000" />
              </View>
            </View>
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: colors.textPrimary }]}>{userName || 'Paisa Pop User'}</Text>
            </View>
            <ChevronRight size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          {/* Name Edit Modal (Inline for now) */}
          {isEditingName && (
            <View style={styles.inlineRow}>
              <TextInput 
                style={[styles.inlineInput, { backgroundColor: colors.surfaceElevated, borderColor: colors.border, color: colors.textPrimary }]} 
                value={editNameValue} 
                onChangeText={setEditNameValue} 
                placeholder="Your Name" 
                placeholderTextColor={colors.textMuted} 
                autoFocus 
              />
              <TouchableOpacity 
                style={[
                  styles.inlineSave,
                  { backgroundColor: theme === 'light' ? '#18181B' : '#FFFFFF' }
                ]} 
                onPress={() => { login(editNameValue.trim() || 'User'); setIsEditingName(false); }}
              >
                <Text style={[styles.inlineSaveText, { color: theme === 'light' ? '#FFFFFF' : '#000000' }]}>Save</Text>
              </TouchableOpacity>
            </View>
          )}

          <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>Preferences</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <SettingRow
              icon={<Wallet size={18} color="#22C55E" />}
              title="Accounts & Wallets" subtitle="Manage your balances and transfers"
              right={<ChevronRight size={18} color={colors.textSecondary} />} onPress={() => navigation.navigate('Accounts')}
            />

            <SettingRow
              icon={<IndianRupee size={18} color="#22C55E" />}
              title="Currency" subtitle={CURRENCIES.find(c => c.value === currency)?.label ?? currency}
              right={<ChevronRight size={18} color={colors.textSecondary} />} onPress={() => toggleSection('currency')}
            />
            {activeSection === 'currency' && (
              <ScrollView style={[styles.inlineExpansion, { maxHeight: 250, backgroundColor: colors.surfaceElevated, borderColor: colors.border }]} nestedScrollEnabled={true}>
                {CURRENCIES.map(c => (
                  <TouchableOpacity key={c.value} style={[styles.pickerRow, { borderBottomColor: colors.border }]} onPress={() => { setCurrency(c.value); toggleSection('currency'); }}>
                    <Text style={{ color: currency === c.value ? '#22C55E' : colors.textPrimary, fontSize: 15 }}>{c.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <SettingRow
              icon={<LayoutGrid size={18} color="#22C55E" />}
              title="Categories" subtitle="Manage expense categories"
              right={<ChevronRight size={18} color={colors.textSecondary} />} onPress={() => toggleSection('categories')}
            />
            {activeSection === 'categories' && (
              <View style={[styles.inlineExpansion, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                <Text style={{ color: colors.textPrimary, fontSize: 13, marginBottom: 10 }}>You have {categories.length} categories.</Text>
                
                {/* Emoji Selector Strip */}
                <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '600', marginBottom: 6 }}>SELECT ICON</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }} contentContainerStyle={{ gap: 6 }}>
                  {EMOJIS.map(emoji => {
                    const isSelected = newCatEmoji === emoji;
                    return (
                      <TouchableOpacity
                        key={emoji}
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 18,
                          backgroundColor: isSelected ? 'rgba(34,197,94,0.15)' : colors.surface,
                          borderWidth: 1,
                          borderColor: isSelected ? '#22C55E' : colors.border,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        onPress={() => setNewCatEmoji(emoji)}
                      >
                        <Text style={{ fontSize: 18 }}>{emoji}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {/* Input & Add Button Row */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      backgroundColor: newCatColor + '20',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    <Text style={{ fontSize: 20 }}>{newCatEmoji}</Text>
                  </View>
                  <TextInput
                    style={[
                      styles.inlineInput,
                      {
                        flex: 1,
                        height: 44,
                        marginTop: 0,
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                        color: colors.textPrimary,
                        paddingHorizontal: 12,
                        fontSize: 14,
                      }
                    ]}
                    placeholder="New category name"
                    placeholderTextColor={colors.textMuted}
                    value={newCat}
                    onChangeText={setNewCat}
                  />
                  <TouchableOpacity
                    style={[
                      styles.inlineSave,
                      {
                        height: 44,
                        paddingHorizontal: 16,
                        minWidth: 56,
                        backgroundColor: newCat.trim() ? (theme === 'light' ? '#18181B' : '#FFFFFF') : (theme === 'light' ? '#E4E4E7' : '#27272A'),
                      }
                    ]}
                    disabled={!newCat.trim()}
                    onPress={() => {
                      if (newCat.trim()) {
                        addCategory(newCat.trim(), { emoji: newCatEmoji, color: newCatColor });
                        setNewCat('');
                        toggleSection('categories');
                      }
                    }}
                  >
                    <Text style={[styles.inlineSaveText, { color: newCat.trim() ? (theme === 'light' ? '#FFFFFF' : '#000000') : colors.textMuted, fontSize: 14 }]}>Add</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <SettingRow
              icon={<Bell size={18} color="#22C55E" />}
              title="Reminders" subtitle="Get reminded for bills & budgets"
              right={<Switch value={reminders} onValueChange={setReminders} trackColor={{ true: '#22C55E', false: colors.border }} thumbColor="#FFF" />}
            />

            <SettingRow
              icon={<Bell size={18} color="#22C55E" />}
              title="Notifications" subtitle="Account activity & updates" isLast={true}
              right={<Switch value={notifications} onValueChange={setNotifications} trackColor={{ true: '#22C55E', false: colors.border }} thumbColor="#FFF" />}
            />
          </View>

          <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>Data & Security</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <SettingRow
              icon={<FileDown size={18} color="#22C55E" />}
              title="Data Export" subtitle="Export your expenses & reports" isLast={true}
              right={<ChevronRight size={18} color={colors.textSecondary} />} onPress={() => toggleSection('export')}
            />
            {activeSection === 'export' && (
              <View style={[styles.inlineExpansion, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: '600' }}>Export All Data</Text>
                  <Switch value={exportAll} onValueChange={setExportAll} trackColor={{ false: colors.border, true: '#22C55E' }} thumbColor="#FFF" />
                </View>
                {!exportAll && (
                  <View style={{ marginTop: 12 }}>
                    <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: '600', marginBottom: 12 }}>Select Month</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {MONTH_NAMES.map((mn, i) => (
                        <TouchableOpacity
                          key={mn}
                          style={[styles.monthPill, { backgroundColor: exportMonth === i ? '#22C55E' : (theme === 'light' ? '#E4E4E7' : '#27272A') }]}
                          onPress={() => setExportMonth(i)}
                        >
                          <Text style={{ color: exportMonth === i ? '#000' : colors.textSecondary, fontWeight: exportMonth === i ? '700' : '400', fontSize: 13 }}>
                            {mn.slice(0, 3)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                    <View style={styles.yearRow}>
                      <TouchableOpacity onPress={() => setExportYear(y => y - 1)}><Text style={styles.yearBtn}>← </Text></TouchableOpacity>
                      <Text style={[styles.yearLabel, { color: colors.textPrimary }]}>{exportYear}</Text>
                      <TouchableOpacity onPress={() => setExportYear(y => y + 1)}><Text style={styles.yearBtn}> →</Text></TouchableOpacity>
                    </View>
                  </View>
                )}
                <TouchableOpacity 
                  style={[
                    styles.inlineSave, 
                    { marginTop: 20, width: '100%', backgroundColor: theme === 'light' ? '#18181B' : '#FFFFFF' }
                  ]} 
                  onPress={handleExport} 
                  disabled={exporting}
                >
                  {exporting ? (
                    <ActivityIndicator color={theme === 'light' ? '#FFFFFF' : '#000000'} size="small" />
                  ) : (
                    <Text style={[styles.inlineSaveText, { color: theme === 'light' ? '#FFFFFF' : '#000000' }]}>
                      Share / Download CSV
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>

          <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>App</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <SettingRow
              icon={<Moon size={18} color="#22C55E" />}
              title="Theme" subtitle="Choose your preferred theme"
              right={
                <View style={[styles.themeToggle, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <TouchableOpacity 
                    style={theme === 'dark' ? styles.themeToggleBtnActive : styles.themeToggleBtn} 
                    onPress={() => setTheme('dark')}
                  >
                    <Text style={theme === 'dark' ? styles.themeToggleTextActive : [styles.themeToggleText, { color: colors.textSecondary }]}>Dark</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={theme === 'light' ? styles.themeToggleBtnActive : styles.themeToggleBtn} 
                    onPress={() => setTheme('light')}
                  >
                    <Text style={theme === 'light' ? styles.themeToggleTextActive : [styles.themeToggleText, { color: colors.textSecondary }]}>Light</Text>
                  </TouchableOpacity>
                </View>
              }
            />

            <SettingRow
              icon={<HelpCircle size={18} color="#22C55E" />}
              title="Help & Support" subtitle="FAQs, contact us"
              right={<ChevronRight size={18} color={colors.textSecondary} />} onPress={() => {
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
              right={<ChevronRight size={18} color={colors.textSecondary} />} onPress={() => {
                navigation.navigate('About');
              }}
            />
          </View>

          <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>Danger Zone</Text>
          <View style={[styles.card, { marginBottom: 20, backgroundColor: colors.surface, borderColor: colors.border }]}>
            <SettingRow
              icon={<Trash2 size={18} color="#EF4444" />}
              title="Clear All Data" subtitle="Delete all transactions & reset budgets" isDanger={true}
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
  headerTitle: { fontSize: 18, fontWeight: '700' },

  profileCard: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderRadius: 16, padding: 16, marginTop: 10,
    shadowColor: '#22C55E', shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }
  },
  profileAvatar: {
    width: 60, height: 60, borderRadius: 30, borderWidth: 1, borderColor: '#22C55E',
    justifyContent: 'center', alignItems: 'center'
  },
  profileAvatarText: { color: '#22C55E', fontSize: 24, fontWeight: '800', fontStyle: 'italic' },
  profileEditBadge: {
    position: 'absolute', bottom: -2, right: -2, backgroundColor: '#22C55E',
    width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2
  },
  profileInfo: { flex: 1, marginLeft: 16 },
  profileName: { fontSize: 18, fontWeight: '700', marginBottom: 2 },
  profileEmail: { fontSize: 13, marginBottom: 8 },

  sectionHeader: { fontSize: 13, fontWeight: '600', marginLeft: 4, marginTop: 24, marginBottom: 8 },
  card: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },

  row: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  rowIconWrap: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  rowTextWrap: { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  rowSubtitle: { fontSize: 13 },
  rowRightWrap: { marginLeft: 12 },

  themeToggle: { flexDirection: 'row', borderRadius: 20, padding: 2, borderWidth: 1 },
  themeToggleBtnActive: { backgroundColor: '#1A2E20', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 6, borderWidth: 1, borderColor: '#22C55E' },
  themeToggleTextActive: { color: '#22C55E', fontSize: 12, fontWeight: '600' },
  themeToggleBtn: { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 6 },
  themeToggleText: { fontSize: 12, fontWeight: '600' },

  inlineExpansion: { padding: 16, borderTopWidth: 1, borderBottomWidth: 1 },
  pickerRow: { paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },

  inlineRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
  inlineInput: { flex: 1, height: 48, borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, fontSize: 15 },
  inlineSave: { height: 48, paddingHorizontal: 20, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  inlineSaveText: { fontSize: 14, fontWeight: '700' },

  monthPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 8 },
  yearRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16, gap: 24 },
  yearLabel: { fontSize: 18, fontWeight: '700' },
  yearBtn: { color: '#22C55E', fontSize: 20, fontWeight: '700', padding: 8 },
});
