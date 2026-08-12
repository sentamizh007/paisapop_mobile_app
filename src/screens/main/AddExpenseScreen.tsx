import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform,
  SafeAreaView, StatusBar as RNStatusBar, Modal, TextInput, Alert, Dimensions,
} from 'react-native';
import { Delete, FileText, X } from 'lucide-react-native';
import { useThemeColors } from '../../theme/colors';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { TabParamList } from '../../navigation/TabNavigator';
import { Category, getCategoryIcon, getCategoryColor } from '../../utils/mockData';
import { useStore } from '../../store/useStore';

const { width: W } = Dimensions.get('window');

export const AddExpenseScreen = () => {
  const navigation = useNavigation<BottomTabNavigationProp<TabParamList>>();
  const { addTransaction, isLoading, categories: storeCategories, currency } = useStore();
  const colors = useThemeColors();

  const [amountStr, setAmountStr] = useState('0');
  const [selectedCategory, setSelectedCategory] = useState<string>(storeCategories[0] ?? 'Food');
  const [note, setNote] = useState('');
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [tempNote, setTempNote] = useState('');
  const [savedOk, setSavedOk] = useState(false);

  const currencySymbol = currency === 'USD' ? '$' : '₹';

  const handleKey = (key: string) => {
    setAmountStr(prev => {
      if (key === 'backspace') return prev.length > 1 ? prev.slice(0, -1) : '0';
      if (key === '.') return prev.includes('.') ? prev : prev + '.';
      if (prev === '0') return key;
      // Max 10 chars
      if (prev.length >= 10) return prev;
      return prev + key;
    });
  };

  const handleSave = async () => {
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter an amount greater than zero.');
      return;
    }

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD (sortable)
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    try {
      await addTransaction({
        title: selectedCategory,
        amount,
        category: selectedCategory as Category,
        date: dateStr,
        time: timeStr,
        type: 'expense',
        notes: note.trim() || undefined,
      });

      // Reset form
      setAmountStr('0');
      setNote('');
      setSavedOk(true);
      setTimeout(() => {
        setSavedOk(false);
        navigation.navigate('History');
      }, 800);
    } catch {
      Alert.alert('Error', 'Failed to save. Please try again.');
    }
  };

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'backspace'];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Add Expense</Text>
      </View>

      {/* Amount display */}
      <View style={[styles.amountCard, { backgroundColor: colors.surface }]}>
        <Text style={[styles.amountLabel, { color: colors.textSecondary }]}>How much?</Text>
        <Text
          style={[styles.amountText, { color: colors.textPrimary }]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {currencySymbol} {amountStr}
        </Text>
        {/* Note button */}
        <TouchableOpacity
          style={[styles.noteBtn, { backgroundColor: note ? colors.primary + '20' : colors.surfaceLight }]}
          onPress={() => { setTempNote(note); setShowNoteModal(true); }}
        >
          <FileText size={14} color={note ? colors.primary : colors.textSecondary} />
          <Text style={[styles.noteBtnText, { color: note ? colors.primary : colors.textSecondary }]}>
            {note ? 'Note added ✓' : 'Add note'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Category pills */}
      <View style={styles.categoryWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          {storeCategories.map(item => {
            const color = getCategoryColor(item as Category) ?? '#6366F1';
            const active = selectedCategory === item;
            return (
              <TouchableOpacity
                key={item}
                style={[styles.categoryPill, { backgroundColor: active ? color + '20' : colors.surface }, active && { borderColor: color, borderWidth: 1.5 }]}
                onPress={() => setSelectedCategory(item)}
                activeOpacity={0.7}
              >
                <View style={[styles.catIconBg, { backgroundColor: color + '20' }]}>
                  {getCategoryIcon(item as Category, color, 13)}
                </View>
                <Text style={[styles.catLabel, { color: active ? color : colors.textSecondary }]}>{item}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Keypad */}
      <View style={styles.keypad}>
        {keys.map(k => (
          <TouchableOpacity
            key={k}
            style={[styles.key, { backgroundColor: colors.surface }]}
            onPress={() => handleKey(k)}
            activeOpacity={0.6}
          >
            {k === 'backspace'
              ? <Delete color={colors.textPrimary} size={20} />
              : <Text style={[styles.keyText, { color: colors.textPrimary }]}>{k}</Text>
            }
          </TouchableOpacity>
        ))}
      </View>

      {/* Save button */}
      <View style={[styles.footer, { backgroundColor: colors.background }]}>
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: savedOk ? '#4CAF50' : colors.primary }]}
          onPress={handleSave}
          disabled={isLoading || savedOk}
          activeOpacity={0.85}
        >
          <Text style={styles.saveBtnText}>
            {savedOk ? '✓  Saved!' : isLoading ? 'Saving…' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Note Modal */}
      <Modal visible={showNoteModal} transparent animationType="slide" onRequestClose={() => setShowNoteModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.noteSheet, { backgroundColor: colors.surface }]}>
            <View style={styles.noteSheetHeader}>
              <Text style={[styles.noteSheetTitle, { color: colors.textPrimary }]}>Add Note</Text>
              <TouchableOpacity onPress={() => setShowNoteModal(false)}>
                <X color={colors.textSecondary} size={22} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={[styles.noteInput, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.background }]}
              value={tempNote}
              onChangeText={setTempNote}
              placeholder="Write a note about this expense..."
              placeholderTextColor={colors.textSecondary}
              multiline
              maxLength={300}
              autoFocus
            />
            <Text style={[styles.charCount, { color: colors.textSecondary }]}>{tempNote.length}/300</Text>
            <View style={styles.noteActions}>
              {tempNote.length > 0 && (
                <TouchableOpacity
                  style={[styles.noteClearBtn, { borderColor: colors.border }]}
                  onPress={() => { setNote(''); setTempNote(''); setShowNoteModal(false); }}
                >
                  <Text style={[styles.noteClearText, { color: colors.textSecondary }]}>Clear</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.noteSaveBtn, { backgroundColor: colors.primary }]}
                onPress={() => { setNote(tempNote); setShowNoteModal(false); }}
              >
                <Text style={styles.noteSaveText}>Save Note</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const KEY_SIZE = (W - 40 - 24) / 3;

