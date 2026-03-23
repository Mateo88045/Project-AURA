import { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@aura/shared/constants/colors';
import { Layout } from '@aura/shared/constants/layout';
import { useShadowSchedule } from '../../hooks/useShadowSchedule';
import { AuraButton } from '../../components/ui/AuraButton';
import { AuraSkeleton } from '../../components/ui/AuraSkeleton';
import { TaskCard } from '../../components/ui/TaskCard';
import { requestShadowSchedule } from '../../services/jobs';

const MOCK_USER_ID = 'user-1';

export default function ShadowScheduleReviewScreen() {
  const router = useRouter();

  const today = useMemo(() => new Date(), []);
  const dayIso = today.toISOString().slice(0, 10);

  const { shadowBlocks, loading, error } = useShadowSchedule(
    MOCK_USER_ID,
    dayIso,
  );

  const [approvedBlockIds, setApprovedBlockIds] = useState<Set<string>>(
    new Set(),
  );
  const [declinedBlockIds, setDeclinedBlockIds] = useState<Set<string>>(
    new Set(),
  );
  const [adjustBusy, setAdjustBusy] = useState(false);
  const [adjustMessage, setAdjustMessage] = useState<string | null>(null);

  const hasShadowBlocks = shadowBlocks.length > 0;

  function handleApproveBlock(blockId: string) {
    // TODO: Trigger.dev — approve single shadow block and promote to 'approved'
    console.log('[STUB] Approve shadow block', blockId);
    setApprovedBlockIds((prev) => new Set(prev).add(blockId));
    setDeclinedBlockIds((prev) => {
      const next = new Set(prev);
      next.delete(blockId);
      return next;
    });
  }

  function handleDeclineBlock(blockId: string) {
    // TODO: Trigger.dev — decline single shadow block from shadow plan
    console.log('[STUB] Decline shadow block', blockId);
    setDeclinedBlockIds((prev) => new Set(prev).add(blockId));
    setApprovedBlockIds((prev) => {
      const next = new Set(prev);
      next.delete(blockId);
      return next;
    });
  }

  function handleApproveAll() {
    // TODO: Trigger.dev — bulk-approve all shadow blocks for the day
    console.log('[STUB] Approve all shadow blocks for day', dayIso);
    setApprovedBlockIds(new Set(shadowBlocks.map((block) => block.id)));
    setDeclinedBlockIds(new Set());
  }

  function handleAskAdjust() {
    setAdjustMessage(null);
    setAdjustBusy(true);
    void requestShadowSchedule(MOCK_USER_ID, dayIso)
      .then((r) => {
        setAdjustMessage(`Replan queued (run ${r.runId})`);
      })
      .catch((e: unknown) => {
        setAdjustMessage(
          e instanceof Error ? e.message : 'Could not request replan',
        );
      })
      .finally(() => setAdjustBusy(false));
  }

  return (
    <View className="flex-1" style={{ backgroundColor: Colors.bgDark }}>
      <View style={styles.orbOne} />
      <View style={styles.orbTwo} />

      <View
        className="flex-1"
        style={{ paddingHorizontal: Layout.screenPadding }}
      >
        <View className="pt-12 pb-6 flex-row items-center justify-between">
          <View>
            <Text
              className="text-xs font-light tracking-[1.5px]"
              style={{ color: Colors.textSecondary }}
            >
              REVIEW
            </Text>
            <Text
              className="text-2xl font-semibold mt-1"
              style={{ color: Colors.textPrimary }}
            >
              Shadow plan
            </Text>
            <Text className="text-sm mt-1" style={{ color: Colors.textSecondary }}>
              Approve Aura&apos;s draft for tonight, or ask for tweaks.
            </Text>
          </View>

          <AuraButton
            label="Done"
            size="sm"
            variant="ghost"
            onPress={() => router.back()}
          />
        </View>

        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-base font-semibold" style={{ color: Colors.textPrimary }}>
            Tonight&apos;s blocks
          </Text>
          <View className="flex-row gap-2">
            <AuraButton
              label="Approve all"
              size="sm"
              variant="primary"
              onPress={handleApproveAll}
              disabled={!hasShadowBlocks}
            />
            <AuraButton
              label="Ask Aura to adjust"
              size="sm"
              variant="ghost"
              onPress={handleAskAdjust}
              disabled={!hasShadowBlocks}
              loading={adjustBusy}
            />
          </View>
        </View>
        {adjustMessage ? (
          <Text
            className="text-xs mb-3"
            style={{ color: Colors.textSecondary }}
          >
            {adjustMessage}
          </Text>
        ) : null}

        {loading && (
          <View className="mt-4">
            <AuraSkeleton height={18} className="mb-3" />
            <AuraSkeleton height={80} className="mb-3" />
            <AuraSkeleton height={80} className="mb-3" />
          </View>
        )}

        {!loading && error && (
          <View className="mt-8 items-center">
            <Text className="text-sm mb-3" style={{ color: Colors.red }}>
              We couldn&apos;t load your shadow plan.
            </Text>
            <AuraButton
              label="Try again"
              onPress={() => {
                // No-op; hook will re-run if dependencies change. In a real app
                // we might bump a key or expose a refetch function.
              }}
            />
          </View>
        )}

        {!loading && !error && !hasShadowBlocks && (
          <View className="mt-8">
            <Text className="text-base font-semibold" style={{ color: Colors.textPrimary }}>
              No shadow plan yet
            </Text>
            <Text className="text-sm mt-2" style={{ color: Colors.textSecondary }}>
              Once Aura drafts a plan for tonight, you&apos;ll be able to
              review and approve it here.
            </Text>
          </View>
        )}

        {!loading && !error && hasShadowBlocks && (
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ paddingBottom: 32 }}
            showsVerticalScrollIndicator={false}
          >
            {shadowBlocks.map((block) => {
              const isApproved = approvedBlockIds.has(block.id);
              const isDeclined = declinedBlockIds.has(block.id);

              return (
                <View key={block.id} className="mb-4">
                  <Text className="text-xs mb-1" style={{ color: Colors.textSecondary }}>
                    {new Date(block.startTime).toLocaleTimeString([], {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}{' '}
                    –{' '}
                    {new Date(block.endTime).toLocaleTimeString([], {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </Text>
                  {block.task && (
                    <TaskCard task={block.task} />
                  )}
                  <View className="flex-row mt-2 gap-2">
                    <AuraButton
                      label={isApproved ? 'Approved' : 'Approve'}
                      size="sm"
                      variant="primary"
                      onPress={() => handleApproveBlock(block.id)}
                    />
                    <AuraButton
                      label={isDeclined ? 'Skipped' : 'Skip for now'}
                      size="sm"
                      variant="ghost"
                      onPress={() => handleDeclineBlock(block.id)}
                    />
                  </View>
                </View>
              );
            })}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  orbOne: {
    position: 'absolute',
    top: -80,
    left: -40,
    width: 200,
    height: 200,
    borderRadius: 200,
    backgroundColor: Colors.mist,
    opacity: 0.12,
  },
  orbTwo: {
    position: 'absolute',
    bottom: -60,
    right: -20,
    width: 220,
    height: 220,
    borderRadius: 220,
    backgroundColor: Colors.steel,
    opacity: 0.16,
  },
});

