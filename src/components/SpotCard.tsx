import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useDarkMode } from '../context/DarkModeContext';
import type { ParkingSpot } from '../types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MapStackParamList } from '../navigation/types';

interface SpotCardProps {
  spot: ParkingSpot;
}

type NavProp = NativeStackNavigationProp<MapStackParamList>;

function getSourceIcon(source: string): keyof typeof Ionicons.glyphMap {
  switch (source) {
    case 'camera':
      return 'camera-outline';
    case 'crowd':
      return 'people-outline';
    case 'prediction':
      return 'trending-up-outline';
    case 'api':
      return 'flash-outline';
    default:
      return 'ellipse-outline';
  }
}

export default function SpotCard({ spot }: SpotCardProps) {
  const navigation = useNavigation<NavProp>();
  const { isDark } = useDarkMode();

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => navigation.navigate('SpotDetail', { id: spot.id })}
      style={[
        styles.card,
        {
          backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF',
          borderColor: isDark ? '#3A3A3C' : '#D3D5D7',
        },
      ]}
    >
      {/* Top row */}
      <View style={styles.topRow}>
        <View style={styles.nameContainer}>
          <View style={styles.nameRow}>
            <Text
              style={[styles.street, { color: isDark ? '#F5F5F7' : '#4A4F55' }]}
              numberOfLines={1}
            >
              {spot.street}
            </Text>
            {spot.type === 'garage' && (
              <Ionicons name="car-outline" size={16} color="#7FA98E" />
            )}
          </View>
          <Text style={[styles.distance, { color: isDark ? '#AEAEB2' : '#8A8D91' }]}>
            {spot.distance}
          </Text>
        </View>

        <View style={styles.badgeContainer}>
          <View style={styles.confidenceBadge}>
            <Text style={styles.confidenceText}>{spot.confidence}%</Text>
          </View>
          {spot.price && (
            <Text style={styles.price}>{spot.price}</Text>
          )}
        </View>
      </View>

      {/* Sources row */}
      <View style={styles.sourcesRow}>
        <View style={styles.sourceIcons}>
          {spot.sources.map((source, i) => (
            <View
              key={i}
              style={[
                styles.sourceIcon,
                {
                  backgroundColor: isDark ? '#3A3A3C' : '#F5F1E8',
                  borderColor: isDark ? '#48484A' : '#D3D5D7',
                },
              ]}
            >
              <Ionicons name={getSourceIcon(source)} size={12} color="#7FA98E" />
            </View>
          ))}
        </View>
        <View
          style={[styles.divider, { backgroundColor: isDark ? '#48484A' : '#D3D5D7' }]}
        />
        <View style={styles.timeValid}>
          <Ionicons name="time-outline" size={12} color={isDark ? '#AEAEB2' : '#8A8D91'} />
          <Text style={[styles.timeText, { color: isDark ? '#AEAEB2' : '#8A8D91' }]}>
            Valid {spot.timeValid}
          </Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={[styles.timeLimit, { color: isDark ? '#AEAEB2' : '#8A8D91' }]}>
          {spot.timeLimit || 'No limit'}
        </Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('Navigation', { destination: undefined })}
          style={styles.navigateButton}
        >
          <Ionicons name="navigate" size={14} color="#FFFFFF" />
          <Text style={styles.navigateText}>Navigate</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  nameContainer: {
    flex: 1,
    marginRight: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  street: {
    fontSize: 16,
    fontWeight: '600',
  },
  distance: {
    fontSize: 13,
  },
  badgeContainer: {
    alignItems: 'flex-end',
    gap: 4,
  },
  confidenceBadge: {
    backgroundColor: 'rgba(127, 169, 142, 0.2)',
    borderWidth: 1,
    borderColor: '#7FA98E',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  confidenceText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5F7A61',
  },
  price: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7FA98E',
  },
  sourcesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sourceIcons: {
    flexDirection: 'row',
    gap: 6,
  },
  sourceIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    width: 1,
    height: 16,
  },
  timeValid: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 11,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeLimit: {
    fontSize: 12,
  },
  navigateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#7FA98E',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 1,
  },
  navigateText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
