import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Platform, StatusBar as RNStatusBar, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { ArrowLeft, Search } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { TransactionItem } from '../../components/TransactionItem';
import { mockTransactions } from '../../utils/mockData';
import { useNavigation } from '@react-navigation/native';

export const SearchScreen = () => {
  const navigation = useNavigation<any>();
  const [query, setQuery] = useState('Amazon');

  const recentSearches = ['Amazon', 'Uber', 'Rent'];
  
  // Mock filter
  const matchingTransactions = mockTransactions.filter(t => 
    t.title.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <ArrowLeft color={colors.textPrimary} size={24} />
        </TouchableOpacity>
        
        <View style={styles.searchContainer}>
          <Search size={18} color={colors.primary} style={styles.searchIcon} />
          <TextInput 
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Search..."
            placeholderTextColor={colors.textSecondary}
            autoFocus
          />
        </View>

        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>RECENT SEARCHES</Text>
          <View style={styles.pillsRow}>
            {recentSearches.map(term => (
              <TouchableOpacity key={term} style={styles.pill} onPress={() => setQuery(term)}>
                <Text style={styles.pillText}>{term}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {query.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>MATCHING TRANSACTIONS</Text>
            {matchingTransactions.map(t => (
              <TransactionItem 
                key={t.id} 
                transaction={t}
                onPress={(id) => navigation.navigate('TransactionDetails', { id })}
              />
            ))}
            {matchingTransactions.length === 0 && (
              <Text style={styles.noResults}>No transactions found for "{query}"</Text>
            )}
          </View>
        )}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  iconBtn: {
    padding: 4,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: colors.textPrimary,
    fontSize: 14,
  },
  cancelText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  container: {
    padding: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 16,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  pill: {
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  pillText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  noResults: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 16,
  }
});
