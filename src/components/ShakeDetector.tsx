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
  Vibration,
} from 'react-native';
import * as QuickActions from 'expo-quick-actions';
import * as Linking from 'expo-linking';
import { BlurView } from 'expo-blur';
import { useStore } from '../store/useStore';
import { useThemeColors } from '../theme/colors';
import { Category, getCategoryIcon, getCategoryColor, getCurrencySymbol } from '../utils/mockData';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { TabParamList } from '../navigation/TabNavigator';
import { User, CheckCircle2, ChevronLeft, ArrowRight, Check } from 'lucide-react-native';

// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────

/** Auto-close the modal after this many milliseconds (3 seconds) if untouched. */
const AUTO_CLOSE_MS = 4000;

// ─────────────────────────────────────────────────────────────────────────────
// ShakeDetector wrapper
// ─────────────────────────────────────────────────────────────────────────────

interface ShakeDetectorProps {
  children: React.ReactNode;
}

export const ShakeDetector: React.FC<ShakeDetectorProps> = ({ children }) => {
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

    // Handle initial Quick Action ONLY (app launched from completely closed state)
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
                setTimeout(() => { try { BackHandler.exitApp(); } catch { } }, 300);
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
      Linking.getInitialURL().then(handleUrl).catch(() => { });
    }

    return () => {};
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: 'transparent' }}>
      {/* If launched directly via shortcut, do not render main app dashboard in background */}
      {isQuickLaunch ? (
        <View style={{ flex: 1, backgroundColor: 'transparent' }} />
      ) : (
        children
      )}
      <QuickAddModal visible={visible} isQuickLaunch={isQuickLaunch} onClose={handleClose} />
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
  const reorderCategoryToFirst = useStore((s) => s.reorderCategoryToFirst);
  const addTransaction = useStore((s) => s.addTransaction);
  const currency = useStore((s) => s.currency);
  const userName = useStore((s) => s.userName);
  const insets = useSafeAreaInsets();

  const navigation = useNavigation<BottomTabNavigationProp<TabParamList>>();
  const sym = getCurrencySymbol(currency);

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [savedCategory, setSavedCategory] = useState('');

  const amountInputRef = useRef<TextInput>(null);
  const noteInputRef = useRef<TextInput>(null);

  const handleDismiss = useCallback(() => {
    if (isQuickLaunch && Platform.OS === 'android') {
      try {
        BackHandler.exitApp();
      } catch { }
      return;
    }
    onClose();
  }, [isQuickLaunch, onClose]);

  // ── Countdown progress animation ───────────────────────────────────────────
  const progressAnim = useRef(new Animated.Value(1)).current;
  const autoCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressAnimRef = useRef<Animated.CompositeAnimation | null>(null);

  // Start / restart the 5-second countdown whenever the modal becomes visible
  useEffect(() => {
    if (visible) {
      // Reset state
      setStep(1);
      setAmount('');
      setNote('');
      setSavedCategory('');

      // Reset and start animated progress bar
      progressAnim.setValue(1);
      progressAnimRef.current = Animated.timing(progressAnim, {
        toValue: 0,
        duration: AUTO_CLOSE_MS,
        useNativeDriver: false,
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
      progressAnimRef.current?.stop();
      if (autoCloseTimer.current) clearTimeout(autoCloseTimer.current);
    };
  }, [visible, handleDismiss]);

  // Cancel auto-close when user starts interacting
  const cancelAutoClose = useCallback(() => {
    progressAnimRef.current?.stop();
    if (autoCloseTimer.current) {
      clearTimeout(autoCloseTimer.current);
      autoCloseTimer.current = null;
    }
    progressAnim.setValue(0);
  }, []);

  const handleNextToNotes = () => {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) return;
    cancelAutoClose();
    setStep(2);
    setTimeout(() => { noteInputRef.current?.focus(); }, 80);
  };

  const handleNextToCategories = () => {
    cancelAutoClose();
    setStep(3);
  };

  const handleSave = async (cat: string) => {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) return;

    cancelAutoClose();
    const now = new Date();
    setSavedCategory(cat);
    setStep(4);

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

    // Show Done message for 1 second (1000ms), then close
    setTimeout(() => {
      handleDismiss();
    }, 1000);
  };

  const handleModalShow = useCallback(() => {
    setTimeout(() => { amountInputRef.current?.focus(); }, 60);
  }, []);

  const handleGoToProfile = useCallback(() => {
    onClose();
    setTimeout(() => navigation.navigate('Profile'), 200);
  }, [navigation, onClose]);

  const theme = useStore(s => s.theme);
  const isLight = theme === 'light';
  const C = isLight
    ? { bg: '#FFFFFF', text: '#000000', sub: '#666666', inputBg: 'rgba(0,0,0,0.05)', border: '#E4E4E7', cancelBg: 'rgba(0,0,0,0.08)' }
    : { bg: '#18181B', text: '#FFFFFF', sub: '#A1A1AA', inputBg: 'rgba(255,255,255,0.08)', border: '#27272A', cancelBg: 'rgba(255,255,255,0.1)' };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleDismiss}
      statusBarTranslucent
      onShow={handleModalShow}
    >
      <View
        style={[
          styles.overlayFill,
          {
            backgroundColor: isQuickLaunch
              ? 'rgba(0,0,0,0.15)'
              : (isLight ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.35)'),
          }
        ]}
      >
        {Platform.OS === 'ios' && (
          <BlurView intensity={25} tint={isLight ? 'light' : 'dark'} style={StyleSheet.absoluteFill} />
        )}
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

            {/* ── Countdown progress bar (Only on Step 1) ── */}
            {step === 1 && (
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
            )}

            {/* ── Step 1: Amount ── */}
            {step === 1 && (
              <>
                <View style={styles.headerRow}>
                  <Text style={[styles.shakeLabel, { color: C.sub }]}>📳 Quick Add • 1/3</Text>
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

                <Text style={[styles.title, { color: C.text }]}>How much did you spend?</Text>

                <View style={[styles.inputWrap, { backgroundColor: C.inputBg }]}>
                  <Text style={[styles.currencyPrefix, { color: C.text }]}>{sym}</Text>
                  <TextInput
                    ref={amountInputRef}
                    style={[styles.amountInput, { color: C.text }]}
                    placeholder="0"
                    placeholderTextColor={C.sub}
                    keyboardType="decimal-pad"
                    value={amount}
                    onChangeText={(val) => {
                      setAmount(val);
                      if (val.length === 1) cancelAutoClose();
                    }}
                    selectionColor="#007AFF"
                    returnKeyType="next"
                    onSubmitEditing={handleNextToNotes}
                  />
                </View>

                <View style={styles.btnRow}>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: C.cancelBg }]}
                    onPress={handleDismiss}
                  >
                    <Text style={[styles.btnText, { color: C.text }]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.actionBtn,
                      styles.doneBtn,
                      { opacity: parseFloat(amount) > 0 ? 1 : 0.5 },
                    ]}
                    onPress={handleNextToNotes}
                    disabled={isNaN(parseFloat(amount)) || parseFloat(amount) <= 0}
                  >
                    <Text style={[styles.btnText, { color: '#FFF' }]}>Next →</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* ── Step 2: Notes / Payee ── */}
            {step === 2 && (
              <>
                <View style={styles.headerRow}>
                  <TouchableOpacity onPress={() => setStep(1)} style={styles.backBtnWrap}>
                    <ChevronLeft size={18} color="#007AFF" />
                    <Text style={styles.backBtnText}>Amount</Text>
                  </TouchableOpacity>
                  <Text style={[styles.shakeLabel, { color: C.sub }]}>Step 2/3</Text>
                </View>

                <Text style={[styles.title, { color: C.text }]}>What was this for?</Text>

                <View style={[styles.inputWrap, { backgroundColor: C.inputBg }]}>
                  <TextInput
                    ref={noteInputRef}
                    style={[styles.noteInput, { color: C.text }]}
                    placeholder="e.g. Lunch with team, Groceries, Uber..."
                    placeholderTextColor={C.sub}
                    value={note}
                    onChangeText={setNote}
                    selectionColor="#007AFF"
                    returnKeyType="next"
                    onSubmitEditing={handleNextToCategories}
                  />
                </View>

                <View style={styles.btnRow}>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: C.cancelBg }]}
                    onPress={handleNextToCategories}
                  >
                    <Text style={[styles.btnText, { color: C.text }]}>Skip</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.doneBtn]}
                    onPress={handleNextToCategories}
                  >
                    <Text style={[styles.btnText, { color: '#FFF' }]}>Choose Category →</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* ── Step 3: Category ── */}
            {step === 3 && (
              <>
                <View style={styles.headerRow}>
                  <TouchableOpacity onPress={() => setStep(2)} style={styles.backBtnWrap}>
                    <ChevronLeft size={18} color="#007AFF" />
                    <Text style={styles.backBtnText}>Notes</Text>
                  </TouchableOpacity>
                  <Text style={[styles.shakeLabel, { color: C.sub }]}>Step 3/3</Text>
                </View>

                <Text style={[styles.title, { color: C.text }]}>Choose a category</Text>

                <ScrollView
                  style={styles.catList}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  {storeCategories.map((item, idx) => {
                    const meta = categoryMeta?.[item];
                    const catColor = meta?.color || getCategoryColor(item as any);
                    return (
                      <TouchableOpacity
                        key={item}
                        style={[
                          styles.catRow,
                          { borderBottomColor: C.border },
                          idx === storeCategories.length - 1 && { borderBottomWidth: 0 },
                        ]}
                        onPress={() => handleSave(item)}
                        onLongPress={() => {
                          try { Vibration.vibrate(50); } catch (_) { }
                          reorderCategoryToFirst(item);
                        }}
                        delayLongPress={300}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.catIconWrap, { backgroundColor: catColor + '22' }]}>
                          {meta?.emoji ? (
                            <Text style={{ fontSize: 18 }}>{meta.emoji}</Text>
                          ) : (
                            getCategoryIcon(item as any, catColor, 18)
                          )}
                        </View>
                        <Text style={[styles.catName, { color: C.text }]}>{item}</Text>
                        <ArrowRight size={16} color={C.sub} />
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </>
            )}

            {/* ── Step 4: Done Screen (Top card shown for 1 sec) ── */}
            {step === 4 && (
              <View style={styles.doneContainer}>
                <View style={styles.doneIconCircle}>
                  <Check size={32} color="#FFFFFF" strokeWidth={3} />
                </View>
                <Text style={[styles.doneTitle, { color: C.text }]}>Transaction Saved!</Text>
                <Text style={styles.doneAmountText}>
                  {sym}{amount}
                </Text>
                <View style={[styles.doneMetaPill, { backgroundColor: C.inputBg, borderColor: C.border }]}>
                  <Text style={[styles.doneMetaText, { color: C.text }]}>
                    {savedCategory} {note ? `• "${note}"` : ''}
                  </Text>
                </View>
              </View>
            )}

          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlayFill: {
    flex: 1,
    backgroundColor: 'transparent',
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
    borderRadius: 28,
    padding: 22,
    paddingTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
    overflow: 'hidden',
  },

  // ── Countdown progress bar ──────────────────────────────────────────────────
  progressTrack: {
    height: 3,
    borderRadius: 2,
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
    marginBottom: 12,
  },
  shakeLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
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
  backBtnWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  backBtnText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },

  // ── Form Content ───────────────────────────────────────────────────────────
  title: {
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'left',
    marginBottom: 14,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 16,
    minHeight: 56,
  },
  currencyPrefix: {
    fontSize: 24,
    fontWeight: '700',
    marginRight: 6,
  },
  amountInput: {
    flex: 1,
    fontSize: 28,
    fontWeight: '700',
    paddingVertical: 12,
  },
  noteInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 14,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtn: {
    backgroundColor: '#007AFF',
  },
  btnText: {
    fontSize: 15,
    fontWeight: '700',
  },

  // ── Categories List ────────────────────────────────────────────────────────
  catList: {
    maxHeight: 280,
  },
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  catIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  catName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },

  // ── Done Screen ────────────────────────────────────────────────────────────
  doneContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  doneIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  doneTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  doneAmountText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#22C55E',
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  doneMetaPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  doneMetaText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
