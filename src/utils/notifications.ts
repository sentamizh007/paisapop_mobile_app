import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

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
 * Sends a local notification.
 * On Web, falls back to the native browser `alert()` or ignores it based on use-case.
 */
export async function sendLocalNotification(title: string, body: string) {
  if (Platform.OS === 'web') {
    // Basic web fallback alert, using setTimeout so it doesn't block UI immediately
    setTimeout(() => {
      window.alert(`${title}\n\n${body}`);
    }, 100);
    return;
  }
  
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: true,
    },
    trigger: null, // trigger immediately
  });
}
