import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, Platform, StatusBar as RNStatusBar, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { ArrowLeft, Share, ShoppingBag } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useStore } from '../../store/useStore';
import { getCategoryIcon, getCategoryColor } from '../../utils/mockData';

export const TransactionDetailsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const id = route.params?.id;
  
  const transaction = useStore(state => state.transactions.find(t => t.id === id));
  const removeTransaction = useStore(state => state.removeTransaction);

  if (!transaction) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
            <ArrowLeft color={colors.textPrimary} size={24} />
          </TouchableOpacity>
        </View>
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
          <Text style={{color: colors.textSecondary}}>Transaction not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleDelete = () => {
    Alert.alert(
      "Delete Transaction",
      "Are you sure you want to delete this transaction?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            await removeTransaction(transaction.id);
            navigation.goBack();
          } 
        }
      ]
    );
  };

  const catColor = getCategoryColor(transaction.category);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <ArrowLeft color={colors.textPrimary} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transaction Details</Text>
        <TouchableOpacity style={styles.iconBtn}>
          <Share color={colors.textPrimary} size={24} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.heroSection}>
          <Text style={styles.amount}>₹{transaction.amount.toLocaleString('en-IN')}</Text>
          <Text style={styles.merchant}>{transaction.title}</Text>
          <View style={[styles.categoryPill, { backgroundColor: catColor + '33' }]}>
            {getCategoryIcon(transaction.category, catColor, 14)}
            <Text style={[styles.categoryText, { color: catColor, marginLeft: 6 }]}>{transaction.category}</Text>
          </View>
        </View>

        <Card style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date & Time</Text>
            <Text style={styles.detailValue}>{transaction.date} {transaction.time}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Payment Method</Text>
            <Text style={styles.detailValue}>{transaction.paymentMethod || 'Unknown'}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailRowColumn}>
            <Text style={styles.detailLabel}>Notes</Text>
            <Text style={[styles.detailValue, { marginTop: 4 }]}>{transaction.notes || 'No notes'}</Text>
          </View>
        </Card>

        <Text style={styles.sectionTitle}>RECEIPT</Text>
        <View style={styles.receiptContainer}>
          <View style={styles.receiptPlaceholder}>
            <Text style={{color: colors.textSecondary, fontSize: 12}}>Receipt Image Mock</Text>
          </View>
        </View>

        <View style={styles.actionButtonsRow}>
          <Button 
            title="Edit Transaction" 
            variant="outline" 
            style={styles.actionBtn} 
          />
          <Button 
            title="Delete" 
            variant="danger" 
            onPress={handleDelete}
            style={[styles.actionBtn, styles.deleteBtn]} 
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

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
  iconBtn: {
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
  heroSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  amount: {
    color: colors.textPrimary,
    fontSize: 48,
    fontWeight: '700',
    marginBottom: 8,
  },
  merchant: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 16,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  detailsCard: {
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  detailRowColumn: {
    paddingVertical: 12,
  },
  detailLabel: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  detailValue: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  sectionTitle: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  receiptContainer: {
    backgroundColor: '#D9D9D9',
    height: 180,
    borderRadius: 12,
    marginBottom: 24,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  receiptPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
  },
  deleteBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.danger,
  },
});
