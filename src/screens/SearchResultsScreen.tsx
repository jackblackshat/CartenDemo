import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDarkMode } from '../context/DarkModeContext';
import { useNavigationContext } from '../context/NavigationContext';
import { useGeocoding, useUserLocation } from '../hooks';
import type { GeocodingResult } from '../types';
import type { MapStackParamList } from '../navigation/types';

type NavProp = NativeStackNavigationProp<MapStackParamList>;

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

const frequentSpots = [
  { id: 'freq1', name: 'Horton Plaza Garage', distance: '0.4 mi', confidence: 96, price: '$3/hr', eta: '3 min drive', visits: 24 },
  { id: 'freq2', name: 'Seaport Village Lot', distance: '0.8 mi', confidence: 92, price: '$5/hr', eta: '5 min drive', visits: 18 },
];

const nearbySpots = [
  { id: '1', name: '5th Ave (Gaslamp)', distance: '0.2 mi', confidence: 94, eta: '2 min drive' },
  { id: '2', name: 'Island Avenue', distance: '0.4 mi', confidence: 87, eta: '4 min drive' },
  { id: '3', name: 'East Village Garage', distance: '0.6 mi', confidence: 99, price: '$4/hr', eta: '5 min drive' },
];

export default function SearchResultsScreen() {
  const navigation = useNavigation<NavProp>();
  const { isDark } = useDarkMode();
  const { setSelectedDestination } = useNavigationContext();
  const [searchQuery, setSearchQuery] = useState('');
  const { results: geocodeResults, loading: geocodeLoading, search: geocodeSearch, clear: clearGeocode } = useGeocoding();
  const { location: userLocation } = useUserLocation();

  const debouncedQuery = useDebounce(searchQuery, 300);

  useEffect(() => {
    if (debouncedQuery.trim().length >= 2) {
      geocodeSearch(debouncedQuery);
    } else {
      clearGeocode();
    }
  }, [debouncedQuery, geocodeSearch, clearGeocode]);

  const calculateDistance = useCallback((result: GeocodingResult): string => {
    if (!userLocation) return '';
    const [lng, lat] = result.center;
    const R = 3959;
    const dLat = ((lat - userLocation.lat) * Math.PI) / 180;
    const dLng = ((lng - userLocation.lng) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos((userLocation.lat * Math.PI) / 180) * Math.cos((lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return `${(R * c).toFixed(1)} mi`;
  }, [userLocation]);

  const handleSelectDestination = (result: GeocodingResult) => {
    setSelectedDestination({
      name: result.place_name,
      lat: result.center[1],
      lng: result.center[0],
    });
    navigation.navigate('Navigation', {
      destination: { name: result.place_name, lat: result.center[1], lng: result.center[0] },
    });
  };

  const showSearchResults = searchQuery.trim().length >= 2;

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#1C1C1E' : '#F5F1E8' }]}>
      {/* Header */}
      <View style={[styles.header, {
        backgroundColor: isDark ? 'rgba(44, 44, 46, 0.9)' : 'rgba(255, 255, 255, 0.9)',
        borderBottomColor: isDark ? '#3A3A3C' : '#D3D5D7',
      }]}>
        <View style={styles.searchRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[styles.backButton, {
              backgroundColor: isDark ? '#3A3A3C' : '#F5F1E8',
              borderColor: isDark ? '#48484A' : '#D3D5D7',
            }]}
          >
            <Ionicons name="arrow-back" size={20} color={isDark ? '#F5F5F7' : '#4A4F55'} />
          </TouchableOpacity>
          <View style={[styles.searchInput, {
            backgroundColor: isDark ? '#3A3A3C' : '#FFFFFF',
            borderColor: isDark ? '#48484A' : '#D3D5D7',
          }]}>
            <Ionicons name="search" size={16} color={isDark ? '#AEAEB2' : '#8A8D91'} />
            <TextInput
              placeholder="Search destination..."
              placeholderTextColor={isDark ? '#AEAEB2' : '#8A8D91'}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
              style={[styles.input, { color: isDark ? '#F5F5F7' : '#4A4F55' }]}
            />
            {geocodeLoading && <ActivityIndicator size="small" color="#7FA98E" />}
          </View>
        </View>
      </View>

      {/* Results */}
      <ScrollView contentContainerStyle={styles.results}>
        {showSearchResults ? (
          <>
            <Text style={[styles.resultCount, { color: isDark ? '#AEAEB2' : '#8A8D91' }]}>
              {geocodeLoading ? 'Searching...' : `${geocodeResults.length} results found`}
            </Text>
            {geocodeResults.map((result) => (
              <TouchableOpacity
                key={result.id}
                onPress={() => handleSelectDestination(result)}
                style={[styles.resultCard, {
                  backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF',
                  borderColor: isDark ? '#3A3A3C' : '#D3D5D7',
                }]}
              >
                <View style={[styles.resultIcon, { backgroundColor: isDark ? '#3A3A3C' : '#F5F1E8' }]}>
                  <Ionicons name="location" size={20} color="#7FA98E" />
                </View>
                <View style={styles.resultContent}>
                  <Text style={[styles.resultTitle, { color: isDark ? '#F5F5F7' : '#4A4F55' }]} numberOfLines={1}>
                    {result.text}
                  </Text>
                  <Text style={[styles.resultSub, { color: isDark ? '#AEAEB2' : '#8A8D91' }]} numberOfLines={1}>
                    {result.place_name}
                  </Text>
                  {userLocation && (
                    <Text style={styles.resultDistance}>{calculateDistance(result)} away</Text>
                  )}
                </View>
                <Ionicons name="navigate" size={20} color="#7FA98E" />
              </TouchableOpacity>
            ))}
          </>
        ) : (
          <>
            {/* Frequent */}
            <View style={styles.sectionHeader}>
              <Ionicons name="star" size={20} color="#C9A96E" />
              <Text style={[styles.sectionTitle, { color: isDark ? '#F5F5F7' : '#4A4F55' }]}>Most Frequented</Text>
            </View>
            {frequentSpots.map((spot) => (
              <TouchableOpacity
                key={spot.id}
                onPress={() => navigation.navigate('SpotDetail', { id: spot.id })}
                style={[styles.spotRow, {
                  backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF',
                  borderColor: 'rgba(201, 169, 110, 0.3)',
                }]}
              >
                <View style={styles.spotInfo}>
                  <View style={styles.spotNameRow}>
                    <Text style={[styles.spotName, { color: isDark ? '#F5F5F7' : '#4A4F55' }]}>{spot.name}</Text>
                    <View style={styles.visitsBadge}>
                      <Text style={styles.visitsText}>{spot.visits} visits</Text>
                    </View>
                  </View>
                  <Text style={[styles.spotMeta, { color: isDark ? '#AEAEB2' : '#8A8D91' }]}>{spot.distance} · {spot.eta}</Text>
                </View>
                <View style={styles.confidenceBadge}>
                  <Text style={styles.confidenceText}>{spot.confidence}%</Text>
                </View>
              </TouchableOpacity>
            ))}

            {/* Nearby */}
            <View style={styles.sectionHeader}>
              <Ionicons name="trending-up" size={20} color={isDark ? '#AEAEB2' : '#8A8D91'} />
              <Text style={[styles.sectionTitle, { color: isDark ? '#F5F5F7' : '#4A4F55' }]}>Nearby Spots</Text>
            </View>
            {nearbySpots.map((spot) => (
              <TouchableOpacity
                key={spot.id}
                onPress={() => navigation.navigate('SpotDetail', { id: spot.id })}
                style={[styles.spotRow, {
                  backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF',
                  borderColor: isDark ? '#3A3A3C' : '#D3D5D7',
                }]}
              >
                <View style={styles.spotInfo}>
                  <Text style={[styles.spotName, { color: isDark ? '#F5F5F7' : '#4A4F55' }]}>{spot.name}</Text>
                  <Text style={[styles.spotMeta, { color: isDark ? '#AEAEB2' : '#8A8D91' }]}>{spot.distance} · {spot.eta}</Text>
                </View>
                <View style={styles.confidenceBadge}>
                  <Text style={styles.confidenceText}>{spot.confidence}%</Text>
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 60, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backButton: {
    width: 36, height: 36, borderRadius: 18, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  searchInput: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, height: 40,
  },
  input: { flex: 1, fontSize: 15 },
  results: { padding: 16, gap: 12 },
  resultCount: { fontSize: 13, marginBottom: 4 },
  resultCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 12, borderWidth: 1, padding: 16,
  },
  resultIcon: {
    width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
  },
  resultContent: { flex: 1 },
  resultTitle: { fontSize: 16, fontWeight: '600' },
  resultSub: { fontSize: 13, marginTop: 2 },
  resultDistance: { fontSize: 12, color: '#7FA98E', marginTop: 4 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8, marginBottom: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '600' },
  spotRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderRadius: 12, borderWidth: 2, padding: 16,
  },
  spotInfo: { flex: 1, marginRight: 12 },
  spotNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  spotName: { fontSize: 15, fontWeight: '600' },
  visitsBadge: { backgroundColor: 'rgba(201, 169, 110, 0.2)', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  visitsText: { fontSize: 11, fontWeight: '600', color: '#C9A96E' },
  spotMeta: { fontSize: 12 },
  confidenceBadge: {
    backgroundColor: 'rgba(127, 169, 142, 0.2)', borderWidth: 1,
    borderColor: '#7FA98E', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4,
  },
  confidenceText: { fontSize: 13, fontWeight: '600', color: '#5F7A61' },
});
