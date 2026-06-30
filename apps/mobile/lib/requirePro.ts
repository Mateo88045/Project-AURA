// Gate helper.
//
// Wrap any interactive action that should be blocked behind the paywall:
//
//   const requirePro = useRequirePro();
//   onPress={() => requirePro('approve_block', () => setBlockStatus(id, 'approved'))}
//
// Behavior:
//   - access === 'full' or 'preview' → run the action immediately.
//   - access === 'gate' or 'readonly' → route to /paywall with the reason as
//     a query param. The action is *not* queued — the user must re-tap after
//     converting. This matches the soft-paywall intent (don't sneak a write
//     through a half-converted state).

import { useCallback } from 'react';
import { useRouter, type Href } from 'expo-router';
import { useEntitlement } from './entitlement';

// String literal union keeps reasons greppable. Add new ones here when you
// wrap a new affordance.
export type PaywallReason =
  | 'approve_block'
  | 'reject_block'
  | 'undo_block'
  | 'bulk_approve'
  | 'add_task'
  | 'sync_now'
  | 'open_copilot';

export function useRequirePro(): (reason: PaywallReason, action: () => void) => void {
  const router = useRouter();
  const { access } = useEntitlement();

  return useCallback(
    (reason: PaywallReason, action: () => void) => {
      if (access === 'full' || access === 'preview') {
        action();
        return;
      }
      router.push(
        ('/paywall?reason=' + encodeURIComponent(reason) + '&mode=' + access) as Href,
      );
    },
    [access, router],
  );
}
