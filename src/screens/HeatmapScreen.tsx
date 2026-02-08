import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useDarkMode } from '../context/DarkModeContext';
import { useUserLocation } from '../hooks/useUserLocation';

const timeOptions = [
  { label: 'Now', value: 0 },
  { label: '+15m', value: 15 },
  { label: '+30m', value: 30 },
  { label: '+1hr', value: 60 },
];

const heatmapData: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', properties: { intensity: 0.9, color: '#7FA98E' }, geometry: { type: 'Point', coordinates: [-122.4025, 37.7899] } },
    { type: 'Feature', properties: { intensity: 0.85, color: '#7FA98E' }, geometry: { type: 'Point', coordinates: [-122.4010, 37.7905] } },
    { type: 'Feature', properties: { intensity: 0.7, color: '#7FA98E' }, geometry: { type: 'Point', coordinates: [-122.4040, 37.7910] } },
    { type: 'Feature', properties: { intensity: 0.5, color: '#C9A96E' }, geometry: { type: 'Point', coordinates: [-122.4035, 37.7889] } },
    { type: 'Feature', properties: { intensity: 0.45, color: '#C9A96E' }, geometry: { type: 'Point', coordinates: [-122.4060, 37.7895] } },
    { type: 'Feature', properties: { intensity: 0.4, color: '#C9A96E' }, geometry: { type: 'Point', coordinates: [-122.4015, 37.7880] } },
    { type: 'Feature', properties: { intensity: 0.2, color: '#B87C7C' }, geometry: { type: 'Point', coordinates: [-122.4045, 37.7879] } },
    { type: 'Feature', properties: { intensity: 0.15, color: '#B87C7C' }, geometry: { type: 'Point', coordinates: [-122.4070, 37.7870] } },
    { type: 'Feature', properties: { intensity: 0.1, color: '#B87C7C' }, geometry: { type: 'Point', coordinates: [-122.4000, 37.7865] } },
  ],
};

export default function HeatmapScreen() {
  const navigation = useNavigation();
  const { isDark } = useDarkMode();
  const [timeOffset, setTimeOffset] = useState(0);
  const { location } = useUserLocation(false);

  return (
    <View style={styles.container}>
      {/* Map background */}
      <MapboxGL.MapView
        style={StyleSheet.absoluteFill}
        styleURL={isDark ? MapboxGL.StyleURL.Dark : MapboxGL.StyleURL.Street}
        logoEnabled={false}
        attributionEnabled={false}
        compassEnabled={false}
      >
        <MapboxGL.Camera
          centerCoordinate={[
            location?.lng ?? -122.4025,
            location?.lat ?? 37.7889,
          ]}
          zoomLevel={14}
          animationMode="flyTo"
          animationDuration={1000}
        />
        <MapboxGL.UserLocation visible />
        <MapboxGL.ShapeSource id="heatmapSource" shape={heatmapData}>
          <MapboxGL.CircleLayer
            id="heatmapCircles"
            style={{
              circleRadius: 40,
              circleColor: ['get', 'color'],
              circleOpacity: 0.35,
              circleBlur: 0.8,
            }}
          />
          <MapboxGL.CircleLayer
            id="heatmapDots"
            style={{
              circleRadius: 6,
              circleColor: ['get', 'color'],
              circleStrokeWidth: 2,
              circleStrokeColor: '#FFFFFF',
            }}
          />
        </MapboxGL.ShapeSource>
      </MapboxGL.MapView>

      {/* Header */}
      <View style={[styles.header, {
        backgroundColor: isDark ? 'rgba(44, 44, 46, 0.85)' : 'rgba(255, 255, 255, 0.85)',
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

      {/* Legend */}
      <View style={[styles.legend, {
        backgroundColor: isDark ? 'rgba(44, 44, 46, 0.85)' : 'rgba(255, 255, 255, 0.85)',
        borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.6)',
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
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
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
