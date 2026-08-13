import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, Platform, StatusBar as RNStatusBar,
  KeyboardAvoidingView, ScrollView, TextInput, TouchableOpacity, Dimensions, Image,
} from 'react-native';
import { User, ShieldCheck } from 'lucide-react-native';
import { useStore } from '../../store/useStore';
import { colors as C } from '../../theme/colors';

const { width: W } = Dimensions.get('window');
const BLOB = W * 0.72;

export const LoginScreen = () => {
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
    <SafeAreaView style={styles.safe}>
      <View style={[styles.blob, styles.blobTR]} />
      <View style={[styles.blob, styles.blobBL]} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          <View style={styles.iconArea}>
            <View style={styles.iconShadow}>
              <Image
                source={require('../../../assets/icon.png')}
                style={styles.iconImage}
                resizeMode="contain"
              />
            </View>
          </View>

          <Text style={styles.title}>
            {'Expense '}
            <Text style={styles.titleBlue}>Tracker</Text>
          </Text>
          <Text style={styles.subtitle}>
            Track your expenses. Take control{'\n'}of your money.
          </Text>

          <View style={styles.form}>
            <Text style={styles.label}>Enter your name</Text>
            <Text style={styles.labelSub}>This will appear in your account</Text>

            <View style={[styles.inputWrapper, focused && styles.inputFocused, !!error && styles.inputError]}>
              <User color={error ? C.danger : focused ? C.primary : C.textSecondary} size={20} />
              <TextInput
                style={styles.input}
                placeholder="Your Name"
                placeholderTextColor={C.textSecondary}
                value={name}
                onChangeText={t => { setName(t); setError(''); }}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                returnKeyType="done"
                onSubmitEditing={handleContinue}
                autoCapitalize="words"
              />
            </View>

            {!!error && <Text style={styles.errorText}>{error}</Text>}

            <TouchableOpacity style={styles.continueBtn} onPress={handleContinue} activeOpacity={0.85}>
              <Text style={styles.continueBtnText}>Continue</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <ShieldCheck color={C.textSecondary} size={15} />
            <Text style={styles.footerText}>Your data is private and secure</Text>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1, backgroundColor: C.background,
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
  },
  blob: { position: 'absolute', width: BLOB, height: BLOB, borderRadius: BLOB / 2, backgroundColor: C.primary + '15', opacity: 0.55 },
  blobTR: { top: -BLOB * 0.35, right: -BLOB * 0.35 },
  blobBL: { bottom: -BLOB * 0.42, left: -BLOB * 0.38 },
  scroll: { flexGrow: 1, paddingHorizontal: 32, justifyContent: 'center', paddingVertical: 40 },
  iconArea: { alignItems: 'center', marginBottom: 32 },
  iconShadow: {
    shadowColor: C.primary, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.25,
    shadowRadius: 20, elevation: 12, borderRadius: 32, backgroundColor: C.surface,
  },
  iconImage: { width: 140, height: 140, borderRadius: 32 },
  title: { textAlign: 'center', fontSize: 34, fontWeight: '800', color: C.textPrimary, marginBottom: 12 },
  titleBlue: { color: C.primary },
  subtitle: { textAlign: 'center', fontSize: 15, color: C.textSecondary, lineHeight: 22, marginBottom: 48 },
  form: { width: '100%' },
  label: { fontSize: 16, fontWeight: '700', color: C.textPrimary, marginBottom: 4 },
  labelSub: { fontSize: 13, color: C.textSecondary, marginBottom: 16 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.surface,
    borderRadius: 16, paddingHorizontal: 18, height: 58, borderWidth: 1.5, borderColor: C.border,
    marginBottom: 4,
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  inputFocused: { borderColor: C.primary, shadowColor: C.primary, shadowOpacity: 0.15, elevation: 4 },
  inputError: { borderColor: C.danger },
  input: { flex: 1, fontSize: 16, color: C.textPrimary, fontWeight: '500' },
  errorText: { color: C.danger, fontSize: 13, marginBottom: 12 },
  continueBtn: {
    backgroundColor: '#FFFFFF', borderRadius: 16, height: 58,
    justifyContent: 'center', alignItems: 'center', marginTop: 8,
    shadowColor: '#FFFFFF', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 14, elevation: 8,
  },
  continueBtnText: { color: '#000000', fontSize: 17, fontWeight: '800', letterSpacing: 0.5 },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 36, gap: 6 },
  footerText: { fontSize: 13, color: C.textSecondary },
});
