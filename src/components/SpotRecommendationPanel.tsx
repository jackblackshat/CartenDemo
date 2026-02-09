import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDarkMode } from '../context/DarkModeContext';
import ConfidenceGauge from './ConfidenceGauge';
import type { SpotRecommendation, LotSummary } from '../types';
import type { MapStackParamList } from '../navigation/types';

type NavProp = NativeStackNavigationProp<MapStackParamList>;

interface Props {
  lotName: string;
  lotSummary: LotSummary;
  recommendations: SpotRecommendation[];
  selectedSpotId?: string | null;
  onSpotPress?: (spotId: string) => void;
}

export default function SpotRecommendationPanel({
  lotName,
  lotSummary,
  recommendations,
  selectedSpotId,
  onSpotPress,
}: Props) {
  const { isDark } = useDarkMode();
  const navigation = useNavigation<NavProp>();
  const top5 = recommendations.slice(0, 5);
  const openPct = Math.round(
    (lotSummary.openSpots / lotSummary.totalSpots) * 100
  );

  return (
    <View style={[styles.container, {
      backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF',
      borderColor: isDark ? '#3A3A3C' : '#D3D5D7',
    }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <View style={styles.headerRow}>
              <Ionicons name="videocam-outline" size={16} color="#7FA98E" />
              <Text style={[styles.lotName, { color: isDark ? '#F5F5F7' : '#4A4F55' }]}>{lotName}</Text>
            </View>
            <Text style={[styles.summary, { color: isDark ? '#AEAEB2' : '#8A8D91' }]}>
              {lotSummary.openSpots}/{lotSummary.totalSpots} spots open
            </Text>
          </View>
          {top5.length > 0 && (
            <TouchableOpacity
              onPress={() => navigation.navigate('Navigation', {
                destination: { name: lotName, lat: top5[0].lat, lng: top5[0].lng },
              })}
              style={styles.lotNavBtn}
            >
              <Ionicons name="navigate" size={14} color="#FFFFFF" />
              <Text style={styles.lotNavText}>Navigate</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Occupancy bar */}
      <View style={styles.occupancyBar}>
        <View style={[styles.occupancyOpen, { flex: lotSummary.openSpots }]} />
        <View style={[styles.occupancyTaken, { flex: lotSummary.occupiedSpots }]} />
      </View>
      <Text style={[styles.occupancyLabel, { color: isDark ? '#AEAEB2' : '#8A8D91' }]}>{openPct}% available</Text>

      {/* Spots list */}
      <ScrollView style={styles.list} showsVerticalScrollIndicator={false} nestedScrollEnabled>
        {top5.map((spot) => (
          <TouchableOpacity
            key={spot.id}
            style={[
              styles.spotCard,
              { backgroundColor: isDark ? '#3A3A3C' : '#F5F1E8', borderColor: isDark ? '#48484A' : '#D3D5D7' },
              spot.id === selectedSpotId && { borderColor: '#7FA98E', borderWidth: 2 },
            ]}
            onPress={() => onSpotPress?.(spot.id)}
            activeOpacity={0.7}
          >
            <View style={styles.spotHeader}>
              <Text style={[styles.spotId, { color: isDark ? '#F5F5F7' : '#4A4F55' }]}>{spot.id}</Text>
              <Text style={[styles.spotRow, { color: isDark ? '#AEAEB2' : '#8A8D91' }]}>Row {spot.row}</Text>
              <Text style={[styles.spotDistance, { color: isDark ? '#AEAEB2' : '#8A8D91' }]}>{spot.distance}m</Text>
              <Text style={[styles.spotWalk, { color: isDark ? '#AEAEB2' : '#8A8D91' }]}>{spot.walkingTimeMinutes} min walk</Text>
            </View>

            <ConfidenceGauge confidence={spot.overallConfidence} label="Confidence" compact />

            <View style={styles.spotFooter}>
              <View>
                <Text style={styles.futureText}>
                  In 5 min: {Math.round(spot.futureConfidence['5min'] * 100)}%
                </Text>
                <Text style={[styles.queueText, { color: isDark ? '#AEAEB2' : '#8A8D91' }]}>
                  {spot.queuePosition === 0
                    ? 'No cars ahead'
                    : `${spot.queuePosition} car${spot.queuePosition > 1 ? 's' : ''} closer`}
                </Text>
                {spot.turnoverMinutes != null && (
                  <View style={styles.turnoverRow}>
                    <Ionicons
                      name="refresh-outline"
                      size={10}
                      color={spot.turnoverMinutes < 25 ? '#7FA98E' : spot.turnoverMinutes <= 60 ? '#C9A96E' : '#B87C7C'}
                    />
                    <Text style={[styles.turnoverLabel, {
                      color: spot.turnoverMinutes < 25 ? '#7FA98E' : spot.turnoverMinutes <= 60 ? '#C9A96E' : '#B87C7C',
                    }]}>
                      ~{spot.turnoverMinutes}m turnover
                    </Text>
                  </View>
                )}
              </View>
              <TouchableOpacity
                onPress={() => navigation.navigate('Navigation', {
                  destination: { name: `Spot ${spot.id} (Row ${spot.row})`, lat: spot.lat, lng: spot.lng },
                })}
                style={styles.spotNavBtn}
              >
                <Ionicons name="navigate" size={12} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    maxHeight: 360,
  },
  header: { marginBottom: 8 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  lotName: { fontWeight: '700', fontSize: 15 },
  summary: { fontSize: 13, marginTop: 2 },
  occupancyBar: {
    flexDirection: 'row', height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: 4,
  },
  occupancyOpen: { backgroundColor: '#7FA98E' },
  occupancyTaken: { backgroundColor: '#B87C7C' },
  occupancyLabel: { fontSize: 11, marginBottom: 8 },
  list: { maxHeight: 240 },
  spotCard: {
    padding: 10, borderRadius: 12, borderWidth: 1, marginBottom: 6, gap: 6,
  },
  spotHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  spotId: { fontWeight: '700', fontSize: 14 },
  spotRow: { fontSize: 12 },
  spotDistance: { fontSize: 12, marginLeft: 'auto' },
  spotWalk: { fontSize: 11 },
  spotFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  futureText: { fontSize: 11, color: '#C9A96E' },
  queueText: { fontSize: 11 },
  turnoverRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  turnoverLabel: { fontSize: 10, fontWeight: '500' },
  lotNavBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#7FA98E', borderRadius: 999,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  lotNavText: { fontSize: 12, fontWeight: '600', color: '#FFFFFF' },
  spotNavBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#7FA98E',
    alignItems: 'center', justifyContent: 'center',
  },
});
