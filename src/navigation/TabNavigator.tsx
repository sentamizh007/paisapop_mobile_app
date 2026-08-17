import React from 'react';
import { View, Platform, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PlusCircle, Clock, BarChart3, LayoutGrid, Wallet } from 'lucide-react-native';
import { AddExpenseScreen } from '../screens/main/AddExpenseScreen';
import { HistoryScreen } from '../screens/main/HistoryScreen';
import { AnalyticsScreen } from '../screens/main/AnalyticsScreen';
import { ProfileScreen } from '../screens/main/ProfileScreen';
import { BudgetsScreen } from '../screens/main/BudgetsScreen';
import { AccountsScreen } from '../screens/main/AccountsScreen';
import { darkColors as C } from '../theme/colors';

export type TabParamList = {
  Add: undefined;
  History: undefined;
  Analytics: undefined;
  Budgets: undefined;
  Profile: undefined;
  Accounts: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();
const TAB_H = 60;

export const TabNavigator = () => {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, Platform.OS === 'android' ? 6 : 0);
  const tabBarHeight = TAB_H + bottomPad;

  return (
    <Tab.Navigator
      initialRouteName="Add"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: C.surface,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: C.border,
          height: tabBarHeight,
          paddingBottom: bottomPad,
          paddingTop: 0,
          elevation: 24,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.25,
          shadowRadius: 16,
          position: 'absolute',
        },
        tabBarActiveTintColor: '#22C55E', // Using the active green color
        tabBarInactiveTintColor: '#71717A',
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          letterSpacing: 0.3,
          marginTop: 0,
        },
        tabBarItemStyle: {
          paddingTop: 10,
        },
      })}
    >
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          tabBarLabel: 'History',
          tabBarIcon: ({ color, focused }) => (
            <Clock size={focused ? 26 : 23} color={color} strokeWidth={focused ? 2.2 : 1.8} />
          ),
        }}
      />
      <Tab.Screen
        name="Analytics"
        component={AnalyticsScreen}
        options={{
          tabBarLabel: 'Analytics',
          tabBarIcon: ({ color, focused }) => (
            <BarChart3 size={focused ? 26 : 23} color={color} strokeWidth={focused ? 2.2 : 1.8} />
          ),
        }}
      />
      <Tab.Screen
        name="Add"
        component={AddExpenseScreen}
        options={{
          tabBarLabel: 'Add',
          tabBarIcon: ({ color, focused }) => (
            <PlusCircle size={focused ? 26 : 23} color={color} strokeWidth={focused ? 2.2 : 1.8} />
          ),
        }}
      />
      <Tab.Screen
        name="Budgets"
        component={BudgetsScreen}
        options={{
          tabBarLabel: 'Budgets',
          tabBarIcon: ({ color, focused }) => (
            <Wallet size={focused ? 26 : 23} color={color} strokeWidth={focused ? 2.2 : 1.8} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <LayoutGrid size={focused ? 26 : 23} color={color} strokeWidth={focused ? 2.2 : 1.8} />
          ),
        }}
      />
      <Tab.Screen
        name="Accounts"
        component={AccountsScreen}
        options={{
          tabBarButton: () => null,
          tabBarItemStyle: { display: 'none' },
        }}
      />
    </Tab.Navigator>
  );
};