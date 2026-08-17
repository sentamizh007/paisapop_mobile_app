import React, { useEffect, useState, useCallback } from 'react';

import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { RootNavigator } from './src/navigation/RootNavigator';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useThemeColors } from './src/theme/colors';
import { initDB } from './src/db/database';
import { useStore } from './src/store/useStore';
import { View, ActivityIndicator, Text, StatusBar, TouchableOpacity, Platform } from 'react-native';
import { ShakeDetector } from './src/components/ShakeDetector';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync().catch(() => {});

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
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [loadSettings, loadTransactions]);

  useEffect(() => {
    setup().then(() => {
      // Mock Version Update Check
      import('./src/utils/notifications').then(({ requestNotificationPermissions, sendLocalNotification }) => {
        requestNotificationPermissions().then((granted) => {
          if (granted || Platform.OS === 'web') {
            // Simulate a check for a new version (we just notify for demonstration as requested)
            const MOCK_NEW_VERSION = true;
            if (MOCK_NEW_VERSION) {
              sendLocalNotification(
                '🎉 New Version Available!',
                'PaisaPop v1.1.0 is out with awesome new features! Restart your app to apply updates.'
              );
            }
          }
        });
      });
    });
  }, [setup]);

  if (!ready) {
    return null;
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
      <ShakeDetector>
        <RootNavigator />
        <StatusBar barStyle="light-content" backgroundColor="#09090B" />
      </ShakeDetector>
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
