import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal, Switch, TextInput,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Animated
} from 'react-native';
import { X, ChevronRight, Download, Trash2 } from 'lucide-react-native';
import { MONTH_NAMES } from '../utils/exportUtils';
import { exportAndShare } from '../utils/exportUtils';
import { Transaction } from '../utils/mockData';
import { Alert } from 'react-native';
import { Currency, Theme } from '../store/useStore';

const CURRENCIES: { label: string; value: Currency; symbol: string }[] = [
  { label: 'Indian Rupee (₹)', value: 'INR', symbol: '₹' },
  { label: 'US Dollar ($)', value: 'USD', symbol: '$' },
];

interface Props {
  visible: boolean;
  onClose: () => void;
  colors: any;
  theme: Theme;
  setTheme: (t: Theme) => void;
  currency: Currency;
  setCurrency: (c: Currency) => void;
  currencySymbol: string;
  monthlyBudget: number;
  setMonthlyBudget: (b: number) => void;
  categories: string[];
  addCategory: (c: string) => void;
  confirmClearAll: () => void;
  transactions: Transaction[];
}

export const SettingsModal = ({
  visible, onClose, colors, theme, setTheme, currency, setCurrency,
  currencySymbol, monthlyBudget, setMonthlyBudget, categories,
  addCategory, confirmClearAll, transactions
}: Props) => {
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [showBudget, setShowBudget] = useState(false);
  const [budgetStr, setBudgetStr] = useState('');
  const [showAddCat, setShowAddCat] = useState(false);
  const [newCat, setNewCat] = useState('');

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

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.sheetOverlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Animated.View style={[styles.sheet, { backgroundColor: colors.surface }]}>
            <View style={styles.sheetHandleBar} />
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>Settings</Text>
              <TouchableOpacity
                style={[styles.iconBtn, { backgroundColor: colors.background }]}
                onPress={onClose}
              >
                <X size={17} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {/* Appearance */}
              <Text style={[styles.settingSection, { color: colors.textSecondary }]}>APPEARANCE</Text>

              <View style={[styles.settingRow, { borderColor: colors.border }]}>
                <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Dark Mode</Text>
                <Switch
                  value={theme === 'dark'}
                  onValueChange={v => setTheme(v ? 'dark' : 'light')}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#FFF"
                />
              </View>

              {/* Currency */}
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
                <View style={[styles.pickerBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
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
                    style={[styles.inlineInput, { color: colors.textPrimary, backgroundColor: colors.background, borderColor: colors.border }]}
                    keyboardType="numeric"
                    value={budgetStr}
                    onChangeText={setBudgetStr}
                    placeholder="e.g. 50000"
                    placeholderTextColor={colors.textSecondary}
                    autoFocus
                  />
                  <TouchableOpacity
                    style={[styles.inlineSave, { backgroundColor: colors.primary }]}
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
                onPress={() => setShowAddCat(p => !p)}
              >
                <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Add Category</Text>
                <View style={styles.settingRight}>
                  <Text style={[styles.settingValue, { color: colors.primary }]}>{categories.length} total</Text>
                  <ChevronRight size={14} color={colors.textSecondary} />
                </View>
              </TouchableOpacity>
              {showAddCat && (
                <View style={styles.inlineRow}>
                  <TextInput
                    style={[styles.inlineInput, { color: colors.textPrimary, backgroundColor: colors.background, borderColor: colors.border }]}
                    value={newCat}
                    onChangeText={setNewCat}
                    placeholder="e.g. Pet Care"
                    placeholderTextColor={colors.textSecondary}
                    autoFocus
                  />
                  <TouchableOpacity
                    style={[styles.inlineSave, { backgroundColor: colors.primary }]}
                    onPress={() => {
                      const t = newCat.trim();
                      if (t && !categories.includes(t)) { addCategory(t); setNewCat(''); setShowAddCat(false); }
                    }}
                  >
                    <Text style={styles.inlineSaveText}>Add</Text>
                  </TouchableOpacity>
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
                <View style={[styles.exportPanel, { backgroundColor: colors.background, borderColor: colors.border }]}>
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
                            style={[styles.monthPill, { backgroundColor: exportMonth === i ? colors.primary : colors.surface }]}
                            onPress={() => setExportMonth(i)}
                          >
                            <Text style={[styles.monthPillText, { color: exportMonth === i ? '#FFF' : colors.textSecondary }]}>
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
                    style={[styles.exportBtn, { backgroundColor: colors.primary }]}
                    onPress={handleExport}
                    disabled={exporting}
                  >
                    {exporting
                      ? <ActivityIndicator color="#FFF" size="small" />
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

              <View style={{ height: 40 }} />
            </ScrollView>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  sheetOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: { borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingHorizontal: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24, maxHeight: '90%' },
  sheetHandleBar: { width: 44, height: 5, borderRadius: 3, backgroundColor: '#E2E8F0', alignSelf: 'center', marginTop: 14, marginBottom: 8 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  sheetTitle: { fontSize: 24, fontWeight: '800' },
  iconBtn: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
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
  inlineSave: { height: 48, paddingHorizontal: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  inlineSaveText: { color: '#FFF', fontSize: 15, fontWeight: '700' },

  // Export
  exportPanel: { borderRadius: 16, borderWidth: 1, marginTop: 12, padding: 16 },
  exportToggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  exportLabel: { fontSize: 13, fontWeight: '600', marginBottom: 12 },
  monthPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 8 },
  monthPillText: { fontSize: 13, fontWeight: '600' },
  yearRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16, gap: 24 },
  yearLabel: { fontSize: 18, fontWeight: '700' },
  yearBtn: { fontSize: 20, fontWeight: '700', padding: 8 },
  exportBtn: { marginTop: 20, height: 50, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  exportBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
