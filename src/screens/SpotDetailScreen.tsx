import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useDarkMode } from '../context/DarkModeContext';
import ConfidenceRing from '../components/ConfidenceRing';
import AvailabilityChart from '../components/AvailabilityChart';
import type { MapStackParamList } from '../navigation/types';

type NavProp = NativeStackNavigationProp<MapStackParamList>;
type SpotDetailRoute = RouteProp<MapStackParamList, 'SpotDetail'>;

const spotData = {
  id: 'market-st-123',
  name: 'Market Street',
  crossStreet: '5th Street',
  distance: '0.2 mi',
  walkTime: '2 min',
  confidence: 94,
  sources: [
    { type: 'camera', name: 'Street Camera', confidence: 98, details: 'Camera #4521, Market St', lastUpdate: '2 min ago', icon: 'camera-outline' as const, color: '#7FA98E' },
    { type: 'crowd', name: 'Crowd Report', confidence: 85, details: 'Reported by verified user', lastUpdate: '10 min ago', icon: 'people-outline' as const, color: '#8B9D83' },
    { type: 'prediction', name: 'Prediction Model', confidence: 72, details: 'Based on historical patterns', lastUpdate: 'Real-time', icon: 'trending-up-outline' as const, color: '#C9A96E' },
    { type: 'api', name: 'City Parking Sensor', confidence: 91, details: 'Municipal sensor network', lastUpdate: '1 min ago', icon: 'server-outline' as const, color: '#8FA88E' },
  ],
  rules: {
    timeLimit: '2 hour maximum',
    hours: 'Mon-Sat 8AM-6PM',
    permit: 'No permit required',
    sweeping: 'Wed 8AM-10AM',
    warnings: [{ text: 'Street sweeping tomorrow 8-10 AM', urgent: true }],
    cost: null as string | null,
  },
  historicalData: [
    { hour: '6AM', availability: 85 }, { hour: '7AM', availability: 72 },
    { hour: '8AM', availability: 45 }, { hour: '9AM', availability: 25 },
    { hour: '10AM', availability: 20 }, { hour: '11AM', availability: 30 },
    { hour: '12PM', availability: 45 }, { hour: '1PM', availability: 52 },
    { hour: '2PM', availability: 48 }, { hour: '3PM', availability: 60 },
    { hour: '4PM', availability: 65 }, { hour: '5PM', availability: 70 },
    { hour: '6PM', availability: 80 }, { hour: '7PM', availability: 88 },
    { hour: '8PM', availability: 92 }, { hour: '9PM', availability: 95 },
  ],
  similarSpots: [
    { id: '1', name: '6th Street', distance: '50ft further', confidence: 98, walkTime: '3 min' },
    { id: '2', name: 'Mission Street', distance: '0.1 mi', confidence: 82, walkTime: '4 min' },
    { id: '3', name: 'Howard Street', distance: '0.15 mi', confidence: 76, walkTime: '5 min' },
  ],
};

function getConfidenceColor(c: number) {
  if (c >= 90) return '#7FA98E';
  if (c >= 70) return '#C9A96E';
  return '#B87C7C';
}

