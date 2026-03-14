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
    // TODO: Trigger.dev — request re-plan for shadow schedule for the day
    console.log('[STUB] Ask Aura to adjust shadow plan for day', dayIso);
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
            <Text className="text-[#8EAFC2] text-xs font-light tracking-[1.5px]">
              REVIEW
            </Text>
            <Text className="text-[#F1FAEE] text-2xl font-semibold mt-1">
              Shadow plan
            </Text>
            <Text className="text-[#8EAFC2] text-sm mt-1">
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
          <Text className="text-[#F1FAEE] text-base font-semibold">
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
            />
          </View>
        </View>

        {loading && (
          <View className="mt-4">
            <AuraSkeleton height={18} className="mb-3" />
            <AuraSkeleton height={80} className="mb-3" />
            <AuraSkeleton height={80} className="mb-3" />
          </View>
        )}

        {!loading && error && (
          <View className="mt-8 items-center">
            <Text className="text-[#E76F6F] text-sm mb-3">
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
            <Text className="text-[#F1FAEE] text-base font-semibold">
              No shadow plan yet
            </Text>
            <Text className="text-[#8EAFC2] text-sm mt-2">
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
                  <Text className="text-[#8EAFC2] text-xs mb-1">
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

