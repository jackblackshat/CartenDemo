import React, { useState, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Linking,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useDarkMode } from '../context/DarkModeContext';
import { useNavigationContext } from '../context/NavigationContext';
import { useDemo, DemoOverrides } from '../context/DemoContext';
import { useUserLocation, useRouting, useSpotIntelligence } from '../hooks';
import { BlurView } from 'expo-blur';
import RerouteCard from '../components/RerouteCard';
import DevPanel from '../components/DevPanel';
import type { MapStackParamList } from '../navigation/types';

// San Diego public transit options near Gaslamp Quarter
const TRANSIT_OPTIONS = [
  {
    id: 'trolley_green',
    type: 'trolley' as const,
    name: 'MTS Green Line',
    station: 'Gaslamp Quarter Station',
    walkMinutes: 3,
    frequency: 'Every 15 min',
    icon: 'train-outline' as const,
    color: '#4CAF50',
  },
  {
    id: 'trolley_blue',
    type: 'trolley' as const,
    name: 'MTS Blue Line',
    station: '5th Ave Station',
    walkMinutes: 5,
    frequency: 'Every 12 min',
    icon: 'train-outline' as const,
    color: '#2196F3',
  },
  {
    id: 'bus_3',
    type: 'bus' as const,
    name: 'Bus Route 3',
    station: '5th Ave & Market St',
    walkMinutes: 2,
    frequency: 'Every 20 min',
    icon: 'bus-outline' as const,
    color: '#FF9800',
  },
  {
    id: 'rideshare',
    type: 'rideshare' as const,
    name: 'Rideshare Drop-off',
    station: 'Gaslamp Quarter',
    walkMinutes: 1,
    frequency: 'On demand',
    icon: 'car-outline' as const,
    color: '#9C27B0',
  },
];

// Fallback demo turn-by-turn steps
const DEMO_STEPS = [
  { maneuver: { instruction: 'Head south on 5th Ave', type: 'depart', modifier: 'straight' }, distance: 400, duration: 45 },
  { maneuver: { instruction: 'Turn left onto Market St', type: 'turn', modifier: 'left' }, distance: 600, duration: 90 },
  { maneuver: { instruction: 'Continue onto Park Blvd', type: 'new name', modifier: 'straight' }, distance: 200, duration: 30 },
  { maneuver: { instruction: 'Arrive at destination', type: 'arrive', modifier: '' }, distance: 0, duration: 0 },
];

function getManeuverIcon(maneuver: { type: string; modifier?: string }): string {
  const { type, modifier } = maneuver;
  if (type === 'arrive') return 'flag';
  if (type === 'depart') return 'arrow-up';
  if (modifier?.includes('uturn')) return 'arrow-undo';
  if (modifier?.includes('sharp left') || modifier === 'left') return 'return-up-back';
  if (modifier?.includes('slight left')) return 'arrow-up';
  if (modifier?.includes('sharp right') || modifier === 'right') return 'return-up-forward';
  if (modifier?.includes('slight right')) return 'arrow-up';
  return 'arrow-up';
}

function formatStepDistance(meters: number): string {
  const miles = meters / 1609.34;
  if (miles < 0.1) return `${Math.round(meters * 3.28084)} ft`;
  return `${miles.toFixed(1)} mi`;
}

type NavProp = NativeStackNavigationProp<MapStackParamList>;
type NavRoute = RouteProp<MapStackParamList, 'Navigation'>;

