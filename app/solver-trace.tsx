import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../src/theme';

export default function SolverTraceScreen() {
  return (
    <LinearGradient colors={['#f9f9fe', '#e8e8ed']} style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Algorithm Telemetry</Text>
        <Text style={styles.subtitle}>Solver trace visualization coming soon</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60 },
  content: { flex: 1, padding: 20, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '800', color: theme.colors.onSurface, marginBottom: 8 },
  subtitle: { fontSize: 14, color: theme.colors.onSurfaceVariant }
});
