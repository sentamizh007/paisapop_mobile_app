import React, { useEffect, useState, useCallback } from 'react';

import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { RootNavigator } from './src/navigation/RootNavigator';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useThemeColors } from './src/theme/colors';
import { initDB } from './src/db/database';
import { useStore } from './src/store/useStore';
import { View, Text, StatusBar, TouchableOpacity, Platform } from 'react-native';
import { ShakeDetector } from './src/components/ShakeDetector';
import { AppSplashScreen } from './src/components/AppSplashScreen';
import * as SplashScreen from 'expo-splash-screen';

import * as QuickActions from 'expo-quick-actions';

SplashScreen.preventAutoHideAsync().catch(() => {});

function AppInner() {
  const [ready, setReady] = useState(false);
  const [showSplash, setShowSplash] = useState(() => {
    try {
      if (Platform.OS !== 'web' && QuickActions.initial?.id === 'quick-add') {
        return false;
      }
    } catch {}
    return true;
  });
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
      import('./src/utils/notifications').then(({ requestNotificationPermissions }) => {
        requestNotificationPermissions();
      });
    });
  }, [setup]);

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

  const isLight = theme === 'light';
  const navTheme = isLight
    ? {
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          background: '#F4F4F5',
          card: '#FFFFFF',
          text: '#09090B',
          border: '#E4E4E7',
        },
      }
    : {
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
    <View style={{ flex: 1, backgroundColor: isLight ? '#F4F4F5' : '#09090B' }}>
      {ready && (
        <NavigationContainer theme={navTheme}>
          <ShakeDetector>
            <RootNavigator />
            <StatusBar 
              barStyle={isLight ? 'dark-content' : 'light-content'} 
              backgroundColor={colors.background} 
            />
          </ShakeDetector>
        </NavigationContainer>
      )}

      {showSplash && (
        <AppSplashScreen isReady={ready} onFinish={() => setShowSplash(false)} />
      )}
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppInner />
    </SafeAreaProvider>
  );
}
