import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
// Static dark palette, not useTheme() — this boundary must render even when
// the theme provider itself is what crashed.
import { darkColors, radius } from '@chronos/shared/theme';

interface State { hasError: boolean; error: Error | null }

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.root}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.body}>{this.state.error?.message ?? 'Unknown error'}</Text>
          <Pressable
            onPress={() => this.setState({ hasError: false, error: null })}
            style={styles.btn}
          >
            <Text style={styles.btnText}>Try again</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: darkColors.background.primary,
    padding: 24,
  },
  title: { fontSize: 20, fontWeight: '600', color: darkColors.text.primary, marginBottom: 8 },
  body: { fontSize: 14, color: darkColors.text.secondary, textAlign: 'center', marginBottom: 24 },
  btn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: radius.sm,
    backgroundColor: darkColors.accent.blue,
  },
  btnText: { color: darkColors.text.inverse, fontWeight: '600', fontSize: 14 },
});
