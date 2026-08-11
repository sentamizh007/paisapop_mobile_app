import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, Platform, StatusBar as RNStatusBar, ScrollView, TouchableOpacity } from 'react-native';
import { Lock } from 'lucide-react-native';
import { colors } from '../../theme/colors';

export const SettingsScreen = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
        <Text style={styles.appVersion}>SpendWise Premium v2.1.0</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>GENERAL</Text>
          <View style={styles.card}>
            <SettingRow label="Currency" value="INR (₹)" />
            <View style={styles.divider} />
            <SettingRow label="Language" value="English" />
            <View style={styles.divider} />
            <SettingRow label="Theme" value="Dark" />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DATA</Text>
          <View style={styles.card}>
            <SettingRow label="Export Data (CSV/PDF)" />
            <View style={styles.divider} />
            <SettingRow label="Import Data" />
            <View style={styles.divider} />
            <SettingRow label="Backup to Device" />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const SettingRow = ({ label, value }: { label: string, value?: string }) => (
  <TouchableOpacity style={styles.row}>
    <Text style={styles.rowLabel}>{label}</Text>
    {value && <Text style={styles.rowValue}>{value}</Text>}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    paddingBottom: 16,
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  appVersion: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  container: {
    padding: 24,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 12,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  rowLabel: {
    color: colors.textPrimary,
    fontSize: 14,
  },
  rowValue: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  securityBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B9811A', // 10% opacity primary
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  securityText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
});
