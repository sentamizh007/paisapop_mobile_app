import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { AddExpenseScreen } from '../screens/main/AddExpenseScreen';
import { HistoryScreen } from '../screens/main/HistoryScreen';
import { AnalyticsScreen } from '../screens/main/AnalyticsScreen';
import { useThemeColors } from '../theme/colors';

export type TabParamList = {
  Tap: undefined;
  History: undefined;
  Analytics: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

export const TabNavigator = () => {
  const colors = useThemeColors();

  return (
    <Tab.Navigator
      initialRouteName="Tap"
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 65,
          paddingBottom: 10,
          paddingTop: 10,
          elevation: 10,
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      {/* ① Add Expense — opens first on app launch */}
      <Tab.Screen
        name="Tap"
        component={AddExpenseScreen}
        options={{
          tabBarLabel: 'Add',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="add-circle-outline" color={color} size={size} />,
        }}
      />

      {/* ② History */}
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          tabBarLabel: 'History',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="history" color={color} size={size} />,
        }}
      />

      {/* ③ Analytics */}
      <Tab.Screen
        name="Analytics"
        component={AnalyticsScreen}
        options={{
          tabBarLabel: 'Analytics',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="bar-chart" color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
};
