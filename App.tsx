import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { RootNavigator } from './src/navigation/RootNavigator';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useThemeColors } from './src/theme/colors';
import { initDB } from './src/db/database';
import { useStore } from './src/store/useStore';
import { View, ActivityIndicator, Text } from 'react-native';

function AppInner() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadTransactions = useStore((s) => s.loadTransactions);
  const loadSettings = useStore((s) => s.loadSettings);
  const theme = useStore((s) => s.theme);
  const colors = useThemeColors();

  useEffect(() => {
    const setup = async () => {
      try {
        // Load persisted settings first so theme is correct from the start
        await loadSettings();
        await initDB();
        await loadTransactions();
      } catch (e: any) {
        console.error('App init error:', e);
        setError(e?.message ?? 'Failed to initialize app');
      } finally {
        setReady(true);
      }
    };
    setup();
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', gap: 16 }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.textSecondary, fontSize: 14 }}>Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
        <Text style={{ color: colors.danger ?? '#EF4444', fontSize: 16, fontWeight: '700', marginBottom: 8 }}>Error</Text>
        <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>{error}</Text>
      </View>
    );
  }

  const navTheme = {
    ...(theme === 'dark' ? DarkTheme : DefaultTheme),
    colors: {
      ...(theme === 'dark' ? DarkTheme.colors : DefaultTheme.colors),
      background: colors.background,
      card: colors.surface,
      text: colors.textPrimary,
      border: colors.border,
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <RootNavigator />
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppInner />
    </SafeAreaProvider>
  );
}
