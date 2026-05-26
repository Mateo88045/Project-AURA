import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { getSupabaseOrNull } from '../lib/supabase';
import { IS_DEMO_MODE } from '../lib/env';

interface AuthState {
  session: Session | null;
  userId: string | null;
  loading: boolean;
}

const DEMO_SESSION_USER_ID = 'demo-user';

/**
 * Single source of truth for the signed-in user. Subscribes to auth state
 * changes so sign-in / sign-out propagates across the app instantly. In
 * demo mode (no Supabase configured) it returns a fake session immediately
 * so the rest of the app keeps rendering against mock data.
 */
export function useAuth(): AuthState {
  const supabase = getSupabaseOrNull();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(!IS_DEMO_MODE);

  useEffect(() => {
    if (!supabase) {
      setSession(null);
      setLoading(false);
      return;
    }
    let mounted = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session ?? null);
      setLoading(false);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: string, next: Session | null) => {
      setSession(next);
    });
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  return {
    session,
    userId: session?.user?.id ?? (IS_DEMO_MODE ? DEMO_SESSION_USER_ID : null),
    loading,
  };
}
