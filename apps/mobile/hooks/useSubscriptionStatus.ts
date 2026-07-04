import { useEffect, useState } from 'react';
import { GUEST_USER_ID } from '../lib/guest';
import { getSubscriptionStatus, type SubscriptionStatus } from '../services/subscriptionStatus';

interface SubscriptionStatusResult {
  status: SubscriptionStatus;
  loading: boolean;
  isFrozen: boolean;
}

/** Live UI read of entitlement state, for banners/badges. Guests are always 'active' (no billing). */
export function useSubscriptionStatus(userId: string | null): SubscriptionStatusResult {
  const [status, setStatus] = useState<SubscriptionStatus>('active');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!userId || userId === GUEST_USER_ID) {
      setStatus('active');
      setLoading(false);
      return;
    }

    let isMounted = true;
    getSubscriptionStatus(userId).then((s) => {
      if (isMounted) {
        setStatus(s);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [userId]);

  return { status, loading, isFrozen: status === 'frozen' };
}
