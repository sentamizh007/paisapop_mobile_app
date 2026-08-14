import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Switch, TextInput,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, SafeAreaView, Alert
} from 'react-native';
import { ChevronRight, Download, Trash2, LogOut, User } from 'lucide-react-native';
import { MONTH_NAMES } from '../../utils/exportUtils';
import { exportAndShare } from '../../utils/exportUtils';
import { Currency, Theme, useStore } from '../../store/useStore';
import { useThemeColors } from '../../theme/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  { label: 'Swedish Krona (kr)', value: 'SEK', symbol: 'kr' },
  { label: 'New Zealand Dollar (NZ$)', value: 'NZD', symbol: 'NZ$' },
  { label: 'Mexican Peso ($)', value: 'MXN', symbol: '$' },
  { label: 'Singapore Dollar (S$)', value: 'SGD', symbol: 'S$' },
  { label: 'Hong Kong Dollar (HK$)', value: 'HKD', symbol: 'HK$' },
  { label: 'South Korean Won (₩)', value: 'KRW', symbol: '₩' },
  { label: 'Turkish Lira (₺)', value: 'TRY', symbol: '₺' },
  { label: 'Russian Ruble (₽)', value: 'RUB', symbol: '₽' },
  { label: 'South African Rand (R)', value: 'ZAR', symbol: 'R' },
  { label: 'Brazilian Real (R$)', value: 'BRL', symbol: 'R$' },
  { label: 'Indonesian Rupiah (Rp)', value: 'IDR', symbol: 'Rp' },
  { label: 'Philippine Peso (₱)', value: 'PHP', symbol: '₱' },
  { label: 'Malaysian Ringgit (RM)', value: 'MYR', symbol: 'RM' },
  { label: 'Thai Baht (฿)', value: 'THB', symbol: '฿' },
];



