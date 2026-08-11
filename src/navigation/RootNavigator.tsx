import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthNavigator } from './AuthNavigator';
import { TabNavigator } from './TabNavigator';
import { AddExpenseScreen } from '../screens/main/AddExpenseScreen';
import { SearchScreen } from '../screens/main/SearchScreen';
import { TransactionDetailsScreen } from '../screens/main/TransactionDetailsScreen';
import { TransactionsScreen } from '../screens/main/TransactionsScreen';
import { useStore } from '../store/useStore';

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  AddExpense: undefined;
  Search: undefined;
  TransactionDetails: { id: string };
  Transactions: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator = () => {
  const userName = useStore(state => state.userName);
  const isAuthenticated = !!userName;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      ) : (
        <>
          <Stack.Screen name="Main" component={TabNavigator} />
          <Stack.Screen name="Transactions" component={TransactionsScreen} />
          <Stack.Screen 
            name="AddExpense" 
            component={AddExpenseScreen}
            options={{ presentation: 'modal' }}
          />
          <Stack.Screen 
            name="Search" 
            component={SearchScreen}
            options={{ presentation: 'fullScreenModal' }}
          />
          <Stack.Screen 
            name="TransactionDetails" 
            component={TransactionDetailsScreen} 
            options={{ presentation: 'modal' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
};
