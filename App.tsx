import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { RootNavigator } from './src/navigation/RootNavigator';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { colors } from './src/theme/colors';
import { initDB } from './src/db/database';
import { useStore } from './src/store/useStore';
import { View, ActivityIndicator } from 'react-native';

export default function App() {
  const [dbInitialized, setDbInitialized] = useState(false);
  const loadTransactions = useStore((state) => state.loadTransactions);

  useEffect(() => {
    const setup = async () => {
      try {
        await initDB();
        await loadTransactions();
      } catch (e) {
        console.error('Failed to init DB', e);
      } finally {
        setDbInitialized(true);
      }
    };
    setup();
  }, []);

  if (!dbInitialized) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider style={{ backgroundColor: colors.background }}>
      <NavigationContainer>
        <RootNavigator />
        <StatusBar style="light" />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