export default function SpotDetailScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<SpotDetailRoute>();
  const { isDark } = useDarkMode();
  const [saved, setSaved] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const confidenceColor = getConfidenceColor(spotData.confidence);

  return (
    <View style={[styles.flex, { backgroundColor: isDark ? '#1C1C1E' : '#F5F1E8' }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Hero - Map */}
        <View style={styles.hero}>
          <MapboxGL.MapView
            style={StyleSheet.absoluteFill}
            styleURL={isDark ? MapboxGL.StyleURL.Dark : MapboxGL.StyleURL.Street}
            logoEnabled={false}
            attributionEnabled={false}
            compassEnabled={false}
            scrollEnabled={false}
            zoomEnabled={false}
            pitchEnabled={false}
            rotateEnabled={false}
          >
            <MapboxGL.Camera
              centerCoordinate={[-122.4025, 37.7899]}
              zoomLevel={16}
              animationMode="flyTo"
              animationDuration={1000}
            />
            <MapboxGL.PointAnnotation
              id="spot-marker"
              coordinate={[-122.4025, 37.7899]}
            >
              <View style={styles.markerContainer}>
                <View style={styles.marker}>
                  <Ionicons name="car" size={16} color="#FFFFFF" />
                </View>
                <View style={styles.markerArrow} />
              </View>
            </MapboxGL.PointAnnotation>
          </MapboxGL.MapView>

          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[styles.backBtn, {
              backgroundColor: isDark ? 'rgba(44, 44, 46, 0.85)' : 'rgba(255, 255, 255, 0.85)',
              borderColor: isDark ? '#3A3A3C' : '#D3D5D7',
            }]}
          >
            <Ionicons name="arrow-back" size={20} color={isDark ? '#F5F5F7' : '#4A4F55'} />
          </TouchableOpacity>

          {/* Quick info overlay */}
          <View style={[styles.quickInfo, {
            backgroundColor: isDark ? 'rgba(44, 44, 46, 0.85)' : 'rgba(255, 255, 255, 0.85)',
            borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.6)',
          }]}>
            <View style={styles.quickInfoContent}>
              <Text style={[styles.spotName, { color: isDark ? '#F5F5F7' : '#4A4F55' }]}>{spotData.name}</Text>
              <Text style={[styles.crossSt, { color: isDark ? '#AEAEB2' : '#8A8D91' }]}>at {spotData.crossStreet}</Text>
              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={16} color="#7FA98E" />
                <Text style={[styles.infoText, { color: isDark ? '#F5F5F7' : '#4A4F55' }]}>{spotData.distance} away</Text>
                <Ionicons name="time-outline" size={16} color="#7FA98E" style={{ marginLeft: 16 }} />
                <Text style={[styles.infoText, { color: isDark ? '#F5F5F7' : '#4A4F55' }]}>{spotData.walkTime} walk</Text>
              </View>
            </View>
            <View style={[styles.confBadge, { backgroundColor: `${confidenceColor}20`, borderColor: confidenceColor }]}>
              <Text style={[styles.confText, { color: confidenceColor }]}>{spotData.confidence}%</Text>
            </View>
          </View>
        </View>

        <View style={styles.body}>
          {/* Confidence Breakdown */}
          <View style={[styles.section, { backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF', borderColor: isDark ? '#3A3A3C' : '#D3D5D7' }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="trending-up" size={20} color="#7FA98E" />
              <Text style={[styles.sectionTitle, { color: isDark ? '#F5F5F7' : '#4A4F55' }]}>Confidence Breakdown</Text>
            </View>

            <View style={styles.ringContainer}>
              <ConfidenceRing confidence={spotData.confidence} />
            </View>

            <Text style={[styles.sourceLabel, { color: isDark ? '#AEAEB2' : '#8A8D91' }]}>Data Sources</Text>
            {spotData.sources.map((source, idx) => (
              <View key={idx} style={[styles.sourceCard, {
                backgroundColor: isDark ? '#3A3A3C' : '#F5F1E8',
                borderColor: isDark ? '#48484A' : '#D3D5D7',
              }]}>
                <View style={styles.sourceRow}>
                  <View style={[styles.sourceIcon, { backgroundColor: `${source.color}20`, borderColor: source.color }]}>
                    <Ionicons name={source.icon} size={20} color={source.color} />
                  </View>
                  <View style={styles.sourceInfo}>
                    <Text style={[styles.sourceName, { color: isDark ? '#F5F5F7' : '#4A4F55' }]}>{source.name}</Text>
                    <Text style={[styles.sourceDetails, { color: isDark ? '#AEAEB2' : '#8A8D91' }]}>{source.details}</Text>
                  </View>
                  <Text style={[styles.sourceConf, { color: source.color }]}>{source.confidence}%</Text>
                </View>
                <View style={[styles.progressBar, { backgroundColor: isDark ? '#48484A' : '#D3D5D7' }]}>
                  <View style={[styles.progressFill, { width: `${source.confidence}%`, backgroundColor: source.color }]} />
                </View>
                <Text style={[styles.sourceUpdate, { color: isDark ? '#AEAEB2' : '#8A8D91' }]}>Last updated: {source.lastUpdate}</Text>
              </View>
            ))}
          </View>

          {/* Rules */}
          <View style={[styles.section, { backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF', borderColor: isDark ? '#3A3A3C' : '#D3D5D7' }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="information-circle" size={20} color="#7FA98E" />
              <Text style={[styles.sectionTitle, { color: isDark ? '#F5F5F7' : '#4A4F55' }]}>Street Rules</Text>
            </View>

            {spotData.rules.warnings.map((w, i) => (
              <View key={i} style={styles.warningCard}>
                <Ionicons name="alert-circle" size={20} color="#C9A96E" />
                <Text style={styles.warningText}>{w.text}</Text>
              </View>
            ))}

            {[
              { icon: 'time-outline' as const, title: spotData.rules.timeLimit, sub: spotData.rules.hours },
              { icon: 'location-outline' as const, title: spotData.rules.permit },
              { icon: 'calendar-outline' as const, title: 'Street Sweeping', sub: spotData.rules.sweeping },
            ].map((rule, i) => (
              <View key={i} style={[styles.ruleRow, { backgroundColor: isDark ? '#3A3A3C' : '#F5F1E8', borderColor: isDark ? '#48484A' : '#D3D5D7' }]}>
                <Ionicons name={rule.icon} size={20} color="#7FA98E" />
                <View>
                  <Text style={[styles.ruleTitle, { color: isDark ? '#F5F5F7' : '#4A4F55' }]}>{rule.title}</Text>
                  {rule.sub && <Text style={[styles.ruleSub, { color: isDark ? '#AEAEB2' : '#8A8D91' }]}>{rule.sub}</Text>}
                </View>
              </View>
            ))}

            <View style={[styles.ruleRow, { backgroundColor: 'rgba(127, 169, 142, 0.1)', borderColor: '#7FA98E' }]}>
              <Ionicons name="cash-outline" size={20} color="#7FA98E" />
              <Text style={[styles.ruleTitle, { color: '#7FA98E' }]}>Free Parking</Text>
            </View>
          </View>

          {/* Chart */}
          <View style={[styles.section, { backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF', borderColor: isDark ? '#3A3A3C' : '#D3D5D7' }]}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionHeader}>
                <Ionicons name="trending-up" size={20} color="#7FA98E" />
                <Text style={[styles.sectionTitle, { color: isDark ? '#F5F5F7' : '#4A4F55' }]}>Typical Availability</Text>
              </View>
              <TouchableOpacity onPress={() => setExpanded(!expanded)}>
                <Text style={styles.expandLink}>{expanded ? 'Collapse' : 'View Details'}</Text>
              </TouchableOpacity>
            </View>
            <AvailabilityChart data={spotData.historicalData} compact={!expanded} height={expanded ? 180 : 100} />
            <Text style={[styles.chartNote, { color: isDark ? '#AEAEB2' : '#8A8D91' }]}>Based on last 30 days of data</Text>
          </View>

          {/* Similar spots */}
          <Text style={[styles.nearbyTitle, { color: isDark ? '#F5F5F7' : '#4A4F55' }]}>Other spots nearby</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.similarScroll}>
            {spotData.similarSpots.map((s) => (
              <TouchableOpacity
                key={s.id}
                onPress={() => navigation.push('SpotDetail', { id: s.id })}
                style={[styles.similarCard, {
                  backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF',
                  borderColor: isDark ? '#3A3A3C' : '#D3D5D7',
                }]}
              >
                <View style={styles.similarTop}>
                  <Text style={[styles.similarName, { color: isDark ? '#F5F5F7' : '#4A4F55' }]}>{s.name}</Text>
                  <View style={[styles.similarBadge, { backgroundColor: `${getConfidenceColor(s.confidence)}20` }]}>
                    <Text style={[styles.similarConf, { color: getConfidenceColor(s.confidence) }]}>{s.confidence}%</Text>
                  </View>
                </View>
                <Text style={[styles.similarMeta, { color: isDark ? '#AEAEB2' : '#8A8D91' }]}>{s.distance}</Text>
                <View style={styles.similarTimeRow}>
                  <Ionicons name="time-outline" size={14} color={isDark ? '#AEAEB2' : '#8A8D91'} />
                  <Text style={[styles.similarTime, { color: isDark ? '#AEAEB2' : '#8A8D91' }]}>{s.walkTime} walk</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={{ height: 120 }} />
        </View>
      </ScrollView>

      {/* Bottom actions */}
      <View style={[styles.bottomBar, {
        backgroundColor: isDark ? 'rgba(28, 28, 30, 0.95)' : 'rgba(245, 241, 232, 0.95)',
      }]}>
        <TouchableOpacity
          onPress={() => navigation.navigate('Navigation', { destination: undefined })}
          style={styles.navButton}
        >
          <Ionicons name="navigate" size={20} color="#FFFFFF" />
          <Text style={styles.navText}>Navigate</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setSaved(!saved)}
          style={[styles.iconButton, {
            backgroundColor: saved ? 'rgba(184, 124, 124, 0.2)' : isDark ? '#2C2C2E' : '#FFFFFF',
            borderColor: saved ? '#B87C7C' : isDark ? '#3A3A3C' : '#D3D5D7',
          }]}
        >
          <Ionicons name={saved ? 'heart' : 'heart-outline'} size={24} color={saved ? '#B87C7C' : '#8A8D91'} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.iconButton, {
          backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF',
          borderColor: isDark ? '#3A3A3C' : '#D3D5D7',
        }]}>
          <Ionicons name="share-outline" size={24} color="#8A8D91" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: {},
  hero: {
    height: Dimensions.get('window').height * 0.35,
    overflow: 'hidden',
  },
  markerContainer: { alignItems: 'center' },
  marker: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#7FA98E', alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: '#FFFFFF',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 4, elevation: 5,
  },
  markerArrow: {
    width: 0, height: 0,
    borderLeftWidth: 6, borderRightWidth: 6, borderTopWidth: 8,
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
    borderTopColor: '#FFFFFF', marginTop: -1,
  },
  backBtn: {
    position: 'absolute', top: 56, left: 16, width: 48, height: 48,
    borderRadius: 24, borderWidth: 1, alignItems: 'center', justifyContent: 'center', zIndex: 10,
  },
  quickInfo: {
    position: 'absolute', bottom: 16, left: 16, right: 16,
    flexDirection: 'row', borderRadius: 16, borderWidth: 1, padding: 16,
  },
  quickInfoContent: { flex: 1 },
  spotName: { fontSize: 22, fontWeight: '700', marginBottom: 2 },
  crossSt: { fontSize: 14, marginBottom: 8 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  infoText: { fontSize: 14 },
  confBadge: { borderRadius: 999, borderWidth: 2, paddingHorizontal: 16, paddingVertical: 8, alignSelf: 'flex-start' },
  confText: { fontSize: 18, fontWeight: '700' },
  body: { padding: 16, gap: 16 },
  section: { borderRadius: 16, borderWidth: 1, padding: 20 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600' },
  ringContainer: { alignItems: 'center', marginBottom: 24 },
  sourceLabel: { fontSize: 14, fontWeight: '500', marginBottom: 12 },
  sourceCard: { borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 12 },
  sourceRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  sourceIcon: {
    width: 40, height: 40, borderRadius: 20, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  sourceInfo: { flex: 1 },
  sourceName: { fontSize: 14, fontWeight: '500' },
  sourceDetails: { fontSize: 12 },
  sourceConf: { fontSize: 14, fontWeight: '700' },
  progressBar: { height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: 8 },
  progressFill: { height: '100%', borderRadius: 3 },
  sourceUpdate: { fontSize: 11 },
  warningCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    padding: 12, borderRadius: 12, backgroundColor: 'rgba(201, 169, 110, 0.1)',
    borderWidth: 1, borderColor: 'rgba(201, 169, 110, 0.3)', marginBottom: 12,
  },
  warningText: { fontSize: 14, fontWeight: '500', color: '#C9A96E', flex: 1 },
  ruleRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 8,
  },
  ruleTitle: { fontSize: 14, fontWeight: '500' },
  ruleSub: { fontSize: 12, marginTop: 2 },
  expandLink: { fontSize: 13, fontWeight: '600', color: '#7FA98E' },
  chartNote: { fontSize: 12, marginTop: 8 },
  nearbyTitle: { fontSize: 18, fontWeight: '600' },
  similarScroll: { marginBottom: 16 },
  similarCard: {
    width: 200, borderRadius: 16, borderWidth: 1, padding: 16, marginRight: 12,
  },
  similarTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  similarName: { fontSize: 15, fontWeight: '600', flex: 1 },
  similarBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 2 },
  similarConf: { fontSize: 12, fontWeight: '700' },
  similarMeta: { fontSize: 12, marginBottom: 8 },
  similarTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  similarTime: { fontSize: 12 },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', gap: 12, padding: 16, paddingBottom: 32,
  },
  navButton: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: '#7FA98E', borderRadius: 16, paddingVertical: 16,
  },
  navText: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
  iconButton: {
    width: 56, height: 56, borderRadius: 16, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
});
