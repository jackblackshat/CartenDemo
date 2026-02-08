import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDarkMode } from '../context/DarkModeContext';

const activityItems = [
  { id: 1, type: 'shared', location: '5th Ave (Gaslamp)', time: '2 hours ago', credits: 10, icon: 'location' as const, color: '#7FA98E' },
  { id: 2, type: 'found', location: 'Island Ave', time: '5 hours ago', icon: 'trending-up' as const, color: '#8B9D83' },
  { id: 3, type: 'shared', location: 'Horton Plaza Garage', time: '1 day ago', credits: 15, icon: 'location' as const, color: '#7FA98E' },
  { id: 4, type: 'achievement', title: 'Trust Builder', description: 'Shared 100 spots', time: '2 days ago', icon: 'trophy' as const, color: '#C9A96E' },
  { id: 5, type: 'found', location: 'India St (Little Italy)', time: '3 days ago', icon: 'trending-up' as const, color: '#8B9D83' },
];

export default function ActivityScreen() {
  const { isDark } = useDarkMode();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: isDark ? '#1C1C1E' : '#F5F1E8' }]}
      contentContainerStyle={styles.content}
    >
      {/* Header */}
      <Text style={[styles.headerTitle, { color: isDark ? '#F5F5F7' : '#4A4F55' }]}>Activity</Text>

      {/* Stats */}
      <View style={styles.statsRow}>
        {[
          { value: '142', label: 'Spots Shared', color: '#7FA98E' },
          { value: '89', label: 'Spots Found', color: '#8B9D83' },
          { value: '247', label: 'Credits', color: '#C9A96E' },
        ].map((stat, i) => (
          <View key={i} style={[styles.statCard, {
            backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF',
            borderColor: isDark ? '#3A3A3C' : '#D3D5D7',
          }]}>
            <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
            <Text style={[styles.statLabel, { color: isDark ? '#AEAEB2' : '#8A8D91' }]}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* Feed */}
      <Text style={[styles.sectionTitle, { color: isDark ? '#F5F5F7' : '#4A4F55' }]}>Recent Activity</Text>
      {activityItems.map((item) => (
        <View key={item.id} style={[styles.activityCard, {
          backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF',
          borderColor: isDark ? '#3A3A3C' : '#D3D5D7',
        }]}>
          <View style={styles.activityRow}>
            <View style={[styles.activityIcon, { backgroundColor: `${item.color}20`, borderColor: item.color }]}>
              <Ionicons name={item.icon} size={20} color={item.color} />
            </View>
            <View style={styles.activityContent}>
              {item.type === 'shared' && (
                <>
                  <Text style={[styles.activityTitle, { color: isDark ? '#F5F5F7' : '#4A4F55' }]}>Shared a parking spot</Text>
                  <Text style={[styles.activitySub, { color: isDark ? '#AEAEB2' : '#8A8D91' }]}>{item.location}</Text>
                </>
              )}
              {item.type === 'found' && (
                <>
                  <Text style={[styles.activityTitle, { color: isDark ? '#F5F5F7' : '#4A4F55' }]}>Found parking</Text>
                  <Text style={[styles.activitySub, { color: isDark ? '#AEAEB2' : '#8A8D91' }]}>{item.location}</Text>
                </>
              )}
              {item.type === 'achievement' && (
                <>
                  <Text style={[styles.activityTitle, { color: isDark ? '#F5F5F7' : '#4A4F55' }]}>{item.title}</Text>
                  <Text style={[styles.activitySub, { color: isDark ? '#AEAEB2' : '#8A8D91' }]}>{item.description}</Text>
                </>
              )}
              <View style={styles.timeRow}>
                <Ionicons name="time-outline" size={12} color={isDark ? '#AEAEB2' : '#8A8D91'} />
                <Text style={[styles.timeText, { color: isDark ? '#AEAEB2' : '#8A8D91' }]}>{item.time}</Text>
              </View>
            </View>
            {item.credits && (
              <View style={styles.creditBadge}>
                <Text style={styles.creditText}>+{item.credits}</Text>
              </View>
            )}
          </View>
        </View>
      ))}

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 60 },
  headerTitle: { fontSize: 24, fontWeight: '700', marginBottom: 20 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  statCard: {
    flex: 1, borderRadius: 16, borderWidth: 1, padding: 16, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  statValue: { fontSize: 24, fontWeight: '700' },
  statLabel: { fontSize: 11, fontWeight: '500', marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  activityCard: {
    borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  activityRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  activityIcon: {
    width: 40, height: 40, borderRadius: 20, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  activityContent: { flex: 1 },
  activityTitle: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  activitySub: { fontSize: 14 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  timeText: { fontSize: 12 },
  creditBadge: {
    backgroundColor: 'rgba(127, 169, 142, 0.2)', borderWidth: 1,
    borderColor: '#7FA98E', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4,
  },
  creditText: { fontSize: 13, fontWeight: '600', color: '#5F7A61' },
});
