import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Animated,
  PanResponder,
} from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useDarkMode } from '../context/DarkModeContext';
import { useDemo } from '../context/DemoContext';
import { useUserLocation } from '../hooks/useUserLocation';
import useSpotIntelligence from '../hooks/useSpotIntelligence';
import { useNavigationContext } from '../context/NavigationContext';
import { usePhoneDataCollector } from '../lib/PhoneDataCollectorProvider';
import { fetchParkingWithFallback, fetchCrowdsourceSpots } from '../services/api';
import SpotCard from '../components/SpotCard';
import SpotMarkers from '../components/SpotMarkers';
import SpotRecommendationPanel from '../components/SpotRecommendationPanel';
import RerouteCard from '../components/RerouteCard';
import CrowdsourcePrompt from '../components/CrowdsourcePrompt';
import LeavingModal from '../components/LeavingModal';
import DevPanel from '../components/DevPanel';
import type { ParkingSpot, CrowdsourceSpot } from '../types';
import type { MapStackParamList } from '../navigation/types';

type NavProp = NativeStackNavigationProp<MapStackParamList>;

const fallbackSpots: ParkingSpot[] = [
  {
    id: '1',
    street: '5th Ave (Gaslamp)',
    distance: '0.2 mi',
    confidence: 94,
    type: 'street',
    status: 'available',
    timeValid: '~5 mins',
    timeLimit: '2hr max',
    sources: ['camera', 'crowd'],
    lat: 32.7120,
    lng: -117.1598,
  },
  {
    id: '2',
    street: 'Island Ave',
    distance: '0.4 mi',
    confidence: 87,
    type: 'street',
    status: 'prediction',
    timeValid: '~8 mins',
    timeLimit: '3hr max',
    sources: ['prediction', 'api'],
    lat: 32.7100,
    lng: -117.1580,
  },
  {
    id: '3',
    street: 'Horton Plaza Garage',
    distance: '0.6 mi',
    confidence: 99,
    type: 'garage',
    status: 'paid',
    timeValid: 'Real-time',
    price: '$4/hr',
    sources: ['api'],
    lat: 32.7138,
    lng: -117.1614,
  },
];

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Bottom sheet snap points (distance from bottom of screen)
const SNAP_COLLAPSED = SCREEN_HEIGHT * 0.35;
const SNAP_HALF = SCREEN_HEIGHT * 0.55;
const SNAP_EXPANDED = SCREEN_HEIGHT * 0.85;

