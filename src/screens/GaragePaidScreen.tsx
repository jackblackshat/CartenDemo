import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useDarkMode } from '../context/DarkModeContext';
import type { MapStackParamList } from '../navigation/types';

type NavProp = NativeStackNavigationProp<MapStackParamList>;

export default function GaragePaidScreen() {
  const navigation = useNavigation<NavProp>();
  const { isDark } = useDarkMode();

  const card = { backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF', borderColor: isDark ? '#3A3A3C' : '#D3D5D7' };

  return (
    <ScrollView style={[styles.container, { backgroundColor: isDark ? '#1C1C1E' : '#F5F1E8' }]} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={[styles.header, {
        backgroundColor: isDark ? 'rgba(44, 44, 46, 0.9)' : 'rgba(255, 255, 255, 0.9)',
        borderBottomColor: isDark ? '#3A3A3C' : '#D3D5D7',
      }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, {
          backgroundColor: isDark ? '#3A3A3C' : '#F5F1E8',
          borderColor: isDark ? '#48484A' : '#D3D5D7',
        }]}>
          <Ionicons name="arrow-back" size={20} color={isDark ? '#F5F5F7' : '#4A4F55'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: isDark ? '#F5F5F7' : '#4A4F55' }]}>Garage Details</Text>
      </View>

      {/* Hero */}
      <View style={[styles.hero, { backgroundColor: isDark ? '#2C2C2E' : '#E8EDE8' }]}>
        <Ionicons name="car" size={80} color="#7FA98E" />
      </View>

      {/* Info */}
      <View style={styles.body}>
        <Text style={[styles.garageName, { color: isDark ? '#F5F5F7' : '#4A4F55' }]}>Mission Street Garage</Text>
        <View style={styles.addressRow}>
          <Ionicons name="location" size={16} color={isDark ? '#AEAEB2' : '#8A8D91'} />
          <Text style={[styles.address, { color: isDark ? '#AEAEB2' : '#8A8D91' }]}>525 Mission St, San Francisco</Text>
        </View>

        {/* Availability */}
        <View style={[styles.availCard, { borderColor: '#7FA98E' }]}>
          <View style={styles.availHeader}>
            <Text style={{ color: isDark ? '#AEAEB2' : '#8A8D91', fontSize: 14 }}>Real-time Availability</Text>
            <View style={styles.liveDot} />
          </View>
          <View style={styles.availNumbers}>
            <Text style={styles.availBig}>47</Text>
            <Text style={[styles.availTotal, { color: isDark ? '#AEAEB2' : '#8A8D91' }]}>/ 200</Text>
          </View>
          <Text style={{ color: isDark ? '#AEAEB2' : '#8A8D91', fontSize: 14 }}>spots available now</Text>
        </View>

        {/* Pricing */}
        <View style={[styles.card, card]}>
          <View style={styles.cardHeader}>
            <Ionicons name="cash-outline" size={20} color="#7FA98E" />
            <Text style={[styles.cardTitle, { color: isDark ? '#F5F5F7' : '#4A4F55' }]}>Pricing</Text>
          </View>
          {[
            { label: 'Hourly Rate', value: '$4.00' },
            { label: 'Daily Maximum', value: '$28.00' },
            { label: 'Weekend Special', value: '$3.00/hr' },
          ].map((item, i) => (
            <View key={i} style={[styles.priceRow, i < 2 && { borderBottomWidth: 1, borderBottomColor: isDark ? '#3A3A3C' : '#D3D5D7' }]}>
              <Text style={{ color: isDark ? '#F5F5F7' : '#4A4F55' }}>{item.label}</Text>
              <Text style={{ fontWeight: '600', color: '#7FA98E' }}>{item.value}</Text>
            </View>
          ))}
        </View>

        {/* Amenities */}
        <View style={[styles.card, card]}>
          <Text style={[styles.cardTitle, { color: isDark ? '#F5F5F7' : '#4A4F55', marginBottom: 16 }]}>Amenities</Text>
          <View style={styles.amenitiesGrid}>
            {[
              { icon: 'shield-checkmark' as const, label: '24/7 Security' },
              { icon: 'videocam' as const, label: 'CCTV' },
              { icon: 'flash' as const, label: 'EV Charging' },
              { icon: 'wifi' as const, label: 'WiFi' },
            ].map((a, i) => (
              <View key={i} style={styles.amenityItem}>
                <View style={styles.amenityIcon}>
                  <Ionicons name={a.icon} size={20} color="#7FA98E" />
                </View>
                <Text style={[styles.amenityLabel, { color: isDark ? '#F5F5F7' : '#4A4F55' }]}>{a.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Navigation', { destination: undefined })}
            style={styles.navButton}
          >
            <Ionicons name="navigate" size={20} color="#FFFFFF" />
            <Text style={styles.navText}>Navigate</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.reserveButton, { borderColor: '#7FA98E', backgroundColor: isDark ? 'transparent' : '#FFFFFF' }]}>
            <Text style={{ fontWeight: '600', color: '#7FA98E', fontSize: 16 }}>Reserve Now</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {},
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingTop: 60, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  hero: { height: 180, alignItems: 'center', justifyContent: 'center' },
  body: { padding: 16, gap: 16 },
  garageName: { fontSize: 24, fontWeight: '700' },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  address: { fontSize: 14 },
  availCard: {
    padding: 24, borderRadius: 16, borderWidth: 1,
    backgroundColor: 'rgba(127, 169, 142, 0.1)',
  },
  availHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#7FA98E' },
  availNumbers: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  availBig: { fontSize: 48, fontWeight: '700', color: '#7FA98E' },
  availTotal: { fontSize: 24 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12 },
  amenitiesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  amenityItem: { flexDirection: 'row', alignItems: 'center', gap: 8, width: '45%' },
  amenityIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(127, 169, 142, 0.2)', borderWidth: 1, borderColor: '#7FA98E',
    alignItems: 'center', justifyContent: 'center',
  },
  amenityLabel: { fontSize: 14 },
  actions: { flexDirection: 'row', gap: 12 },
  navButton: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: '#7FA98E', borderRadius: 16, paddingVertical: 16,
  },
  navText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  reserveButton: {
    flex: 1, borderWidth: 2, borderRadius: 16, paddingVertical: 16, alignItems: 'center',
  },
});
