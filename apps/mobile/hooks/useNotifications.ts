import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type AuraNotificationType =
  | 'sync_complete'
  | 'task_reminder'
  | 'schedule_ready'
  | 'streak_milestone';

export interface AuraNotification {
  id: string;
  type: AuraNotificationType;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

// TODO: Supabase — store in a notifications table per user_id for cross-device sync
const STORAGE_KEY = 'aura:notifications';

function loadFromStorage(userId: string): Promise<AuraNotification[]> {
  return AsyncStorage.getItem(`${STORAGE_KEY}:${userId}`)
    .then((raw) => (raw ? (JSON.parse(raw) as AuraNotification[]) : []))
    .catch(() => []);
}

function saveToStorage(userId: string, items: AuraNotification[]): Promise<void> {
  return AsyncStorage.setItem(`${STORAGE_KEY}:${userId}`, JSON.stringify(items)).catch(() => {});
}

interface NotificationsResult {
  notifications: AuraNotification[];
  unreadCount: number;
  loading: boolean;
  addNotification: (n: Omit<AuraNotification, 'id' | 'read' | 'createdAt'>) => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
}

export function useNotifications(userId: string): NotificationsResult {
  const [notifications, setNotifications] = useState<AuraNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    loadFromStorage(userId).then((items) => {
      setNotifications(items);
      setLoading(false);
    });
  }, [userId]);

  const addNotification = useCallback(
    async (n: Omit<AuraNotification, 'id' | 'read' | 'createdAt'>) => {
      const newItem: AuraNotification = {
        ...n,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        read: false,
        createdAt: new Date().toISOString(),
      };
      setNotifications((prev) => {
        const updated = [newItem, ...prev].slice(0, 50);
        void saveToStorage(userId, updated);
        return updated;
      });
    },
    [userId],
  );

  const markRead = useCallback(
    async (id: string) => {
      setNotifications((prev) => {
        const updated = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
        void saveToStorage(userId, updated);
        return updated;
      });
    },
    [userId],
  );

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }));
      void saveToStorage(userId, updated);
      return updated;
    });
  }, [userId]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return { notifications, unreadCount, loading, addNotification, markRead, markAllRead };
}
