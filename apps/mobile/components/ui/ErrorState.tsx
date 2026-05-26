import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@aura/shared/constants/colors';
import { AuraButton } from './AuraButton';

interface Props {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'Something went sideways',
  message = 'We couldn\'t load this. Try again in a moment.',
  onRetry,
}: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry ? (
        <View style={styles.button}>
          <AuraButton label="Try again" onPress={onRetry} variant="secondary" size="sm" />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  title: { color: Colors.red, fontSize: 15, fontWeight: '600' },
  message: {
    color: Colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 18,
  },
  button: { marginTop: 12 },
});
