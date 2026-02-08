import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDarkMode } from '../context/DarkModeContext';
import ConfidenceGauge from './ConfidenceGauge';
import type { RerouteDecision } from '../types';

interface Props {
  decision: RerouteDecision;
  onReroute: () => void;
  onDismiss: () => void;
}

export default function RerouteCard({ decision, onReroute, onDismiss }: Props) {
  const { isDark } = useDarkMode();

  if (!decision.shouldReroute || !decision.alternative) return null;

  const alt = decision.alternative;

  return (
    <View style={[styles.container, {
      backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF',
      borderColor: isDark ? '#3A3A3C' : '#D3D5D7',
    }]}>
      <View style={styles.titleRow}>
        <Ionicons name="swap-horizontal" size={18} color="#C9A96E" />
        <Text style={[styles.title, { color: isDark ? '#F5F5F7' : '#4A4F55' }]}>Consider Rerouting</Text>
      </View>
      <Text style={[styles.reason, { color: isDark ? '#AEAEB2' : '#8A8D91' }]}>{decision.reason}</Text>

      <View style={styles.comparison}>
        <View style={styles.compareCol}>
          <Text style={[styles.compareLabel, { color: isDark ? '#AEAEB2' : '#8A8D91' }]}>Current Lot</Text>
          <ConfidenceGauge confidence={decision.currentConfidence} compact />
        </View>
        <View style={styles.compareCol}>
          <Text style={[styles.compareLabel, { color: isDark ? '#AEAEB2' : '#8A8D91' }]}>{alt.name}</Text>
          <ConfidenceGauge confidence={alt.estimatedConfidence} compact />
        </View>
      </View>

      <Text style={[styles.driveTime, { color: isDark ? '#AEAEB2' : '#8A8D91' }]}>
        {alt.estimatedDriveMinutes} min drive · ~{alt.typicalOpenSpots} spots usually open
      </Text>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.rerouteButton} onPress={onReroute} activeOpacity={0.8}>
          <Text style={styles.rerouteText}>Reroute</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.stayButton, {
            backgroundColor: isDark ? '#3A3A3C' : '#F5F1E8',
            borderColor: isDark ? '#48484A' : '#D3D5D7',
          }]}
          onPress={onDismiss}
          activeOpacity={0.8}
        >
          <Text style={[styles.stayText, { color: isDark ? '#F5F5F7' : '#4A4F55' }]}>Stay Here</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 12,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  title: { fontWeight: '700', fontSize: 16 },
  reason: { fontSize: 13, marginBottom: 12, lineHeight: 18 },
  comparison: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  compareCol: { flex: 1, gap: 4 },
  compareLabel: { fontSize: 11, fontWeight: '600' },
  driveTime: { fontSize: 12, marginBottom: 12 },
  buttonRow: { flexDirection: 'row', gap: 8 },
  rerouteButton: {
    flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center',
    backgroundColor: '#7FA98E',
  },
  rerouteText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  stayButton: {
    flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center',
    borderWidth: 1,
  },
  stayText: { fontWeight: '600', fontSize: 15 },
});
