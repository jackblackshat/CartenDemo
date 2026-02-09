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

const workLocation = {
  name: 'SDSU',
  address: '5500 Campanile Dr',
  distance: '8.2 mi',
  lat: 32.7757,
  lng: -117.0719,
};

const events = [
  { id: 'ev1', name: 'Padres vs Dodgers', venue: 'Petco Park', time: 'Tonight, 7:10 PM', difficulty: 'High' as const, lat: 32.7073, lng: -117.1566, parkingFull: true },
  { id: 'ev2', name: 'Gaslamp Night Market', venue: '5th Ave, Gaslamp', time: 'Saturday, 6:00 PM', difficulty: 'Medium' as const, lat: 32.7112, lng: -117.1601, parkingFull: false },
  { id: 'ev3', name: 'SD Symphony', venue: 'Copley Symphony Hall', time: 'Friday, 8:00 PM', difficulty: 'Medium' as const, lat: 32.7199, lng: -117.1571, parkingFull: false },
];

// Alternatives shown when event parking is full
const eventAlternatives = [
  { id: 'alt1', name: 'Horton Plaza Garage', distance: '0.3 mi', walk: '6 min walk', confidence: 78, price: '$3/hr', lat: 32.7138, lng: -117.1614, icon: 'car' as const },
  { id: 'alt2', name: '6th Ave & Island Lot', distance: '0.4 mi', walk: '8 min walk', confidence: 85, price: '$5/hr', lat: 32.7095, lng: -117.1618, icon: 'car' as const },
  { id: 'alt3', name: 'Seaport Village Parking', distance: '0.5 mi', walk: '10 min walk', confidence: 72, price: '$4/hr', lat: 32.7070, lng: -117.1685, icon: 'car' as const },
];

const eventTransit = [
  { id: 'tr1', name: 'MTS Green Line', detail: 'Gaslamp Quarter Station · 4 min walk', frequency: 'Every 15 min', color: '#4CAF50', icon: 'train-outline' as const, lat: 32.7118, lng: -117.1590 },
  { id: 'tr2', name: 'MTS Blue Line', detail: '12th & Imperial · 12 min walk', frequency: 'Every 12 min', color: '#2196F3', icon: 'train-outline' as const, lat: 32.7060, lng: -117.1520 },
  { id: 'tr3', name: 'Bus Route 3', detail: 'Park Blvd & Market St · 3 min walk', frequency: 'Every 20 min', color: '#FF9800', icon: 'bus-outline' as const, lat: 32.7080, lng: -117.1560 },
];

