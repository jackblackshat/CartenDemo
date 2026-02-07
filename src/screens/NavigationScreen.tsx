import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import MapView, { Polyline, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
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

  const routeCoords = routeData?.geometry?.coordinates?.map(([lng, lat]) => ({
    latitude: lat,
    longitude: lng,
  })) || [];

  if (!isNavigating) {
    return (
      <View style={[styles.flex, { backgroundColor: isDark ? '#1C1C1E' : '#F5F1E8' }]}>
        {/* Map preview */}
        <View style={styles.flex}>
          <MapView
            style={StyleSheet.absoluteFill}
            provider={PROVIDER_GOOGLE}
            initialRegion={{
              latitude: userLocation?.lat ?? 37.7749,
              longitude: userLocation?.lng ?? -122.4194,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
            showsUserLocation
          >
            {destination && (
              <Marker
                coordinate={{ latitude: destination.lat, longitude: destination.lng }}
                pinColor="#7FA98E"
              />
            )}
            {routeCoords.length > 0 && (
              <Polyline
                coordinates={routeCoords}
                strokeColor="#7FA98E"
                strokeWidth={4}
              />
            )}
          </MapView>

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
        </View>

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
      <MapView
        style={styles.flex}
        provider={PROVIDER_GOOGLE}
        region={
          userLocation
            ? {
                latitude: userLocation.lat,
                longitude: userLocation.lng,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }
            : undefined
        }
        showsUserLocation
      >
        {destination && (
          <Marker
            coordinate={{ latitude: destination.lat, longitude: destination.lng }}
            pinColor="#7FA98E"
          />
        )}
        {routeCoords.length > 0 && (
          <Polyline coordinates={routeCoords} strokeColor="#7FA98E" strokeWidth={5} />
        )}
      </MapView>

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
  endBtn: {
    position: 'absolute', top: 56, left: 16,
    paddingHorizontal: 24, paddingVertical: 12, borderRadius: 999, borderWidth: 1,
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
