import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';

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
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#07090F', padding: 24 },
  title: { fontSize: 20, fontWeight: '600', color: '#F8FAFC', marginBottom: 8 },
  body: { fontSize: 14, color: '#94A3B8', textAlign: 'center', marginBottom: 24 },
  btn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, backgroundColor: '#457B9D' },
  btnText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },
});
