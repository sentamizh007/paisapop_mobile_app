import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, LineChart, Wallet, Settings } from 'lucide-react-native';
import { HomeScreen } from '../screens/main/HomeScreen';
import { AnalyticsScreen } from '../screens/main/AnalyticsScreen';
import { CategoriesScreen } from '../screens/main/CategoriesScreen';
import { SettingsScreen } from '../screens/main/SettingsScreen';
import { colors } from '../theme/colors';

export type TabParamList = {
  Home: undefined;
  Analytics: undefined;
  Budgets: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

export const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{
          tabBarIcon: ({ color, size }) => <Home color={color} size={24} />
        }}
      />
      <Tab.Screen 
        name="Analytics" 
        component={AnalyticsScreen} 
        options={{
          tabBarIcon: ({ color, size }) => <LineChart color={color} size={24} />
        }}
      />
      <Tab.Screen 
        name="Budgets" 
        component={CategoriesScreen} 
        options={{
          tabBarIcon: ({ color, size }) => <Wallet color={color} size={24} />
        }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen} 
        options={{
          tabBarIcon: ({ color, size }) => <Settings color={color} size={24} />
        }}
      />
    </Tab.Navigator>
  );
};