export const ProfileScreen = () => {
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

  const handleExport = async () => {
    setExporting(true);
    try {
      const result = await exportAndShare(
        transactions,
        exportAll ? undefined : exportMonth,
        exportAll ? undefined : exportYear,
      );
      if (!result.success) {
        Alert.alert('Export Failed', result.error ?? 'Unknown error');
      }
    } finally {
      setExporting(false);
    }
  };

  const confirmClearAll = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to delete all transactions? This cannot be undone.')) {
        clearAllTransactions();
      }
    } else {
      Alert.alert('Clear All Data', 'Are you sure you want to delete all transactions? This cannot be undone.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: clearAllTransactions }
      ]);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <RNStatusBar barStyle="light-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        {isEditingName ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 16 }}>
            <TextInput
              style={[styles.inlineInput, { flex: 1, color: colors.textPrimary, backgroundColor: colors.surface, borderColor: colors.border }]}
              value={editNameValue}
              onChangeText={setEditNameValue}
              placeholder="Your Name"
              placeholderTextColor={colors.textSecondary}
              autoFocus
            />
            <TouchableOpacity
              style={[styles.inlineSave, { marginLeft: 12 }]}
              onPress={() => {
                login(editNameValue.trim() || 'User');
                setIsEditingName(false);
              }}
            >
              <Text style={styles.inlineSaveText}>Save</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={[styles.headerTitle, { color: colors.textPrimary, flexShrink: 1, marginRight: 12 }]} numberOfLines={1}>
              {userName || 'Profile'}
            </Text>
            <TouchableOpacity onPress={() => { setEditNameValue(userName || ''); setIsEditingName(true); }}>
              <Text style={{ color: colors.primary, fontWeight: '600' }}>Edit Name</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: bottomPad + TAB_BAR_H + 40 }}
        >
          <TouchableOpacity
            style={[styles.settingRow, { borderColor: colors.border }]}
            onPress={() => setShowCurrencyPicker(p => !p)}
          >
            <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Currency</Text>
            <View style={styles.settingRight}>
              <Text style={[styles.settingValue, { color: colors.primary }]}>
                {CURRENCIES.find(c => c.value === currency)?.label ?? currency}
              </Text>
              <ChevronRight size={14} color={colors.textSecondary} />
            </View>
          </TouchableOpacity>
          {showCurrencyPicker && (
            <View style={[styles.pickerBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {CURRENCIES.map(c => (
                <TouchableOpacity
                  key={c.value}
                  style={[styles.pickerRow, { borderColor: colors.border }]}
                  onPress={() => { setCurrency(c.value); setShowCurrencyPicker(false); }}
                >
                  <Text style={[styles.pickerText, { color: currency === c.value ? colors.primary : colors.textPrimary }]}>
                    {currency === c.value ? '✓  ' : '      '}{c.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Monthly Budget */}
          <Text style={[styles.settingSection, { color: colors.textSecondary }]}>FINANCIALS</Text>
          <TouchableOpacity
            style={[styles.settingRow, { borderColor: colors.border }]}
            onPress={() => { setBudgetStr(monthlyBudget > 0 ? monthlyBudget.toString() : ''); setShowBudget(p => !p); }}
          >
            <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Monthly Budget</Text>
            <View style={styles.settingRight}>
              <Text style={[styles.settingValue, { color: colors.primary }]}>
                {monthlyBudget > 0 ? `${currencySymbol}${monthlyBudget.toLocaleString('en-US')}` : 'Set'}
              </Text>
              <ChevronRight size={14} color={colors.textSecondary} />
            </View>
          </TouchableOpacity>
          {showBudget && (
            <View style={styles.inlineRow}>
              <TextInput
                style={[styles.inlineInput, { color: colors.textPrimary, backgroundColor: colors.surface, borderColor: colors.border }]}
                keyboardType="numeric"
                value={budgetStr}
                onChangeText={setBudgetStr}
                placeholder="e.g. 50000"
                placeholderTextColor={colors.textSecondary}
                autoFocus
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
          )}

          {/* Categories */}
          <Text style={[styles.settingSection, { color: colors.textSecondary }]}>CATEGORIES</Text>
          <TouchableOpacity
            style={[styles.settingRow, { borderColor: colors.border }]}
            onPress={() => {
              setNewCatEmoji(EMOJIS[Math.floor(Math.random() * EMOJIS.length)]);
              setNewCatColor(COLORS[Math.floor(Math.random() * COLORS.length)]);
              setShowAddCat(p => !p);
            }}
          >
            <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Add Category</Text>
            <View style={styles.settingRight}>
              <Text style={[styles.settingValue, { color: colors.primary }]}>{categories.length} total</Text>
              <ChevronRight size={14} color={colors.textSecondary} />
            </View>
          </TouchableOpacity>
          {showAddCat && (
            <View style={[styles.inlineRow, { flexDirection: 'column', alignItems: 'stretch' }]}>
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
                  style={[styles.inlineInput, { flex: 1, color: colors.textPrimary, backgroundColor: colors.surface, borderColor: colors.border }]}
                  value={newCat}
                  onChangeText={setNewCat}
                  placeholder="e.g. Pet Care"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
              <TouchableOpacity
                style={[styles.inlineSave, { width: '100%', alignItems: 'center' }]}
                onPress={() => {
                  const t = newCat.trim();
                  if (t && !categories.includes(t)) {
                    addCategory(t, { emoji: newCatEmoji, color: newCatColor });
                    setNewCat('');
                    setShowAddCat(false);
                  }
                }}
              >
                <Text style={styles.inlineSaveText}>Add Category</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            style={[styles.settingRow, { borderColor: colors.border }]}
            onPress={() => setShowCatBudget(p => !p)}
          >
            <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Category Budgets</Text>
            <ChevronRight size={14} color={colors.textSecondary} />
          </TouchableOpacity>
          {showCatBudget && (
            <View style={{ paddingTop: 10, paddingBottom: 15 }}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                {categories.map(c => (
                  <TouchableOpacity
                    key={c}
                    style={{ padding: 8, paddingHorizontal: 12, borderRadius: 20, backgroundColor: budgetCat === c ? colors.primary : colors.surfaceMid, marginRight: 8 }}
                    onPress={() => setBudgetCat(c)}
                  >
                    <Text style={{ color: budgetCat === c ? '#000' : colors.textPrimary, fontWeight: budgetCat === c ? '700' : '400' }}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              {budgetCat ? (
                <View style={styles.inlineRow}>
                  <TextInput
                    style={[styles.inlineInput, { color: colors.textPrimary, backgroundColor: colors.surface, borderColor: colors.border }]}
                    keyboardType="numeric"
                    value={catBudgetAmount}
                    onChangeText={setCatBudgetAmount}
                    placeholder={`Limit for ${budgetCat}`}
                    placeholderTextColor={colors.textSecondary}
                  />
                  <TouchableOpacity
                    style={[styles.inlineSave, { backgroundColor: colors.primary, paddingHorizontal: 10, marginRight: 5 }]}
                    onPress={() => setCatBudgetPeriod(p => p === 'monthly' ? 'weekly' : 'monthly')}
                  >
                    <Text style={styles.inlineSaveText}>{catBudgetPeriod === 'monthly' ? 'Month' : 'Week'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.inlineSave}
                    onPress={() => {
                      const v = parseFloat(catBudgetAmount);
                      if (!isNaN(v) && v >= 0) {
                        setCategoryBudget(budgetCat, { amount: v, period: catBudgetPeriod });
                        setCatBudgetAmount('');
                        setBudgetCat('');
                      }
                    }}
                  >
                    <Text style={styles.inlineSaveText}>Save</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
              {Object.keys(categoryBudgets).map(c => (
                <Text key={c} style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4 }}>
                  {c}: {currencySymbol}{categoryBudgets[c].amount} / {categoryBudgets[c].period}
                </Text>
              ))}
            </View>
          )}

          {/* Export */}
          <Text style={[styles.settingSection, { color: colors.textSecondary }]}>DATA</Text>
          <TouchableOpacity
            style={[styles.settingRow, { borderColor: colors.border }]}
            onPress={() => setShowExport(p => !p)}
          >
            <View style={styles.settingLeft}>
              <Download size={17} color={colors.primary} />
              <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Export to CSV</Text>
            </View>
            <ChevronRight size={14} color={colors.textSecondary} />
          </TouchableOpacity>

          {showExport && (
            <View style={[styles.exportPanel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.exportToggleRow}>
                <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Export All Data</Text>
                <Switch
                  value={exportAll}
                  onValueChange={setExportAll}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#FFF"
                />
              </View>
              {!exportAll && (
                <View style={{ marginTop: 12 }}>
                  <Text style={[styles.exportLabel, { color: colors.textSecondary }]}>Select Month</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {MONTH_NAMES.map((mn, i) => (
                      <TouchableOpacity
                        key={mn}
                        style={[styles.monthPill, { backgroundColor: exportMonth === i ? colors.primary : colors.surfaceMid }]}
                        onPress={() => setExportMonth(i)}
                      >
                        <Text style={[styles.monthPillText, { color: exportMonth === i ? '#000' : colors.textSecondary, fontWeight: exportMonth === i ? '700' : '400' }]}>
                          {mn.slice(0, 3)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  <View style={styles.yearRow}>
                    <TouchableOpacity onPress={() => setExportYear(y => y - 1)}>
                      <Text style={[styles.yearBtn, { color: colors.primary }]}>← </Text>
                    </TouchableOpacity>
                    <Text style={[styles.yearLabel, { color: colors.textPrimary }]}>{exportYear}</Text>
                    <TouchableOpacity onPress={() => setExportYear(y => y + 1)}>
                      <Text style={[styles.yearBtn, { color: colors.primary }]}> →</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              <TouchableOpacity
                style={styles.exportBtn}
                onPress={handleExport}
                disabled={exporting}
              >
                {exporting
                  ? <ActivityIndicator color="#000" size="small" />
                  : <Text style={styles.exportBtnText}>Share / Download CSV</Text>
                }
              </TouchableOpacity>
            </View>
          )}

          {/* Danger zone */}
          <Text style={[styles.settingSection, { color: colors.textSecondary }]}>DANGER ZONE</Text>
          <TouchableOpacity
            style={[styles.settingRow, styles.dangerRow, { borderColor: '#FEE2E2' }]}
            onPress={confirmClearAll}
          >
            <View style={styles.settingLeft}>
              <Trash2 size={17} color="#EF4444" />
              <Text style={[styles.settingLabel, { color: '#EF4444' }]}>Clear All Data</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingRow, styles.dangerRow, { borderColor: '#FEE2E2', marginTop: 12 }]}
            onPress={logout}
          >
            <View style={styles.settingLeft}>
              <LogOut size={17} color="#EF4444" />
              <Text style={[styles.settingLabel, { color: '#EF4444' }]}>Log Out</Text>
            </View>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 10 },
  headerTitle: { fontSize: 24, fontWeight: '800', letterSpacing: -0.3 },

  settingSection: { fontSize: 12, fontWeight: '800', letterSpacing: 1, marginTop: 24, marginBottom: 12 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  settingLabel: { fontSize: 16, fontWeight: '600' },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  settingValue: { fontSize: 15, fontWeight: '600' },
  dangerRow: { borderBottomWidth: 0, marginTop: 8 },

  // Pickers & Inputs
  pickerBox: { borderRadius: 16, borderWidth: 1, marginTop: 8, overflow: 'hidden' },
  pickerRow: { padding: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  pickerText: { fontSize: 15, fontWeight: '600' },
  inlineRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
  inlineInput: { flex: 1, height: 48, borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, fontSize: 15 },
  inlineSave: { height: 48, paddingHorizontal: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' },
  inlineSaveText: { color: '#000000', fontSize: 15, fontWeight: '800' },

  // Export
  exportPanel: { borderRadius: 16, borderWidth: 1, marginTop: 12, padding: 16 },
  exportToggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  exportLabel: { fontSize: 13, fontWeight: '600', marginBottom: 12 },
  monthPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 8 },
  monthPillText: { fontSize: 13, fontWeight: '600' },
  yearRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16, gap: 24 },
  yearLabel: { fontSize: 18, fontWeight: '700' },
  yearBtn: { fontSize: 20, fontWeight: '700', padding: 8 },
  exportBtn: { marginTop: 20, height: 50, borderRadius: 14, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' },
  exportBtnText: { color: '#000000', fontSize: 16, fontWeight: '800' },
});
