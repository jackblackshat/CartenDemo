import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useDarkMode } from '../context/DarkModeContext';

const timeOptions = [
  { label: 'Now', value: 0 },
  { label: '+15m', value: 15 },
  { label: '+30m', value: 30 },
  { label: '+1hr', value: 60 },
];

export default function HeatmapScreen() {
  const navigation = useNavigation();
  const { isDark } = useDarkMode();
  const [timeOffset, setTimeOffset] = useState(0);

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#1C1C1E' : '#F5F1E8' }]}>
      {/* Header */}
      <View style={[styles.header, {
        backgroundColor: isDark ? 'rgba(44, 44, 46, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        borderBottomColor: isDark ? '#3A3A3C' : '#D3D5D7',
      }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, {
            backgroundColor: isDark ? '#3A3A3C' : '#F5F1E8',
            borderColor: isDark ? '#48484A' : '#D3D5D7',
          }]}>
            <Ionicons name="arrow-back" size={20} color={isDark ? '#F5F5F7' : '#4A4F55'} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: isDark ? '#F5F5F7' : '#4A4F55' }]}>Availability Heatmap</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeScroll}>
          {timeOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              onPress={() => setTimeOffset(option.value)}
              style={[styles.timeChip, timeOffset === option.value ? styles.timeActive : {
                backgroundColor: isDark ? '#3A3A3C' : '#F5F1E8',
                borderColor: isDark ? '#48484A' : '#D3D5D7',
              }]}
            >
              <Ionicons name="time-outline" size={14} color={timeOffset === option.value ? '#FFFFFF' : isDark ? '#AEAEB2' : '#8A8D91'} />
              <Text style={[styles.timeText, { color: timeOffset === option.value ? '#FFFFFF' : isDark ? '#AEAEB2' : '#8A8D91' }]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Heatmap visualization */}
      <View style={[styles.heatmapArea, { backgroundColor: isDark ? '#2C2C2E' : '#E8DFD0' }]}>
        {/* Simulated heatmap zones */}
        <View style={[styles.zone, styles.zoneHigh, { top: '20%', left: '15%' }]} />
        <View style={[styles.zone, styles.zoneMid, { top: '40%', right: '15%' }]} />
        <View style={[styles.zone, styles.zoneLow, { bottom: '25%', left: '35%' }]} />

        {/* Legend */}
        <View style={[styles.legend, {
          backgroundColor: isDark ? 'rgba(44, 44, 46, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          borderColor: isDark ? '#3A3A3C' : '#D3D5D7',
        }]}>
          <View style={styles.legendHeader}>
            <Text style={[styles.legendTitle, { color: isDark ? '#F5F5F7' : '#4A4F55' }]}>Availability Legend</Text>
            <Text style={styles.legendNote}>Based on prediction</Text>
          </View>
          {[
            { color: '#7FA98E', label: 'High availability (70%+)' },
            { color: '#C9A96E', label: 'Moderate (30-70%)' },
            { color: '#B87C7C', label: 'Low availability (<30%)' },
          ].map((item, i) => (
            <View key={i} style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: item.color }]} />
              <Text style={[styles.legendLabel, { color: isDark ? '#F5F5F7' : '#4A4F55' }]}>{item.label}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 60, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '600' },
  timeScroll: { flexDirection: 'row' },
  timeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, borderWidth: 1, marginRight: 8,
  },
  timeActive: { backgroundColor: '#7FA98E', borderColor: '#7FA98E' },
  timeText: { fontSize: 14 },
  heatmapArea: { flex: 1, position: 'relative' },
  zone: { position: 'absolute', borderRadius: 999, opacity: 0.4 },
  zoneHigh: { width: 200, height: 200, backgroundColor: '#7FA98E' },
  zoneMid: { width: 240, height: 240, backgroundColor: '#C9A96E' },
  zoneLow: { width: 180, height: 180, backgroundColor: '#B87C7C' },
  legend: {
    position: 'absolute', bottom: 100, left: 16, right: 16,
    borderRadius: 16, borderWidth: 1, padding: 16,
  },
  legendHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  legendTitle: { fontSize: 14, fontWeight: '600' },
  legendNote: { fontSize: 12, color: '#7FA98E' },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  legendDot: { width: 24, height: 24, borderRadius: 12 },
  legendLabel: { fontSize: 14 },
});
