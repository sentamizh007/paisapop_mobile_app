import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, Platform, StatusBar as RNStatusBar,
  KeyboardAvoidingView, ScrollView, TextInput, TouchableOpacity, Dimensions, Image,
} from 'react-native';
import { User, ShieldCheck } from 'lucide-react-native';
import { useStore } from '../../store/useStore';

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
              <User color={error ? '#EF4444' : focused ? '#4F46E5' : '#94A3B8'} size={20} />
              <TextInput
                style={styles.input}
                placeholder="Your Name"
                placeholderTextColor="#CBD5E1"
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
            <ShieldCheck color="#94A3B8" size={15} />
            <Text style={styles.footerText}>Your data is private and secure</Text>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1, backgroundColor: '#F0F2FA',
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
  },
  blob: { position: 'absolute', width: BLOB, height: BLOB, borderRadius: BLOB / 2, backgroundColor: '#DDE3F8', opacity: 0.55 },
  blobTR: { top: -BLOB * 0.35, right: -BLOB * 0.35 },
  blobBL: { bottom: -BLOB * 0.42, left: -BLOB * 0.38 },
  scroll: { flexGrow: 1, paddingHorizontal: 32, justifyContent: 'center', paddingVertical: 40 },
  iconArea: { alignItems: 'center', marginBottom: 32 },
  iconShadow: {
    shadowColor: '#1A1F3A', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.25,
    shadowRadius: 20, elevation: 12, borderRadius: 32, backgroundColor: '#FFF',
  },
  iconImage: { width: 140, height: 140, borderRadius: 32 },
  title: { textAlign: 'center', fontSize: 34, fontWeight: '800', color: '#1A1F3A', marginBottom: 12 },
  titleBlue: { color: '#4F46E5' },
  subtitle: { textAlign: 'center', fontSize: 15, color: '#64748B', lineHeight: 22, marginBottom: 48 },
  form: { width: '100%' },
  label: { fontSize: 16, fontWeight: '700', color: '#1A1F3A', marginBottom: 4 },
  labelSub: { fontSize: 13, color: '#94A3B8', marginBottom: 16 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFF',
    borderRadius: 16, paddingHorizontal: 18, height: 58, borderWidth: 1.5, borderColor: '#E2E8F0',
    marginBottom: 4,
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  inputFocused: { borderColor: '#4F46E5', shadowColor: '#4F46E5', shadowOpacity: 0.15, elevation: 4 },
  inputError: { borderColor: '#EF4444' },
  input: { flex: 1, fontSize: 16, color: '#1A1F3A', fontWeight: '500' },
  errorText: { color: '#EF4444', fontSize: 13, marginBottom: 12 },
  continueBtn: {
    backgroundColor: '#4F46E5', borderRadius: 16, height: 58,
    justifyContent: 'center', alignItems: 'center', marginTop: 8,
    shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 14, elevation: 8,
  },
  continueBtnText: { color: '#FFF', fontSize: 17, fontWeight: '700', letterSpacing: 0.5 },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 36, gap: 6 },
  footerText: { fontSize: 13, color: '#94A3B8' },
});
