import { getSupabaseOrNull } from '../lib/supabase';
import { IS_DEMO_MODE } from '../lib/env';

export interface FixedEventInput {
  title: string;
  startTime: string; // HH:MM (24-hour)
  endTime: string;   // HH:MM
  daysOfWeek: number[]; // 0=Sun .. 6=Sat
}

function devLog(label: string, payload: unknown) {
  if (__DEV__ || IS_DEMO_MODE) {
    // eslint-disable-next-line no-console
    console.log(`[fixedEvents] ${label}`, payload);
  }
}

/**
 * Validates start < end and that at least one day-of-week is selected.
 * Returns a human-readable error string, or null if the input is valid.
 */
export function validateFixedEvent(input: FixedEventInput): string | null {
  if (input.title.trim().length === 0) return 'Give this event a name.';
  if (input.daysOfWeek.length === 0) return 'Pick at least one day.';
  const startMins = toMins(input.startTime);
  const endMins = toMins(input.endTime);
  if (startMins == null || endMins == null) return 'Times must look like 15:30.';
  if (endMins <= startMins) return 'End time must be after start time.';
  return null;
}

function toMins(hhmm: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const mm = Number(m[2]);
  if (h < 0 || h > 23 || mm < 0 || mm > 59) return null;
  return h * 60 + mm;
}

export async function createFixedEvent(
  userId: string,
  input: FixedEventInput,
): Promise<void> {
  const supabase = getSupabaseOrNull();
  if (!supabase) {
    devLog('create (demo)', { userId, input });
    return;
  }
  const { error } = await supabase.from('fixed_events').insert({
    user_id: userId,
    title: input.title.trim(),
    start_time: `${input.startTime}:00`,
    end_time: `${input.endTime}:00`,
    days_of_week: input.daysOfWeek,
  });
  if (error) throw new Error(error.message);
}

export async function updateFixedEvent(
  id: string,
  input: FixedEventInput,
): Promise<void> {
  const supabase = getSupabaseOrNull();
  if (!supabase) {
    devLog('update (demo)', { id, input });
    return;
  }
  const { error } = await supabase
    .from('fixed_events')
    .update({
      title: input.title.trim(),
      start_time: `${input.startTime}:00`,
      end_time: `${input.endTime}:00`,
      days_of_week: input.daysOfWeek,
    })
    .eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteFixedEvent(id: string): Promise<void> {
  const supabase = getSupabaseOrNull();
  if (!supabase) {
    devLog('delete (demo)', { id });
    return;
  }
  const { error } = await supabase.from('fixed_events').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
