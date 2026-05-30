import { View, Text, StyleSheet } from 'react-native';
import { ReactNode } from 'react';
import { Colors } from '@chronos/shared/constants/colors';

interface Props {
  title: string;
  body?: string;
  action?: ReactNode;
  icon?: ReactNode;
}

export function EmptyState({ title, body, action, icon }: Props) {
  return (
    <View style={styles.container}>
      {icon ? <View style={styles.icon}>{icon}</View> : null}
      <Text style={styles.title}>{title}</Text>
      {body ? <Text style={styles.body}>{body}</Text> : null}
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: 48, gap: 8 },
  icon: { marginBottom: 8, opacity: 0.6 },
  title: { color: Colors.textPrimary, fontSize: 17, fontWeight: '600', letterSpacing: -0.3 },
  body: {
    color: Colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 20,
  },
  action: { marginTop: 16 },
});
