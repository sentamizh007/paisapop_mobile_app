import * as Notifications from 'expo-notifications';
import { Platform, Vibration } from 'react-native';
import { useStore } from '../store/useStore';

// Configure notification behavior when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Setup Android notification channel with default chime & vibration
if (Platform.OS === 'android') {
  Notifications.setNotificationChannelAsync('default', {
    name: 'Default Notifications',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    sound: 'default',
    enableVibrate: true,
    enableLights: true,
    lightColor: '#22C55E',
  }).catch(() => {});
}

/**
 * Plays an audible notification chime sound and haptic vibration
 */
export function playNotificationSound() {
  try {
    // 1. Play haptic vibration on native devices
    if (Platform.OS !== 'web') {
      Vibration.vibrate([0, 120, 60, 120]);
    }

    // 2. Play synthesized chime in Web / Browser environments
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        const ctx = new AudioContextClass();
        const now = ctx.currentTime;

        // Tone 1: E5 (659.25 Hz)
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(659.25, now);
        gain1.gain.setValueAtTime(0.3, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.35);

        // Tone 2: A5 (880 Hz) - delayed slightly for melodious chime
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(880, now + 0.12);
        gain2.gain.setValueAtTime(0.35, now + 0.12);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now + 0.12);
        osc2.stop(now + 0.55);
      }
    }
  } catch (err) {
    console.log('Notification sound error:', err);
  }
}

/**
 * Requests permissions for push notifications
 */
export async function requestNotificationPermissions() {
  if (Platform.OS === 'web') return false;
  
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  return finalStatus === 'granted';
}

/**
 * Sends a local notification with sound, vibration, and in-app recording.
 */
export async function sendLocalNotification(
  title: string,
  body: string,
  type: 'budget' | 'system' | 'reminder' | 'tip' = 'system'
) {
  // 1. Play audible notification sound / chime
  playNotificationSound();

  // 2. Record in in-app store so it displays in bell notification panel
  try {
    useStore.getState().addAppNotification({ title, body, type });
  } catch (e) {
    console.error('Failed to record app notification:', e);
  }

  if (Platform.OS === 'web') {
    return;
  }
  
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: 'default',
      },
      trigger: null, // trigger immediately
    });
  } catch (err) {
    console.error('Notification schedule error:', err);
  }
}