export default function NavigationScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<NavRoute>();
  const { isDark } = useDarkMode();
  const { selectedDestination } = useNavigationContext();
  const { overrides } = useDemo();
  const [isNavigating, setIsNavigating] = useState(false);
  const [isNorthUp, setIsNorthUp] = useState(false);
  const [showDevPanel, setShowDevPanel] = useState(false);
  const [spotTakenNotif, setSpotTakenNotif] = useState(false);
  const [isSheetExpanded, setIsSheetExpanded] = useState(false);
  const notifOpacity = useRef(new Animated.Value(0)).current;
  const cameraRef = useRef<MapboxGL.Camera>(null);
  const [activeDestOverride, setActiveDestOverride] = useState<{name: string; lat: number; lng: number} | null>(null);

  // Draggable sheet animation
  const SCREEN_HEIGHT = Dimensions.get('window').height;
  const COLLAPSED_SNAP = 0;
  const EXPANDED_SNAP = 1;
  const sheetAnim = useRef(new Animated.Value(0)).current;
  const sheetExpandedRef = useRef(false);

  const sheetPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dy) > 8,
      onPanResponderMove: (_, gs) => {
        // Drag up = negative dy = expand; drag down = positive dy = collapse
        if (gs.dy < 0 && !sheetExpandedRef.current) {
          // Dragging up from collapsed — interpolate 0→1
          const progress = Math.min(1, Math.abs(gs.dy) / 200);
          sheetAnim.setValue(progress);
        } else if (gs.dy > 0 && sheetExpandedRef.current) {
          // Dragging down from expanded — interpolate 1→0
          const progress = Math.max(0, 1 - gs.dy / 200);
          sheetAnim.setValue(progress);
        }
      },
      onPanResponderRelease: (_, gs) => {
        const swipeUp = gs.dy < -40 || gs.vy < -0.5;
        const swipeDown = gs.dy > 40 || gs.vy > 0.5;
        if (swipeUp && !sheetExpandedRef.current) {
          sheetExpandedRef.current = true;
          Animated.spring(sheetAnim, { toValue: EXPANDED_SNAP, useNativeDriver: false, friction: 8 }).start(
            () => setIsSheetExpanded(true),
          );
        } else if (swipeDown && sheetExpandedRef.current) {
          sheetExpandedRef.current = false;
          Animated.spring(sheetAnim, { toValue: COLLAPSED_SNAP, useNativeDriver: false, friction: 8 }).start(
            () => setIsSheetExpanded(false),
          );
        } else {
          // Snap back
          const target = sheetExpandedRef.current ? EXPANDED_SNAP : COLLAPSED_SNAP;
          Animated.spring(sheetAnim, { toValue: target, useNativeDriver: false, friction: 8 }).start();
        }
      },
    }),
  ).current;

  const EXPANDED_CONTENT_HEIGHT = Math.min(380, SCREEN_HEIGHT * 0.45);
  const expandedHeight = sheetAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, EXPANDED_CONTENT_HEIGHT],
  });

  const destination = route.params?.destination ?? selectedDestination ?? {
    name: '5th Ave Parking (Gaslamp)',
    lat: 32.7115,
    lng: -117.1600,
  };

  // Nearby street parking spot (slightly offset from destination)
  const parkingSpot = useMemo(() => ({
    name: `Street Parking near ${destination.name.split('—')[0].split('(')[0].trim()}`,
    lat: destination.lat + 0.0005,
    lng: destination.lng - 0.0003,
  }), [destination]);

  // In active navigation, use the override destination if set (from Find Parking)
  const navDest = activeDestOverride ?? destination;

  const { location: userLocation, loading: locationLoading } = useUserLocation(true);

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

  // Fetch spot intelligence for occupancy/parking-full detection and reroute
  const { data: intelligence } = useSpotIntelligence(
    destination ? { lat: destination.lat, lng: destination.lng } : null,
    !!destination,
    demoParams,
  );
  const occupancyRate = intelligence?.lotSummary?.occupancyRate ?? 0;
  const rerouteDecision = intelligence?.rerouteDecision;
  const parkingIsFull = occupancyRate > 0.85;

  // Show spot-taken notification when dev overrides indicate reroute
  const handleDevApply = useCallback((applied: DemoOverrides) => {
    const shouldTrigger =
      applied.forceReroute ||
      applied.cameraSpotAvailable === false ||
      (applied.occupancy !== null && applied.occupancy >= 85);

    if (shouldTrigger) {
      // Brief delay so panel close animation finishes
      setTimeout(() => {
        setSpotTakenNotif(true);
        Animated.timing(notifOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }, 400);
    } else {
      setSpotTakenNotif(false);
      notifOpacity.setValue(0);
    }
  }, []);

  const FALLBACK_ALT = { name: 'Horton Plaza Garage', lat: 32.7138, lng: -117.1614 };

  const handleNotifPress = useCallback(() => {
    const alt = rerouteDecision?.alternative ?? FALLBACK_ALT;
    setSpotTakenNotif(false);
    navigation.navigate('Navigation', {
      destination: { name: alt.name, lat: alt.lat, lng: alt.lng },
    });
  }, [rerouteDecision, navigation]);

  // If the user is far from the destination (>50km), simulate a nearby origin
  // so the route preview shows a realistic local drive, not a 500mi trip
  const routingOrigin = useMemo(() => {
    if (!userLocation || !destination) return userLocation;
    const dLat = userLocation.lat - destination.lat;
    const dLng = userLocation.lng - destination.lng;
    const approxKm = Math.sqrt(dLat * dLat + dLng * dLng) * 111;
    if (approxKm > 50) {
      // Place simulated origin ~1.5km north of destination
      return { lat: destination.lat + 0.013, lng: destination.lng - 0.005 };
    }
    return userLocation;
  }, [userLocation, destination]);

  const { route: routeData, loading: routeLoading } = useRouting(
    routingOrigin ? { lat: routingOrigin.lat, lng: routingOrigin.lng } : null,
    destination ? { lat: destination.lat, lng: destination.lng } : null,
  );

  const durationMins = routeData ? Math.round(routeData.duration / 60) : 8;
  const distanceMiles = routeData ? (routeData.distance / 1609.34).toFixed(1) : '1.2';
  const confidence = 94;
  const arrivalTime = new Date(Date.now() + durationMins * 60000).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const isLoading = locationLoading || routeLoading;

  // Route coordinates come as [lng, lat] from Mapbox API - use directly
  // If API returns nothing, generate a demo route from origin to destination
  const routeCoords: [number, number][] = useMemo(() => {
    if (routeData?.geometry?.coordinates?.length) {
      return routeData.geometry.coordinates;
    }
    // Fallback demo route: origin → jog east → jog south → destination
    const orig = routingOrigin ?? { lat: (destination?.lat ?? 32.7115) + 0.013, lng: (destination?.lng ?? -117.16) - 0.005 };
    const dest = destination ?? { lat: 32.7115, lng: -117.16 };
    const midLat = (orig.lat + dest.lat) / 2;
    const midLng = (orig.lng + dest.lng) / 2;
    return [
      [orig.lng, orig.lat],
      [orig.lng + 0.002, orig.lat - 0.003],
      [midLng + 0.001, midLat],
      [dest.lng - 0.002, dest.lat + 0.003],
      [dest.lng, dest.lat],
    ];
  }, [routeData, routingOrigin, destination]);

  const routeGeoJSON: GeoJSON.FeatureCollection<GeoJSON.LineString> = {
    type: 'FeatureCollection',
    features:
      routeCoords.length > 0
        ? [
            {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: routeCoords,
              },
            },
          ]
        : [],
  };

  // Compute bounding box for overview mode
  // Use routingOrigin (simulated near SD) instead of real userLocation (may be in SF)
  const routeBounds = useMemo(() => {
    const points: [number, number][] = [...routeCoords];
    if (routingOrigin) points.push([routingOrigin.lng, routingOrigin.lat]);
    if (destination) points.push([destination.lng, destination.lat]);
    if (points.length < 2) return null;
    const lngs = points.map((p) => p[0]);
    const lats = points.map((p) => p[1]);
    return {
      ne: [Math.max(...lngs), Math.max(...lats)] as [number, number],
      sw: [Math.min(...lngs), Math.min(...lats)] as [number, number],
    };
  }, [routeCoords, routingOrigin, destination]);

  // Turn-by-turn step data
  const steps = (routeData?.legs?.[0]?.steps?.length ?? 0) > 0
    ? routeData!.legs[0].steps
    : DEMO_STEPS;
  const currentStep = steps[0] ?? null;
  const nextStep = steps.length > 1 ? steps[1] : null;

  // Check if user is near route (for camera follow mode vs. demo static camera)
  const isUserNearRoute = useMemo(() => {
    if (!userLocation || routeCoords.length === 0) return true;
    const [lng, lat] = routeCoords[0];
    const dLat = userLocation.lat - lat;
    const dLng = userLocation.lng - lng;
    return Math.sqrt(dLat * dLat + dLng * dLng) * 111 < 50;
  }, [userLocation, routeCoords]);

  // Initial bearing from route start (for demo camera when user is far)
  const initialBearing = useMemo(() => {
    if (routeCoords.length < 2) return 0;
    const [lng1, lat1] = routeCoords[0];
    const [lng2, lat2] = routeCoords[Math.min(5, routeCoords.length - 1)];
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const lat1R = (lat1 * Math.PI) / 180;
    const lat2R = (lat2 * Math.PI) / 180;
    const y = Math.sin(dLng) * Math.cos(lat2R);
    const x = Math.cos(lat1R) * Math.sin(lat2R) - Math.sin(lat1R) * Math.cos(lat2R) * Math.cos(dLng);
    return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
  }, [routeCoords]);

  if (!isNavigating) {
    return (
      <View style={styles.flex}>
        {/* Full-screen map */}
        <MapboxGL.MapView
          style={StyleSheet.absoluteFill}
          styleURL={isDark ? MapboxGL.StyleURL.Dark : MapboxGL.StyleURL.Street}
          logoEnabled={false}
          attributionEnabled={false}
          compassEnabled={false}
        >
          {routeBounds ? (
            <MapboxGL.Camera
              bounds={{
                ne: routeBounds.ne,
                sw: routeBounds.sw,
                paddingTop: 200,
                paddingBottom: 180,
                paddingLeft: 60,
                paddingRight: 60,
              }}
              animationMode="flyTo"
              animationDuration={1000}
            />
          ) : (
            <MapboxGL.Camera
              centerCoordinate={[
                destination?.lng ?? -117.1600,
                destination?.lat ?? 32.7115,
              ]}
              zoomLevel={15}
              animationMode="flyTo"
              animationDuration={1000}
            />
          )}
          <MapboxGL.UserLocation visible />
          {destination && (
            <MapboxGL.ShapeSource
              id="destPoint"
              shape={{ type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [destination.lng, destination.lat] } }}
            >
              <MapboxGL.CircleLayer
                id="destCircle"
                style={{ circleRadius: 8, circleColor: '#7FA98E', circleStrokeWidth: 3, circleStrokeColor: '#FFFFFF' }}
              />
            </MapboxGL.ShapeSource>
          )}
          {routeCoords.length > 0 && (
            <MapboxGL.ShapeSource id="routeSource" shape={routeGeoJSON}>
              <MapboxGL.LineLayer
                id="routeLineShadow"
                style={{
                  lineColor: 'rgba(74, 130, 98, 0.3)',
                  lineWidth: 10,
                  lineCap: 'round',
                  lineJoin: 'round',
                }}
              />
              <MapboxGL.LineLayer
                id="routeLine"
                style={{
                  lineColor: '#7FA98E',
                  lineWidth: 5,
                  lineCap: 'round',
                  lineJoin: 'round',
                }}
              />
            </MapboxGL.ShapeSource>
          )}
        </MapboxGL.MapView>

        {isLoading && (
          <View style={styles.loadingOverlay}>
            <View style={[styles.loadingPill, { backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF' }]}>
              <ActivityIndicator size="small" color="#7FA98E" />
              <Text style={{ color: isDark ? '#F5F5F7' : '#4A4F55' }}>Calculating route...</Text>
            </View>
          </View>
        )}

        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.closeBtn, {
            backgroundColor: isDark ? 'rgba(58, 58, 60, 0.7)' : 'rgba(255, 255, 255, 0.7)',
            borderColor: isDark ? 'rgba(72, 72, 74, 0.4)' : 'rgba(255, 255, 255, 0.4)',
          }]}
        >
          <Ionicons name="close" size={20} color={isDark ? '#F5F5F7' : '#4A4F55'} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setShowDevPanel(true)}
          style={[styles.devBtn, {
            backgroundColor: isDark ? 'rgba(58, 58, 60, 0.7)' : 'rgba(255, 255, 255, 0.7)',
            borderColor: isDark ? 'rgba(72, 72, 74, 0.4)' : 'rgba(255, 255, 255, 0.4)',
          }]}
        >
          <Ionicons name="construct" size={20} color={isDark ? '#F5F5F7' : '#4A4F55'} />
        </TouchableOpacity>

        {/* Reroute banner floating above bottom bar */}
        {rerouteDecision?.shouldReroute && rerouteDecision?.alternative && (
          <View style={styles.previewRerouteWrap}>
            <RerouteCard
              decision={rerouteDecision}
              onReroute={() => {
                const alt = rerouteDecision.alternative;
                if (alt) {
                  navigation.navigate('Navigation', {
                    destination: { name: alt.name, lat: alt.lat, lng: alt.lng },
                  });
                }
              }}
              onDismiss={() => {}}
            />
          </View>
        )}

        {/* Draggable bottom sheet */}
        <View style={[styles.bottomSheet, {
          backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF',
          borderTopColor: isDark ? '#3A3A3C' : '#D3D5D7',
        }]}>
          {/* Drag handle */}
          <View style={styles.handle} {...sheetPanResponder.panHandlers}>
            <View style={[styles.handleBar, { backgroundColor: isDark ? '#48484A' : '#D1D1D6' }]} />
          </View>

          {/* Destination + stats (always visible) */}
          <View style={styles.sheetBody}>
            <View style={[styles.destPill, {
              backgroundColor: isDark ? '#3A3A3C' : '#F5F1E8',
              borderColor: isDark ? '#48484A' : '#D3D5D7',
            }]}>
              <View style={styles.destDot}>
                <Ionicons name="location" size={22} color="#FFFFFF" />
              </View>
              <View style={styles.destText}>
                <Text style={[styles.destName, { color: isDark ? '#F5F5F7' : '#4A4F55' }]} numberOfLines={1}>
                  {destination?.name || 'Loading...'}
                </Text>
                <Text style={[styles.destCoords, { color: isDark ? '#AEAEB2' : '#8A8D91' }]}>
                  {durationMins} min · {distanceMiles} mi · ETA {arrivalTime}
                </Text>
              </View>
              <View style={[styles.previewConfBadge, { backgroundColor: 'rgba(127, 169, 142, 0.15)' }]}>
                <Text style={styles.previewConfText}>{confidence}%</Text>
              </View>
            </View>

            {/* Action buttons (always visible) */}
            <View style={styles.previewActions}>
              <TouchableOpacity
                onPress={() => {
                  setActiveDestOverride(parkingSpot);
                  setIsNavigating(true);
                }}
                disabled={isLoading}
                style={[styles.previewStartBtn, isLoading && { opacity: 0.5 }]}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="car" size={20} color="#FFFFFF" />
                )}
                <Text style={styles.previewStartText}>{isLoading ? 'Loading...' : 'Find Parking'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setIsNavigating(true)}
                disabled={isLoading}
                style={[styles.previewNavBtn, isLoading && { opacity: 0.5 }, {
                  borderColor: isDark ? 'rgba(72, 72, 74, 0.6)' : 'rgba(127, 169, 142, 0.4)',
                }]}
              >
                <Ionicons name="navigate" size={18} color="#7FA98E" />
                <Text style={styles.previewNavText}>Exact Spot</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Animated expandable content — drag up to reveal */}
          <Animated.View style={{ height: expandedHeight, overflow: 'hidden' }}>
            <ScrollView
              style={styles.expandedScroll}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled
              scrollEnabled={isSheetExpanded}
            >
              {/* Stats row */}
              <View style={styles.statsRow}>
                {[
                  { value: `${durationMins}`, label: 'MIN', color: '#7FA98E' },
                  { value: `${distanceMiles}`, label: 'MILES', color: isDark ? '#F5F5F7' : '#4A4F55' },
                  { value: `${confidence}%`, label: 'CONFIDENCE', color: '#7FA98E' },
                ].map((s, i) => (
                  <View key={i} style={[styles.statCard, {
                    backgroundColor: isDark ? '#3A3A3C' : '#F5F1E8',
                    borderColor: isDark ? '#48484A' : '#D3D5D7',
                  }]}>
                    <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
                    <Text style={[styles.statLabel, { color: isDark ? '#AEAEB2' : '#8A8D91' }]}>{s.label}</Text>
                  </View>
                ))}
              </View>

              {/* Street Rules */}
              <View style={[styles.infoContainer, {
                backgroundColor: isDark ? '#3A3A3C' : '#F5F1E8',
                borderColor: isDark ? '#48484A' : '#D3D5D7',
              }]}>
                <Text style={[styles.sectionTitle, { color: isDark ? '#F5F5F7' : '#4A4F55' }]}>
                  <Ionicons name="document-text-outline" size={16} /> Street Rules
                </Text>
                {[
                  { icon: 'time-outline' as const, label: 'Time Limit', value: '2 hour max' },
                  { icon: 'calendar-outline' as const, label: 'Hours', value: 'Mon-Sat 8AM-6PM' },
                  { icon: 'card-outline' as const, label: 'Permit', value: 'No permit required' },
                  { icon: 'water-outline' as const, label: 'Sweeping', value: 'Wed 8-10 AM' },
                ].map((rule, i) => (
                  <View key={i} style={styles.infoRow}>
                    <View style={styles.infoLeft}>
                      <Ionicons name={rule.icon} size={16} color={isDark ? '#AEAEB2' : '#8A8D91'} />
                      <Text style={[styles.infoLabel, { color: isDark ? '#AEAEB2' : '#8A8D91' }]}>{rule.label}</Text>
                    </View>
                    <Text style={[styles.infoValue, { color: isDark ? '#F5F5F7' : '#4A4F55' }]}>{rule.value}</Text>
                  </View>
                ))}
              </View>

              {/* Turnover */}
              <View style={[styles.infoContainer, {
                backgroundColor: isDark ? '#3A3A3C' : '#F5F1E8',
                borderColor: isDark ? '#48484A' : '#D3D5D7',
              }]}>
                <Text style={[styles.sectionTitle, { color: isDark ? '#F5F5F7' : '#4A4F55' }]}>
                  <Ionicons name="refresh-outline" size={16} /> Spot Turnover
                </Text>
                <View style={styles.turnoverStatsRow}>
                  {[
                    { value: '25 min', label: 'Avg Duration' },
                    { value: 'Fast', label: 'Turnover Rate' },
                    { value: '~4 min', label: 'Est. Wait' },
                  ].map((t, i) => (
                    <View key={i} style={[styles.turnoverStatCard, {
                      backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF',
                    }]}>
                      <Text style={[styles.turnoverStatVal, { color: '#7FA98E' }]}>{t.value}</Text>
                      <Text style={[styles.turnoverStatLbl, { color: isDark ? '#AEAEB2' : '#8A8D91' }]}>{t.label}</Text>
                    </View>
                  ))}
                </View>
                <Text style={[styles.turnoverContext, { color: isDark ? '#AEAEB2' : '#8A8D91' }]}>
                  Cars here stay ~25 min on average. Spots free up frequently during evenings.
                </Text>
              </View>

              {/* Transit options */}
              <View style={[styles.infoContainer, {
                backgroundColor: isDark ? '#3A3A3C' : '#F5F1E8',
                borderColor: isDark ? '#48484A' : '#D3D5D7',
              }]}>
                <Text style={[styles.sectionTitle, { color: isDark ? '#F5F5F7' : '#4A4F55' }]}>
                  <Ionicons name="bus-outline" size={16} /> Nearby Transit
                </Text>
                {TRANSIT_OPTIONS.slice(0, 3).map((t) => (
                  <View key={t.id} style={[styles.transitOption, {
                    backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF',
                    borderColor: isDark ? '#48484A' : '#D3D5D7',
                  }]}>
                    <View style={[styles.transitIcon, { backgroundColor: t.color + '20' }]}>
                      <Ionicons name={t.icon} size={20} color={t.color} />
                    </View>
                    <View style={styles.transitInfo}>
                      <Text style={[styles.transitName, { color: isDark ? '#F5F5F7' : '#4A4F55' }]}>{t.name}</Text>
                      <Text style={[styles.transitStation, { color: isDark ? '#AEAEB2' : '#8A8D91' }]}>{t.station} · {t.walkMinutes} min walk</Text>
                    </View>
                    <Text style={[styles.transitFreq, { color: isDark ? '#AEAEB2' : '#8A8D91' }]}>{t.frequency}</Text>
                  </View>
                ))}
              </View>

              <View style={{ height: 20 }} />
            </ScrollView>
          </Animated.View>
        </View>

        {/* Spot taken notification */}
        {spotTakenNotif && (
          <Animated.View style={[styles.spotTakenNotif, { opacity: notifOpacity }]}>
            <TouchableOpacity
              onPress={handleNotifPress}
              style={styles.spotTakenPill}
              activeOpacity={0.8}
            >
              <Ionicons name="warning" size={16} color="#FFFFFF" />
              <Text style={styles.spotTakenText} numberOfLines={1}>
                Spot taken — tap to reroute to {rerouteDecision?.alternative?.name ?? FALLBACK_ALT.name}
              </Text>
              <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </Animated.View>
        )}

        <DevPanel visible={showDevPanel} onClose={() => setShowDevPanel(false)} onApply={handleDevApply} />
      </View>
    );
  }

  // Active navigation
  return (
    <View style={[styles.flex, { backgroundColor: isDark ? '#1C1C1E' : '#F5F1E8' }]}>
      <MapboxGL.MapView
        style={styles.flex}
        styleURL={isDark ? MapboxGL.StyleURL.Dark : MapboxGL.StyleURL.Street}
        logoEnabled={false}
        attributionEnabled={false}
        compassEnabled={false}
      >
        {isUserNearRoute ? (
          <MapboxGL.Camera
            ref={cameraRef}
            followUserLocation
            followUserMode={isNorthUp ? 'normal' : 'course'}
            followPitch={isNorthUp ? 0 : 60}
            followZoomLevel={isNorthUp ? 15 : 16}
            animationMode="flyTo"
            animationDuration={500}
          />
        ) : (
          <MapboxGL.Camera
            ref={cameraRef}
            centerCoordinate={routeCoords[0] ?? [navDest.lng, navDest.lat]}
            heading={isNorthUp ? 0 : initialBearing}
            pitch={isNorthUp ? 0 : 60}
            zoomLevel={isNorthUp ? 15 : 16}
            animationMode="flyTo"
            animationDuration={500}
          />
        )}
        <MapboxGL.ShapeSource id="routeSourceActive" shape={routeGeoJSON}>
          <MapboxGL.LineLayer
            id="routeLineActive"
            style={{
              lineColor: '#4A90D9',
              lineWidth: 6,
              lineCap: 'round',
              lineJoin: 'round',
            }}
          />
        </MapboxGL.ShapeSource>
        <MapboxGL.UserLocation visible renderMode="native" />
        {navDest && (
          <MapboxGL.ShapeSource
            id="destPointActive"
            shape={{ type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [navDest.lng, navDest.lat] } }}
          >
            <MapboxGL.CircleLayer
              id="destCircleActive"
              style={{ circleRadius: 8, circleColor: '#7FA98E', circleStrokeWidth: 3, circleStrokeColor: '#FFFFFF' }}
            />
          </MapboxGL.ShapeSource>
        )}
      </MapboxGL.MapView>

      {/* Direction banner — frosted glass */}
      <View style={styles.directionPanel}>
        <View style={styles.directionMain}>
          <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(74, 130, 98, 0.55)' }]} />
          <View style={styles.directionMainContent}>
            <View style={styles.directionIconWrap}>
              <Ionicons
                name={(currentStep ? getManeuverIcon(currentStep.maneuver) : 'arrow-up') as any}
                size={30}
                color="#FFFFFF"
              />
            </View>
            <View style={styles.directionTextWrap}>
              <Text style={styles.directionInstruction} numberOfLines={2}>
                {currentStep?.maneuver.instruction ?? `Head toward ${navDest?.name ?? 'destination'}`}
              </Text>
            </View>
            <Text style={styles.directionStepDist}>
              {currentStep ? formatStepDistance(currentStep.distance) : `${distanceMiles} mi`}
            </Text>
          </View>
        </View>
        {nextStep && (
          <View style={styles.directionNext}>
            <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(44, 44, 46, 0.5)' }]} />
            <View style={styles.directionNextContent}>
              <Text style={styles.directionNextLabel}>Then</Text>
              <Ionicons
                name={getManeuverIcon(nextStep.maneuver) as any}
                size={16}
                color="#AEAEB2"
              />
              <Text style={styles.directionNextText} numberOfLines={1}>
                {nextStep.maneuver.instruction}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Right side map buttons */}
      <View style={styles.mapButtonsRight}>
        <TouchableOpacity
          onPress={() => setShowDevPanel(true)}
          style={[styles.mapRoundBtn, {
            backgroundColor: isDark ? 'rgba(44, 44, 46, 0.9)' : 'rgba(255, 255, 255, 0.9)',
          }]}
        >
          <Ionicons name="construct" size={20} color={isDark ? '#F5F5F7' : '#4A4F55'} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setIsNorthUp(!isNorthUp)}
          style={[styles.mapRoundBtn, {
            backgroundColor: isDark ? 'rgba(44, 44, 46, 0.9)' : 'rgba(255, 255, 255, 0.9)',
          }]}
        >
          <Ionicons
            name={isNorthUp ? 'compass' : 'compass-outline'}
            size={24}
            color={isNorthUp ? '#7FA98E' : (isDark ? '#F5F5F7' : '#4A4F55')}
          />
        </TouchableOpacity>
      </View>

      {/* Recenter button — only visible when north-up mode is active */}
      {isNorthUp && (
        <TouchableOpacity
          onPress={() => setIsNorthUp(false)}
          style={[styles.recenterBtn, {
            backgroundColor: isDark ? 'rgba(44, 44, 46, 0.9)' : 'rgba(255, 255, 255, 0.9)',
          }]}
        >
          <Ionicons name="locate" size={24} color="#7FA98E" />
        </TouchableOpacity>
      )}

      {/* Reroute banner */}
      {rerouteDecision?.shouldReroute && rerouteDecision?.alternative && (
        <TouchableOpacity
          onPress={() => {
            const alt = rerouteDecision.alternative;
            if (alt) {
              navigation.navigate('Navigation', {
                destination: { name: alt.name, lat: alt.lat, lng: alt.lng },
              });
            }
          }}
          style={[styles.rerouteBanner, {
            backgroundColor: isDark ? 'rgba(201, 169, 110, 0.95)' : 'rgba(201, 169, 110, 0.95)',
            borderColor: '#C9A96E',
          }]}
          activeOpacity={0.8}
        >
          <Ionicons name="swap-horizontal" size={20} color="#4A4F55" />
          <Text style={styles.rerouteBannerText} numberOfLines={1}>
            Lot full – tap to reroute to {rerouteDecision.alternative?.name}
          </Text>
        </TouchableOpacity>
      )}

      {/* Bottom ETA bar — frosted glass */}
      <View style={[styles.navBottomBar, { borderTopColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
        <BlurView intensity={80} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, {
          backgroundColor: isDark ? 'rgba(44, 44, 46, 0.4)' : 'rgba(255, 255, 255, 0.4)',
        }]} />
        <View style={styles.navBottomContent}>
          <View style={styles.navBottomStats}>
            <View style={styles.navBottomStatItem}>
              <Text style={styles.navBottomValueGreen}>{durationMins}</Text>
              <Text style={[styles.navBottomLabel, { color: isDark ? '#AEAEB2' : '#8A8D91' }]}>min</Text>
            </View>
            <View style={[styles.navBottomDivider, { backgroundColor: isDark ? '#48484A' : '#D1D1D6' }]} />
            <View style={styles.navBottomStatItem}>
              <Text style={[styles.navBottomValue, { color: isDark ? '#F5F5F7' : '#4A4F55' }]}>{distanceMiles}</Text>
              <Text style={[styles.navBottomLabel, { color: isDark ? '#AEAEB2' : '#8A8D91' }]}>mi</Text>
            </View>
            <View style={[styles.navBottomDivider, { backgroundColor: isDark ? '#48484A' : '#D1D1D6' }]} />
            <View style={styles.navBottomStatItem}>
              <Text style={[styles.navBottomValue, { color: isDark ? '#F5F5F7' : '#4A4F55' }]}>{arrivalTime}</Text>
              <Text style={[styles.navBottomLabel, { color: isDark ? '#AEAEB2' : '#8A8D91' }]}>arrival</Text>
            </View>
          </View>
          <View style={styles.navBottomActions}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.navEndBtn}>
              <Text style={styles.navEndBtnText}>End</Text>
            </TouchableOpacity>
            <Text style={[styles.navBottomDest, { color: isDark ? '#AEAEB2' : '#8A8D91' }]} numberOfLines={1}>
              {navDest?.name ?? 'Destination'}
            </Text>
          </View>
        </View>
      </View>

      {/* Spot taken notification */}
      {spotTakenNotif && (
        <Animated.View style={[styles.spotTakenNotif, { opacity: notifOpacity }]}>
          <TouchableOpacity
            onPress={handleNotifPress}
            style={styles.spotTakenPill}
            activeOpacity={0.8}
          >
            <Ionicons name="warning" size={16} color="#FFFFFF" />
            <Text style={styles.spotTakenText} numberOfLines={1}>
              Spot taken — tap to reroute to {rerouteDecision?.alternative?.name ?? FALLBACK_ALT.name}
            </Text>
            <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </Animated.View>
      )}

      <DevPanel visible={showDevPanel} onClose={() => setShowDevPanel(false)} onApply={handleDevApply} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  loadingPill: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16,
  },
  closeBtn: {
    position: 'absolute', top: 56, left: 16,
    width: 44, height: 44, borderRadius: 22, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  devBtn: {
    position: 'absolute', top: 56, right: 16,
    width: 44, height: 44, borderRadius: 22, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  // Bottom sheet (expandable)
  bottomSheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderTopWidth: 1,
  },
  handle: { paddingTop: 14, paddingBottom: 10, alignItems: 'center' },
  handleBar: { width: 40, height: 5, borderRadius: 3 },
  sheetBody: { paddingHorizontal: 20, paddingBottom: 20 },
  destPill: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderRadius: 20, borderWidth: 1, marginBottom: 14,
  },
  destDot: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#7FA98E',
    alignItems: 'center', justifyContent: 'center',
  },
  destText: { flex: 1 },
  destName: { fontSize: 17, fontWeight: '700' },
  destCoords: { fontSize: 13, marginTop: 2 },
  previewConfBadge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
  },
  previewConfText: { fontSize: 13, fontWeight: '700', color: '#7FA98E' },
  previewActions: {
    flexDirection: 'row', gap: 10,
  },
  previewStartBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: '#7FA98E', borderRadius: 24,
    paddingVertical: 14,
  },
  previewStartText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  previewNavBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, borderRadius: 24, borderWidth: 1.5,
    paddingHorizontal: 18, paddingVertical: 14,
  },
  previewNavText: { fontSize: 14, fontWeight: '700', color: '#7FA98E' },
  previewRerouteWrap: {
    position: 'absolute', bottom: 220, left: 16, right: 16, zIndex: 10,
  },
  // Expanded content
  expandedScroll: { paddingHorizontal: 20, maxHeight: 340 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: {
    flex: 1, borderRadius: 16, borderWidth: 1, padding: 12, alignItems: 'center',
  },
  statValue: { fontSize: 22, fontWeight: '700' },
  statLabel: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', marginTop: 2 },
  sectionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 12 },
  infoContainer: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 16, gap: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoLabel: { fontSize: 13, fontWeight: '500' },
  infoValue: { fontSize: 13, fontWeight: '700' },
  turnoverStatsRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  turnoverStatCard: { flex: 1, borderRadius: 12, padding: 10, alignItems: 'center' },
  turnoverStatVal: { fontSize: 16, fontWeight: '700' },
  turnoverStatLbl: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', marginTop: 2 },
  turnoverContext: { fontSize: 12, lineHeight: 18 },
  // Direction banner (Google Maps style top bar)
  directionPanel: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  directionMain: {
    overflow: 'hidden',
  },
  directionMainContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 58,
    paddingBottom: 16,
    paddingHorizontal: 16,
    gap: 14,
  },
  directionIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  directionTextWrap: { flex: 1 },
  directionInstruction: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  directionStepDist: { fontSize: 16, fontWeight: '700', color: 'rgba(255, 255, 255, 0.8)' },
  directionNext: {
    overflow: 'hidden',
  },
  directionNextContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  directionNextLabel: { fontSize: 13, fontWeight: '600', color: '#AEAEB2' },
  directionNextText: { flex: 1, fontSize: 13, fontWeight: '500', color: '#D1D1D6' },
  // Right-side map buttons
  mapButtonsRight: {
    position: 'absolute',
    right: 16,
    top: 200,
    gap: 10,
    zIndex: 5,
  },
  mapRoundBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  recenterBtn: {
    position: 'absolute',
    bottom: 170,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 5,
  },
  rerouteBanner: {
    position: 'absolute',
    bottom: 170,
    left: 16,
    right: 80,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    zIndex: 5,
  },
  rerouteBannerText: { fontSize: 14, fontWeight: '600', color: '#4A4F55', flex: 1 },
  // Bottom ETA bar
  navBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
    borderTopWidth: 1,
  },
  navBottomContent: {
    paddingBottom: 34,
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  navBottomStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  navBottomStatItem: { flex: 1, alignItems: 'center' },
  navBottomValueGreen: { fontSize: 24, fontWeight: '700', color: '#7FA98E' },
  navBottomValue: { fontSize: 20, fontWeight: '700' },
  navBottomLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', marginTop: 2 },
  navBottomDivider: { width: 1, height: 28 },
  navBottomActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  navEndBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(184, 124, 124, 0.12)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  navEndBtnText: { fontSize: 14, fontWeight: '700', color: '#B87C7C' },
  navBottomDest: { flex: 1, fontSize: 13, fontWeight: '500', textAlign: 'right' },
  transitContainer: {
    borderRadius: 24, borderWidth: 1, padding: 16, marginBottom: 20,
  },
  transitHeader: { marginBottom: 12 },
  transitWarning: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  transitTitle: { fontSize: 16, fontWeight: '700' },
  transitSubtitle: { fontSize: 13, marginTop: 4, marginLeft: 26 },
  transitOption: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 12, borderRadius: 16, borderWidth: 1, marginBottom: 8,
  },
  transitIcon: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  transitInfo: { flex: 1 },
  transitName: { fontSize: 14, fontWeight: '600' },
  transitStation: { fontSize: 12, marginTop: 2 },
  transitFreq: { fontSize: 11, fontWeight: '600' },
  spotTakenNotif: {
    position: 'absolute',
    top: 110,
    right: 16,
    left: 16,
    zIndex: 20,
  },
  spotTakenPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#B87C7C',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  spotTakenText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