export default function SearchResultsScreen() {
  const navigation = useNavigation<NavProp>();
  const { isDark } = useDarkMode();
  const { setSelectedDestination } = useNavigationContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
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
            {/* Work */}
            <TouchableOpacity
              onPress={() => {
                setSelectedDestination({
                  name: `${workLocation.name} — ${workLocation.address}`,
                  lat: workLocation.lat,
                  lng: workLocation.lng,
                });
                navigation.navigate('Navigation', {
                  destination: {
                    name: `${workLocation.name} — ${workLocation.address}`,
                    lat: workLocation.lat,
                    lng: workLocation.lng,
                  },
                });
              }}
              style={[styles.workCard, {
                backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF',
              }]}
            >
              <View style={[styles.workIcon, { backgroundColor: isDark ? 'rgba(127, 169, 142, 0.15)' : 'rgba(127, 169, 142, 0.12)' }]}>
                <Ionicons name="briefcase" size={22} color="#7FA98E" />
              </View>
              <View style={styles.workContent}>
                <Text style={[styles.workLabel, { color: isDark ? '#AEAEB2' : '#8A8D91' }]}>Work</Text>
                <Text style={[styles.workName, { color: isDark ? '#F5F5F7' : '#4A4F55' }]}>{workLocation.name} — {workLocation.address}</Text>
                <Text style={styles.workDistance}>{workLocation.distance}</Text>
              </View>
              <Ionicons name="navigate" size={20} color="#7FA98E" />
            </TouchableOpacity>

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

            {/* Events */}
            <View style={styles.sectionHeader}>
              <Ionicons name="calendar" size={20} color="#C9A96E" />
              <Text style={[styles.sectionTitle, { color: isDark ? '#F5F5F7' : '#4A4F55' }]}>Events Nearby</Text>
            </View>
            {events.map((event) => {
              const isExpanded = expandedEventId === event.id;
              return (
                <View key={event.id}>
                  <TouchableOpacity
                    onPress={() => {
                      if (event.parkingFull) {
                        setExpandedEventId(isExpanded ? null : event.id);
                      } else {
                        setSelectedDestination({
                          name: `${event.name} — ${event.venue}`,
                          lat: event.lat,
                          lng: event.lng,
                        });
                        navigation.navigate('Navigation', {
                          destination: {
                            name: `${event.name} — ${event.venue}`,
                            lat: event.lat,
                            lng: event.lng,
                          },
                        });
                      }
                    }}
                    style={[styles.eventCard, {
                      backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF',
                      borderColor: isExpanded ? '#DC4C4C' : isDark ? '#3A3A3C' : '#D3D5D7',
                      borderBottomLeftRadius: isExpanded ? 0 : 16,
                      borderBottomRightRadius: isExpanded ? 0 : 16,
                    }]}
                  >
                    <View style={styles.eventContent}>
                      <Text style={[styles.eventName, { color: isDark ? '#F5F5F7' : '#4A4F55' }]}>{event.name}</Text>
                      <Text style={[styles.eventVenue, { color: isDark ? '#AEAEB2' : '#8A8D91' }]}>{event.venue}</Text>
                      <Text style={[styles.eventTime, { color: isDark ? '#AEAEB2' : '#8A8D91' }]}>{event.time}</Text>
                    </View>
                    <View style={[
                      styles.difficultyBadge,
                      { backgroundColor: event.difficulty === 'High' ? 'rgba(220, 76, 76, 0.15)' : 'rgba(201, 169, 110, 0.15)' },
                    ]}>
                      <View style={[
                        styles.difficultyDot,
                        { backgroundColor: event.difficulty === 'High' ? '#DC4C4C' : '#C9A96E' },
                      ]} />
                      <Text style={[
                        styles.difficultyText,
                        { color: event.difficulty === 'High' ? '#DC4C4C' : '#C9A96E' },
                      ]}>
                        {event.difficulty}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {/* Expanded: parking full — show alternatives & transit */}
                  {isExpanded && event.parkingFull && (
                    <View style={[styles.eventExpanded, {
                      backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF',
                      borderColor: '#DC4C4C',
                    }]}>
                      {/* Warning banner */}
                      <View style={styles.fullWarning}>
                        <Ionicons name="warning" size={16} color="#DC4C4C" />
                        <Text style={styles.fullWarningText}>Parking near {event.venue} is likely full</Text>
                      </View>

                      {/* Nearby alternatives */}
                      <Text style={[styles.altSectionTitle, { color: isDark ? '#F5F5F7' : '#4A4F55' }]}>
                        <Ionicons name="car-outline" size={14} /> Nearby Parking
                      </Text>
                      {eventAlternatives.map((alt) => (
                        <View key={alt.id} style={[styles.altRow, {
                          backgroundColor: isDark ? '#3A3A3C' : '#F5F1E8',
                          borderColor: isDark ? '#48484A' : '#D3D5D7',
                        }]}>
                          <View style={styles.altInfo}>
                            <Text style={[styles.altName, { color: isDark ? '#F5F5F7' : '#4A4F55' }]}>{alt.name}</Text>
                            <Text style={[styles.altMeta, { color: isDark ? '#AEAEB2' : '#8A8D91' }]}>
                              {alt.distance} · {alt.walk} · {alt.price}
                            </Text>
                          </View>
                          <View style={styles.altRight}>
                            <View style={styles.altConfBadge}>
                              <Text style={styles.altConfText}>{alt.confidence}%</Text>
                            </View>
                            <TouchableOpacity
                              onPress={() => {
                                setSelectedDestination({ name: alt.name, lat: alt.lat, lng: alt.lng });
                                navigation.navigate('Navigation', {
                                  destination: { name: alt.name, lat: alt.lat, lng: alt.lng },
                                });
                              }}
                              style={styles.altNavBtn}
                            >
                              <Ionicons name="navigate" size={16} color="#FFFFFF" />
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))}

                      {/* Public transit */}
                      <Text style={[styles.altSectionTitle, { color: isDark ? '#F5F5F7' : '#4A4F55', marginTop: 12 }]}>
                        <Ionicons name="bus-outline" size={14} /> Public Transit
                      </Text>
                      {eventTransit.map((tr) => (
                        <View key={tr.id} style={[styles.altRow, {
                          backgroundColor: isDark ? '#3A3A3C' : '#F5F1E8',
                          borderColor: isDark ? '#48484A' : '#D3D5D7',
                        }]}>
                          <View style={[styles.transitDot, { backgroundColor: tr.color + '20' }]}>
                            <Ionicons name={tr.icon} size={18} color={tr.color} />
                          </View>
                          <View style={styles.altInfo}>
                            <Text style={[styles.altName, { color: isDark ? '#F5F5F7' : '#4A4F55' }]}>{tr.name}</Text>
                            <Text style={[styles.altMeta, { color: isDark ? '#AEAEB2' : '#8A8D91' }]}>{tr.detail}</Text>
                            <Text style={[styles.altFreq, { color: isDark ? '#AEAEB2' : '#8A8D91' }]}>{tr.frequency}</Text>
                          </View>
                          <TouchableOpacity
                            onPress={() => {
                              setSelectedDestination({ name: `${tr.name} — ${tr.detail.split('·')[0].trim()}`, lat: tr.lat, lng: tr.lng });
                              navigation.navigate('Navigation', {
                                destination: { name: `${tr.name} — ${tr.detail.split('·')[0].trim()}`, lat: tr.lat, lng: tr.lng },
                              });
                            }}
                            style={styles.altNavBtn}
                          >
                            <Ionicons name="navigate" size={16} color="#FFFFFF" />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
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
  workCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#7FA98E',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  workIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  workContent: { flex: 1 },
  workLabel: { fontSize: 12, fontWeight: '500', marginBottom: 2 },
  workName: { fontSize: 15, fontWeight: '600' },
  workDistance: { fontSize: 12, color: '#7FA98E', marginTop: 2 },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  eventContent: { flex: 1, marginRight: 12 },
  eventName: { fontSize: 15, fontWeight: '600' },
  eventVenue: { fontSize: 13, marginTop: 2 },
  eventTime: { fontSize: 12, marginTop: 4 },
  difficultyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  difficultyDot: { width: 6, height: 6, borderRadius: 3 },
  difficultyText: { fontSize: 12, fontWeight: '600' },
  // Event expanded (parking full)
  eventExpanded: {
    borderWidth: 1,
    borderTopWidth: 0,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    padding: 16,
    gap: 8,
  },
  fullWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(220, 76, 76, 0.1)',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  fullWarningText: { fontSize: 13, fontWeight: '600', color: '#DC4C4C', flex: 1 },
  altSectionTitle: { fontSize: 14, fontWeight: '700', marginBottom: 8 },
  altRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
  },
  altInfo: { flex: 1 },
  altName: { fontSize: 14, fontWeight: '600' },
  altMeta: { fontSize: 12, marginTop: 2 },
  altFreq: { fontSize: 11, marginTop: 2 },
  altRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  altConfBadge: {
    backgroundColor: 'rgba(127, 169, 142, 0.15)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  altConfText: { fontSize: 12, fontWeight: '700', color: '#7FA98E' },
  altNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#7FA98E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  transitDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
