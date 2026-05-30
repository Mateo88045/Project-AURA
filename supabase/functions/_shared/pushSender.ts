// Expo Push Notification sender — Deno-compatible.
// Pure `fetch` + JSON; no npm/Node-specific APIs.

export type ExpoPushToken = `ExponentPushToken[${string}]`;

export interface PushPayload {
  to: ExpoPushToken | ExpoPushToken[];
  title: string;
  body: string;
  data?: Record<string, unknown>;
  badge?: number;
  sound?: 'default' | null;
  channelId?: string;
  ttl?: number;
  expiration?: number;
  priority?: 'default' | 'normal' | 'high';
}

export interface PushTicket {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: {
    error?: 'DeviceNotRegistered' | 'InvalidCredentials' | 'MessageTooBig' | 'MessageRateExceeded';
  };
}

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const EXPO_RECEIPTS_URL = 'https://exp.host/--/api/v2/push/getReceipts';

/**
 * Sends a single or batch push notification via the Expo Push API.
 * Chunks at 100 messages per request (the Expo API max).
 */
export async function sendPushNotification(payload: PushPayload): Promise<PushTicket[]> {
  const tokens = Array.isArray(payload.to) ? payload.to : [payload.to];
  const CHUNK_SIZE = 100;
  const allTickets: PushTicket[] = [];

  for (let i = 0; i < tokens.length; i += CHUNK_SIZE) {
    const chunk = tokens.slice(i, i + CHUNK_SIZE);
    const messages = chunk.map((token) => ({
      to: token,
      title: payload.title,
      body: payload.body,
      data: payload.data ?? {},
      badge: payload.badge,
      sound: payload.sound ?? 'default',
      channelId: payload.channelId ?? 'aura-default',
      ttl: payload.ttl,
      expiration: payload.expiration,
      priority: payload.priority ?? 'high',
    }));

    const response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(messages),
    });

    if (!response.ok) {
      throw new Error(`Expo Push API error: ${response.status} ${response.statusText}`);
    }

    const json = (await response.json()) as { data: PushTicket[] };
    allTickets.push(...json.data);
  }

  return allTickets;
}

export async function checkPushReceipts(
  receiptIds: string[],
): Promise<Record<string, { status: 'ok' | 'error'; message?: string; details?: unknown }>> {
  const response = await fetch(EXPO_RECEIPTS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ ids: receiptIds }),
  });
  if (!response.ok) throw new Error(`Expo Receipts API error: ${response.status}`);
  const json = (await response.json()) as {
    data: Record<string, { status: 'ok' | 'error'; message?: string; details?: unknown }>;
  };
  return json.data;
}

// ── Pre-built notification templates ────────────────────────────────────────

export async function notifyScheduleReady(
  pushToken: ExpoPushToken,
  pendingTaskCount: number,
): Promise<PushTicket[]> {
  return sendPushNotification({
    to: pushToken,
    title: 'Your schedule is ready',
    body: `Aura has planned ${pendingTaskCount} task${pendingTaskCount !== 1 ? 's' : ''} for tomorrow. Tap to review.`,
    data: { type: 'daily_schedule_ready' },
    badge: 1,
    priority: 'high',
  });
}

export async function notifyTaskStartingSoon(
  pushToken: ExpoPushToken,
  taskTitle: string,
  taskId: string,
): Promise<PushTicket[]> {
  return sendPushNotification({
    to: pushToken,
    title: 'Starting in 5 minutes',
    body: taskTitle,
    data: { type: 'task_reminder', taskId },
    badge: 0,
    priority: 'high',
  });
}

export async function notifySundayBriefing(
  pushToken: ExpoPushToken,
  taskCount: number,
): Promise<PushTicket[]> {
  return sendPushNotification({
    to: pushToken,
    title: "This week's outlook",
    body: `${taskCount} assignment${taskCount !== 1 ? 's' : ''} on deck. Open Aura to see the plan.`,
    data: { type: 'sunday_briefing' },
    badge: 1,
    priority: 'normal',
  });
}

export async function notifySyncComplete(
  pushToken: ExpoPushToken,
  newTaskCount: number,
): Promise<PushTicket[]> {
  if (newTaskCount === 0) return [];
  return sendPushNotification({
    to: pushToken,
    title: 'New assignments synced',
    body: `${newTaskCount} new task${newTaskCount !== 1 ? 's' : ''} added to your queue.`,
    data: { type: 'sync_complete' },
    badge: newTaskCount,
    priority: 'normal',
  });
}
