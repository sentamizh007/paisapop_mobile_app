import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, SafeAreaView, StatusBar as RNStatusBar } from 'react-native';
import { X, Calendar, Image as ImageIcon, Utensils, Car, ShoppingBag, Zap } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { useNavigation } from '@react-navigation/native';
import { Category } from '../../utils/mockData';
import { useStore } from '../../store/useStore';

export const AddExpenseScreen = () => {
  const navigation = useNavigation();
  const addTransaction = useStore(state => state.addTransaction);
  const isLoading = useStore(state => state.isLoading);

  const [amountStr, setAmountStr] = useState('');
  const [category, setCategory] = useState<Category>('Food');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [notes, setNotes] = useState('');

  const categories: { label: Category; icon: any }[] = [
    { label: 'Food', icon: Utensils },
    { label: 'Transport', icon: Car },
    { label: 'Shopping', icon: ShoppingBag },
    { label: 'Bills', icon: Zap },
  ];

  const paymentMethods = ['Cash', 'UPI', 'Card', 'Net Banking'];

  const handleSave = async () => {
    const numericAmount = parseFloat(amountStr.replace(/,/g, ''));
    if (isNaN(numericAmount) || numericAmount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    const now = new Date();
    // Simplified date handling for now, would typically use a library or proper formatter
    const dateStr = 'Today'; 
    const timeStr = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

    await addTransaction({
      title: notes || 'New Expense', // Use notes or generic title
      amount: numericAmount,
      category,
      date: dateStr,
      time: timeStr,
      type: 'expense',
      paymentMethod,
      notes,
    });

    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <X color={colors.textPrimary} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Expense</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.amountContainer}>
          <Text style={styles.currencySymbol}>₹</Text>
          <Input
            value={amountStr}
            onChangeText={setAmountStr}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={colors.textSecondary}
            style={styles.amountInput}
            containerStyle={styles.amountInputContainer}
          />
        </View>
        <Text style={styles.amountHelper}>Enter amount</Text>

        <View style={styles.categoriesGrid}>
          {categories.map((c) => {
            const Icon = c.icon;
            const isActive = category === c.label;
            return (
              <TouchableOpacity 
                key={c.label} 
                style={[styles.categoryBtn, isActive && styles.categoryBtnActive]}
                onPress={() => setCategory(c.label)}
              >
                <Icon size={16} color={isActive ? colors.primary : colors.textSecondary} />
                <Text style={[styles.categoryLabel, isActive && styles.categoryLabelActive]}>{c.label}</Text>
              </TouchableOpacity>
            )
          })}
        </View>

        <TouchableOpacity style={styles.dateSelector}>
          <View style={styles.dateIconWrapper}>
            <Calendar size={18} color={colors.textSecondary} />
            <Text style={styles.dateLabel}>Date</Text>
          </View>
          <Text style={styles.dateValue}>Today, 10 Aug</Text>
        </TouchableOpacity>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PAYMENT METHOD</Text>
          <View style={styles.paymentMethodsRow}>
            {paymentMethods.map(method => {
              const isActive = paymentMethod === method;
              return (
                <TouchableOpacity 
                  key={method} 
                  style={[styles.paymentMethodBtn, isActive && styles.paymentMethodBtnActive]}
                  onPress={() => setPaymentMethod(method)}
                >
                  <Text style={[styles.paymentMethodLabel, isActive && styles.paymentMethodLabelActive]}>{method}</Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>NOTES (Title)</Text>
          <Input 
            value={notes}
            onChangeText={setNotes}
            placeholder="Add note or title..."
            leftIcon={<Utensils size={18} color={colors.textSecondary} />} 
          />
        </View>

        <TouchableOpacity style={styles.attachBtn}>
          <View style={styles.attachIconWrapper}>
            <ImageIcon size={18} color={colors.textSecondary} />
            <Text style={styles.attachLabel}>Attach receipt thumbnail</Text>
          </View>
          <PlusIcon color={colors.textSecondary} size={18} />
        </TouchableOpacity>

      </ScrollView>

      <View style={styles.footer}>
        <Button 
          title="Save Expense" 
          onPress={handleSave} 
          isLoading={isLoading} 
        />
      </View>
    </SafeAreaView>
  );
};

const PlusIcon = ({ color, size }: { color: string, size: number }) => (
  <Text style={{ color, fontSize: size }}>+</Text>
);

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  closeBtn: {
    padding: 4,
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  container: {
    padding: 24,
    paddingBottom: 40,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 8,
  },
  currencySymbol: {
    color: colors.primary,
    fontSize: 32,
    fontWeight: '500',
    marginRight: 8,
  },
  amountInputContainer: {
    marginBottom: 0,
    minHeight: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
  },
  amountInput: {
    color: colors.textPrimary,
    fontSize: 48,
    fontWeight: '700',
    minWidth: 100,
    textAlign: 'center',
  },
  amountHelper: {
    color: colors.textSecondary,
    textAlign: 'center',
    fontSize: 12,
    marginBottom: 40,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 24,
  },
  categoryBtn: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    gap: 8,
  },
  categoryBtnActive: {
    borderColor: colors.primary,
    backgroundColor: '#10B98122',
  },
  categoryLabel: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  categoryLabelActive: {
    color: colors.primary,
  },
  dateSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateIconWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dateLabel: {
    color: colors.textPrimary,
    fontSize: 14,
  },
  dateValue: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  paymentMethodsRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  paymentMethodBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  paymentMethodBtnActive: {
    backgroundColor: colors.surfaceLight,
  },
  paymentMethodLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  paymentMethodLabelActive: {
    color: colors.textPrimary,
  },
  attachBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  attachIconWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  attachLabel: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
});
