import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform,
  StatusBar as RNStatusBar, Dimensions, Alert, TextInput, Modal, Switch, Image, useWindowDimensions,
  KeyboardAvoidingView, Vibration, LayoutAnimation, UIManager, Pressable, Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ChevronLeft, ReceiptText, ArrowDown, ArrowUp, ArrowRightLeft,
  FileText, User, CreditCard, Calendar, Clock, Tag, Receipt,
  Camera, Users, Delete, ChevronRight, X, Wallet, Banknote, Landmark, Smartphone, Check,
  Bell, Trash2, CheckCheck, AlertTriangle, Sparkles, Info, Image as ImageIcon, Eye, Search
} from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { TabParamList } from '../../navigation/TabNavigator';
import { Category, getCategoryIcon, getCategoryColor, getCurrencySymbol } from '../../utils/mockData';
import { useStore, Account, AppNotification } from '../../store/useStore';
import { useThemeColors } from '../../theme/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MONTH_NAMES } from '../../utils/exportUtils';

const { width: W } = Dimensions.get('window');

type TxType = 'expense' | 'income' | 'transfer';

const formatTimeStr = (d: Date) => {
  let h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  h = h ? h : 12;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${ampm}`;
};

const getAccountIcon = (type: string, color: string, size = 20) => {
  switch (type) {
    case 'cash': return <Banknote size={size} color={color} />;
    case 'upi': return <Smartphone size={size} color={color} />;
    case 'bank': return <Landmark size={size} color={color} />;
    case 'credit': return <CreditCard size={size} color={color} />;
    case 'wallet': return <Wallet size={size} color={color} />;
    default: return <Wallet size={size} color={color} />;
  }
};

export const AddExpenseScreen = () => {
  const C = useThemeColors();
  const theme = useStore(s => s.theme);
  const storeCategories = useStore(s => s.categories);
  const categoryMeta = useStore(s => s.categoryMeta);
  const addTransaction = useStore(s => s.addTransaction);
  const addCategory = useStore(s => s.addCategory);
  const reorderCategoryToFirst = useStore(s => s.reorderCategoryToFirst);
  const currency = useStore(s => s.currency);
  const transactions = useStore(s => s.transactions);
  const accounts = useStore(s => s.accounts);
  const setAccounts = useStore(s => s.setAccounts);
  const deleteAccount = useStore(s => s.deleteAccount);
  const notifications = useStore(s => s.notifications || []);
  const markNotificationAsRead = useStore(s => s.markNotificationAsRead);
  const markAllNotificationsAsRead = useStore(s => s.markAllNotificationsAsRead);
  const clearNotifications = useStore(s => s.clearNotifications);

  const navigation = useNavigation<BottomTabNavigationProp<TabParamList>>();
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, Platform.OS === 'android' ? 6 : 0);
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const [containerWidth, setContainerWidth] = useState(0);
  const effectiveWidth = containerWidth > 0 ? containerWidth : (Platform.OS === 'web' ? 343 : Math.min(windowWidth - 32, 388));
  const catItemWidth = (effectiveWidth - 18) / 4;

  const [amountStr, setAmountStr] = useState('0');
  const catScrollRef = useRef<ScrollView>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [txType, setTxType] = useState<TxType>('expense');
  const [paymentMode, setPaymentMode] = useState<string>('');
  const [toPaymentMode, setToPaymentMode] = useState<string>('');
  const [showAllCats, setShowAllCats] = useState(false);

  const [showAddCatModal, setShowAddCatModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatEmoji, setNewCatEmoji] = useState('🏷️');

  const [merchant, setMerchant] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [dateTimeTab, setDateTimeTab] = useState<'date' | 'time'>('date');
  const [showDateTimeDropdown, setShowDateTimeDropdown] = useState(false);

  const timeSlots = useMemo(() => {
    const slots: { label: string; hour: number; minute: number }[] = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 15) {
        const period = h >= 12 ? 'PM' : 'AM';
        const displayHour = h % 12 === 0 ? 12 : h % 12;
        const displayMin = m.toString().padStart(2, '0');
        const label = `${displayHour.toString().padStart(2, '0')}:${displayMin} ${period}`;
        slots.push({ label, hour: h, minute: m });
      }
    }
    return slots;
  }, []);
  const [showAccountPicker, setShowAccountPicker] = useState<'from' | 'to' | 'mode' | null>(null);
  const [showMerchantModal, setShowMerchantModal] = useState(false);
  const [merchantSearch, setMerchantSearch] = useState('');
  const [isMerchantSearchFocused, setIsMerchantSearchFocused] = useState(false);
  const [merchantCategoryFilter, setMerchantCategoryFilter] = useState('All');
  const [receiptUri, setReceiptUri] = useState<string | null>(null);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showReceiptPickerModal, setShowReceiptPickerModal] = useState(false);
  const [showFullReceiptModal, setShowFullReceiptModal] = useState(false);

  const budgetNotifications = useMemo(() => (notifications || []).filter(n => n.type === 'budget'), [notifications]);
  const unreadNotifCount = useMemo(() => budgetNotifications.filter(n => !n.read).length, [budgetNotifications]);

  const sym = getCurrencySymbol(currency);
  const isExpense = txType === 'expense';
  const isIncome = txType === 'income';
  const isTransfer = txType === 'transfer';

  const POPULAR_MERCHANTS = useMemo(() => [
    // Food
    { name: 'Swiggy', category: 'Food', icon: '🍔' },
    { name: 'Zomato', category: 'Food', icon: '🍽️' },
    { name: 'McDonald\'s', category: 'Food', icon: '🍟' },
    { name: 'Starbucks', category: 'Food', icon: '☕' },
    { name: 'Domino\'s Pizza', category: 'Food', icon: '🍕' },
    { name: 'KFC', category: 'Food', icon: '🍗' },
    { name: 'Subway', category: 'Food', icon: '🥪' },
    { name: 'Burger King', category: 'Food', icon: '🍔' },
    { name: 'Pizza Hut', category: 'Food', icon: '🍕' },
    { name: 'Chai Point', category: 'Food', icon: '🫖' },
    { name: 'Chaayos', category: 'Food', icon: '🍵' },
    { name: 'Haldiram\'s', category: 'Food', icon: '🍛' },
    { name: 'Barbeque Nation', category: 'Food', icon: '🍢' },
    
    // Shopping
    { name: 'Amazon', category: 'Shopping', icon: '📦' },
    { name: 'Flipkart', category: 'Shopping', icon: '🛍️' },
    { name: 'Myntra', category: 'Shopping', icon: '👗' },
    { name: 'Meesho', category: 'Shopping', icon: '🏷️' },
    { name: 'Ajio', category: 'Shopping', icon: '👠' },
    { name: 'Nykaa', category: 'Shopping', icon: '💄' },
    { name: 'Zara', category: 'Shopping', icon: '👔' },
    { name: 'H&M', category: 'Shopping', icon: '👕' },
    { name: 'Apple Store', category: 'Shopping', icon: '🍎' },
    { name: 'Croma', category: 'Shopping', icon: '💻' },
    { name: 'Reliance Digital', category: 'Shopping', icon: '📱' },
    { name: 'Decathlon', category: 'Shopping', icon: '⚽' },
    { name: 'IKEA', category: 'Shopping', icon: '🛋️' },
    { name: 'Uniqlo', category: 'Shopping', icon: '🧥' },
    { name: 'Tata CLiQ', category: 'Shopping', icon: '🛍️' },

    // Groceries
    { name: 'Blinkit', category: 'Groceries', icon: '⚡' },
    { name: 'Zepto', category: 'Groceries', icon: '⏱️' },
    { name: 'Instamart', category: 'Groceries', icon: '🛒' },
    { name: 'BigBasket', category: 'Groceries', icon: '🥦' },
    { name: 'DMart', category: 'Groceries', icon: '🏬' },
    { name: 'Reliance Fresh', category: 'Groceries', icon: '🍎' },
    { name: 'More Supermarket', category: 'Groceries', icon: '🛒' },
    { name: 'Nature\'s Basket', category: 'Groceries', icon: '🥑' },
    { name: 'Local Kirana', category: 'Groceries', icon: '🏪' },
    { name: 'Milk Basket', category: 'Groceries', icon: '🥛' },

    // Transport
    { name: 'Uber', category: 'Transport', icon: '🚗' },
    { name: 'Ola', category: 'Transport', icon: '🚖' },
    { name: 'Rapido', category: 'Transport', icon: '🛵' },
    { name: 'Indian Oil', category: 'Transport', icon: '⛽' },
    { name: 'HP Petrol', category: 'Transport', icon: '⛽' },
    { name: 'Bharat Petroleum', category: 'Transport', icon: '⛽' },
    { name: 'Shell Petrol', category: 'Transport', icon: '⛽' },
    { name: 'IRCTC', category: 'Transport', icon: '🚆' },
    { name: 'Metro Card Recharge', category: 'Transport', icon: '🚇' },
    { name: 'Fastag Toll', category: 'Transport', icon: '🛣️' },
    { name: 'MakeMyTrip', category: 'Transport', icon: '✈️' },
    { name: 'RedBus', category: 'Transport', icon: '🚌' },
    { name: 'IndiGo Airlines', category: 'Transport', icon: '✈️' },

    // Bills
    { name: 'Electricity Bill', category: 'Bills', icon: '⚡' },
    { name: 'Airtel Recharge', category: 'Bills', icon: '📶' },
    { name: 'Jio Recharge', category: 'Bills', icon: '📱' },
    { name: 'Vodafone Idea (Vi)', category: 'Bills', icon: '📶' },
    { name: 'Gas Cylinder (HP/Indane)', category: 'Bills', icon: '🔥' },
    { name: 'Water Bill', category: 'Bills', icon: '💧' },
    { name: 'Wi-Fi Broadband', category: 'Bills', icon: '🌐' },
    { name: 'Credit Card Bill', category: 'Bills', icon: '💳' },
    { name: 'Tata Play DTH', category: 'Bills', icon: '📡' },

    // Subscriptions
    { name: 'Netflix', category: 'Subscriptions', icon: '🎬' },
    { name: 'Spotify', category: 'Subscriptions', icon: '🎵' },
    { name: 'YouTube Premium', category: 'Subscriptions', icon: '▶️' },
    { name: 'Disney+ Hotstar', category: 'Subscriptions', icon: '📺' },
    { name: 'Amazon Prime', category: 'Subscriptions', icon: '📦' },
    { name: 'ChatGPT Plus', category: 'Subscriptions', icon: '🤖' },
    { name: 'Apple Services / iCloud', category: 'Subscriptions', icon: '☁️' },
    { name: 'Google One', category: 'Subscriptions', icon: '💾' },
    { name: 'Sony LIV', category: 'Subscriptions', icon: '📺' },
    { name: 'Zee5', category: 'Subscriptions', icon: '📺' },

    // Entertainment
    { name: 'BookMyShow', category: 'Entertainment', icon: '🎟️' },
    { name: 'PVR Inox Cinema', category: 'Entertainment', icon: '🍿' },
    { name: 'Prime Video', category: 'Entertainment', icon: '🎥' },
    { name: 'PlayStation Store', category: 'Entertainment', icon: '🎮' },
    { name: 'Steam Games', category: 'Entertainment', icon: '🕹️' },

    // Health
    { name: 'Apollo Pharmacy', category: 'Health', icon: '💊' },
    { name: 'Tata 1mg', category: 'Health', icon: '🩺' },
    { name: 'Netmeds', category: 'Health', icon: '🏥' },
    { name: 'MedPlus', category: 'Health', icon: '💊' },
    { name: 'PharmEasy', category: 'Health', icon: '📦' },
    { name: 'Cult.fit Gym', category: 'Health', icon: '🏋️' },
    { name: 'Practo Doctor', category: 'Health', icon: '👨‍⚕️' },
    { name: 'Dr. Lal PathLabs', category: 'Health', icon: '🔬' },

    // Education
    { name: 'Udemy', category: 'Education', icon: '🎓' },
    { name: 'Coursera', category: 'Education', icon: '📚' },
    { name: 'College / School Fees', category: 'Education', icon: '🏫' },
    { name: 'Books & Stationery', category: 'Education', icon: '📖' },
    { name: 'Unacademy', category: 'Education', icon: '💡' },
    { name: 'PhysicsWallah', category: 'Education', icon: '📐' },
    { name: 'Duolingo', category: 'Education', icon: '🦉' },

    // Travel
    { name: 'MakeMyTrip Hotels', category: 'Travel', icon: '🏨' },
    { name: 'Goibibo', category: 'Travel', icon: '✈️' },
    { name: 'Airbnb', category: 'Travel', icon: '🏡' },
    { name: 'OYO Rooms', category: 'Travel', icon: '🏨' },
    { name: 'Booking.com', category: 'Travel', icon: '🗺️' },
    { name: 'Cleartrip', category: 'Travel', icon: '✈️' },

    // Coffee
    { name: 'Starbucks Coffee', category: 'Coffee', icon: '☕' },
    { name: 'Third Wave Coffee', category: 'Coffee', icon: '☕' },
    { name: 'Blue Tokai', category: 'Coffee', icon: '☕' },
    { name: 'Costa Coffee', category: 'Coffee', icon: '☕' },
    { name: 'Cafe Coffee Day', category: 'Coffee', icon: '☕' },

    // Gifts
    { name: 'Ferns N Petals (FNP)', category: 'Gifts', icon: '💐' },
    { name: 'FlowerAura', category: 'Gifts', icon: '🌸' },
    { name: 'Titan / Tanishq', category: 'Gifts', icon: '⌚' },
    { name: 'Archies Gallery', category: 'Gifts', icon: '🎁' },
    { name: 'Amazon Gift Card', category: 'Gifts', icon: '🎁' },

    // Rent
    { name: 'House Rent', category: 'Rent', icon: '🏠' },
    { name: 'Flat Maintenance', category: 'Rent', icon: '🏢' },
    { name: 'Office Rent', category: 'Rent', icon: '🏬' },
    { name: 'PG Accommodation', category: 'Rent', icon: '🛏️' },

    // Savings
    { name: 'Zerodha', category: 'Savings', icon: '📈' },
    { name: 'Groww', category: 'Savings', icon: '🌱' },
    { name: 'Mutual Fund SIP', category: 'Savings', icon: '💰' },
    { name: 'PPF / EPF Deposit', category: 'Savings', icon: '🏦' },
    { name: 'Gold Savings', category: 'Savings', icon: '🪙' },

    // Other
    { name: 'ATM Cash Withdrawal', category: 'Other', icon: '🏧' },
    { name: 'Laundry / Dry Cleaning', category: 'Other', icon: '🧺' },
    { name: 'Salon / Barber', category: 'Other', icon: '💇' },
    { name: 'Pet Care / Vet', category: 'Other', icon: '🐾' },
    { name: 'Charity / Donation', category: 'Other', icon: '❤️' },
  ], []);

  const suggestedMerchants = useMemo(() => {
    const defaults = [
      { name: 'Swiggy', icon: '🍔' },
      { name: 'Zomato', icon: '🍽️' },
      { name: 'Flipkart', icon: '🛍️' },
      { name: 'Amazon', icon: '📦' },
      { name: 'Uber', icon: '🚗' },
    ];

    const counts: Record<string, number> = {};
    transactions.forEach(t => {
      if (t.title && t.title !== t.category && !defaults.find(d => d.name.toLowerCase() === t.title.toLowerCase())) {
        counts[t.title] = (counts[t.title] || 0) + 1;
      }
    });

    const mostUsed = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(entry => ({ name: entry[0], icon: '🏪' }));

    return [...defaults, ...mostUsed];
  }, [transactions]);

  const mostUsedAccounts = useMemo(() => {
    const counts: Record<string, number> = {};
    transactions.forEach(t => {
      if (t.paymentMethod) counts[t.paymentMethod] = (counts[t.paymentMethod] || 0) + 1;
      if (t.toPaymentMethod) counts[t.toPaymentMethod] = (counts[t.toPaymentMethod] || 0) + 1;
    });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).map(entry => entry[0]);
    const allAccounts = accounts.map(a => a.name);
    const uniqueNames = Array.from(new Set([...sorted, ...allAccounts]));
    return uniqueNames.map(n => accounts.find(a => a.name === n)).filter(Boolean) as Account[];
  }, [transactions, accounts]);

  const handleKey = (key: string) => {
    setAmountStr(prev => {
      if (key === 'backspace') return prev.length > 1 ? prev.slice(0, -1) : '0';
      if (key === '.') return prev.includes('.') ? prev : prev + '.';
      if (prev === '0') return key;
      if (prev.includes('.') && prev.split('.')[1].length >= 2) return prev;
      if (prev.length >= 10) return prev;
      return prev + key;
    });
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please allow camera access to take receipt photos.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setReceiptUri(result.assets[0].uri);
        setShowReceiptPickerModal(false);
      }
    } catch (err: any) {
      Alert.alert('Camera Error', err.message || 'Could not launch camera');
    }
  };

  const handleChooseFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please grant photo library access to attach receipts.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setReceiptUri(result.assets[0].uri);
        setShowReceiptPickerModal(false);
      }
    } catch (err: any) {
      Alert.alert('Gallery Error', err.message || 'Could not pick image');
    }
  };

  const handleRemoveReceipt = () => {
    setReceiptUri(null);
    setShowReceiptPickerModal(false);
  };

  const handleSave = async () => {
    const amount = parseFloat(amountStr);
    const showAlert = (title: string, msg: string) => {
      if (Platform.OS === 'web') window.alert(`${title}: ${msg}`);
      else Alert.alert(title, msg);
    };

    if (isNaN(amount) || amount <= 0) {
      showAlert('Invalid Amount', 'Please enter a valid amount greater than 0.');
      return;
    }
    if (isExpense && !selectedCategory) {
      showAlert('Category Required', 'Please select an expense category.');
      return;
    }
    if (isTransfer && !paymentMode) {
      showAlert('Account Required', 'Please select a source account to transfer from.');
      return;
    }
    if (isTransfer && !toPaymentMode) {
      showAlert('Account Required', 'Please select a destination account.');
      return;
    }

    try {
      const dateStr = date.toISOString().split('T')[0];
      const timeStr = formatTimeStr(time);
      const title = isTransfer
        ? `Transfer to ${toPaymentMode}`
        : (isIncome ? (notes.trim() || 'Income') : (merchant.trim() || selectedCategory || 'Expense'));

      await addTransaction({
        title,
        amount,
        type: txType,
        category: isTransfer ? 'Transfer' : (isIncome ? 'Income' : (selectedCategory || 'Other')),
        date: dateStr,
        time: timeStr,
        paymentMethod: paymentMode,
        toPaymentMethod: isTransfer ? toPaymentMode : undefined,
        notes: notes.trim() || undefined,
        receipt: receiptUri || undefined,
      });

      setAmountStr('0');
      setMerchant('');
      setNotes('');
      setReceiptUri(null);
      navigation.navigate('History');
    } catch (e: any) {
      showAlert('Error', String(e.message || e));
    }
  };

  const KEYPAD_ROWS = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['.', '0', 'backspace'],
  ];

  const isSmallScreen = windowHeight < 720;
  const isTallScreen = windowHeight >= 820;
  const keyBtnHeight = isSmallScreen ? 48 : isTallScreen ? 64 : 58;
  const keyGap = isSmallScreen ? 8 : 10;
  const sectionSpacing = isSmallScreen ? 8 : isTallScreen ? 12 : 10;
  const keypadTopGap = isSmallScreen ? 14 : 18;
  const cardPaddingV = isSmallScreen ? 12 : isTallScreen ? 18 : 14;
  const amountFontSize = isSmallScreen ? 34 : isTallScreen ? 44 : 38;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: C.background }]} edges={['top', 'bottom']}>
      <RNStatusBar barStyle={theme === 'light' ? 'dark-content' : 'light-content'} backgroundColor={C.background} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={{ width: 38 }} />
        <Text style={[styles.headerTitle, { color: C.textPrimary }]}>Add Transaction</Text>
        <TouchableOpacity
          style={styles.bellBtn}
          onPress={() => setShowNotificationsModal(true)}
          activeOpacity={0.7}
        >
          <Bell size={22} color={C.textPrimary} />
          {unreadNotifCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {unreadNotifCount > 9 ? '9+' : unreadNotifCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View
        style={[
          styles.mainContainer,
          {
            paddingBottom: 60 + bottomPad + (isSmallScreen ? 6 : 10),
            paddingHorizontal: 16,
          }
        ]}
      >
        {/* ── Top Section (Inputs & Selectors) ── */}
        <View style={{ gap: sectionSpacing }}>
          {/* ── Type Selector ── */}
          <View style={[styles.segmentContainer, { backgroundColor: C.surface, borderColor: C.border }]}>
            <TouchableOpacity
              style={[
                styles.segmentBtn,
                isExpense && { backgroundColor: 'rgba(34,197,94,0.15)', borderColor: '#22C55E' }
              ]}
              onPress={() => setTxType('expense')}
              activeOpacity={0.7}
            >
              <ArrowUp size={13} color={isExpense ? '#22C55E' : C.textSecondary} />
              <Text style={[styles.segmentText, { color: isExpense ? '#22C55E' : C.textSecondary, fontWeight: isExpense ? '700' : '600' }]}>
                Expense
              </Text>
            </TouchableOpacity>
            <View style={[styles.segmentDivider, { backgroundColor: C.border }]} />
            <TouchableOpacity
              style={[
                styles.segmentBtn,
                isIncome && { backgroundColor: 'rgba(59,130,246,0.15)', borderColor: '#3B82F6' }
              ]}
              onPress={() => setTxType('income')}
              activeOpacity={0.7}
            >
              <ArrowDown size={13} color={isIncome ? '#3B82F6' : C.textSecondary} />
              <Text style={[styles.segmentText, { color: isIncome ? '#3B82F6' : C.textSecondary, fontWeight: isIncome ? '700' : '600' }]}>
                Income
              </Text>
            </TouchableOpacity>
            <View style={[styles.segmentDivider, { backgroundColor: C.border }]} />
            <TouchableOpacity
              style={[
                styles.segmentBtn,
                isTransfer && { backgroundColor: 'rgba(168,85,247,0.15)', borderColor: '#A855F7' }
              ]}
              onPress={() => setTxType('transfer')}
              activeOpacity={0.7}
            >
              <ArrowRightLeft size={13} color={isTransfer ? '#A855F7' : C.textSecondary} />
              <Text style={[styles.segmentText, { color: isTransfer ? '#A855F7' : C.textSecondary, fontWeight: isTransfer ? '700' : '600' }]}>
                Transfer
              </Text>
            </TouchableOpacity>
          </View>

          {/* ── Amount Card ── */}
          <View
            style={[
              styles.amountCard,
              {
                backgroundColor: C.surface,
                borderColor: parseFloat(amountStr) > 0
                  ? (isExpense ? 'rgba(34,197,94,0.4)' : isIncome ? 'rgba(59,130,246,0.4)' : 'rgba(168,85,247,0.4)')
                  : C.border,
                paddingVertical: cardPaddingV,
              }
            ]}
          >
            <Text style={[styles.amountLabel, { color: C.textSecondary }]}>
              {isExpense ? 'EXPENSE AMOUNT' : isIncome ? 'INCOME AMOUNT' : 'TRANSFER AMOUNT'}
            </Text>

            <Text
              style={[
                styles.amountText,
                {
                  color: parseFloat(amountStr) > 0 ? (isExpense ? '#22C55E' : isIncome ? '#3B82F6' : '#A855F7') : C.textPrimary,
                  fontSize: amountFontSize,
                }
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {sym}{amountStr}
            </Text>

            <View style={styles.amountBottomRow}>
              {/* Left: Debit / Credit / Transfer Quick Switcher Pill */}
              <TouchableOpacity
                style={[
                  styles.actionPill,
                  {
                    backgroundColor: isExpense
                      ? 'rgba(34, 197, 94, 0.12)'
                      : isIncome
                      ? 'rgba(59, 130, 246, 0.12)'
                      : 'rgba(168, 85, 247, 0.12)',
                    borderColor: isExpense ? '#22C55E' : isIncome ? '#3B82F6' : '#A855F7',
                  }
                ]}
                onPress={() => {
                  if (isExpense) setTxType('income');
                  else if (isIncome) setTxType('transfer');
                  else setTxType('expense');
                }}
                activeOpacity={0.7}
              >
                {isExpense ? (
                  <>
                    <ArrowUp size={12} color="#22C55E" />
                    <Text style={[styles.actionPillText, { color: '#22C55E', fontWeight: '700' }]}>Debit</Text>
                  </>
                ) : isIncome ? (
                  <>
                    <ArrowDown size={12} color="#3B82F6" />
                    <Text style={[styles.actionPillText, { color: '#3B82F6', fontWeight: '700' }]}>Credit</Text>
                  </>
                ) : (
                  <>
                    <ArrowRightLeft size={12} color="#A855F7" />
                    <Text style={[styles.actionPillText, { color: '#A855F7', fontWeight: '700' }]}>Transfer</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Right: Add Note Pill */}
              <TouchableOpacity
                style={[
                  styles.actionPill,
                  {
                    backgroundColor: notes.length > 0 ? 'rgba(34, 197, 94, 0.12)' : C.surfaceElevated,
                    borderColor: notes.length > 0 ? '#22C55E' : C.border,
                  }
                ]}
                onPress={() => setShowNoteModal(true)}
                activeOpacity={0.7}
              >
                <FileText size={12} color={notes.length > 0 ? '#22C55E' : C.textSecondary} />
                <Text
                  numberOfLines={1}
                  style={[
                    styles.actionPillText,
                    { color: notes.length > 0 ? '#22C55E' : C.textSecondary, maxWidth: 130 }
                  ]}
                >
                  {notes.length > 0 ? notes : 'Add Note'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Category / Transfer Quick Bar ── */}
          {isTransfer ? (
            <View style={styles.metaGridRow}>
              <TouchableOpacity 
                style={[
                  styles.metaColBtn,
                  { flex: 1, height: isSmallScreen ? 34 : 38, backgroundColor: C.surface, borderColor: paymentMode ? '#A855F7' : C.border }
                ]}
                onPress={() => setShowAccountPicker('from')}
                activeOpacity={0.7}
              >
                <Wallet size={12} color="#A855F7" />
                <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.metaChipText, { color: paymentMode ? C.textPrimary : C.textSecondary }]}>
                  From: {paymentMode || 'Select'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.metaColBtn,
                  { flex: 1, height: isSmallScreen ? 34 : 38, backgroundColor: C.surface, borderColor: toPaymentMode ? '#A855F7' : C.border }
                ]}
                onPress={() => setShowAccountPicker('to')}
                activeOpacity={0.7}
              >
                <Landmark size={12} color="#A855F7" />
                <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.metaChipText, { color: toPaymentMode ? C.textPrimary : C.textSecondary }]}>
                  To: {toPaymentMode || 'Select'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View
              style={[styles.catStripWrap, { height: isSmallScreen ? 32 : 36 }]}
              onLayout={(e) => {
                const w = e.nativeEvent.layout.width;
                if (w > 100 && Math.abs(w - containerWidth) > 2) {
                  setContainerWidth(w);
                }
              }}
            >
              <ScrollView
                ref={catScrollRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 6, alignItems: 'center' }}
                keyboardShouldPersistTaps="always"
                nestedScrollEnabled={true}
              >
                {storeCategories.map(cat => {
                  const active = selectedCategory === cat;
                  const meta = categoryMeta[cat];
                  const col = meta?.color ?? getCategoryColor(cat as any);
                  return (
                    <Pressable
                      key={cat}
                      style={({ pressed }) => [
                        styles.catBtn,
                        {
                          width: catItemWidth,
                          height: isSmallScreen ? 30 : 34,
                          backgroundColor: active ? (col + '22') : C.surface,
                          borderColor: active ? col : C.border,
                          opacity: pressed ? 0.6 : 1,
                        }
                      ]}
                      onPress={() => setSelectedCategory(active ? '' : cat)}
                      onLongPress={() => {
                        try {
                          if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
                            UIManager.setLayoutAnimationEnabledExperimental(true);
                          }
                          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                        } catch (_) {}
                        try { Vibration.vibrate(50); } catch (_) {}
                        reorderCategoryToFirst(cat);
                        setSelectedCategory(cat);
                        setTimeout(() => {
                          catScrollRef.current?.scrollTo({ x: 0, animated: true });
                        }, 40);
                      }}
                      delayLongPress={200}
                      hitSlop={6}
                    >
                      {meta?.emoji ? (
                        <Text style={{ fontSize: 11.5 }}>{meta.emoji}</Text>
                      ) : (
                        getCategoryIcon(cat as any, col, 12)
                      )}
                      <Text
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        style={[styles.catBtnText, { color: active ? col : C.textPrimary, fontWeight: active ? '700' : '600' }]}
                      >
                        {cat}
                      </Text>
                    </Pressable>
                  );
                })}
                <TouchableOpacity
                  style={[
                    styles.catBtn,
                    {
                      width: catItemWidth,
                      height: isSmallScreen ? 30 : 34,
                      backgroundColor: C.surfaceElevated,
                      borderColor: C.border,
                      borderStyle: 'dashed',
                    }
                  ]}
                  onPress={() => {
                    setNewCatName('');
                    setNewCatEmoji('🏷️');
                    setShowAddCatModal(true);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.catBtnText, { color: '#22C55E', fontWeight: '700' }]}>+ New</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          )}

          {/* ── Quick Meta Details (Responsive 2-Row Column Grid) ── */}
          <View style={{ gap: isSmallScreen ? 5 : 6 }}>
            {/* Row 1: Account + Payee */}
            {!isTransfer && (
              <View style={styles.metaGridRow}>
                <TouchableOpacity
                  style={[
                    styles.metaColBtn,
                    { flex: 1, height: isSmallScreen ? 34 : 38, backgroundColor: C.surface, borderColor: paymentMode ? '#22C55E' : C.border }
                  ]}
                  onPress={() => setShowAccountPicker('mode')}
                  activeOpacity={0.7}
                >
                  <CreditCard size={12} color={paymentMode ? '#22C55E' : C.textSecondary} />
                  <Text numberOfLines={1} style={[styles.metaChipText, { color: paymentMode ? C.textPrimary : C.textSecondary }]}>
                    {paymentMode ? `Account: ${paymentMode}` : 'Select Account'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.metaColBtn,
                    { flex: 1, height: isSmallScreen ? 34 : 38, backgroundColor: C.surface, borderColor: merchant ? '#22C55E' : C.border }
                  ]}
                  onPress={() => {
                    setMerchantSearch('');
                    setIsMerchantSearchFocused(false);
                    setMerchantCategoryFilter('All');
                    setShowMerchantModal(true);
                  }}
                  activeOpacity={0.7}
                >
                  <User size={12} color={merchant ? '#22C55E' : C.textSecondary} />
                  <Text numberOfLines={1} style={[styles.metaChipText, { color: merchant ? C.textPrimary : C.textSecondary }]}>
                    {merchant
                      ? `${isExpense ? 'Payee' : 'Payer'}: ${merchant}`
                      : (isExpense ? 'Select Payee' : 'Select Payer')}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Row 2: Date/Time + Receipt */}
            <View style={styles.metaGridRow}>
              <TouchableOpacity
                style={[
                  styles.metaColBtn,
                  { flex: 1, height: isSmallScreen ? 34 : 38, backgroundColor: C.surface, borderColor: C.border }
                ]}
                onPress={() => setShowDateTimeDropdown(!showDateTimeDropdown)}
                activeOpacity={0.7}
              >
                <Clock size={12} color={C.textSecondary} />
                <Text numberOfLines={1} style={[styles.metaChipText, { color: C.textPrimary }]}>
                  {date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}, {formatTimeStr(time)}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.metaColBtn,
                  { flex: 1, height: isSmallScreen ? 34 : 38, backgroundColor: C.surface, borderColor: receiptUri ? '#22C55E' : C.border }
                ]}
                onPress={() => setShowReceiptPickerModal(true)}
                activeOpacity={0.7}
              >
                <Camera size={13} color={receiptUri ? '#22C55E' : C.textSecondary} />
                <Text numberOfLines={1} style={[styles.metaChipText, { color: receiptUri ? '#22C55E' : C.textSecondary }]}>
                  {receiptUri ? 'Receipt ✓' : '+ Receipt'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ── Bottom Section (Keypad + Save CTA Button) ── */}
        <View style={{ flex: 1, gap: keyGap, marginTop: keypadTopGap }}>
          {/* ── Keypad ── */}
          <View style={[styles.keypad, { flex: 1, gap: keyGap }]}>
            {KEYPAD_ROWS.map((row, rIdx) => (
              <View key={rIdx} style={[styles.keypadRow, { flex: 1, gap: keyGap }]}>
                {row.map(k => (
                  <TouchableOpacity
                    key={k}
                    style={[
                      styles.keyBtn,
                      {
                        flex: 1,
                        backgroundColor: C.surface,
                        borderColor: C.border,
                        borderWidth: 1,
                      }
                    ]}
                    onPress={() => handleKey(k)}
                    activeOpacity={0.65}
                  >
                    {k === 'backspace' ? (
                      <Delete size={isSmallScreen ? 22 : 26} color={C.textPrimary} />
                    ) : (
                      <Text style={[styles.keyText, { color: C.textPrimary, fontSize: isSmallScreen ? 20 : 24 }]}>{k}</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </View>

          {/* ── Save Button ── */}
          <TouchableOpacity
            style={[
              styles.saveBtn,
              {
                marginTop: isSmallScreen ? 10 : 14,
                height: isSmallScreen ? 46 : 50,
                backgroundColor: parseFloat(amountStr) > 0
                  ? (theme === 'light' ? '#18181B' : '#FFFFFF')
                  : (theme === 'light' ? '#E4E4E7' : '#27272A'),
                borderWidth: 1,
                borderColor: parseFloat(amountStr) > 0
                  ? (theme === 'light' ? '#18181B' : '#FFFFFF')
                  : C.border,
                shadowColor: parseFloat(amountStr) > 0 ? (theme === 'light' ? '#000000' : '#FFFFFF') : 'transparent',
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: parseFloat(amountStr) > 0 ? 0.2 : 0,
                shadowRadius: 6,
                elevation: parseFloat(amountStr) > 0 ? 3 : 0,
              }
            ]}
            onPress={handleSave}
            disabled={parseFloat(amountStr) <= 0}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.saveBtnText,
                {
                  color: parseFloat(amountStr) > 0
                    ? (theme === 'light' ? '#FFFFFF' : '#000000')
                    : C.textMuted,
                  fontSize: isSmallScreen ? 13.5 : 14.5,
                }
              ]}
            >
              {parseFloat(amountStr) > 0
                ? `Save ${isExpense ? 'Expense' : isIncome ? 'Income' : 'Transfer'} • ${sym}${amountStr}`
                : 'Enter Amount'}
            </Text>
          </TouchableOpacity>
        </View>

      </View>

      {/* ── Notifications Modal ── */}
      <Modal visible={showNotificationsModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '80%', backgroundColor: C.surface, borderColor: C.border }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, minWidth: 0, marginRight: 8 }}>
                <View style={[styles.notifIconHeaderWrap, { backgroundColor: 'rgba(239,68,68,0.15)' }]}>
                  <AlertTriangle size={16} color="#EF4444" />
                </View>
                <Text numberOfLines={1} style={[styles.modalTitle, { color: C.textPrimary, flexShrink: 1, fontSize: 16 }]}>
                  Budget Alerts
                </Text>
                {unreadNotifCount > 0 && (
                  <View style={[styles.badge, { position: 'relative', top: 0, right: 0, marginLeft: 2, height: 16, borderRadius: 8, paddingHorizontal: 5 }]}>
                    <Text style={[styles.badgeText, { fontSize: 9 }]}>{unreadNotifCount} new</Text>
                  </View>
                )}
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                {unreadNotifCount > 0 && (
                  <TouchableOpacity onPress={markAllNotificationsAsRead} style={styles.markReadBtn} activeOpacity={0.7}>
                    <CheckCheck size={14} color="#22C55E" />
                    <Text style={[styles.markReadText, { color: '#22C55E', fontSize: 11.5 }]}>Mark read</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => setShowNotificationsModal(false)} style={{ padding: 4 }} activeOpacity={0.7}>
                  <X size={20} color={C.textPrimary} />
                </TouchableOpacity>
              </View>
            </View>

            {budgetNotifications.length === 0 ? (
              <View style={styles.emptyNotifWrap}>
                <Text style={{ fontSize: 36, marginBottom: 8 }}>🛡️</Text>
                <Text style={[styles.emptyNotifTitle, { color: C.textPrimary }]}>No Budget Alerts</Text>
                <Text style={[styles.emptyNotifSub, { color: C.textSecondary }]}>Your spending is well within set budget limits!</Text>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
                {budgetNotifications.map((item: AppNotification) => {
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.notifItem,
                        { borderColor: C.border, backgroundColor: item.read ? 'transparent' : (theme === 'light' ? 'rgba(239,68,68,0.06)' : 'rgba(239,68,68,0.08)') },
                      ]}
                      onPress={() => markNotificationAsRead(item.id)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.notifIconCircle, { backgroundColor: 'rgba(239,68,68,0.15)' }]}>
                        <AlertTriangle size={18} color="#EF4444" />
                      </View>

                      <View style={{ flex: 1, minWidth: 0 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 2 }}>
                          <Text style={[styles.notifItemTitle, { color: C.textPrimary, fontWeight: item.read ? '600' : '700' }]}>
                            {item.title}
                          </Text>
                          {!item.read && <View style={[styles.unreadDot, { backgroundColor: '#EF4444' }]} />}
                        </View>
                        <Text style={[styles.notifItemBody, { color: C.textSecondary }]}>{item.body}</Text>
                        <Text style={[styles.notifItemTime, { color: C.textMuted }]}>{item.time || item.date}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}

                {budgetNotifications.length > 0 && (
                  <TouchableOpacity
                    style={[styles.clearAllBtn, { borderColor: C.border }]}
                    onPress={clearNotifications}
                    activeOpacity={0.7}
                  >
                    <Trash2 size={14} color="#EF4444" />
                    <Text style={styles.clearAllText}>Clear all alerts</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* ── Merchant / Payee Picker Modal ── */}
      <Modal visible={showMerchantModal} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View
            style={[
              styles.modalContent,
              {
                height: 460,
                maxHeight: '80%',
                backgroundColor: C.surface,
                borderColor: C.border,
              }
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: C.textPrimary }]}>Select Merchant / Payee</Text>
              <TouchableOpacity onPress={() => setShowMerchantModal(false)}>
                <X size={24} color={C.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Search / Custom Entry Bar */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <View
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: C.surfaceElevated,
                  borderRadius: 14,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  borderWidth: 1,
                  borderColor: isMerchantSearchFocused ? (theme === 'light' ? '#000000' : '#FFFFFF') : C.border,
                }}
              >
                <Search size={16} color={isMerchantSearchFocused ? (theme === 'light' ? '#000000' : '#FFFFFF') : C.textMuted} style={{ marginRight: 8 }} />
                <TextInput
                  style={{ flex: 1, color: C.textPrimary, fontSize: 15, padding: 0 }}
                  placeholder="Search or enter merchant name..."
                  placeholderTextColor={C.textMuted}
                  value={merchantSearch}
                  onChangeText={setMerchantSearch}
                  onFocus={() => setIsMerchantSearchFocused(true)}
                  onBlur={() => {
                    if (!merchantSearch.trim()) setIsMerchantSearchFocused(false);
                  }}
                />
                {merchantSearch.length > 0 && (
                  <TouchableOpacity onPress={() => setMerchantSearch('')} style={{ padding: 4 }}>
                    <X size={16} color={C.textMuted} />
                  </TouchableOpacity>
                )}
              </View>
              {isMerchantSearchFocused && (
                <TouchableOpacity
                  onPress={() => {
                    setMerchantSearch('');
                    setIsMerchantSearchFocused(false);
                  }}
                  style={{ paddingHorizontal: 6, paddingVertical: 4 }}
                >
                  <Text style={{ color: C.textSecondary, fontSize: 14, fontWeight: '600' }}>Cancel</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* If user typed a custom merchant, show quick "Use [Name]" button */}
            {merchantSearch.trim().length > 0 && (
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  backgroundColor: 'rgba(34, 197, 94, 0.12)',
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: '#22C55E',
                  marginBottom: 12,
                }}
                onPress={() => {
                  const mName = merchantSearch.trim();
                  setMerchant(mName);
                  setShowMerchantModal(false);
                }}
              >
                <Text style={{ color: '#22C55E', fontWeight: '700', fontSize: 14 }}>
                  Use "{merchantSearch.trim()}"
                </Text>
                <Check size={18} color="#22C55E" />
              </TouchableOpacity>
            )}

            {/* Category Filter Pills */}
            <View style={{ height: 38, marginBottom: 14 }}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8, alignItems: 'center' }}
              >
                {['All', 'Mostly Used', ...storeCategories].map(cat => {
                  const isSelected = merchantCategoryFilter === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={{
                        paddingHorizontal: 14,
                        paddingVertical: 7,
                        borderRadius: 14,
                        backgroundColor: isSelected ? (theme === 'light' ? '#000' : '#FFF') : C.surfaceElevated,
                        borderWidth: 1,
                        borderColor: isSelected ? (theme === 'light' ? '#000' : '#FFF') : C.border,
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                      onPress={() => setMerchantCategoryFilter(cat)}
                    >
                      <Text style={{ fontSize: 12, fontWeight: '600', color: isSelected ? (theme === 'light' ? '#FFF' : '#000') : C.textSecondary }}>
                        {cat === 'Mostly Used' ? '⭐ Mostly Used' : cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Merchant List */}
            <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 24 }}>
              {(() => {
                let list = POPULAR_MERCHANTS;

                if (merchantCategoryFilter === 'Mostly Used') {
                  const counts: Record<string, number> = {};
                  transactions.forEach(t => {
                    if (t.title && t.title !== t.category) {
                      counts[t.title] = (counts[t.title] || 0) + 1;
                    }
                  });
                  const userTop = Object.entries(counts)
                    .sort((a, b) => b[1] - a[1])
                    .map(([name]) => {
                      const match = POPULAR_MERCHANTS.find(p => p.name.toLowerCase() === name.toLowerCase());
                      return match || { name, category: 'Other', icon: '🏪' };
                    });
                  const fallbackTop = POPULAR_MERCHANTS.slice(0, 18);
                  list = [
                    ...userTop,
                    ...fallbackTop.filter(f => !userTop.some(u => u.name.toLowerCase() === f.name.toLowerCase()))
                  ];
                } else if (merchantCategoryFilter !== 'All') {
                  list = POPULAR_MERCHANTS.filter(m => m.category.toLowerCase() === merchantCategoryFilter.toLowerCase());
                }

                if (merchantSearch.trim()) {
                  const q = merchantSearch.toLowerCase().trim();
                  list = list.filter(m => m.name.toLowerCase().includes(q) || m.category.toLowerCase().includes(q));
                }

                if (list.length === 0) {
                  return (
                    <View style={{ alignItems: 'center', paddingVertical: 24 }}>
                      <Text style={{ color: C.textMuted, fontSize: 14, marginBottom: 12 }}>
                        No payees found for "{merchantSearch || merchantCategoryFilter}"
                      </Text>
                      {merchantSearch.trim().length > 0 && (
                        <TouchableOpacity
                          style={{
                            paddingHorizontal: 18,
                            paddingVertical: 10,
                            borderRadius: 12,
                            backgroundColor: theme === 'light' ? '#18181B' : '#FFFFFF',
                          }}
                          onPress={() => {
                            setMerchant(merchantSearch.trim());
                            setShowMerchantModal(false);
                          }}
                        >
                          <Text style={{ color: theme === 'light' ? '#FFFFFF' : '#000000', fontWeight: '700', fontSize: 13 }}>
                            Use "{merchantSearch.trim()}" as Payee
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                }

                return list.map((m, i, arr) => {
                  const isSelected = merchant === m.name;
                  return (
                    <TouchableOpacity
                      key={`${m.name}-${m.category}-${i}`}
                      style={[
                        styles.modalRow,
                        { borderBottomColor: C.border },
                        isSelected && { backgroundColor: 'rgba(34, 197, 94, 0.1)' },
                        i === arr.length - 1 && { borderBottomWidth: 0 }
                      ]}
                      onPress={() => {
                        setMerchant(m.name);
                        if (!selectedCategory || selectedCategory === 'Other') {
                          setSelectedCategory(m.category);
                        }
                        setShowMerchantModal(false);
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                        <Text style={{ fontSize: 20 }}>{m.icon}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.modalRowText, { color: C.textPrimary, fontWeight: isSelected ? '700' : '600' }]}>
                            {m.name}
                          </Text>
                          <Text style={{ fontSize: 11, color: C.textSecondary, marginTop: 1 }}>
                            {m.category}
                          </Text>
                        </View>
                      </View>
                      {isSelected && <Check size={18} color="#22C55E" />}
                    </TouchableOpacity>
                  );
                });
              })()}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Add Custom Category Modal ── */}
      <Modal visible={showAddCatModal} transparent animationType="slide">
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={[styles.modalContent, { backgroundColor: C.surface, borderColor: C.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: C.textPrimary }]}>Add Category</Text>
              <TouchableOpacity onPress={() => setShowAddCatModal(false)}>
                <X size={22} color={C.textPrimary} />
              </TouchableOpacity>
            </View>

            <Text style={{ color: C.textSecondary, fontSize: 13, marginBottom: 8, fontWeight: '500' }}>Category Icon</Text>
            <View style={{ height: 44, marginBottom: 14 }}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ alignItems: 'center' }}>
                {['🏷️', '💼', '💻', '🏬', '📈', '🎁', '🎀', '🏠', '🛒', '🍔', '✈️', '🎮', '💡', '🩺', '📚'].map(emoji => (
                  <TouchableOpacity
                    key={emoji}
                    style={{
                      width: 40, height: 40, borderRadius: 20,
                      backgroundColor: newCatEmoji === emoji ? 'rgba(34,197,94,0.15)' : C.surfaceElevated,
                      borderWidth: 1, borderColor: newCatEmoji === emoji ? '#22C55E' : C.border,
                      justifyContent: 'center', alignItems: 'center', marginRight: 8
                    }}
                    onPress={() => setNewCatEmoji(emoji)}
                  >
                    <Text style={{ fontSize: 19 }}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <Text style={{ color: C.textSecondary, fontSize: 13, marginBottom: 8, fontWeight: '500' }}>Category Name</Text>
            <TextInput
              style={{
                backgroundColor: C.surfaceElevated,
                color: C.textPrimary,
                padding: 12,
                borderRadius: 12,
                fontSize: 15,
                borderWidth: 1,
                borderColor: C.border,
                marginBottom: 16
              }}
              placeholder="e.g. Freelance, Side Project, Gym..."
              placeholderTextColor={C.textMuted}
              value={newCatName}
              onChangeText={setNewCatName}
              autoFocus
            />

            <TouchableOpacity
              style={[
                styles.saveBtn,
                {
                  height: 48,
                  marginHorizontal: 0,
                  marginBottom: 0,
                  backgroundColor: newCatName.trim() ? (theme === 'light' ? '#18181B' : '#FFFFFF') : (theme === 'light' ? '#E4E4E7' : '#27272A'),
                }
              ]}
              disabled={!newCatName.trim()}
              onPress={() => {
                const name = newCatName.trim();
                if (name) {
                  addCategory(name, { emoji: newCatEmoji, color: isIncome ? '#3B82F6' : '#22C55E' });
                  setSelectedCategory(name);
                  setShowAddCatModal(false);
                  setNewCatName('');
                }
              }}
            >
              <Text style={[styles.saveBtnText, { color: newCatName.trim() ? (theme === 'light' ? '#FFFFFF' : '#000000') : C.textMuted, fontSize: 14, fontWeight: '700' }]}>
                Save & Select Category
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Note Modal ── */}
      <Modal visible={showNoteModal} transparent animationType="slide">
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={[styles.modalContent, { backgroundColor: C.surface, borderColor: C.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: C.textPrimary }]}>Add Note</Text>
              <TouchableOpacity onPress={() => setShowNoteModal(false)}>
                <X size={22} color={C.textPrimary} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={{
                backgroundColor: C.surfaceElevated,
                color: C.textPrimary,
                padding: 14,
                borderRadius: 12,
                fontSize: 15,
                height: 85,
                textAlignVertical: 'top',
                borderWidth: 1,
                borderColor: C.border
              }}
              placeholder="Enter your notes here..."
              placeholderTextColor={C.textMuted}
              multiline
              value={notes}
              onChangeText={setNotes}
              autoFocus
            />
            <TouchableOpacity
              style={[
                styles.saveBtn,
                {
                  height: 48,
                  marginTop: 14,
                  marginBottom: 0,
                  backgroundColor: theme === 'light' ? '#18181B' : '#FFFFFF',
                }
              ]}
              onPress={() => setShowNoteModal(false)}
            >
              <Text style={[styles.saveBtnText, { color: theme === 'light' ? '#FFFFFF' : '#000000', fontSize: 14, fontWeight: '700' }]}>Done</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Account Picker Modal ── */}
      <Modal visible={!!showAccountPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: C.surface, borderColor: C.border }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: C.textPrimary }]}>Select Account</Text>
                <Text style={{ color: C.textMuted, fontSize: 11, marginTop: 2 }}>Long press an account to delete</Text>
              </View>
              <TouchableOpacity onPress={() => setShowAccountPicker(null)}>
                <X size={24} color={C.textPrimary} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {accounts.map((acc, i) => {
                const isSelected = (showAccountPicker === 'from' || showAccountPicker === 'mode') ? (paymentMode === acc.name) : (toPaymentMode === acc.name);
                return (
                  <TouchableOpacity
                    key={acc.id}
                    style={[
                      styles.modalRow,
                      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomColor: C.border },
                      i === accounts.length - 1 && { borderBottomWidth: 0 }
                    ]}
                    onPress={() => {
                      if (showAccountPicker === 'from' || showAccountPicker === 'mode') setPaymentMode(acc.name);
                      if (showAccountPicker === 'to') setToPaymentMode(acc.name);
                      setShowAccountPicker(null);
                    }}
                    onLongPress={() => {
                      const confirmDelete = () => {
                        deleteAccount(acc.id);
                        if (paymentMode === acc.name) setPaymentMode('');
                        if (toPaymentMode === acc.name) setToPaymentMode('');
                      };
                      if (Platform.OS === 'web') {
                        if (window.confirm(`Delete "${acc.name}" account?`)) {
                          confirmDelete();
                        }
                      } else {
                        Alert.alert(
                          'Delete Account',
                          `Are you sure you want to delete "${acc.name}"?`,
                          [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Delete', style: 'destructive', onPress: confirmDelete }
                          ]
                        );
                      }
                    }}
                    delayLongPress={350}
                    activeOpacity={0.7}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: acc.color + '20', justifyContent: 'center', alignItems: 'center' }}>
                        {getAccountIcon(acc.type, acc.color || '#22C55E', 18)}
                      </View>
                      <Text style={[styles.modalRowText, { color: C.textPrimary }, isSelected && { color: '#22C55E', fontWeight: 'bold' }]}>{acc.name}</Text>
                    </View>
                    {isSelected && <Check size={18} color="#22C55E" />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Date & Time Picker Modal ── */}
      <Modal visible={showDateTimeDropdown} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '75%', backgroundColor: C.surface, borderColor: C.border }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: C.textPrimary }]}>Date & Time</Text>
                <Text style={{ color: C.textSecondary, fontSize: 12, marginTop: 2 }}>
                  {date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} at {formatTimeStr(time)}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowDateTimeDropdown(false)} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: '#22C55E' }}>
                <Text style={{ color: '#000', fontWeight: '700', fontSize: 14 }}>Done</Text>
              </TouchableOpacity>
            </View>

            {/* Sub-tabs: Date vs Time */}
            <View style={{ flexDirection: 'row', backgroundColor: C.surfaceElevated, borderRadius: 14, padding: 4, marginBottom: 16, borderWidth: 1, borderColor: C.border }}>
              <TouchableOpacity
                style={{ flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 10, backgroundColor: dateTimeTab === 'date' ? (theme === 'light' ? '#FFF' : '#27272A') : 'transparent' }}
                onPress={() => setDateTimeTab('date')}
              >
                <Text style={{ color: dateTimeTab === 'date' ? (theme === 'light' ? '#000' : '#FFF') : C.textSecondary, fontWeight: '700', fontSize: 13 }}>📅 Select Date</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 10, backgroundColor: dateTimeTab === 'time' ? (theme === 'light' ? '#FFF' : '#27272A') : 'transparent' }}
                onPress={() => setDateTimeTab('time')}
              >
                <Text style={{ color: dateTimeTab === 'time' ? (theme === 'light' ? '#000' : '#FFF') : C.textSecondary, fontWeight: '700', fontSize: 13 }}>⏰ Select Time</Text>
              </TouchableOpacity>
            </View>

            {dateTimeTab === 'date' ? (
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 300 }}>
                {Array.from({ length: 30 }).map((_, i) => {
                  const d = new Date();
                  d.setDate(d.getDate() - i);
                  const isSelected = d.getDate() === date.getDate() && d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear();
                  return (
                    <TouchableOpacity
                      key={i}
                      style={[styles.modalRow, { borderBottomColor: C.border }, isSelected && { backgroundColor: 'rgba(34, 197, 94, 0.1)' }]}
                      onPress={() => setDate(d)}
                    >
                      <Text style={[styles.modalRowText, { color: C.textPrimary }, isSelected && { color: '#22C55E', fontWeight: 'bold' }]}>
                        {i === 0 ? 'Today' : i === 1 ? 'Yesterday' : `${d.getDate().toString().padStart(2, '0')} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`}
                      </Text>
                      {isSelected && <Check size={18} color="#22C55E" />}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 320 }}>
                {/* Right Now Quick Button */}
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    paddingVertical: 12,
                    backgroundColor: 'rgba(34, 197, 94, 0.12)',
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: '#22C55E',
                    marginBottom: 12,
                  }}
                  onPress={() => setTime(new Date())}
                >
                  <Clock size={16} color="#22C55E" />
                  <Text style={{ color: '#22C55E', fontWeight: '700', fontSize: 13 }}>⏰ Set to Current Time (Now)</Text>
                </TouchableOpacity>

                {/* 15-minute intervals list */}
                {timeSlots.map(slot => {
                  const isSelected = time.getHours() === slot.hour && (Math.abs(time.getMinutes() - slot.minute) < 8 || time.getMinutes() === slot.minute);
                  return (
                    <TouchableOpacity
                      key={slot.label}
                      style={[
                        styles.modalRow,
                        { borderBottomColor: C.border },
                        isSelected && { backgroundColor: 'rgba(34, 197, 94, 0.1)' }
                      ]}
                      onPress={() => {
                        const d = new Date(time);
                        d.setHours(slot.hour, slot.minute, 0, 0);
                        setTime(d);
                      }}
                    >
                      <Text style={[styles.modalRowText, { color: C.textPrimary }, isSelected && { color: '#22C55E', fontWeight: 'bold' }]}>
                        {slot.label}
                      </Text>
                      {isSelected && <Check size={18} color="#22C55E" />}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* ── Receipt Options Modal ── */}
      <Modal visible={showReceiptPickerModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: C.surface, borderColor: C.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: C.textPrimary }]}>Attach Receipt</Text>
              <TouchableOpacity onPress={() => setShowReceiptPickerModal(false)}>
                <X size={24} color={C.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={{ gap: 12, paddingBottom: 12 }}>
              <TouchableOpacity
                style={[styles.receiptActionBtn, { backgroundColor: C.surfaceElevated, borderColor: C.border }]}
                onPress={handleTakePhoto}
                activeOpacity={0.7}
              >
                <View style={[styles.receiptActionIcon, { backgroundColor: 'rgba(34,197,94,0.15)' }]}>
                  <Camera size={22} color="#22C55E" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.receiptActionTitle, { color: C.textPrimary }]}>Take Photo (Camera)</Text>
                  <Text style={[styles.receiptActionSub, { color: C.textSecondary }]}>Capture receipt using camera</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.receiptActionBtn, { backgroundColor: C.surfaceElevated, borderColor: C.border }]}
                onPress={handleChooseFromGallery}
                activeOpacity={0.7}
              >
                <View style={[styles.receiptActionIcon, { backgroundColor: 'rgba(59,130,246,0.15)' }]}>
                  <ImageIcon size={22} color="#3B82F6" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.receiptActionTitle, { color: C.textPrimary }]}>Choose from Gallery</Text>
                  <Text style={[styles.receiptActionSub, { color: C.textSecondary }]}>Select photo from device album</Text>
                </View>
              </TouchableOpacity>

              {receiptUri && (
                <>
                  <TouchableOpacity
                    style={[styles.receiptActionBtn, { backgroundColor: C.surfaceElevated, borderColor: C.border }]}
                    onPress={() => {
                      setShowReceiptPickerModal(false);
                      setTimeout(() => setShowFullReceiptModal(true), 150);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.receiptActionIcon, { backgroundColor: 'rgba(168,85,247,0.15)' }]}>
                      <Eye size={22} color="#A855F7" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.receiptActionTitle, { color: C.textPrimary }]}>View Attached Photo</Text>
                      <Text style={[styles.receiptActionSub, { color: C.textSecondary }]}>Preview current receipt image</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.receiptActionBtn, { backgroundColor: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.2)' }]}
                    onPress={handleRemoveReceipt}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.receiptActionIcon, { backgroundColor: 'rgba(239,68,68,0.15)' }]}>
                      <Trash2 size={22} color="#EF4444" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.receiptActionTitle, { color: '#EF4444' }]}>Remove Receipt</Text>
                      <Text style={[styles.receiptActionSub, { color: C.textSecondary }]}>Detach image from this transaction</Text>
                    </View>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Fullscreen Receipt Viewer Modal ── */}
      <Modal visible={showFullReceiptModal} transparent animationType="fade">
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
          <View style={{ width: '100%', maxWidth: 450, maxHeight: '90%', borderRadius: 20, overflow: 'hidden', backgroundColor: C.surface, borderWidth: 1, borderColor: C.border }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: C.border }}>
              <Text style={{ color: C.textPrimary, fontSize: 17, fontWeight: '700' }}>Receipt Preview</Text>
              <TouchableOpacity onPress={() => setShowFullReceiptModal(false)}>
                <X size={24} color={C.textPrimary} />
              </TouchableOpacity>
            </View>

            {receiptUri ? (
              <ScrollView maximumZoomScale={3} minimumZoomScale={1} contentContainerStyle={{ alignItems: 'center', justifyContent: 'center', padding: 16 }}>
                <Image source={{ uri: receiptUri }} style={{ width: W - 72, height: 380, borderRadius: 12 }} resizeMode="contain" />
              </ScrollView>
            ) : null}

            <View style={{ flexDirection: 'row', gap: 12, padding: 16, borderTopWidth: 1, borderTopColor: C.border }}>
              <TouchableOpacity
                style={{ flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: C.surfaceElevated, alignItems: 'center', borderWidth: 1, borderColor: C.border }}
                onPress={() => {
                  setShowFullReceiptModal(false);
                  setTimeout(() => setShowReceiptPickerModal(true), 150);
                }}
              >
                <Text style={{ color: C.textPrimary, fontWeight: '600', fontSize: 14 }}>Change Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#22C55E', alignItems: 'center' }}
                onPress={() => setShowFullReceiptModal(false)}
              >
                <Text style={{ color: '#000', fontWeight: '700', fontSize: 14 }}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },

  mainContainer: { flex: 1, justifyContent: 'space-between' },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8 },
  headerTitle: { fontSize: 17, fontWeight: '700' },

  bellBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  badge: { position: 'absolute', top: 3, right: 3, backgroundColor: '#EF4444', minWidth: 15, height: 15, borderRadius: 7.5, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 3 },
  badgeText: { color: '#FFF', fontSize: 8.5, fontWeight: '800' },

  segmentContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, borderWidth: 1, padding: 3 },
  segmentBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 7, borderRadius: 13, borderWidth: 1, borderColor: 'transparent' },
  segmentText: { fontSize: 12, fontWeight: '600' },
  segmentDivider: { width: 1, height: '50%' },

  amountCard: { borderRadius: 18, paddingHorizontal: 16, borderWidth: 1, alignItems: 'center' },
  amountLabel: { fontSize: 10.5, fontWeight: '700', letterSpacing: 0.8, marginBottom: 2, textAlign: 'center' },
  amountText: { fontWeight: '800', textAlign: 'center', letterSpacing: -1, marginVertical: 2 },
  amountBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginTop: 4 },
  actionPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 11, paddingVertical: 5, borderRadius: 12, borderWidth: 1 },
  actionPillText: { fontSize: 11, fontWeight: '600' },

  catStripWrap: { width: '100%', overflow: 'hidden' },
  catBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, borderRadius: 12, borderWidth: 1, flexShrink: 0 },
  catBtnText: { fontSize: 11 },

  metaGridRow: { flexDirection: 'row', gap: 8 },
  metaColBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, borderRadius: 12, borderWidth: 1, paddingHorizontal: 8 },
  metaChipText: { fontSize: 10.5, fontWeight: '500' },

  keypad: { width: '100%' },
  keypadRow: { flexDirection: 'row' },
  keyBtn: { flex: 1, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  keyText: { fontWeight: '600' },

  saveBtn: { width: '100%', borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  saveBtnText: { fontWeight: '700', letterSpacing: 0.2 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, borderWidth: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  modalClose: { fontSize: 16, fontWeight: '600' },
  modalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1 },
  modalRowText: { fontSize: 16 },
  suggestionPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, borderWidth: 1 },
  suggestionPillText: { fontSize: 12, fontWeight: '600' },

  notifIconHeaderWrap: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  markReadBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4 },
  markReadText: { fontSize: 12, fontWeight: '600' },
  notifItem: { flexDirection: 'row', padding: 12, borderRadius: 16, borderWidth: 1, marginBottom: 10, gap: 12, alignItems: 'flex-start' },
  notifIconCircle: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  notifItemTitle: { fontSize: 14, marginBottom: 2 },
  notifItemBody: { fontSize: 12, lineHeight: 16, marginBottom: 4 },
  notifItemTime: { fontSize: 10 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22C55E', marginLeft: 8, marginTop: 4 },
  emptyNotifWrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 36 },
  emptyNotifTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  emptyNotifSub: { fontSize: 13 },
  clearAllBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, marginTop: 8, borderRadius: 12, borderWidth: 1 },
  clearAllText: { color: '#EF4444', fontSize: 13, fontWeight: '600' },

  receiptActionBtn: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 16, borderWidth: 1, gap: 14 },
  receiptActionIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  receiptActionTitle: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  receiptActionSub: { fontSize: 12 },
});
