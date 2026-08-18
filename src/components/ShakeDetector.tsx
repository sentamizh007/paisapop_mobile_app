import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  BackHandler,
} from 'react-native';
import { Accelerometer } from 'expo-sensors';
import * as QuickActions from 'expo-quick-actions';
import * as Linking from 'expo-linking';
import { BlurView } from 'expo-blur';
import { useStore } from '../store/useStore';
import { useThemeColors } from '../theme/colors';
import { Category } from '../utils/mockData';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { TabParamList } from '../navigation/TabNavigator';
import { User } from 'lucide-react-native';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

/** Quick Actions Configuration */

/** Auto-close the modal after this many milliseconds (3 seconds). */
const AUTO_CLOSE_MS = 3000;

// ─────────────────────────────────────────────────────────────────────────────
// ShakeDetector wrapper
// ─────────────────────────────────────────────────────────────────────────────

interface ShakeDetectorProps {
  children: React.ReactNode;
}

export const ShakeDetector: React.FC<ShakeDetectorProps> = ({ children }) => {
  const shakeToAdd = useStore((s) => s.shakeToAdd);
  const [visible, setVisible] = useState(false);
  const [isQuickLaunch, setIsQuickLaunch] = useState(false);

  const mountedRef = useRef<boolean>(true);
  const consumedInitialQuickActionRef = useRef<boolean>(false);
  const consumedInitialUrlRef = useRef<boolean>(false);

  const handleClose = useCallback(() => {
    setVisible(false);
    setIsQuickLaunch(false);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') return;

    // Register the Quick Action shortcut
    QuickActions.setItems([
      {
        title: 'Quick Add',
        id: 'quick-add',
        icon: 'compose',
        params: { href: 'quick-add' }
      }
    ]);

    // Handle Quick Action clicks while app is open / in background
    const subscription = QuickActions.addListener((action) => {
      if (action.id === 'quick-add' && mountedRef.current) {
        setIsQuickLaunch(true);
        setVisible(true);
      }
    });

    // Handle initial Quick Action (app launched from closed state)
    if (!consumedInitialQuickActionRef.current) {
      const action = QuickActions.initial;
      if (action?.id === 'quick-add' && mountedRef.current) {
        consumedInitialQuickActionRef.current = true;
        setIsQuickLaunch(true);
        setVisible(true);
      }
    }

    // Handle deep link (e.g. paisapop://quick-add or paisapop://quick-add?amount=100&category=Food)
    const handleUrl = (url: string | null) => {
      if (!url) return;
      try {
        const parsed = Linking.parse(url);
        const rawUrl = url.toLowerCase();

        if (rawUrl.includes('quick-add') || rawUrl.includes('quickadd')) {
          const qParams = parsed.queryParams || {};
          const qAmt = parseFloat(String(qParams.amount || ''));
          const qCat = String(qParams.category || '').trim();
          const qNotes = String(qParams.notes || '').trim();

          // If shortcut already collected amount/category directly on wallpaper
          if (!isNaN(qAmt) && qAmt > 0 && qCat) {
            const now = new Date();
            useStore.getState().addTransaction({
              title: qCat,
              amount: qAmt,
              category: qCat as any,
              date: now.toISOString().split('T')[0],
              time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              type: 'expense',
              paymentMethod: 'Cash',
              notes: qNotes || undefined,
            }).then(() => {
              if (Platform.OS === 'android') {
                setTimeout(() => { try { BackHandler.exitApp(); } catch {} }, 300);
              }
            });
            return;
          }

          if (mountedRef.current) {
            setIsQuickLaunch(true);
            setVisible(true);
          }
        }
      } catch (err) {
        console.warn('handleUrl error:', err);
      }
    };

    // Cold start deep-link check (run only once)
    if (!consumedInitialUrlRef.current) {
      consumedInitialUrlRef.current = true;
      Linking.getInitialURL().then(handleUrl).catch(() => {});
    }

    // Warm start deep-link listener
    const linkingSub = Linking.addEventListener('url', (event) => handleUrl(event.url));

    return () => {
      subscription.remove();
      linkingSub.remove();
    };
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: 'transparent' }}>
      {!visible && children}
      <QuickAddModal visible={visible} isQuickLaunch={true} onClose={handleClose} />
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// QuickAddModal
// ─────────────────────────────────────────────────────────────────────────────

interface QuickAddModalProps {
  visible: boolean;
  isQuickLaunch?: boolean;
  onClose: () => void;
}

const QuickAddModal: React.FC<QuickAddModalProps> = ({ visible, isQuickLaunch, onClose }) => {
  const storeCategories = useStore((s) => s.categories);
  const categoryMeta = useStore((s) => s.categoryMeta);
  const addTransaction = useStore((s) => s.addTransaction);
  const currency = useStore((s) => s.currency);
  const userName = useStore((s) => s.userName);
  const insets = useSafeAreaInsets();

  // Navigation — to jump to Profile from the shake modal
  const navigation = useNavigation<BottomTabNavigationProp<TabParamList>>();

  const sym = currency === 'USD' ? '$' : '₹';

  const [step, setStep] = useState<1 | 2>(1);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  const amountInputRef = useRef<TextInput>(null);

  const handleDismiss = useCallback(() => {
    onClose();
    if (isQuickLaunch && Platform.OS === 'android') {
      setTimeout(() => {
        try { BackHandler.exitApp(); } catch {}
      }, 300);
    }
  }, [isQuickLaunch, onClose]);

  // ── Countdown progress animation ───────────────────────────────────────────
  // progressAnim goes from 1 → 0 over AUTO_CLOSE_MS
  const progressAnim = useRef(new Animated.Value(1)).current;
  const autoCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressAnimRef = useRef<Animated.CompositeAnimation | null>(null);

  // Start / restart the 3-second countdown whenever the modal becomes visible
  useEffect(() => {
    if (visible) {
      // Reset state
      setStep(1);
      setAmount('');
      setNote('');

      // Reset and start animated progress bar
      progressAnim.setValue(1);
      progressAnimRef.current = Animated.timing(progressAnim, {
        toValue: 0,
        duration: AUTO_CLOSE_MS,
        useNativeDriver: false, // width % can't use native driver
      });
      progressAnimRef.current.start();

      // Auto-close timer
      autoCloseTimer.current = setTimeout(() => {
        handleDismiss();
      }, AUTO_CLOSE_MS);
    } else {
      // Modal closed — cancel everything
      progressAnimRef.current?.stop();
      progressAnim.setValue(1);
      if (autoCloseTimer.current) {
        clearTimeout(autoCloseTimer.current);
        autoCloseTimer.current = null;
      }
    }

    return () => {
      // Cleanup on unmount
      progressAnimRef.current?.stop();
      if (autoCloseTimer.current) clearTimeout(autoCloseTimer.current);
    };
  }, [visible, handleDismiss]);

  // Cancel auto-close when user starts interacting (types amount)
  const cancelAutoClose = useCallback(() => {
    progressAnimRef.current?.stop();
    if (autoCloseTimer.current) {
      clearTimeout(autoCloseTimer.current);
      autoCloseTimer.current = null;
    }
    // Set bar to full so it just freezes
    progressAnim.setValue(0);
  }, []);

  const handleNext = () => {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) return;
    cancelAutoClose(); // user is engaged — stop the timer
    setStep(2);
  };

  const handleSave = async (cat: string) => {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) return;

    const now = new Date();
    await addTransaction({
      title: cat,
      amount: amt,
      category: cat as Category,
      date: now.toISOString().split('T')[0],
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'expense',
      paymentMethod: 'Cash',
      notes: note.trim() || undefined,
    });

    handleDismiss();
  };

  // Focus the amount input AFTER modal fully appears
  const handleModalShow = useCallback(() => {
    setTimeout(() => { amountInputRef.current?.focus(); }, 50);
  }, []);

  // Navigate to Profile and close modal
  const handleGoToProfile = useCallback(() => {
    onClose();
    setTimeout(() => navigation.navigate('Profile'), 200);
  }, [navigation, onClose]);

  const theme = useStore(s => s.theme);
  const colors = useThemeColors();
  const isLight = theme === 'light';
  const C = isLight
    ? { bg: '#FFFFFF', text: '#000000', sub: '#666666', inputBg: 'rgba(0,0,0,0.05)', border: '#E4E4E7', cancelBg: 'rgba(0,0,0,0.08)' }
    : { bg: '#18181B', text: '#FFFFFF', sub: '#A1A1AA', inputBg: 'rgba(255,255,255,0.08)', border: '#27272A', cancelBg: 'rgba(255,255,255,0.1)' };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleDismiss}
      statusBarTranslucent
      onShow={handleModalShow}
    >
      <BlurView intensity={isQuickLaunch ? 25 : 50} tint={isLight ? 'light' : 'dark'} style={[styles.overlayFill, isQuickLaunch && { backgroundColor: 'transparent' }]}>
        {/* Tap outside to dismiss */}
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          onPress={handleDismiss}
          activeOpacity={1}
        />

        <KeyboardAvoidingView
          style={styles.kavContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
          pointerEvents="box-none"
        >
          <View style={[styles.popup, { marginTop: insets.top + 16, backgroundColor: C.bg, borderWidth: 1, borderColor: C.border }]}>

            {/* ── Countdown progress bar (top of card) ── */}
            <View style={[styles.progressTrack, { backgroundColor: C.border }]}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
            </View>

            {/* ── Header row: title + Profile button ── */}
            <View style={styles.headerRow}>
              <Text style={[styles.shakeLabel, { color: C.sub }]}>📳 Quick Add</Text>
              {/* Profile shortcut button */}
              <TouchableOpacity
                style={styles.profileBtn}
                onPress={handleGoToProfile}
                activeOpacity={0.7}
              >
                <User size={14} color="#007AFF" strokeWidth={2.5} />
                <Text style={styles.profileBtnText}>
                  {userName ? userName.split(' ')[0] : 'Profile'}
                </Text>
              </TouchableOpacity>
            </View>

            {step === 1 ? (
              <>
                <Text style={[styles.title, { color: C.text }]}>How much did you spend?</Text>

                <View style={[styles.inputWrap, { backgroundColor: C.inputBg }]}>
                  <TextInput
                    ref={amountInputRef}
                    style={[styles.amountInput, { color: C.text }]}
                    placeholder="Amount"
                    placeholderTextColor={C.sub}
                    keyboardType="decimal-pad"
                    value={amount}
                    onChangeText={(val) => {
                      setAmount(val);
                      if (val.length === 1) cancelAutoClose();
                    }}
                    selectionColor="#007AFF"
                    returnKeyType="next"
                    onSubmitEditing={handleNext}
                  />
                </View>

                <View style={[styles.inputWrap, { marginTop: 12, backgroundColor: C.inputBg }]}>
                  <TextInput
                    style={[styles.noteInput, { color: C.text }]}
                    placeholder="Notes (optional)"
                    placeholderTextColor={C.sub}
                    value={note}
                    onChangeText={setNote}
                    selectionColor="#007AFF"
                    returnKeyType="done"
                    onSubmitEditing={handleNext}
                  />
                </View>

                <View style={styles.btnRow}>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: C.cancelBg }]}
                    onPress={onClose}
                  >
                    <Text style={[styles.btnText, { color: C.text }]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.actionBtn,
                      styles.doneBtn,
                      { opacity: parseFloat(amount) > 0 ? 1 : 0.5 },
                    ]}
                    onPress={handleNext}
                    disabled={isNaN(parseFloat(amount)) || parseFloat(amount) <= 0}
                  >
                    <Text style={[styles.btnText, { color: '#FFF' }]}>Done</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <View style={styles.step2Header}>
                  <TouchableOpacity onPress={() => setStep(1)}>
                    <Text style={styles.backBtn}>← Back</Text>
                  </TouchableOpacity>
                  <Text style={[styles.title, { color: C.text }]}>Choose a category</Text>
                </View>

                <ScrollView
                  style={styles.catList}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  {storeCategories.map((item, idx) => {
                    const meta = categoryMeta?.[item];
                    return (
                      <TouchableOpacity
                        key={item}
                        style={[
                          styles.catRow,
                          { borderBottomColor: C.border },
                          idx === storeCategories.length - 1 && { borderBottomWidth: 0 },
                        ]}
                        onPress={() => handleSave(item)}
                      >
                        <Text style={styles.catEmoji}>{meta?.emoji ?? '🏷️'}</Text>
                        <Text style={[styles.catName, { color: C.text }]}>{item}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </BlurView>
    </Modal>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlayFill: {
    flex: 1,
  },
  kavContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  popup: {
    width: '94%',
    maxWidth: 400,
    backgroundColor: Platform.select({ ios: 'rgba(250,250,250,0.85)', android: '#FAFAFA' }),
    borderRadius: 32,
    padding: 24,
    paddingTop: 16, // slightly tighter top so progress bar looks natural
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden', // keeps progress bar inside rounded corners
  },

  // ── Countdown progress bar ──────────────────────────────────────────────────
  progressTrack: {
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.08)',
    marginBottom: 14,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: '#007AFF',
  },

  // ── Header row ─────────────────────────────────────────────────────────────
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  shakeLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(0,0,0,0.45)',
    letterSpacing: 0.4,
  },
  // Profile shortcut button
  profileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#007AFF18',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#007AFF30',
  },
  profileBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#007AFF',
  },

  // ── Step 1 form ────────────────────────────────────────────────────────────
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    textAlign: 'left',
    marginBottom: 16,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 16,
    paddingHorizontal: 16,
  },
  amountInput: {
    flex: 1,
    fontSize: 28,
    fontWeight: '600',
    color: '#000',
    paddingVertical: 18,
  },
  noteInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    paddingVertical: 14,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  cancelBtn: { backgroundColor: 'rgba(0,0,0,0.1)' },
  doneBtn: { backgroundColor: '#007AFF' },
  btnText: { fontSize: 16, fontWeight: '600' },

  // ── Step 2 categories ──────────────────────────────────────────────────────
  step2Header: { marginBottom: 8 },
  backBtn: {
    color: '#007AFF',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  catList: { maxHeight: 280 },
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  catEmoji: { fontSize: 20, marginRight: 12 },
  catName: { fontSize: 16, color: '#000', fontWeight: '500' },
});