export default function MapHomeScreen() {
  const navigation = useNavigation<NavProp>();
  const { isDark } = useDarkMode();
  const phoneData = usePhoneDataCollector();
  const { overrides, hasOverrides } = useDemo();

  const [filters, setFilters] = useState<string[]>(['Free', 'Paid', 'Garage', 'Street']);
  const [showLeavingModal, setShowLeavingModal] = useState(false);
  const [showParkedModal, setShowParkedModal] = useState(false);
  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(null);
  const [showRerouteCard, setShowRerouteCard] = useState(true);
  const [showDevPanel, setShowDevPanel] = useState(false);
  const { selectedDestination } = useNavigationContext();


  // API state
  const [spots, setSpots] = useState<ParkingSpot[]>(fallbackSpots);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Crowdsource state
  const [crowdsourcePrompt, setCrowdsourcePrompt] = useState<{
    id: string;
    name: string;
    lat: number;
    lng: number;
  } | null>(null);

  const { location, loading: locationLoading } = useUserLocation(true);

  // Spot intelligence: fetches ML-ranked spots from nearest camera
  // Stabilize coords reference to avoid infinite re-fetch loop
  const rawCoords = selectedDestination ?? location;
  const stableLat = rawCoords?.lat ?? null;
  const stableLng = rawCoords?.lng ?? null;
  const intelligenceCoords = useMemo(
    () => (stableLat && stableLng ? { lat: stableLat, lng: stableLng } : null),
    [stableLat, stableLng],
  );
  const demoParams = useMemo(
    () => ({
      occupancy: overrides.occupancy,
      traffic: overrides.traffic,
      forceReroute: overrides.forceReroute,
      cameraSpotAvailable: overrides.cameraSpotAvailable,
      phoneSpotFree: overrides.phoneSpotFree,
      workScenario: overrides.workScenario,
      parkingDuration: overrides.parkingDuration,
    }),
    [overrides.occupancy, overrides.traffic, overrides.forceReroute, overrides.cameraSpotAvailable, overrides.phoneSpotFree, overrides.workScenario, overrides.parkingDuration],
  );
  const { data: intelligence } = useSpotIntelligence(
    intelligenceCoords,
    !!intelligenceCoords,
    demoParams,
  );

  // --- Draggable bottom sheet ---
  const sheetHeight = useRef(new Animated.Value(SNAP_HALF)).current;
  const lastSnap = useRef(SNAP_HALF);
  const scrollRef = useRef<ScrollView>(null);
  const [scrollEnabled, setScrollEnabled] = useState(true);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gestureState) =>
          Math.abs(gestureState.dy) > 5,
        onPanResponderGrant: () => {
          sheetHeight.stopAnimation();
        },
        onPanResponderMove: (_, gestureState) => {
          const newHeight = lastSnap.current - gestureState.dy;
          const clamped = Math.max(SNAP_COLLAPSED, Math.min(SNAP_EXPANDED, newHeight));
          sheetHeight.setValue(clamped);
        },
        onPanResponderRelease: (_, gestureState) => {
          const currentHeight = lastSnap.current - gestureState.dy;
          const velocity = gestureState.vy;

          let targetSnap: number;
          if (velocity < -0.5) {
            // Swiping down (velocity negative = finger moving up on screen, but we invert)
            // Actually vy < 0 means finger moving up = expand
            targetSnap =
              currentHeight < SNAP_HALF ? SNAP_HALF : SNAP_EXPANDED;
          } else if (velocity > 0.5) {
            // Swiping down = collapse
            targetSnap =
              currentHeight > SNAP_HALF ? SNAP_HALF : SNAP_COLLAPSED;
          } else {
            // Snap to nearest
            const snaps = [SNAP_COLLAPSED, SNAP_HALF, SNAP_EXPANDED];
            targetSnap = snaps.reduce((prev, snap) =>
              Math.abs(snap - currentHeight) < Math.abs(prev - currentHeight)
                ? snap
                : prev,
            );
          }

          lastSnap.current = targetSnap;
          setScrollEnabled(targetSnap !== SNAP_COLLAPSED);

          Animated.spring(sheetHeight, {
            toValue: targetSnap,
            useNativeDriver: false,
            damping: 20,
            stiffness: 200,
          }).start();
        },
      }),
    [],
  );

  // Listen for phone data events (crowdsource prompts)
  useEffect(() => {
    if (!phoneData) return;
    const unsubscribe = phoneData.onTrigger((event: any) => {
      if (event?.type === 'CROWDSOURCE_PROMPT' && event?.data?.spot) {
        setCrowdsourcePrompt(event.data.spot);
      }
    });
    return unsubscribe;
  }, [phoneData]);

  // Fetch parking data
  useEffect(() => {
    async function fetchData() {
      if (!location) return;

      setLoading(true);
      setError(null);

      try {
        const parkingResult = await fetchParkingWithFallback(location);

        if (parkingResult) {
          const apiSpot: ParkingSpot = {
            id: parkingResult.blockId,
            street: parkingResult.name,
            distance: `${(parkingResult.distance / 1609.34).toFixed(1)} mi`,
            confidence: Math.round(parkingResult.probability * 100),
            type: 'street',
            status: parkingResult.probability > 0.7 ? 'available' : 'prediction',
            timeValid: `~${Math.round(parkingResult.exp / 60)} mins`,
            timeLimit: '2hr max',
            sources: ['api'],
            lat: location.lat,
            lng: location.lng,
          };
          setSpots([apiSpot, ...fallbackSpots.slice(1)]);
        } else {
          setSpots(fallbackSpots);
        }
      } catch {
        setSpots(fallbackSpots);
        setError('Using cached data');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [location?.lat, location?.lng]);

  // Fallback if location fails
  useEffect(() => {
    if (!locationLoading && !location && spots.length === 0) {
      setSpots(fallbackSpots);
      setLoading(false);
    }
  }, [locationLoading, location, spots.length]);

  const toggleFilter = (filter: string) => {
    setFilters((prev) =>
      prev.includes(filter)
        ? prev.filter((f) => f !== filter)
        : [...prev, filter],
    );
  };

  const filteredSpots = spots.filter((spot) => {
    if (filters.includes('Free') && spot.status === 'available' && !spot.price)
      return true;
    if (filters.includes('Paid') && (spot.status === 'paid' || spot.price))
      return true;
    if (filters.includes('Garage') && spot.type === 'garage') return true;
    if (filters.includes('Street') && spot.type === 'street') return true;
    return false;
  });

  const handleRefresh = useCallback(async () => {
    if (!location) return;
    setLoading(true);
    try {
      const result = await fetchParkingWithFallback(location);
      if (result) {
        const apiSpot: ParkingSpot = {
          id: result.blockId,
          street: result.name,
          distance: `${(result.distance / 1609.34).toFixed(1)} mi`,
          confidence: Math.round(result.probability * 100),
          type: 'street',
          status: result.probability > 0.7 ? 'available' : 'prediction',
          timeValid: `~${Math.round(result.exp / 60)} mins`,
          timeLimit: '2hr max',
          sources: ['api'],
          lat: location.lat,
          lng: location.lng,
        };
        setSpots([apiSpot, ...fallbackSpots.slice(1)]);
      }
    } catch {
      setError('Failed to refresh');
    } finally {
      setLoading(false);
    }
  }, [location]);

  const getMarkerColor = (spot: ParkingSpot) => {
    if (spot.status === 'available') return '#7FA98E';
    if (spot.status === 'prediction') return '#C9A96E';
    if (spot.status === 'paid') return '#8B9D83';
    return '#B87C7C';
  };

  const spotsGeoJSON: GeoJSON.FeatureCollection = useMemo(() => ({
    type: 'FeatureCollection',
    features: filteredSpots
      .filter((s) => s.lat && s.lng)
      .map((spot) => ({
        type: 'Feature' as const,
        id: spot.id,
        properties: {
          id: spot.id,
          color: getMarkerColor(spot),
          name: spot.street,
        },
        geometry: {
          type: 'Point' as const,
          coordinates: [spot.lng, spot.lat],
        },
      })),
  }), [filteredSpots]);

  const handleMapPress = useCallback((e: any) => {
    const feature = e?.features?.[0];
    if (feature?.properties?.id) {
      const coords = feature.geometry?.coordinates;
      navigation.navigate('SpotDetail', {
        id: feature.properties.id,
        name: feature.properties.name,
        lat: coords?.[1],
        lng: coords?.[0],
      });
    }
  }, [navigation]);

  return (
    <View style={styles.flex}>
      <View style={styles.flex}>
        {/* Map */}
        <MapboxGL.MapView
          style={styles.flex}
          styleURL={isDark ? MapboxGL.StyleURL.Dark : MapboxGL.StyleURL.Street}
          logoEnabled={false}
          attributionEnabled={false}
          compassEnabled={false}
        >
          <MapboxGL.Camera
            centerCoordinate={[-117.1611, 32.7157]}
            zoomLevel={14}
            animationMode="flyTo"
            animationDuration={1000}
          />
          <MapboxGL.UserLocation visible />
          <MapboxGL.ShapeSource
            id="spotsSource"
            shape={spotsGeoJSON}
            onPress={handleMapPress}
          >
            <MapboxGL.CircleLayer
              id="spotsCircle"
              style={{
                circleRadius: 10,
                circleColor: ['get', 'color'],
                circleStrokeWidth: 3,
                circleStrokeColor: '#FFFFFF',
              }}
            />
          </MapboxGL.ShapeSource>
          {/* ML-detected spot markers from camera */}
          {intelligence?.allSpots && (
            <SpotMarkers
              spots={intelligence.allSpots}
              selectedSpotId={selectedSpotId}
              onSpotPress={setSelectedSpotId}
            />
          )}
        </MapboxGL.MapView>

        {/* Top Controls */}
        <View style={styles.topControls}>
          <TouchableOpacity
            onPress={handleRefresh}
            disabled={loading}
            style={[
              styles.controlButton,
              {
                backgroundColor: isDark
                  ? 'rgba(44, 44, 46, 0.95)'
                  : 'rgba(255, 255, 255, 0.95)',
                borderColor: isDark ? '#3A3A3C' : '#D3D5D7',
              },
            ]}
          >
            <Ionicons
              name="refresh"
              size={20}
              color={isDark ? '#AEAEB2' : '#8A8D91'}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('Heatmap')}
            style={[
              styles.controlButton,
              {
                backgroundColor: isDark
                  ? 'rgba(44, 44, 46, 0.95)'
                  : 'rgba(255, 255, 255, 0.95)',
                borderColor: isDark ? '#3A3A3C' : '#D3D5D7',
              },
            ]}
          >
            <Ionicons
              name="layers"
              size={20}
              color={isDark ? '#AEAEB2' : '#8A8D91'}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowDevPanel(true)}
            style={[
              styles.controlButton,
              {
                backgroundColor: isDark
                  ? 'rgba(44, 44, 46, 0.95)'
                  : 'rgba(255, 255, 255, 0.95)',
                borderColor: isDark ? '#3A3A3C' : '#D3D5D7',
              },
            ]}
          >
            <Ionicons
              name="construct"
              size={20}
              color={isDark ? '#AEAEB2' : '#8A8D91'}
            />
          </TouchableOpacity>
        </View>

        {/* Location loading indicator */}
        {locationLoading && (
          <View style={styles.locationStatus}>
            <View
              style={[
                styles.locationPill,
                {
                  backgroundColor: isDark
                    ? 'rgba(44, 44, 46, 0.95)'
                    : 'rgba(255, 255, 255, 0.95)',
                  borderColor: isDark ? '#3A3A3C' : '#D3D5D7',
                },
              ]}
            >
              <ActivityIndicator size="small" color="#7FA98E" />
              <Text
                style={[
                  styles.locationText,
                  { color: isDark ? '#AEAEB2' : '#8A8D91' },
                ]}
              >
                Getting location...
              </Text>
            </View>
          </View>
        )}

        {/* FABs - move with bottom sheet */}
        <Animated.View style={[styles.fabContainer, { bottom: Animated.add(sheetHeight, 16) }]}>
          <TouchableOpacity
            onPress={() => setShowLeavingModal(true)}
            style={[styles.fab, { backgroundColor: '#B87C7C' }]}
          >
            <Ionicons name="log-out-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowParkedModal(true)}
            style={[styles.fab, { backgroundColor: '#7FA98E' }]}
          >
            <Ionicons name="location" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </Animated.View>

        {/* Draggable Bottom Sheet */}
        <Animated.View
          style={[
            styles.bottomSheet,
            {
              height: sheetHeight,
              borderColor: isDark
                ? 'rgba(255, 255, 255, 0.12)'
                : 'rgba(255, 255, 255, 0.6)',
            },
          ]}
        >
          {/* Liquid glass background */}
          <View style={styles.glassContainer}>
            <BlurView
              intensity={40}
              tint={isDark ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor: isDark
                    ? 'rgba(30, 30, 32, 0.25)'
                    : 'rgba(255, 255, 255, 0.2)',
                },
              ]}
            />
            {/* Top highlight edge */}
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 24,
                right: 24,
                height: 1,
                backgroundColor: isDark
                  ? 'rgba(255, 255, 255, 0.15)'
                  : 'rgba(255, 255, 255, 0.8)',
              }}
            />
          </View>

          {/* Drag Handle */}
          <View {...panResponder.panHandlers} style={styles.handleBar}>
            <View
              style={[
                styles.handle,
                {
                  backgroundColor: isDark
                    ? 'rgba(255, 255, 255, 0.25)'
                    : 'rgba(0, 0, 0, 0.15)',
                },
              ]}
            />
          </View>
          {/* Search Bar - pinned */}
          <TouchableOpacity
            onPress={() => navigation.navigate('SearchResults')}
            style={[
              styles.searchBar,
              {
                backgroundColor: isDark ? '#3A3A3C' : '#F5F1E8',
                borderColor: isDark ? '#48484A' : '#D3D5D7',
              },
            ]}
          >
            <Ionicons
              name="search"
              size={20}
              color={isDark ? '#AEAEB2' : '#8A8D91'}
            />
            <Text
              style={{ color: isDark ? '#AEAEB2' : '#8A8D91', fontSize: 15 }}
            >
              Where are you going?
            </Text>
          </TouchableOpacity>

          <ScrollView
            ref={scrollRef}
            scrollEnabled={scrollEnabled}
            contentContainerStyle={styles.sheetContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* Header */}
            <View style={styles.headerRow}>
              <Text
                style={[
                  styles.headerTitle,
                  { color: isDark ? '#F5F5F7' : '#4A4F55' },
                ]}
              >
                {`${filteredSpots.length} spots nearby`}
              </Text>
            </View>

            {/* Filter Chips */}
            <View style={styles.filterRow}>
              {['Free', 'Paid', 'Garage', 'Street'].map((filter) => (
                <TouchableOpacity
                  key={filter}
                  onPress={() => toggleFilter(filter)}
                  style={[
                    styles.filterChip,
                    filters.includes(filter)
                      ? styles.filterActive
                      : {
                          backgroundColor: isDark ? '#3A3A3C' : '#F5F1E8',
                          borderColor: isDark ? '#48484A' : '#D3D5D7',
                        },
                  ]}
                >
                  <Text
                    style={[
                      styles.filterText,
                      {
                        color: filters.includes(filter)
                          ? '#FFFFFF'
                          : isDark
                          ? '#AEAEB2'
                          : '#8A8D91',
                      },
                    ]}
                  >
                    {filter}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Intelligence Panel */}
            {intelligence && (
              <>
                {intelligence.rerouteDecision.shouldReroute && showRerouteCard && (
                  <RerouteCard
                    decision={intelligence.rerouteDecision}
                    onReroute={() => {
                      const alt = intelligence.rerouteDecision.alternative;
                      if (alt) {
                        navigation.navigate('Navigation', {
                          destination: { name: alt.name, lat: alt.lat, lng: alt.lng },
                        });
                      }
                      setShowRerouteCard(false);
                    }}
                    onDismiss={() => setShowRerouteCard(false)}
                  />
                )}
                <SpotRecommendationPanel
                  lotName={intelligence.camera.lotName}
                  lotSummary={intelligence.lotSummary}
                  recommendations={intelligence.recommendations}
                  selectedSpotId={selectedSpotId}
                  onSpotPress={setSelectedSpotId}
                />
                <View style={{ height: 12 }} />
              </>
            )}

            {/* Spot Cards */}
            {loading && (
              <ActivityIndicator
                size="large"
                color="#7FA98E"
                style={styles.loader}
              />
            )}
            {filteredSpots.map((spot) => (
              <SpotCard key={spot.id} spot={spot} />
            ))}
            {filteredSpots.length === 0 && !loading && (
              <View style={styles.emptyState}>
                <Text
                  style={{ color: isDark ? '#AEAEB2' : '#8A8D91', textAlign: 'center' }}
                >
                  No spots match your filters
                </Text>
                <TouchableOpacity
                  onPress={() => setFilters(['Free', 'Paid', 'Garage', 'Street'])}
                >
                  <Text style={styles.clearFilters}>Clear filters</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Bottom padding for tab bar */}
            <View style={{ height: 100 }} />
          </ScrollView>
        </Animated.View>

        {/* Crowdsource Prompt */}
        {crowdsourcePrompt && (
          <CrowdsourcePrompt
            spot={crowdsourcePrompt}
            onResponse={(spotId, isOpen) => {
              (phoneData as any)?.userAction('crowdsource_response', 0);
              setCrowdsourcePrompt(null);
            }}
            onDismiss={() => setCrowdsourcePrompt(null)}
          />
        )}

        {/* Parked Modal */}
        {showParkedModal && (
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.parkedSheet,
                { backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF' },
              ]}
            >
              <View style={styles.parkedHeader}>
                <Text
                  style={[
                    styles.parkedTitle,
                    { color: isDark ? '#F5F5F7' : '#4A4F55' },
                  ]}
                >
                  How long are you staying?
                </Text>
                <TouchableOpacity onPress={() => setShowParkedModal(false)}>
                  <Ionicons
                    name="close"
                    size={24}
                    color={isDark ? '#AEAEB2' : '#8A8D91'}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.durationGrid}>
                {['15m', '30m', '1hr', '2hr'].map((d) => (
                  <TouchableOpacity
                    key={d}
                    onPress={() => {
                      (phoneData as any)?.userAction('parked', parseInt(d));
                      setShowParkedModal(false);
                    }}
                    style={[
                      styles.durationButton,
                      {
                        backgroundColor: isDark ? '#3A3A3C' : '#F5F1E8',
                        borderColor: isDark ? '#48484A' : '#D3D5D7',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.durationText,
                        { color: isDark ? '#F5F5F7' : '#4A4F55' },
                      ]}
                    >
                      {d}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                onPress={() => setShowParkedModal(false)}
                style={styles.notSureButton}
              >
                <Text style={styles.notSureText}>Not sure</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Leaving Modal */}
        <LeavingModal
          visible={showLeavingModal}
          onClose={() => {
            (phoneData as any)?.userAction('leaving', 0);
            setShowLeavingModal(false);
          }}
        />

        {/* Dev Panel */}
        <DevPanel
          visible={showDevPanel}
          onClose={() => setShowDevPanel(false)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  marker: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  topControls: {
    position: 'absolute',
    top: 60,
    right: 16,
    gap: 8,
  },
  controlButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  locationStatus: {
    position: 'absolute',
    top: 60,
    left: 16,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  locationText: {
    fontSize: 12,
  },
  fabContainer: {
    position: 'absolute',
    right: 16,
    gap: 12,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
  glassContainer: {
    ...StyleSheet.absoluteFillObject,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  handleBar: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  handle: {
    width: 48,
    height: 5,
    borderRadius: 3,
  },
  sheetContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 48,
    borderRadius: 24,
    paddingHorizontal: 16,
    borderWidth: 1,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 999,
    alignItems: 'center',
    borderWidth: 1,
  },
  filterActive: {
    backgroundColor: '#7FA98E',
    borderColor: '#7FA98E',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
  },
  loader: {
    marginVertical: 32,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  clearFilters: {
    color: '#7FA98E',
    textDecorationLine: 'underline',
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
    zIndex: 100,
  },
  parkedSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  parkedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  parkedTitle: {
    fontSize: 22,
    fontWeight: '600',
  },
  durationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  durationButton: {
    width: '47%',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  durationText: {
    fontSize: 18,
    fontWeight: '500',
  },
  notSureButton: {
    backgroundColor: '#7FA98E',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  notSureText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
