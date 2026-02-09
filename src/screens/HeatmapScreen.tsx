import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useDarkMode } from '../context/DarkModeContext';

type HeatmapMode = 'availability' | 'turnover';

const timeOptions = [
  { label: 'Now', value: 0 },
  { label: '+15m', value: 15 },
  { label: '+30m', value: 30 },
  { label: '+1hr', value: 60 },
];

// turnoverMin = avg minutes parked, turnoverColor = speed color
const heatmapData: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    // Gaslamp Quarter — fast evening turnover (restaurants/nightlife)
    { type: 'Feature', properties: { intensity: 0.9, color: '#7FA98E', turnoverMin: 20, turnoverColor: '#7FA98E', area: 'Gaslamp' }, geometry: { type: 'Point', coordinates: [-117.1600, 32.7115] } },
    { type: 'Feature', properties: { intensity: 0.85, color: '#7FA98E', turnoverMin: 22, turnoverColor: '#7FA98E', area: 'Gaslamp' }, geometry: { type: 'Point', coordinates: [-117.1585, 32.7120] } },
    { type: 'Feature', properties: { intensity: 0.7, color: '#7FA98E', turnoverMin: 25, turnoverColor: '#C9A96E', area: 'Gaslamp' }, geometry: { type: 'Point', coordinates: [-117.1615, 32.7125] } },
    { type: 'Feature', properties: { intensity: 0.5, color: '#C9A96E', turnoverMin: 30, turnoverColor: '#C9A96E', area: 'Gaslamp' }, geometry: { type: 'Point', coordinates: [-117.1610, 32.7100] } },
    { type: 'Feature', properties: { intensity: 0.45, color: '#C9A96E', turnoverMin: 35, turnoverColor: '#C9A96E', area: 'Gaslamp' }, geometry: { type: 'Point', coordinates: [-117.1635, 32.7108] } },
    { type: 'Feature', properties: { intensity: 0.4, color: '#C9A96E', turnoverMin: 40, turnoverColor: '#C9A96E', area: 'Gaslamp' }, geometry: { type: 'Point', coordinates: [-117.1590, 32.7095] } },
    { type: 'Feature', properties: { intensity: 0.2, color: '#B87C7C', turnoverMin: 45, turnoverColor: '#C9A96E', area: 'Gaslamp' }, geometry: { type: 'Point', coordinates: [-117.1620, 32.7090] } },
    { type: 'Feature', properties: { intensity: 0.15, color: '#B87C7C', turnoverMin: 50, turnoverColor: '#C9A96E', area: 'Gaslamp' }, geometry: { type: 'Point', coordinates: [-117.1645, 32.7085] } },
    { type: 'Feature', properties: { intensity: 0.1, color: '#B87C7C', turnoverMin: 55, turnoverColor: '#C9A96E', area: 'Gaslamp' }, geometry: { type: 'Point', coordinates: [-117.1575, 32.7080] } },
    // Little Italy — mixed, medium turnover
    { type: 'Feature', properties: { intensity: 0.8, color: '#7FA98E', turnoverMin: 35, turnoverColor: '#C9A96E', area: 'Little Italy' }, geometry: { type: 'Point', coordinates: [-117.1685, 32.7225] } },
    { type: 'Feature', properties: { intensity: 0.6, color: '#C9A96E', turnoverMin: 40, turnoverColor: '#C9A96E', area: 'Little Italy' }, geometry: { type: 'Point', coordinates: [-117.1700, 32.7235] } },
    { type: 'Feature', properties: { intensity: 0.35, color: '#C9A96E', turnoverMin: 30, turnoverColor: '#C9A96E', area: 'Little Italy' }, geometry: { type: 'Point', coordinates: [-117.1672, 32.7215] } },
    { type: 'Feature', properties: { intensity: 0.2, color: '#B87C7C', turnoverMin: 45, turnoverColor: '#C9A96E', area: 'Little Italy' }, geometry: { type: 'Point', coordinates: [-117.1695, 32.7245] } },
    // Hillcrest
    { type: 'Feature', properties: { intensity: 0.75, color: '#7FA98E', turnoverMin: 50, turnoverColor: '#C9A96E', area: 'Hillcrest' }, geometry: { type: 'Point', coordinates: [-117.1625, 32.7480] } },
    { type: 'Feature', properties: { intensity: 0.55, color: '#C9A96E', turnoverMin: 35, turnoverColor: '#C9A96E', area: 'Hillcrest' }, geometry: { type: 'Point', coordinates: [-117.1640, 32.7490] } },
    { type: 'Feature', properties: { intensity: 0.3, color: '#B87C7C', turnoverMin: 20, turnoverColor: '#7FA98E', area: 'Hillcrest' }, geometry: { type: 'Point', coordinates: [-117.1610, 32.7470] } },
    // North Park
    { type: 'Feature', properties: { intensity: 0.65, color: '#C9A96E', turnoverMin: 40, turnoverColor: '#C9A96E', area: 'North Park' }, geometry: { type: 'Point', coordinates: [-117.1300, 32.7475] } },
    { type: 'Feature', properties: { intensity: 0.8, color: '#7FA98E', turnoverMin: 30, turnoverColor: '#C9A96E', area: 'North Park' }, geometry: { type: 'Point', coordinates: [-117.1285, 32.7465] } },
    { type: 'Feature', properties: { intensity: 0.25, color: '#B87C7C', turnoverMin: 15, turnoverColor: '#7FA98E', area: 'North Park' }, geometry: { type: 'Point', coordinates: [-117.1315, 32.7485] } },
    // Pacific Beach
    { type: 'Feature', properties: { intensity: 0.4, color: '#C9A96E', turnoverMin: 60, turnoverColor: '#C9A96E', area: 'Pacific Beach' }, geometry: { type: 'Point', coordinates: [-117.2350, 32.7950] } },
    { type: 'Feature', properties: { intensity: 0.7, color: '#7FA98E', turnoverMin: 45, turnoverColor: '#C9A96E', area: 'Pacific Beach' }, geometry: { type: 'Point', coordinates: [-117.2365, 32.7940] } },
    { type: 'Feature', properties: { intensity: 0.15, color: '#B87C7C', turnoverMin: 90, turnoverColor: '#B87C7C', area: 'Pacific Beach' }, geometry: { type: 'Point', coordinates: [-117.2340, 32.7960] } },
  ],
};

