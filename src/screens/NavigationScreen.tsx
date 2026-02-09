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

type NavProp = NativeStackNavigationProp<MapStackParamList>;
type NavRoute = RouteProp<MapStackParamList, 'Navigation'>;

export default function NavigationScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<NavRoute>();
  const { isDark } = useDarkMode();
  const { selectedDestination } = useNavigationContext();
  const { overrides } = useDemo();
  const [isNavigating, setIsNavigating] = useState(false);
  const [isOverview, setIsOverview] = useState(false);
  const [showDevPanel, setShowDevPanel] = useState(false);
  const [spotTakenNotif, setSpotTakenNotif] = useState(false);
  const notifOpacity = useRef(new Animated.Value(0)).current;
  const cameraRef = useRef<MapboxGL.Camera>(null);

  const destination = route.params?.destination ?? selectedDestination ?? {
    name: '5th Ave Parking (Gaslamp)',
    lat: 32.7115,
    lng: -117.1600,
  };

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
  const routeCoords: [number, number][] =
    routeData?.geometry?.coordinates ?? [];

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
  const routeBounds = useMemo(() => {
    const points: [number, number][] = [...routeCoords];
    if (userLocation) points.push([userLocation.lng, userLocation.lat]);
    if (destination) points.push([destination.lng, destination.lat]);
    if (points.length < 2) return null;
    const lngs = points.map((p) => p[0]);
    const lats = points.map((p) => p[1]);
    return {
      ne: [Math.max(...lngs), Math.max(...lats)] as [number, number],
      sw: [Math.min(...lngs), Math.min(...lats)] as [number, number],
    };
  }, [routeCoords, userLocation, destination]);

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
          <MapboxGL.Camera
            centerCoordinate={[
              destination?.lng ?? -117.1600,
              destination?.lat ?? 32.7115,
            ]}
            zoomLevel={15}
            animationMode="flyTo"
            animationDuration={1000}
          />
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
                id="routeLine"
                style={{
                  lineColor: '#7FA98E',
                  lineWidth: 4,
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

        {/* Bottom sheet */}
        <View style={[styles.bottomSheet, {
          backgroundColor: isDark ? 'rgba(44, 44, 46, 0.8)' : 'rgba(255, 255, 255, 0.8)',
          borderTopColor: isDark ? '#3A3A3C' : '#D3D5D7',
          maxHeight: '75%',
        }]}>
          <View style={styles.handle}>
            <View style={[styles.handleBar, { backgroundColor: isDark ? '#48484A' : '#D3D5D7' }]} />
          </View>

          <ScrollView style={styles.sheetBody} showsVerticalScrollIndicator={false}>
            {/* Destination pill */}
            <View style={[styles.destPill, {
              backgroundColor: isDark ? 'rgba(58, 58, 60, 0.6)' : 'rgba(255, 255, 255, 0.6)',
              borderColor: isDark ? 'rgba(72, 72, 74, 0.6)' : 'rgba(255, 255, 255, 0.6)',
            }]}>
              <View style={styles.destDot} />
              <View style={styles.destText}>
                <Text style={[styles.destName, { color: isDark ? '#F5F5F7' : '#4A4F55' }]} numberOfLines={1}>
                  {destination?.name || 'Loading...'}
                </Text>
                <Text style={[styles.destCoords, { color: isDark ? '#AEAEB2' : '#8A8D91' }]}>
                  {destination ? `${destination.lat.toFixed(4)}, ${destination.lng.toFixed(4)}` : 'Getting location...'}
                </Text>
              </View>
            </View>

            {/* Stats */}
            <View style={styles.statsRow}>
              {[
                { value: `${durationMins}`, label: 'min', color: '#7FA98E' },
                { value: distanceMiles, label: 'miles', color: isDark ? '#F5F5F7' : '#4A4F55' },
                { value: `${confidence}%`, label: 'confident', color: '#7FA98E' },
              ].map((s, i) => (
                <View key={i} style={[styles.statCard, {
                  backgroundColor: isDark ? 'rgba(58, 58, 60, 0.8)' : 'rgba(248, 249, 246, 0.8)',
                  borderColor: isDark ? 'rgba(72, 72, 74, 0.5)' : 'rgba(255, 255, 255, 0.5)',
                }]}>
                  <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
                  <Text style={[styles.statLabel, { color: isDark ? '#AEAEB2' : '#8A8D91' }]}>{s.label}</Text>
                </View>
              ))}
            </View>

            {/* Info rows */}
            <View style={[styles.infoContainer, {
              backgroundColor: isDark ? 'rgba(58, 58, 60, 0.5)' : 'rgba(255, 255, 255, 0.5)',
              borderColor: isDark ? 'rgba(72, 72, 74, 0.5)' : 'rgba(255, 255, 255, 0.5)',
            }]}>
              {[
                { icon: 'time-outline' as const, label: 'Estimated arrival', value: arrivalTime },
                { icon: 'trending-up-outline' as const, label: 'Traffic', value: (overrides.traffic ?? 'light').charAt(0).toUpperCase() + (overrides.traffic ?? 'light').slice(1), valueColor: overrides.traffic === 'heavy' ? '#B87C7C' : overrides.traffic === 'moderate' ? '#C9A96E' : '#7FA98E' },
              ].map((item, i) => (
                <View key={i} style={styles.infoRow}>
                  <View style={styles.infoLeft}>
                    <View style={[styles.infoIcon, {
                      backgroundColor: isDark ? 'rgba(58, 58, 60, 0.6)' : 'rgba(255, 255, 255, 0.6)',
                      borderColor: isDark ? 'rgba(72, 72, 74, 0.6)' : 'rgba(255, 255, 255, 0.6)',
                    }]}>
                      <Ionicons name={item.icon} size={16} color="#7FA98E" />
                    </View>
                    <Text style={[styles.infoLabel, { color: isDark ? '#AEAEB2' : '#8A8D91' }]}>{item.label}</Text>
                  </View>
                  <Text style={[styles.infoValue, { color: item.valueColor ?? (isDark ? '#F5F5F7' : '#4A4F55') }]}>{item.value}</Text>
                </View>
              ))}
            </View>

            {/* Reroute suggestion (camera/occupancy/demo suggests alternative lot) */}
            {rerouteDecision?.shouldReroute && rerouteDecision?.alternative && (
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
            )}

            {/* Transit alternatives when parking is full */}
            {parkingIsFull && (
              <View style={[styles.transitContainer, {
                backgroundColor: isDark ? 'rgba(58, 58, 60, 0.5)' : 'rgba(255, 255, 255, 0.5)',
                borderColor: isDark ? 'rgba(72, 72, 74, 0.5)' : 'rgba(255, 255, 255, 0.5)',
              }]}>
                <View style={styles.transitHeader}>
                  <View style={styles.transitWarning}>
                    <Ionicons name="warning" size={18} color="#B87C7C" />
                    <Text style={[styles.transitTitle, { color: isDark ? '#F5F5F7' : '#4A4F55' }]}>
                      Parking {Math.round(occupancyRate * 100)}% Full
                    </Text>
                  </View>
                  <Text style={[styles.transitSubtitle, { color: isDark ? '#AEAEB2' : '#8A8D91' }]}>
                    Consider public transit alternatives
                  </Text>
                </View>
                {TRANSIT_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.id}
                    style={[styles.transitOption, {
                      backgroundColor: isDark ? 'rgba(44, 44, 46, 0.6)' : 'rgba(248, 249, 246, 0.6)',
                      borderColor: isDark ? 'rgba(72, 72, 74, 0.4)' : 'rgba(211, 213, 215, 0.4)',
                    }]}
                    onPress={() => {
                      if (opt.type === 'rideshare') {
                        Linking.openURL('https://m.uber.com/').catch(() => {});
                      }
                    }}
                    activeOpacity={opt.type === 'rideshare' ? 0.7 : 1}
                  >
                    <View style={[styles.transitIcon, { backgroundColor: opt.color + '20' }]}>
                      <Ionicons name={opt.icon} size={20} color={opt.color} />
                    </View>
                    <View style={styles.transitInfo}>
                      <Text style={[styles.transitName, { color: isDark ? '#F5F5F7' : '#4A4F55' }]}>
                        {opt.name}
                      </Text>
                      <Text style={[styles.transitStation, { color: isDark ? '#AEAEB2' : '#8A8D91' }]}>
                        {opt.station} · {opt.walkMinutes} min walk
                      </Text>
                    </View>
                    <Text style={[styles.transitFreq, { color: isDark ? '#AEAEB2' : '#8A8D91' }]}>
                      {opt.frequency}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Start button */}
            <TouchableOpacity
              onPress={() => setIsNavigating(true)}
              disabled={isLoading}
              style={[styles.startButton, isLoading && { opacity: 0.5 }]}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="navigate" size={24} color="#FFFFFF" />
              )}
              <Text style={styles.startText}>{isLoading ? 'Loading...' : 'Start Navigation'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate('SearchResults')}
              style={[styles.altButton, {
                backgroundColor: isDark ? 'rgba(58, 58, 60, 0.5)' : 'rgba(255, 255, 255, 0.5)',
                borderColor: isDark ? 'rgba(72, 72, 74, 0.6)' : 'rgba(255, 255, 255, 0.6)',
              }]}
            >
              <Text style={styles.altText}>Find Alternative Spot</Text>
            </TouchableOpacity>
          </ScrollView>
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
        {isOverview && routeBounds ? (
          <MapboxGL.Camera
            ref={cameraRef}
            bounds={{
              ne: routeBounds.ne,
              sw: routeBounds.sw,
              paddingTop: 120,
              paddingBottom: 120,
              paddingLeft: 60,
              paddingRight: 60,
            }}
            animationMode="flyTo"
            animationDuration={800}
          />
        ) : routeCoords.length > 0 ? (
          <MapboxGL.Camera
            ref={cameraRef}
            bounds={{
              ne: [
                Math.max(routeCoords[0][0], routeCoords[routeCoords.length - 1][0]) + 0.002,
                Math.max(routeCoords[0][1], routeCoords[routeCoords.length - 1][1]) + 0.002,
              ],
              sw: [
                Math.min(routeCoords[0][0], routeCoords[routeCoords.length - 1][0]) - 0.002,
                Math.min(routeCoords[0][1], routeCoords[routeCoords.length - 1][1]) - 0.002,
              ],
              paddingTop: 100,
              paddingBottom: 100,
              paddingLeft: 40,
              paddingRight: 40,
            }}
            animationMode="flyTo"
            animationDuration={800}
          />
        ) : (
          <MapboxGL.Camera
            ref={cameraRef}
            centerCoordinate={[
              destination?.lng ?? -117.1600,
              destination?.lat ?? 32.7115,
            ]}
            zoomLevel={15}
            animationMode="flyTo"
            animationDuration={500}
          />
        )}
        <MapboxGL.ShapeSource id="routeSourceActive" shape={routeGeoJSON}>
          <MapboxGL.LineLayer
            id="routeLineActive"
            style={{
              lineColor: '#7FA98E',
              lineWidth: 5,
              lineCap: 'round',
              lineJoin: 'round',
            }}
          />
        </MapboxGL.ShapeSource>
        <MapboxGL.UserLocation visible />
        {destination && (
          <MapboxGL.ShapeSource
            id="destPointActive"
            shape={{ type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [destination.lng, destination.lat] } }}
          >
            <MapboxGL.CircleLayer
              id="destCircleActive"
              style={{ circleRadius: 8, circleColor: '#7FA98E', circleStrokeWidth: 3, circleStrokeColor: '#FFFFFF' }}
            />
          </MapboxGL.ShapeSource>
        )}
      </MapboxGL.MapView>

      {/* Top controls */}
      <View style={styles.navTopControls}>
        {/* End button */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.endBtn, {
            backgroundColor: isDark ? 'rgba(58, 58, 60, 0.7)' : 'rgba(255, 255, 255, 0.7)',
            borderColor: isDark ? 'rgba(72, 72, 74, 0.5)' : 'rgba(255, 255, 255, 0.5)',
          }]}
        >
          <Text style={[styles.endText, { color: isDark ? '#F5F5F7' : '#4A4F55' }]}>End</Text>
        </TouchableOpacity>

        <View style={styles.navTopRight}>
          {/* DEV button */}
          <TouchableOpacity
            onPress={() => setShowDevPanel(true)}
            style={[styles.overviewBtn, {
              backgroundColor: isDark ? 'rgba(58, 58, 60, 0.7)' : 'rgba(255, 255, 255, 0.7)',
              borderColor: isDark ? 'rgba(72, 72, 74, 0.5)' : 'rgba(255, 255, 255, 0.5)',
            }]}
          >
            <Ionicons name="construct" size={20} color={isDark ? '#F5F5F7' : '#4A4F55'} />
          </TouchableOpacity>

          {/* Overview / Re-center toggle */}
          <TouchableOpacity
            onPress={() => setIsOverview((prev) => !prev)}
            style={[styles.overviewBtn, {
              backgroundColor: isDark ? 'rgba(58, 58, 60, 0.7)' : 'rgba(255, 255, 255, 0.7)',
              borderColor: isDark ? 'rgba(72, 72, 74, 0.5)' : 'rgba(255, 255, 255, 0.5)',
            }]}
          >
            <Ionicons
              name={isOverview ? 'navigate' : 'map-outline'}
              size={20}
              color={isDark ? '#F5F5F7' : '#4A4F55'}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Reroute banner when navigating and lot confidence is low */}
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

      {/* Bottom ETA */}
      <View style={[styles.etaBar, {
        backgroundColor: isDark ? 'rgba(44, 44, 46, 0.8)' : 'rgba(255, 255, 255, 0.8)',
        borderTopColor: isDark ? '#3A3A3C' : '#D3D5D7',
      }]}>
        <View style={styles.etaLeft}>
          <View style={styles.destDot} />
          <View>
            <Text style={[styles.etaName, { color: isDark ? '#F5F5F7' : '#4A4F55' }]} numberOfLines={1}>
              {destination?.name || 'Destination'}
            </Text>
            <Text style={[styles.etaMeta, { color: isDark ? '#AEAEB2' : '#8A8D91' }]}>
              {distanceMiles} mi
            </Text>
          </View>
        </View>
        <View style={styles.etaRight}>
          <Text style={styles.etaValue}>{durationMins}</Text>
          <Text style={[styles.etaUnit, { color: isDark ? '#AEAEB2' : '#8A8D91' }]}>min</Text>
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
  bottomSheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    borderTopLeftRadius: 32, borderTopRightRadius: 32,
    borderTopWidth: 1,
  },
  handle: { paddingTop: 12, paddingBottom: 20, alignItems: 'center' },
  handleBar: { width: 48, height: 6, borderRadius: 3 },
  sheetBody: { paddingHorizontal: 24, paddingBottom: 32 },
  destPill: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 16, borderRadius: 24, borderWidth: 1, marginBottom: 20,
  },
  destDot: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: '#7FA98E',
    alignItems: 'center', justifyContent: 'center',
  },
  destText: { flex: 1 },
  destName: { fontSize: 20, fontWeight: '700' },
  destCoords: { fontSize: 14, marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  statCard: {
    flex: 1, borderRadius: 24, borderWidth: 1, padding: 16, alignItems: 'center',
  },
  statValue: { fontSize: 28, fontWeight: '700' },
  statLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', marginTop: 4 },
  infoContainer: { borderRadius: 24, borderWidth: 1, padding: 20, marginBottom: 20, gap: 16 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoIcon: {
    width: 32, height: 32, borderRadius: 16, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  infoLabel: { fontSize: 14, fontWeight: '500' },
  infoValue: { fontSize: 14, fontWeight: '700' },
  startButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 12, backgroundColor: '#7FA98E', borderRadius: 28,
    paddingVertical: 18, marginBottom: 12,
  },
  startText: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  altButton: {
    borderRadius: 24, borderWidth: 1, paddingVertical: 16, alignItems: 'center',
  },
  altText: { fontSize: 14, fontWeight: '700', color: '#7FA98E' },
  navTopControls: {
    position: 'absolute', top: 56, left: 16, right: 16,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  endBtn: {
    paddingHorizontal: 24, paddingVertical: 12, borderRadius: 999, borderWidth: 1,
  },
  navTopRight: { flexDirection: 'row', gap: 8 },
  overviewBtn: {
    width: 44, height: 44, borderRadius: 22, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  endText: { fontSize: 14, fontWeight: '700' },
  rerouteBanner: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
  },
  rerouteBannerText: { fontSize: 14, fontWeight: '600', color: '#4A4F55', flex: 1 },
  etaBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 24, paddingVertical: 20, borderTopWidth: 1,
  },
  etaLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  etaName: { fontSize: 14, fontWeight: '700', maxWidth: 150 },
  etaMeta: { fontSize: 12, marginTop: 2 },
  etaRight: { alignItems: 'flex-end' },
  etaValue: { fontSize: 36, fontWeight: '700', color: '#7FA98E' },
  etaUnit: { fontSize: 14, fontWeight: '600' },
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
