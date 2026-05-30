import * as Notifications from 'expo-notifications';

const DAILY_BRIEFING_ID = 'aura-daily-briefing';
const TASK_REMINDER_PREFIX = 'aura-task-reminder-';

export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/**
 * Schedules a repeating daily briefing notification at the given HH:MM time.
 * Cancels any previous daily briefing before scheduling the new one.
 */
export async function scheduleDailyBriefing(timeHHMM: string): Promise<void> {
  const [hStr, mStr = '00'] = timeHHMM.split(':');
  const hour = parseInt(hStr, 10);
  const minute = parseInt(mStr, 10);

  // Cancel previous so we don't stack duplicates
  await cancelDailyBriefing();

  await Notifications.scheduleNotificationAsync({
    identifier: DAILY_BRIEFING_ID,
    content: {
      title: 'Aura briefing ready',
      body: 'Your schedule for today is set. Tap to review.',
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

/**
 * Schedules a reminder for a task block.
 * Fires `minutesBefore` minutes before `blockStartISO`.
 * If the computed fire time is in the past, skips silently.
 */
export async function scheduleTaskReminder(
  taskId: string,
  title: string,
  blockStartISO: string,
  minutesBefore: number,
): Promise<void> {
  const fireDate = new Date(new Date(blockStartISO).getTime() - minutesBefore * 60_000);
  if (fireDate <= new Date()) return;

  await Notifications.scheduleNotificationAsync({
    identifier: `${TASK_REMINDER_PREFIX}${taskId}`,
    content: {
      title: `Starting in ${minutesBefore} min`,
      body: title,
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: fireDate,
    },
  });
}

export async function cancelTaskReminder(taskId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(`${TASK_REMINDER_PREFIX}${taskId}`);
}

export async function cancelDailyBriefing(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(DAILY_BRIEFING_ID);
}
