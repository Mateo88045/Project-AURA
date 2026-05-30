import { useEffect, useState } from 'react';
import { supabase } from '@chronos/shared/supabase';
import type { User } from '@chronos/shared/types';
import type { Session } from '@supabase/supabase-js';
import {
  GUEST_USER_ID,
  loadGuestMode,
  exitGuestMode,
  subscribeGuestMode,
} from '../lib/guest';

interface AuthUser extends Pick<User, 'id' | 'email' | 'displayName'> {}

const GUEST_USER: AuthUser = {
  id: GUEST_USER_ID,
  email: '',
  displayName: 'Guest',
};

interface AuthResult {
  isAuthenticated: boolean;
  isGuest: boolean;
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

export function useAuth(): AuthResult {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isGuest, setIsGuest] = useState<boolean>(false);
  const [sessionLoaded, setSessionLoaded] = useState<boolean>(false);
  const [guestLoaded, setGuestLoaded] = useState<boolean>(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      if (initialSession?.user) {
        setUser({
          id: initialSession.user.id,
          email: initialSession.user.email ?? '',
          displayName: initialSession.user.user_metadata?.display_name ?? '',
        });
      }
      setSessionLoaded(true);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, updatedSession) => {
        setSession(updatedSession);
        if (updatedSession?.user) {
          setUser({
            id: updatedSession.user.id,
            email: updatedSession.user.email ?? '',
            displayName: updatedSession.user.user_metadata?.display_name ?? '',
          });
        } else {
          setUser(null);
        }
        setSessionLoaded(true);
      },
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Guest mode — load the persisted flag and stay in sync with live changes
  // (e.g. the welcome screen enabling it), so the auth guard reacts immediately.
  useEffect(() => {
    loadGuestMode().then((value) => {
      setIsGuest(value);
      setGuestLoaded(true);
    });
    return subscribeGuestMode(setIsGuest);
  }, []);

  async function signOut() {
    await exitGuestMode();
    await supabase.auth.signOut();
  }

  // A real Supabase session always wins over guest mode.
  const hasSession = session !== null;
  const resolvedUser = hasSession ? user : isGuest ? GUEST_USER : null;

  return {
    isAuthenticated: hasSession || isGuest,
    isGuest: isGuest && !hasSession,
    user: resolvedUser,
    session,
    loading: !sessionLoaded || !guestLoaded,
    signOut,
  };
}