const styles = StyleSheet.create({
  safe: { flex: 1, paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0 },
  header: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  headerTitle: { fontSize: 22, fontWeight: '800' },
  amountCard: {
    marginHorizontal: 16, borderRadius: 24, padding: 20, alignItems: 'center', marginBottom: 12,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
  },
  amountLabel: { fontSize: 13, fontWeight: '500', marginBottom: 4 },
  amountText: { fontSize: 52, fontWeight: '800', letterSpacing: -1 },
  noteBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  noteBtnText: { fontSize: 13, fontWeight: '600' },
  categoryWrapper: { marginBottom: 8 },
  categoryScroll: { paddingHorizontal: 16, gap: 8 },
  categoryPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 9, borderRadius: 20, borderWidth: 1.5, borderColor: 'transparent' },
  catIconBg: { width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 6 },
  catLabel: { fontSize: 12, fontWeight: '600' },
  keypad: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 8, alignContent: 'flex-start', paddingTop: 4 },
  key: { width: KEY_SIZE, height: KEY_SIZE * 0.62, borderRadius: 16, justifyContent: 'center', alignItems: 'center', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  keyText: { fontSize: 24, fontWeight: '500' },
  footer: { paddingHorizontal: 16, paddingBottom: Platform.OS === 'ios' ? 8 : 20, paddingTop: 8 },
  saveBtn: { borderRadius: 20, paddingVertical: 18, alignItems: 'center', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  saveBtnText: { color: '#FFF', fontSize: 17, fontWeight: '700' },
  // Note modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  noteSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 28 },
  noteSheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  noteSheetTitle: { fontSize: 18, fontWeight: '700' },
  noteInput: { minHeight: 100, borderWidth: 1, borderRadius: 16, padding: 14, fontSize: 15, lineHeight: 22, textAlignVertical: 'top' },
  charCount: { fontSize: 12, textAlign: 'right', marginTop: 6, marginBottom: 16 },
  noteActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  noteClearBtn: { paddingHorizontal: 20, paddingVertical: 13, borderRadius: 14, borderWidth: 1 },
  noteClearText: { fontSize: 15, fontWeight: '600' },
  noteSaveBtn: { paddingHorizontal: 24, paddingVertical: 13, borderRadius: 14 },
  noteSaveText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
});
