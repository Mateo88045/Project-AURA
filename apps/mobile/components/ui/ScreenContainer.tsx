import { ReactNode } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@aura/shared/constants/colors';
import { Layout } from '@aura/shared/constants/layout';
import { AmbientOrbs } from './AmbientOrbs';

interface Props {
  children: ReactNode;
  scroll?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  edgeInsets?: boolean;
  ambient?: boolean;
}

export function ScreenContainer({
  children,
  scroll = true,
  refreshing,
  onRefresh,
  edgeInsets = true,
  ambient = true,
}: Props) {
  const insets = useSafeAreaInsets();
  const paddingTop = edgeInsets ? insets.top + 12 : 0;
  const paddingBottom = edgeInsets ? insets.bottom + 24 : 0;

  const inner = (
    <View
      style={{
        paddingHorizontal: Layout.screenPadding,
        paddingTop,
        paddingBottom,
        flexGrow: 1,
      }}
    >
      {children}
    </View>
  );

  return (
    <View style={styles.root}>
      {ambient ? <AmbientOrbs /> : null}
      {scroll ? (
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={!!refreshing}
                onRefresh={onRefresh}
                tintColor={Colors.mist}
              />
            ) : undefined
          }
        >
          {inner}
        </ScrollView>
      ) : (
        inner
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bgDark },
});
