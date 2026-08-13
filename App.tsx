import React, { useEffect, useState, useCallback } from 'react';

import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { RootNavigator } from './src/navigation/RootNavigator';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useThemeColors } from './src/theme/colors';
import { initDB } from './src/db/database';
import { useStore } from './src/store/useStore';
import { View, ActivityIndicator, Text, StatusBar, TouchableOpacity } from 'react-native';

function AppInner() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadTransactions = useStore((s) => s.loadTransactions);
  const loadSettings = useStore((s) => s.loadSettings);
  const theme = useStore((s) => s.theme);
  const colors = useThemeColors();

  const setup = useCallback(async () => {
    setReady(false);
    setError(null);
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
  }, [loadSettings, loadTransactions]);

  useEffect(() => {
    setup();
  }, [setup]);

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
        <Text style={{ color: colors.textSecondary, textAlign: 'center', marginBottom: 20 }}>{error}</Text>
        <TouchableOpacity
          onPress={setup}
          style={{
            backgroundColor: colors.primary,
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 8,
          }}
        >
          <Text style={{ color: colors.background, fontWeight: '600', fontSize: 14 }}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const navTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: '#09090B',
      card: '#18181B',
      text: '#FAFAFA',
      border: '#3F3F46',
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <RootNavigator />
      <StatusBar barStyle="light-content" backgroundColor="#09090B" />
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
