import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { router } from 'expo-router';
import { getSupabaseOrNull } from '../lib/supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export type NotificationDeepLink =
  | { kind: 'today' }
  | { kind: 'review' }
  | { kind: 'task'; taskId: string }
  | { kind: 'briefing' };

export async function requestNotificationPermissions(): Promise<boolean> {
  const settings = await Notifications.getPermissionsAsync();
  if (settings.granted) return true;
  const req = await Notifications.requestPermissionsAsync();
  return req.granted;
}

export async function registerPushToken(): Promise<string | null> {
  if (!Device.isDevice) return null;
  const granted = await requestNotificationPermissions();
  if (!granted) return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Aura',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#A8DADC',
    });
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;
  if (!projectId) {
    console.warn('[notifications] EAS projectId missing — push token unavailable');
    return null;
  }
  try {
    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    void savePushTokenToUser(token.data);
    return token.data;
  } catch (err) {
    console.warn('[notifications] failed to get push token', err);
    return null;
  }
}

async function savePushTokenToUser(pushToken: string): Promise<void> {
  const supabase = getSupabaseOrNull();
  if (!supabase) return;
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user?.id;
  if (!userId) return;
  await supabase
    .from('users')
    .update({ expo_push_token: pushToken, notifications_enabled: true })
    .eq('id', userId);
}

function parseDeepLink(raw: unknown): NotificationDeepLink | null {
  if (!raw || typeof raw !== 'object') return null;
  const data = raw as Record<string, unknown>;
  const kind = data.kind;
  if (kind === 'today') return { kind: 'today' };
  if (kind === 'review') return { kind: 'review' };
  if (kind === 'briefing') return { kind: 'briefing' };
  if (kind === 'task' && typeof data.taskId === 'string') {
    return { kind: 'task', taskId: data.taskId };
  }
  return null;
}

export function routeNotification(link: NotificationDeepLink): void {
  switch (link.kind) {
    case 'today':
      router.push('/(tabs)');
      return;
    case 'review':
      router.push('/schedule/review');
      return;
    case 'briefing':
      router.push('/briefing');
      return;
    case 'task':
      router.push(`/tasks/${link.taskId}`);
      return;
  }
}

export function subscribeToNotifications() {
  const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
    const link = parseDeepLink(response.notification.request.content.data);
    if (link) routeNotification(link);
  });
  return () => {
    responseSub.remove();
  };
}

export async function scheduleLocalReminder(
  title: string,
  body: string,
  triggerDate: Date,
  data?: NotificationDeepLink,
): Promise<string> {
  return Notifications.scheduleNotificationAsync({
    content: { title, body, data: data ?? {} },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
    },
  });
}

export async function cancelReminder(id: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(id);
}
