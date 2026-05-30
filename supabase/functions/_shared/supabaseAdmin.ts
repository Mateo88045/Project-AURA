// Service-role Supabase client for Edge Functions.
// Bypasses RLS — only use from inside trusted serverless code.
// Deno reads env via Deno.env.get() — these vars are set via:
//   supabase secrets set SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=...
// or the supabase/.env.functions file.

import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

// Inline minimal Database type — Edge Functions can't easily reach the monorepo's
// packages/shared. Update both when the schema changes. (The mobile app reads
// the canonical types from packages/shared/supabase/types.ts.)
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          display_name: string;
          grade_level: number;
          onboarding_answers: Record<string, unknown>;
          daily_trigger_time: string;
          timezone: string;
          push_token: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['users']['Row']> & { id: string; email: string };
        Update: Partial<Database['public']['Tables']['users']['Row']>;
        Relationships: [];
      };
      connections: {
        Row: {
          id: string;
          user_id: string;
          platform: 'google_classroom' | 'canvas';
          oauth_token: string;
          refresh_token: string;
          canvas_api_token: string | null;
          canvas_base_url: string | null;
          status: 'active' | 'expired' | 'error';
          last_synced_at: string | null;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['connections']['Row']>;
        Update: Partial<Database['public']['Tables']['connections']['Row']>;
        Relationships: [];
      };
      tasks: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          subject: string;
          source: 'google_classroom' | 'canvas' | 'manual' | 'photo';
          external_id: string | null;
          due_date: string;
          difficulty: 1 | 2 | 3 | 4 | 5;
          estimated_minutes: number;
          task_type: 'essay' | 'problem_set' | 'reading' | 'project' | 'study_guide' | 'quiz_prep' | 'other';
          status: 'pending' | 'scheduled' | 'in_progress' | 'completed';
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['tasks']['Row']> &
          Pick<
            Database['public']['Tables']['tasks']['Row'],
            'user_id' | 'title' | 'source' | 'due_date' | 'difficulty' | 'estimated_minutes'
          >;
        Update: Partial<Database['public']['Tables']['tasks']['Row']>;
        Relationships: [];
      };
      scheduled_blocks: {
        Row: {
          id: string;
          user_id: string;
          task_id: string | null;
          start_time: string;
          end_time: string;
          status: 'shadow' | 'approved' | 'completed';
          day: string;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['scheduled_blocks']['Row']> &
          Pick<
            Database['public']['Tables']['scheduled_blocks']['Row'],
            'user_id' | 'start_time' | 'end_time' | 'day'
          >;
        Update: Partial<Database['public']['Tables']['scheduled_blocks']['Row']>;
        Relationships: [];
      };
      task_completions: {
        Row: {
          id: string;
          task_id: string;
          user_id: string;
          estimated_minutes: number;
          actual_minutes: number;
          completed_at: string;
          user_feedback: 'too_long' | 'about_right' | 'too_short';
        };
        Insert: Partial<Database['public']['Tables']['task_completions']['Row']>;
        Update: Partial<Database['public']['Tables']['task_completions']['Row']>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      users_due_for_daily_trigger: {
        Args: { now_utc: string };
        Returns: { id: string }[];
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
}

let cached: SupabaseClient<Database> | null = null;

export function getSupabaseAdmin(): SupabaseClient<Database> {
  if (cached) return cached;

  const url = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!url) throw new Error('SUPABASE_URL env var is not set');
  if (!serviceKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY env var is not set');

  cached = createClient<Database>(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    db: { schema: 'public' },
  });

  return cached;
}

/**
 * Validates the cron secret in the Authorization header.
 * pg_cron sets `Authorization: Bearer <CRON_SECRET>` when calling Edge Functions.
 * Returns true if valid, false if not. Use as the first check in every cron-triggered function.
 */
export function validateCronAuth(req: Request): boolean {
  const header = req.headers.get('authorization') ?? '';
  const token = header.replace(/^Bearer\s+/i, '');
  const expected = Deno.env.get('CRON_SECRET');
  if (!expected) {
    console.error('CRON_SECRET env var not set — refusing all cron invocations');
    return false;
  }
  return token === expected;
}
