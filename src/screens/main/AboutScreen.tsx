import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Info, ShieldCheck, FileText, Code2, Heart } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/RootNavigator';

export const AboutScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const SectionItem = ({ icon, title, value, isLink }: { icon: React.ReactNode, title: string, value?: string, isLink?: boolean }) => (
    <TouchableOpacity style={styles.itemRow} disabled={!isLink}>
      <View style={styles.itemLeft}>
        {icon}
        <Text style={styles.itemTitle}>{title}</Text>
      </View>
      {value ? (
        <Text style={styles.itemValue}>{value}</Text>
      ) : isLink ? (
        <ChevronLeft size={16} color="#666" style={{ transform: [{ rotate: '180deg' }] }} />
      ) : null}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About PaisaPop</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.logoSection}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoEmoji}>💸</Text>
          </View>
          <Text style={styles.appName}>PaisaPop</Text>
          <Text style={styles.appVersion}>Version 1.0.0</Text>
        </View>

        <View style={styles.card}>
          <SectionItem 
            icon={<Info size={20} color="#A855F7" />} 
            title="App Version" 
            value="1.0.0 (Build 42)" 
          />
          <View style={styles.divider} />
          <SectionItem 
            icon={<Code2 size={20} color="#22C55E" />} 
            title="Developer" 
            value="Kerplunk Media" 
          />
        </View>

        <Text style={styles.sectionTitle}>Legal</Text>
        <View style={styles.card}>
          <SectionItem 
            icon={<ShieldCheck size={20} color="#3B82F6" />} 
            title="Privacy Policy" 
            isLink 
          />
          <View style={styles.divider} />
          <SectionItem 
            icon={<FileText size={20} color="#EAB308" />} 
            title="Terms of Service" 
            isLink 
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Made with </Text>
          <Heart size={14} color="#EF4444" fill="#EF4444" style={{ marginHorizontal: 4 }} />
          <Text style={styles.footerText}> by PaisaPop Team</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#09090B' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#131315', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#27272A' },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  scroll: { padding: 20, paddingBottom: 60 },
  
  logoSection: { alignItems: 'center', marginVertical: 32 },
  logoCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(34, 197, 94, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: 'rgba(34, 197, 94, 0.2)' },
  logoEmoji: { fontSize: 40 },
  appName: { color: '#FFF', fontSize: 24, fontWeight: '800', marginBottom: 8 },
  appVersion: { color: '#A1A1AA', fontSize: 14, fontWeight: '500' },

  sectionTitle: { color: '#A1A1AA', fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginTop: 24, marginBottom: 12, marginLeft: 16 },
  card: { backgroundColor: '#131315', borderRadius: 16, padding: 4, borderWidth: 1, borderColor: '#27272A' },
  itemRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  itemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  itemTitle: { color: '#FFF', fontSize: 16, fontWeight: '500' },
  itemValue: { color: '#A1A1AA', fontSize: 15, fontWeight: '500' },
  divider: { height: 1, backgroundColor: '#27272A', marginLeft: 48, marginRight: 16 },

  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 40 },
  footerText: { color: '#666', fontSize: 14, fontWeight: '500' }
});
