import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isGuestId } from '../lib/guest';
import { toLocalDayIso } from '../lib/dates';

// TODO: Supabase — derive from task_completions WHERE completed_at grouped by date
// Rolling logic: if last completion was today or yesterday → streak continues, else resets.

const MILESTONES = [3, 7, 14, 30];

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string | null; // YYYY-MM-DD
  milestoneReached: boolean;
}

interface StoredStreak {
  current: number;
  longest: number;
  lastDate: string | null;
}

// Local-calendar keys — a "day" is the user's local day, not the UTC day.
// `toISOString().slice(0,10)` is UTC: an evening study session in the US maps to
// the next UTC date, so two different local days can collide on one UTC key and
// silently break the streak.
function todayISO(): string {
  return toLocalDayIso(new Date());
}

function yesterdayISO(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return toLocalDayIso(d);
}

function storageKey(userId: string) {
  return `aura:streak:${userId}`;
}

async function loadStreak(userId: string): Promise<StoredStreak> {
  try {
    const raw = await AsyncStorage.getItem(storageKey(userId));
    if (!raw) return { current: 0, longest: 0, lastDate: null };
    return JSON.parse(raw) as StoredStreak;
  } catch {
    return { current: 0, longest: 0, lastDate: null };
  }
}

async function saveStreak(userId: string, data: StoredStreak): Promise<void> {
  try {
    await AsyncStorage.setItem(storageKey(userId), JSON.stringify(data));
  } catch {}
}

interface StreakResult {
  streak: StreakData;
  loading: boolean;
  incrementStreak: () => Promise<StreakData>;
}

export function useStreak(userId: string): StreakResult {
  const [stored, setStored] = useState<StoredStreak>({ current: 0, longest: 0, lastDate: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId || isGuestId(userId)) { setLoading(false); return; }
    loadStreak(userId).then((s) => {
      setStored(s);
      setLoading(false);
    });
  }, [userId]);

  const incrementStreak = useCallback(async (): Promise<StreakData> => {
    const today = todayISO();
    const yesterday = yesterdayISO();

    // Guests have no persisted profile — keep their streak session-only rather
    // than writing a guest-keyed entry that exitGuestMode never clears.
    const guest = isGuestId(userId);
    const current = guest ? stored : await loadStreak(userId);
    let newCurrent: number;

    if (current.lastDate === today) {
      // Already completed today — no increment
      newCurrent = current.current;
    } else if (current.lastDate === yesterday || current.lastDate === null) {
      // Consecutive day (or first ever)
      newCurrent = current.current + 1;
    } else {
      // Streak broken — reset to 1
      newCurrent = 1;
    }

    const newLongest = Math.max(current.longest, newCurrent);
    const updated: StoredStreak = { current: newCurrent, longest: newLongest, lastDate: today };
    if (!guest) await saveStreak(userId, updated);
    setStored(updated);

    const milestoneReached = MILESTONES.includes(newCurrent);
    return {
      currentStreak: newCurrent,
      longestStreak: newLongest,
      lastCompletedDate: today,
      milestoneReached,
    };
  }, [userId, stored]);

  const streak: StreakData = {
    currentStreak: stored.current,
    longestStreak: stored.longest,
    lastCompletedDate: stored.lastDate,
    milestoneReached: MILESTONES.includes(stored.current),
  };

  return { streak, loading, incrementStreak };
}
