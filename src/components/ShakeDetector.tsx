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
} from 'react-native';
import { Accelerometer } from 'expo-sensors';
import { BlurView } from 'expo-blur';
import { useStore } from '../store/useStore';
import { Category } from '../utils/mockData';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { TabParamList } from '../navigation/TabNavigator';
import { User } from 'lucide-react-native';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

/**
 * After subtracting gravity (high-pass filter), a real shake produces
 * a net linear-acceleration magnitude well above 0.8 g. Normal movement
 * (picking up phone, walking) rarely exceeds 0.6 g in the filtered signal.
 */
const SHAKE_THRESHOLD = 0.8;

/** Minimum ms between two consecutive shake triggers. */
const SHAKE_COOLDOWN_MS = 2500;

/** Low-pass filter coefficient for the gravity estimate (0..1). */
const GRAVITY_ALPHA = 0.8;

/** Sensor polling interval in ms. */
const SENSOR_INTERVAL_MS = 100;

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

  const lastShakeTime = useRef<number>(0);
  const isShaking    = useRef<boolean>(false);
  const gravityX     = useRef<number>(0);
  const gravityY     = useRef<number>(0);
  const gravityZ     = useRef<number>(0);
  const mountedRef   = useRef<boolean>(true);

  // Reset debounce when modal is closed so rapid re-shake works.
  const handleClose = useCallback(() => {
    setVisible(false);
    lastShakeTime.current = 0;
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!shakeToAdd || Platform.OS === 'web') return;

    Accelerometer.setUpdateInterval(SENSOR_INTERVAL_MS);

    const subscription = Accelerometer.addListener(({ x, y, z }) => {
      // High-pass filter: subtract gravity to get linear acceleration
      gravityX.current = GRAVITY_ALPHA * gravityX.current + (1 - GRAVITY_ALPHA) * x;
      gravityY.current = GRAVITY_ALPHA * gravityY.current + (1 - GRAVITY_ALPHA) * y;
      gravityZ.current = GRAVITY_ALPHA * gravityZ.current + (1 - GRAVITY_ALPHA) * z;

      const linX = x - gravityX.current;
      const linY = y - gravityY.current;
      const linZ = z - gravityZ.current;

      const magnitude = Math.sqrt(linX * linX + linY * linY + linZ * linZ);

      if (magnitude > SHAKE_THRESHOLD) {
        if (!isShaking.current) {
          // Only trigger ONCE per shake gesture (rising edge only)
          isShaking.current = true;
          const now = Date.now();
          if (now - lastShakeTime.current > SHAKE_COOLDOWN_MS) {
            lastShakeTime.current = now;
            if (mountedRef.current) setVisible(true);
          }
        }
      } else {
        isShaking.current = false;
      }
    });

    return () => { subscription.remove(); };
  }, [shakeToAdd]);

  return (
    <View style={{ flex: 1 }}>
      {children}
      <QuickAddModal visible={visible} onClose={handleClose} />
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// QuickAddModal
// ─────────────────────────────────────────────────────────────────────────────

interface QuickAddModalProps {
  visible: boolean;
  onClose: () => void;
}

const QuickAddModal: React.FC<QuickAddModalProps> = ({ visible, onClose }) => {
  const storeCategories = useStore((s) => s.categories);
  const categoryMeta    = useStore((s) => s.categoryMeta);
  const addTransaction  = useStore((s) => s.addTransaction);
  const currency        = useStore((s) => s.currency);
  const userName        = useStore((s) => s.userName);
  const insets          = useSafeAreaInsets();

  // Navigation — to jump to Profile from the shake modal
  const navigation = useNavigation<BottomTabNavigationProp<TabParamList>>();

  const sym = currency === 'USD' ? '$' : '₹';

  const [step, setStep]   = useState<1 | 2>(1);
  const [amount, setAmount] = useState('');
  const [note, setNote]   = useState('');

  const amountInputRef = useRef<TextInput>(null);

  // ── Countdown progress animation ───────────────────────────────────────────
  // progressAnim goes from 1 → 0 over AUTO_CLOSE_MS
  const progressAnim    = useRef(new Animated.Value(1)).current;
  const autoCloseTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
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
        onClose();
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
  }, [visible]);

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
      title:         cat,
      amount:        amt,
      category:      cat as Category,
      date:          now.toISOString().split('T')[0],
      time:          now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type:          'expense',
      paymentMethod: 'Cash',
      notes:         note.trim() || undefined,
    });

    onClose();
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

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      onShow={handleModalShow}
    >
      <BlurView intensity={50} tint="dark" style={styles.overlayFill}>
        {/* Tap outside to dismiss */}
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          activeOpacity={1}
        />

        <KeyboardAvoidingView
          style={styles.kavContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
          pointerEvents="box-none"
        >
          <View style={[styles.popup, { marginTop: insets.top + 16 }]}>

            {/* ── Countdown progress bar (top of card) ── */}
            <View style={styles.progressTrack}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    width: progressAnim.interpolate({
                      inputRange:  [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
            </View>

            {/* ── Header row: title + Profile button ── */}
            <View style={styles.headerRow}>
              <Text style={styles.shakeLabel}>📳 Quick Add</Text>
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
                <Text style={styles.title}>How much did you spend?</Text>

                <View style={styles.inputWrap}>
                  <TextInput
                    ref={amountInputRef}
                    style={styles.amountInput}
                    placeholder="Amount"
                    placeholderTextColor="rgba(0,0,0,0.3)"
                    keyboardType="decimal-pad"
                    value={amount}
                    onChangeText={(val) => {
                      setAmount(val);
                      if (val.length === 1) cancelAutoClose(); // first keystroke cancels timer
                    }}
                    selectionColor="#007AFF"
                    returnKeyType="next"
                    onSubmitEditing={handleNext}
                  />
                </View>

                <View style={[styles.inputWrap, { marginTop: 12 }]}>
                  <TextInput
                    style={styles.noteInput}
                    placeholder="Notes (optional)"
                    placeholderTextColor="rgba(0,0,0,0.3)"
                    value={note}
                    onChangeText={setNote}
                    selectionColor="#007AFF"
                    returnKeyType="done"
                    onSubmitEditing={handleNext}
                  />
                </View>

                <View style={styles.btnRow}>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.cancelBtn]}
                    onPress={onClose}
                  >
                    <Text style={[styles.btnText, { color: '#000' }]}>Cancel</Text>
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
                  <Text style={styles.title}>Choose a category</Text>
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
                          idx === storeCategories.length - 1 && { borderBottomWidth: 0 },
                        ]}
                        onPress={() => handleSave(item)}
                      >
                        <Text style={styles.catEmoji}>
                          {meta?.emoji ? meta.emoji : '🏷️'}
                        </Text>
                        <Text style={styles.catName}>{item}</Text>
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
  doneBtn:   { backgroundColor: '#007AFF' },
  btnText:   { fontSize: 16, fontWeight: '600' },

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
  catName:  { fontSize: 16, color: '#000', fontWeight: '500' },
});