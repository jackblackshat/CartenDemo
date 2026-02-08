import React, { useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useDarkMode } from '../context/DarkModeContext';
import { useNavigationContext } from '../context/NavigationContext';
import { useUserLocation, useRouting } from '../hooks';
import type { MapStackParamList } from '../navigation/types';

type NavProp = NativeStackNavigationProp<MapStackParamList>;
type NavRoute = RouteProp<MapStackParamList, 'Navigation'>;

export default function NavigationScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<NavRoute>();
  const { isDark } = useDarkMode();
  const { selectedDestination } = useNavigationContext();
  const [isNavigating, setIsNavigating] = useState(false);
  const [isOverview, setIsOverview] = useState(false);
  const cameraRef = useRef<MapboxGL.Camera>(null);

  const destination = route.params?.destination ?? selectedDestination ?? {
    name: 'Market St Parking',
    lat: 37.7899,
    lng: -122.4025,
  };

  const { location: userLocation, loading: locationLoading } = useUserLocation(true);
  const { route: routeData, loading: routeLoading } = useRouting(
    userLocation ? { lat: userLocation.lat, lng: userLocation.lng } : null,
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
          {routeBounds ? (
            <MapboxGL.Camera
              bounds={{
                ne: routeBounds.ne,
                sw: routeBounds.sw,
                paddingTop: 100,
                paddingBottom: 420,
                paddingLeft: 60,
                paddingRight: 60,
              }}
              animationMode="flyTo"
              animationDuration={1000}
            />
          ) : (
            <MapboxGL.Camera
              centerCoordinate={[
                destination?.lng ?? -122.4025,
                destination?.lat ?? 37.7889,
              ]}
              zoomLevel={13}
              animationMode="flyTo"
              animationDuration={1000}
            />
          )}
          <MapboxGL.UserLocation visible />
          {destination && (
            <MapboxGL.PointAnnotation
              id="destination"
              coordinate={[destination.lng, destination.lat]}
            >
              <View style={styles.destMarker} />
            </MapboxGL.PointAnnotation>
          )}
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

        {/* Bottom sheet */}
        <View style={[styles.bottomSheet, {
          backgroundColor: isDark ? 'rgba(44, 44, 46, 0.8)' : 'rgba(255, 255, 255, 0.8)',
          borderTopColor: isDark ? '#3A3A3C' : '#D3D5D7',
        }]}>
          <View style={styles.handle}>
            <View style={[styles.handleBar, { backgroundColor: isDark ? '#48484A' : '#D3D5D7' }]} />
          </View>

          <View style={styles.sheetBody}>
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
                  {userLocation ? `${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}` : 'Getting location...'}
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
                { icon: 'trending-up-outline' as const, label: 'Traffic', value: 'Light', valueColor: '#7FA98E' },
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
          </View>
        </View>
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
        ) : (
          <MapboxGL.Camera
            ref={cameraRef}
            followUserLocation
            followZoomLevel={15}
            followPitch={0}
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
          <MapboxGL.PointAnnotation
            id="destination-active"
            coordinate={[destination.lng, destination.lat]}
          >
            <View style={styles.destMarker} />
          </MapboxGL.PointAnnotation>
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
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  destMarker: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#7FA98E',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
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
  overviewBtn: {
    width: 44, height: 44, borderRadius: 22, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  endText: { fontSize: 14, fontWeight: '700' },
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
});
