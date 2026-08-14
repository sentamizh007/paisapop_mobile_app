import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Modal, StyleSheet, TextInput, TouchableOpacity, ScrollView, Animated, Dimensions, Platform } from 'react-native';
import { Accelerometer } from 'expo-sensors';
import { useStore } from '../store/useStore';
import { useThemeColors } from '../theme/colors';
import { getCategoryIcon, getCategoryColor, Category } from '../utils/mockData';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ShakeDetectorProps {
  children: React.ReactNode;
}

const SHAKE_THRESHOLD = 1.7; // Adjust if needed

export const ShakeDetector: React.FC<ShakeDetectorProps> = ({ children }) => {
  const shakeToAdd = useStore(s => s.shakeToAdd);
  const [visible, setVisible] = useState(false);
  const C = useThemeColors();

  // Used for debounce
  const lastShakeTime = useRef<number>(0);

  useEffect(() => {
    let subscription: any;
    if (shakeToAdd && Platform.OS !== 'web') {
      Accelerometer.setUpdateInterval(400);
      subscription = Accelerometer.addListener((accelerometerData) => {
        const { x, y, z } = accelerometerData;
        const magnitude = Math.sqrt(x * x + y * y + z * z);
        if (magnitude > SHAKE_THRESHOLD) {
          const now = Date.now();
          if (now - lastShakeTime.current > 2000) { // 2 seconds debounce
            lastShakeTime.current = now;
            setVisible(true);
          }
        }
      });
    }

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, [shakeToAdd]);

  return (
    <View style={{ flex: 1 }}>
      {children}

      <QuickAddModal
        visible={visible}
        onClose={() => setVisible(false)}
      />
    </View>
  );
};

const QuickAddModal = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => {
  const storeCategories = useStore(s => s.categories);
  const categoryMeta = useStore(s => s.categoryMeta);
  const addTransaction = useStore(s => s.addTransaction);
  const currency = useStore(s => s.currency);
  const insets = useSafeAreaInsets();

  const sym = currency === 'USD' ? '$' : '₹';

  const [step, setStep] = useState<1 | 2>(1);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');

  // Reset state when opened
  useEffect(() => {
    if (visible) {
      setStep(1);
      setAmount('');
      setNote('');
      setShowAllCategories(false);
      setSelectedCategory('');
    }
  }, [visible]);

  const handleNext = () => {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) return;
    setStep(2);
  };

  const handleSave = async (selectedCategory: string) => {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) return;

    const now = new Date();
    await addTransaction({
      title: selectedCategory,
      amount: amt,
      category: selectedCategory as Category,
      date: now.toISOString().split('T')[0],
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'expense', // default for quick shortcut
      paymentMethod: 'Cash', // default for quick shortcut
      notes: note.trim() || undefined,
    });

    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        {/* Click outside to close */}
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
        
        {/* iOS Shortcut Style Glass Popup */}
        <View style={[styles.popup, { marginTop: insets.top + 16 }]}>
          
          {step === 1 ? (
            <>
              <Text style={styles.title}>How much did you spend?</Text>
              
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.amountInput}
                  placeholder="Amount"
                  placeholderTextColor="rgba(0,0,0,0.3)"
                  keyboardType="decimal-pad"
                  value={amount}
                  onChangeText={setAmount}
                  autoFocus
                  selectionColor="#007AFF"
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
                />
              </View>

              <View style={styles.btnRow}>
                <TouchableOpacity style={[styles.actionBtn, styles.cancelBtn]} onPress={onClose}>
                  <Text style={[styles.btnText, { color: '#000' }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.actionBtn, styles.doneBtn, { opacity: parseFloat(amount) > 0 ? 1 : 0.5 }]} 
                  onPress={handleNext}
                  disabled={isNaN(parseFloat(amount)) || parseFloat(amount) <= 0}
                >
                  <Text style={[styles.btnText, { color: '#FFF' }]}>Done</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <Text style={[styles.title, { marginBottom: 16 }]}>Choose a category</Text>
              
              <ScrollView style={styles.catList} showsVerticalScrollIndicator={false}>
                {storeCategories.map((item, idx) => {
                  const meta = categoryMeta?.[item];
                  return (
                    <TouchableOpacity
                      key={item}
                      style={[
                        styles.catRow,
                        idx === storeCategories.length - 1 && { borderBottomWidth: 0 }
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
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  popup: {
    width: '94%',
    maxWidth: 400,
    backgroundColor: 'rgba(250, 250, 250, 0.95)',
    borderRadius: 32,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
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
  cancelBtn: {
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  doneBtn: {
    backgroundColor: '#007AFF', // iOS Blue
  },
  btnText: {
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Category List
  catList: {
    maxHeight: 300,
  },
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  catEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  catName: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
  },
});
