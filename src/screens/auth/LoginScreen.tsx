import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Platform, StatusBar as RNStatusBar, Image } from 'react-native';
import { colors } from '../../theme/colors';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { useNavigation } from '@react-navigation/native';
import { User } from 'lucide-react-native';
import { useStore } from '../../store/useStore';

export const LoginScreen = () => {
  const navigation = useNavigation<any>();
  const [name, setName] = useState('');
  const login = useStore(state => state.login);

  const handleLogin = () => {
    if (name.trim()) {
      login(name.trim());
    } else {
      alert('Please enter your name to continue.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>SW</Text>
          </View>
          <Text style={styles.title}>Welcome to SpendWise</Text>
          <Text style={styles.subtitle}>Enter your name to access your expense tracker</Text>
        </View>

        <View style={styles.form}>
          <Input 
            label="Name" 
            placeholder="John Doe" 
            value={name}
            onChangeText={setName}
            leftIcon={<User size={18} color={colors.textSecondary} />} 
          />
          <Button 
            title="Enter App" 
            onPress={handleLogin} 
            style={styles.loginBtn}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoContainer: {
    width: 64,
    height: 64,
    backgroundColor: colors.primary,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  logoText: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 1,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  form: {
    gap: 16,
  },
  loginBtn: {
    marginTop: 8,
  }
});
