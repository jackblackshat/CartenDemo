import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useDarkMode } from '../context/DarkModeContext';

interface Props {
  confidence: number; // 0-1
  label?: string;
  compact?: boolean;
}

function getColor(confidence: number): string {
  const pct = confidence * 100;
  if (pct > 70) return '#7FA98E';
  if (pct >= 40) return '#C9A96E';
  return '#B87C7C';
}

export default function ConfidenceGauge({ confidence, label, compact }: Props) {
  const { isDark } = useDarkMode();
  const pct = Math.round(confidence * 100);
  const color = getColor(confidence);

  return (
    <View style={[styles.container, compact && styles.compact]}>
      {label && <Text style={[styles.label, { color: isDark ? '#AEAEB2' : '#8A8D91' }]}>{label}</Text>}
      <View style={[styles.barBackground, { backgroundColor: isDark ? '#3A3A3C' : '#E8E8E8' }]}>
        <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <Text style={[styles.pct, { color }]}>{pct}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  compact: {
    gap: 4,
  },
  label: {
    fontSize: 11,
    width: 60,
  },
  barBackground: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  pct: {
    fontSize: 12,
    fontWeight: '600',
    width: 36,
    textAlign: 'right',
  },
});
