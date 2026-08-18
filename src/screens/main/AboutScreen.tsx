import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Linking, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  ChevronLeft, 
  Info, 
  ShieldCheck, 
  Code2, 
  Heart, 
  Zap, 
  PieChart, 
  Target, 
  Lock, 
  Wallet,
  ExternalLink,
  Sparkles
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { useThemeColors } from '../../theme/colors';

export const AboutScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const C = useThemeColors();

  const openPrivacyPolicy = async () => {
    const url = 'https://kerplunkdeveloper-lgtm.github.io/Privacy_Policy_paisapop/';
    try {
      if (Platform.OS === 'web') {
        window.open(url, '_blank');
      } else {
        await Linking.openURL(url);
      }
    } catch (error) {
      Alert.alert('Error', 'Unable to open link: ' + url);
    }
  };

  const FeatureItem = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
    <View style={styles.featureRow}>
      <View style={[styles.featureIconContainer, { backgroundColor: C.surfaceElevated, borderColor: C.border }]}>
        {icon}
      </View>
      <View style={styles.featureTextContainer}>
        <Text style={[styles.featureTitle, { color: C.textPrimary }]}>{title}</Text>
        <Text style={[styles.featureDesc, { color: C.textSecondary }]}>{description}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: C.background }]} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: C.border }]}>
        <TouchableOpacity 
          style={[styles.backBtn, { backgroundColor: C.surface, borderColor: C.border }]} 
          onPress={() => navigation.goBack()} 
          activeOpacity={0.7}
        >
          <ChevronLeft size={22} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: C.textPrimary }]}>About PaisaPop</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* App Hero / Branding */}
        <View style={styles.heroSection}>
          <View style={styles.logoCircle}>
            <Image
              source={require('../../../assets/icon.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <Text style={[styles.appName, { color: C.textPrimary }]}>PaisaPop</Text>
          <Text style={[styles.appTagline, { color: C.textSecondary }]}>Smart Personal Expense & Budget Tracker</Text>
          <View style={[styles.versionBadge, { backgroundColor: C.surfaceElevated, borderColor: C.border }]}>
            <Sparkles size={12} color="#22C55E" />
            <Text style={[styles.versionBadgeText, { color: C.textPrimary }]}>v1.0.0 (Build 42)</Text>
          </View>
        </View>

        {/* Mission / About Card */}
        <View style={[styles.aboutCard, { backgroundColor: C.surface, borderColor: C.border }]}>
          <Text style={[styles.aboutCardTitle, { color: C.textPrimary }]}>Our Mission</Text>
          <Text style={[styles.aboutCardText, { color: C.textSecondary }]}>
            PaisaPop is built to help you take complete control of your personal finances. 
            Track daily expenses, set realistic budgets, manage multiple accounts, and gain clear insights into your spending habits—all with speed, simplicity, and complete privacy.
          </Text>
        </View>

        {/* Key Features Section */}
        <Text style={[styles.sectionTitle, { color: C.textMuted }]}>Key Highlights</Text>
        <View style={[styles.card, { backgroundColor: C.surface, borderColor: C.border }]}>
          <FeatureItem 
            icon={<Zap size={18} color="#EAB308" />} 
            title="Lightning Fast Logging" 
            description="Add income & expenses in seconds with smart category auto-picks." 
          />
          <View style={[styles.divider, { backgroundColor: C.border }]} />
          <FeatureItem 
            icon={<Target size={18} color="#22C55E" />} 
            title="Budget Control & Alerts" 
            description="Set monthly limits per category and stay on top of overspending." 
          />
          <View style={[styles.divider, { backgroundColor: C.border }]} />
          <FeatureItem 
            icon={<PieChart size={18} color="#3B82F6" />} 
            title="Visual Analytics" 
            description="Understand cash flows with interactive breakdowns & spending charts." 
          />
          <View style={[styles.divider, { backgroundColor: C.border }]} />
          <FeatureItem 
            icon={<Wallet size={18} color="#A855F7" />} 
            title="Multi-Account Management" 
            description="Seamlessly organize Bank Accounts, Cash, Credit Cards & Wallets." 
          />
          <View style={[styles.divider, { backgroundColor: C.border }]} />
          <FeatureItem 
            icon={<Lock size={18} color="#EC4899" />} 
            title="100% Privacy Focused" 
            description="Your financial data remains secure and private on your device." 
          />
        </View>

        {/* App Info & Developer Card */}
        <Text style={[styles.sectionTitle, { color: C.textMuted }]}>Application Info</Text>
        <View style={[styles.card, { backgroundColor: C.surface, borderColor: C.border }]}>
          <View style={styles.infoRow}>
            <View style={styles.infoLeft}>
              <Code2 size={18} color="#22C55E" />
              <Text style={[styles.infoLabel, { color: C.textPrimary }]}>Developer</Text>
            </View>
            <Text style={[styles.infoValue, { color: C.textSecondary }]}>Kerplunk Media</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: C.border }]} />
          <View style={styles.infoRow}>
            <View style={styles.infoLeft}>
              <Info size={18} color="#A855F7" />
              <Text style={[styles.infoLabel, { color: C.textPrimary }]}>Version</Text>
            </View>
            <Text style={[styles.infoValue, { color: C.textSecondary }]}>1.0.0 Stable</Text>
          </View>
        </View>

        {/* Legal & Privacy Section */}
        <Text style={[styles.sectionTitle, { color: C.textMuted }]}>Legal & Privacy</Text>
        <View style={[styles.card, { backgroundColor: C.surface, borderColor: C.border }]}>
          <TouchableOpacity 
            style={styles.legalRow} 
            onPress={openPrivacyPolicy}
            activeOpacity={0.7}
          >
            <View style={styles.legalLeft}>
              <View style={styles.legalIconBadge}>
                <ShieldCheck size={18} color="#3B82F6" />
              </View>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={[styles.legalTitle, { color: C.textPrimary }]}>Privacy Policy</Text>
                <Text style={[styles.legalSubtitle, { color: C.textSecondary }]}>Learn how we respect and protect your data</Text>
              </View>
            </View>
            <ExternalLink size={16} color={C.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerMadeWith}>
            <Text style={[styles.footerText, { color: C.textSecondary }]}>Made with </Text>
            <Heart size={14} color="#EF4444" fill="#EF4444" style={{ marginHorizontal: 3 }} />
            <Text style={[styles.footerText, { color: C.textSecondary }]}> by Kerplunk Media</Text>
          </View>
          <Text style={[styles.footerCopyright, { color: C.textMuted }]}>© 2026 PaisaPop. All rights reserved.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 16, 
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backBtn: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderWidth: 1, 
  },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  scroll: { padding: 18, paddingBottom: 60 },
  
  heroSection: { alignItems: 'center', marginVertical: 20 },
  logoCircle: { 
    width: 84, 
    height: 84, 
    borderRadius: 42, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 12, 
    overflow: 'hidden',
    borderWidth: 2, 
    borderColor: 'rgba(34, 197, 94, 0.4)',
    backgroundColor: '#000',
  },
  logoImage: { width: '100%', height: '100%' },
  appName: { fontSize: 24, fontWeight: '800', marginBottom: 4 },
  appTagline: { fontSize: 13, fontWeight: '500', textAlign: 'center', marginBottom: 12 },
  versionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  versionBadgeText: { fontSize: 12, fontWeight: '600' },

  aboutCard: {
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    marginBottom: 12,
    borderLeftWidth: 3.5,
    borderLeftColor: '#22C55E'
  },
  aboutCardTitle: { fontSize: 15, fontWeight: '700', marginBottom: 6 },
  aboutCardText: { fontSize: 13, lineHeight: 20 },

  sectionTitle: { 
    fontSize: 12, 
    fontWeight: '700', 
    textTransform: 'uppercase', 
    letterSpacing: 0.8, 
    marginTop: 18, 
    marginBottom: 10, 
    marginLeft: 4 
  },
  card: { 
    borderRadius: 16, 
    padding: 6, 
    borderWidth: 1, 
  },

  /* Feature Item */
  featureRow: { 
    flexDirection: 'row', 
    alignItems: 'flex-start', 
    padding: 12, 
    gap: 12 
  },
  featureIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginTop: 2
  },
  featureTextContainer: { flex: 1 },
  featureTitle: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  featureDesc: { fontSize: 12, lineHeight: 17 },

  /* Info Row */
  infoRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    padding: 14 
  },
  infoLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoLabel: { fontSize: 14, fontWeight: '500' },
  infoValue: { fontSize: 14, fontWeight: '500' },

  /* Legal Row */
  legalRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    padding: 14 
  },
  legalLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  legalIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)'
  },
  legalTitle: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  legalSubtitle: { fontSize: 12 },

  divider: { height: 1, marginHorizontal: 12 },

  footer: { alignItems: 'center', justifyContent: 'center', marginTop: 32, gap: 6 },
  footerMadeWith: { flexDirection: 'row', alignItems: 'center' },
  footerText: { fontSize: 13, fontWeight: '500' },
  footerCopyright: { fontSize: 11 }
});