export default function HeatmapScreen() {
  const navigation = useNavigation();
  const { isDark } = useDarkMode();
  const [timeOffset, setTimeOffset] = useState(0);
  const [mode, setMode] = useState<HeatmapMode>('availability');

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
          centerCoordinate={[-117.1611, 32.7157]}
          zoomLevel={13}
          animationMode="flyTo"
          animationDuration={1000}
        />
        <MapboxGL.UserLocation visible />
        <MapboxGL.ShapeSource id="heatmapSource" shape={heatmapData}>
          <MapboxGL.CircleLayer
            id="heatmapCircles"
            style={{
              circleRadius: 40,
              circleColor: mode === 'turnover' ? ['get', 'turnoverColor'] : ['get', 'color'],
              circleOpacity: 0.35,
              circleBlur: 0.8,
            }}
          />
          <MapboxGL.CircleLayer
            id="heatmapDots"
            style={{
              circleRadius: 6,
              circleColor: mode === 'turnover' ? ['get', 'turnoverColor'] : ['get', 'color'],
              circleStrokeWidth: 2,
              circleStrokeColor: '#FFFFFF',
            }}
          />
          <MapboxGL.SymbolLayer
            id="turnoverLabels"
            style={{
              textField: mode === 'turnover' ? ['concat', ['get', 'turnoverMin'], 'm'] : '',
              textSize: 11,
              textColor: '#FFFFFF',
              textHaloColor: 'rgba(0,0,0,0.7)',
              textHaloWidth: 1,
              textOffset: [0, 1.5],
              textFont: ['DIN Pro Medium'],
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
          <Text style={[styles.title, { color: isDark ? '#F5F5F7' : '#4A4F55' }]}>
            {mode === 'availability' ? 'Availability Heatmap' : 'Turnover Heatmap'}
          </Text>
        </View>

        <View style={styles.modeToggle}>
          <TouchableOpacity
            onPress={() => setMode('availability')}
            style={[styles.modeBtn, mode === 'availability' && styles.modeBtnActive, mode !== 'availability' && {
              backgroundColor: isDark ? '#3A3A3C' : '#F5F1E8',
            }]}
          >
            <Ionicons name="layers-outline" size={14} color={mode === 'availability' ? '#FFFFFF' : isDark ? '#AEAEB2' : '#8A8D91'} />
            <Text style={[styles.modeBtnText, { color: mode === 'availability' ? '#FFFFFF' : isDark ? '#AEAEB2' : '#8A8D91' }]}>Availability</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setMode('turnover')}
            style={[styles.modeBtn, mode === 'turnover' && styles.modeBtnActive, mode !== 'turnover' && {
              backgroundColor: isDark ? '#3A3A3C' : '#F5F1E8',
            }]}
          >
            <Ionicons name="refresh-outline" size={14} color={mode === 'turnover' ? '#FFFFFF' : isDark ? '#AEAEB2' : '#8A8D91'} />
            <Text style={[styles.modeBtnText, { color: mode === 'turnover' ? '#FFFFFF' : isDark ? '#AEAEB2' : '#8A8D91' }]}>Turnover</Text>
          </TouchableOpacity>
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
          <Text style={[styles.legendTitle, { color: isDark ? '#F5F5F7' : '#4A4F55' }]}>
            {mode === 'availability' ? 'Availability Legend' : 'Turnover Legend'}
          </Text>
          <Text style={styles.legendNote}>
            {mode === 'availability' ? 'Based on prediction' : 'Avg parking duration'}
          </Text>
        </View>
        {mode === 'availability' ? (
          [
            { color: '#7FA98E', label: 'High availability (70%+)' },
            { color: '#C9A96E', label: 'Moderate (30-70%)' },
            { color: '#B87C7C', label: 'Low availability (<30%)' },
          ].map((item, i) => (
            <View key={i} style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: item.color }]} />
              <Text style={[styles.legendLabel, { color: isDark ? '#F5F5F7' : '#4A4F55' }]}>{item.label}</Text>
            </View>
          ))
        ) : (
          [
            { color: '#7FA98E', label: 'Fast turnover (<25 min)' },
            { color: '#C9A96E', label: 'Medium turnover (25-60 min)' },
            { color: '#B87C7C', label: 'Slow turnover (60+ min)' },
          ].map((item, i) => (
            <View key={i} style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: item.color }]} />
              <Text style={[styles.legendLabel, { color: isDark ? '#F5F5F7' : '#4A4F55' }]}>{item.label}</Text>
            </View>
          ))
        )}
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
  modeToggle: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  modeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999,
  },
  modeBtnActive: { backgroundColor: '#7FA98E' },
  modeBtnText: { fontSize: 13, fontWeight: '600' },
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
