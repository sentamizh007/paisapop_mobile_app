import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Platform, StatusBar as RNStatusBar,
  KeyboardAvoidingView, ScrollView, TextInput, TouchableOpacity, Dimensions, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, ShieldCheck } from 'lucide-react-native';
import { useStore } from '../../store/useStore';
import { useThemeColors } from '../../theme/colors';

const { width: W } = Dimensions.get('window');
const BLOB = W * 0.72;

export const LoginScreen = () => {
  const C = useThemeColors();
  const theme = useStore(s => s.theme);
  const [name, setName] = useState('');
  const [focused, setFocused] = useState(false);
  const [error, setError] = useState('');
  const login = useStore(state => state.login);

  const handleContinue = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Please enter your name to continue.');
      return;
    }
    if (trimmed.length < 2) {
      setError('Name must be at least 2 characters.');
      return;
    }
    setError('');
    login(trimmed);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: C.background }]} edges={['top', 'bottom']}>
      <RNStatusBar barStyle={theme === 'light' ? 'dark-content' : 'light-content'} backgroundColor={C.background} />
      <View style={[styles.blob, styles.blobTR, { backgroundColor: C.primary + '15' }]} />
      <View style={[styles.blob, styles.blobBL, { backgroundColor: C.primary + '15' }]} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          <View style={styles.iconArea}>
            <View style={[styles.iconShadow, { backgroundColor: C.surface }]}>
              <Image
                source={require('../../../assets/icon.png')}
                style={styles.iconImage}
                resizeMode="contain"
              />
            </View>
          </View>

          <Text style={[styles.title, { color: C.textPrimary }]}>
            {'Paisa '}
            <Text style={{ color: C.primary }}>Pop</Text>
          </Text>
          <Text style={[styles.subtitle, { color: C.textSecondary }]}>
            Track your expenses. Take control{'\n'}of your money.
          </Text>

          <View style={styles.form}>
            <Text style={[styles.label, { color: C.textPrimary }]}>Enter your name</Text>
            <Text style={[styles.labelSub, { color: C.textSecondary }]}>This will appear in your account</Text>

            <View style={[styles.inputWrapper, { backgroundColor: C.surface, borderColor: C.border }, focused && { borderColor: C.primary }, !!error && { borderColor: C.danger }]}>
              <User color={error ? C.danger : focused ? C.primary : C.textSecondary} size={20} />
              <TextInput
                style={[styles.input, { color: C.textPrimary }]}
                placeholder="Your Name"
                placeholderTextColor={C.textMuted}
                value={name}
                onChangeText={t => { setName(t); setError(''); }}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                returnKeyType="done"
                onSubmitEditing={handleContinue}
                autoCapitalize="words"
              />
            </View>

            {!!error && <Text style={[styles.errorText, { color: C.danger }]}>{error}</Text>}

            <TouchableOpacity style={styles.continueBtn} onPress={handleContinue} activeOpacity={0.85}>
              <Text style={styles.continueBtnText}>Continue</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <ShieldCheck color={C.textSecondary} size={15} />
            <Text style={[styles.footerText, { color: C.textSecondary }]}>Your data is private and secure</Text>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  blob: { position: 'absolute', width: BLOB, height: BLOB, borderRadius: BLOB / 2, opacity: 0.55 },
  blobTR: { top: -BLOB * 0.35, right: -BLOB * 0.35 },
  blobBL: { bottom: -BLOB * 0.42, left: -BLOB * 0.38 },
  scroll: { flexGrow: 1, paddingHorizontal: 32, justifyContent: 'center', paddingVertical: 40 },
  iconArea: { alignItems: 'center', marginBottom: 32 },
  iconShadow: {
    shadowColor: '#22C55E', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.25,
    shadowRadius: 20, elevation: 12, borderRadius: 32,
  },
  iconImage: { width: 140, height: 140, borderRadius: 32 },
  title: { textAlign: 'center', fontSize: 34, fontWeight: '800', marginBottom: 12 },
  subtitle: { textAlign: 'center', fontSize: 15, lineHeight: 22, marginBottom: 48 },
  form: { width: '100%' },
  label: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  labelSub: { fontSize: 13, marginBottom: 16 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 16, paddingHorizontal: 18, height: 58, borderWidth: 1.5,
    marginBottom: 4,
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  input: { flex: 1, fontSize: 16, fontWeight: '500' },
  errorText: { fontSize: 13, marginBottom: 12 },
  continueBtn: {
    backgroundColor: '#22C55E', borderRadius: 16, height: 58,
    justifyContent: 'center', alignItems: 'center', marginTop: 12,
    shadowColor: '#22C55E', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 14, elevation: 8,
  },
  continueBtnText: { color: '#000000', fontSize: 17, fontWeight: '800', letterSpacing: 0.5 },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 36, gap: 6 },
  footerText: { fontSize: 13 },
});

