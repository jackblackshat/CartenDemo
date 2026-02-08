import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDarkMode } from '../context/DarkModeContext';
import ToggleSwitch from '../components/ToggleSwitch';
import SubscriptionModal from '../components/SubscriptionModal';
import DurationModal from '../components/DurationModal';
import type { ProfileStackParamList } from '../navigation/types';

type NavProp = NativeStackNavigationProp<ProfileStackParamList>;

export default function ProfileScreen() {
  const navigation = useNavigation<NavProp>();
  const { isDark, toggleDarkMode } = useDarkMode();
  const [showSubscription, setShowSubscription] = useState(false);
  const [showDuration, setShowDuration] = useState(false);
  const [carPlayEnabled, setCarPlayEnabled] = useState(true);
  const [defaultDuration, setDefaultDuration] = useState('1 hour');

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: isDark ? '#1C1C1E' : '#F5F1E8' }]}
      contentContainerStyle={styles.content}
    >
      {/* Header */}
      <Text style={[styles.headerTitle, { color: isDark ? '#F5F5F7' : '#4A4F55' }]}>Profile</Text>

      {/* Profile card */}
      <View style={[styles.card, {
        backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF',
        borderColor: isDark ? '#3A3A3C' : '#D3D5D7',
      }]}>
        <View style={styles.avatarRow}>
          <View style={[styles.avatar, {
            backgroundColor: isDark ? '#3A3A3C' : 'rgba(127, 169, 142, 0.15)',
            borderColor: '#7FA98E',
          }]}>
            <Ionicons name="person" size={32} color="#7FA98E" />
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.name, { color: isDark ? '#F5F5F7' : '#4A4F55' }]}>Alex Chen</Text>
            <Text style={[styles.email, { color: isDark ? '#AEAEB2' : '#8A8D91' }]}>alex.chen@email.com</Text>
          </View>
        </View>
      </View>

      {/* Stats Card */}
      <View style={[styles.card, {
        backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF',
        borderColor: isDark ? '#3A3A3C' : '#D3D5D7',
      }]}>
        <View style={styles.statRow}>
          <View style={styles.statLeft}>
            <View style={styles.trustIcon}>
              <Ionicons name="trophy" size={24} color="#7FA98E" />
            </View>
            <View>
              <Text style={[styles.statLabel, { color: isDark ? '#AEAEB2' : '#8A8D91' }]}>Trust Score</Text>
              <Text style={[styles.statBig, { color: isDark ? '#F5F5F7' : '#4A4F55' }]}>87</Text>
            </View>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[styles.statLabel, { color: isDark ? '#AEAEB2' : '#8A8D91' }]}>Tier</Text>
            <View style={styles.tierBadge}>
              <Text style={styles.tierText}>Free</Text>
            </View>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: isDark ? '#3A3A3C' : '#D3D5D7' }]} />

        <View style={styles.statRow}>
          <View>
            <Text style={[styles.statLabel, { color: isDark ? '#AEAEB2' : '#8A8D91' }]}>Credits Balance</Text>
            <Text style={[styles.creditValue, { color: '#7FA98E' }]}>247</Text>
          </View>
          <TouchableOpacity style={styles.earnButton}>
            <Text style={styles.earnText}>Earn More</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Activity Grid */}
      <Text style={[styles.sectionTitle, { color: isDark ? '#F5F5F7' : '#4A4F55' }]}>Your Activity</Text>
      <View style={styles.gridRow}>
        <View style={[styles.gridCard, {
          backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF',
          borderColor: isDark ? '#3A3A3C' : '#D3D5D7',
        }]}>
          <View style={styles.gridIconRow}>
            <Ionicons name="trending-up" size={16} color="#7FA98E" />
            <Text style={[styles.gridLabel, { color: isDark ? '#AEAEB2' : '#8A8D91' }]}>Spots Shared</Text>
          </View>
          <Text style={[styles.gridValue, { color: isDark ? '#F5F5F7' : '#4A4F55' }]}>142</Text>
        </View>
        <View style={[styles.gridCard, {
          backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF',
          borderColor: isDark ? '#3A3A3C' : '#D3D5D7',
        }]}>
          <View style={styles.gridIconRow}>
            <Ionicons name="checkmark" size={16} color="#7FA98E" />
            <Text style={[styles.gridLabel, { color: isDark ? '#AEAEB2' : '#8A8D91' }]}>Accuracy</Text>
          </View>
          <Text style={[styles.gridValue, { color: '#7FA98E' }]}>94%</Text>
        </View>
      </View>

      {/* Upgrade */}
      <TouchableOpacity
        onPress={() => setShowSubscription(true)}
        style={[styles.upgradeCard, {
          backgroundColor: '#7FA98E',
        }]}
      >
        <View style={styles.upgradeRow}>
          <Text style={styles.upgradeTitle}>Upgrade to Pro</Text>
          <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
        </View>
        <Text style={styles.upgradeSub}>Get real-time data, camera feeds, priority alerts & more</Text>
      </TouchableOpacity>

      {/* Settings */}
      <Text style={[styles.sectionTitle, { color: isDark ? '#F5F5F7' : '#4A4F55' }]}>Settings</Text>
      <View style={[styles.settingsCard, {
        backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF',
        borderColor: isDark ? '#3A3A3C' : '#D3D5D7',
      }]}>
        <TouchableOpacity onPress={toggleDarkMode} style={styles.settingRow}>
          <View style={styles.settingLeft}>
            <Ionicons name={isDark ? 'sunny' : 'moon'} size={20} color={isDark ? '#AEAEB2' : '#8A8D91'} />
            <Text style={[styles.settingLabel, { color: isDark ? '#F5F5F7' : '#4A4F55' }]}>
              {isDark ? 'Light Mode' : 'Dark Mode'}
            </Text>
          </View>
          <ToggleSwitch enabled={isDark} onChange={toggleDarkMode} />
        </TouchableOpacity>

        <View style={[styles.settingDivider, { backgroundColor: isDark ? '#3A3A3C' : '#D3D5D7' }]} />

        <TouchableOpacity onPress={() => navigation.navigate('NotificationSettings')} style={styles.settingRow}>
          <View style={styles.settingLeft}>
            <Ionicons name="notifications-outline" size={20} color={isDark ? '#AEAEB2' : '#8A8D91'} />
            <Text style={[styles.settingLabel, { color: isDark ? '#F5F5F7' : '#4A4F55' }]}>Notifications</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={isDark ? '#AEAEB2' : '#8A8D91'} />
        </TouchableOpacity>

        <View style={[styles.settingDivider, { backgroundColor: isDark ? '#3A3A3C' : '#D3D5D7' }]} />

        <TouchableOpacity onPress={() => setShowDuration(true)} style={styles.settingRow}>
          <View style={styles.settingLeft}>
            <Ionicons name="time-outline" size={20} color={isDark ? '#AEAEB2' : '#8A8D91'} />
            <Text style={[styles.settingLabel, { color: isDark ? '#F5F5F7' : '#4A4F55' }]}>Default Duration</Text>
          </View>
          <View style={styles.settingRight}>
            <Text style={[styles.settingValue, { color: isDark ? '#AEAEB2' : '#8A8D91' }]}>{defaultDuration}</Text>
            <Ionicons name="chevron-forward" size={20} color={isDark ? '#AEAEB2' : '#8A8D91'} />
          </View>
        </TouchableOpacity>

        <View style={[styles.settingDivider, { backgroundColor: isDark ? '#3A3A3C' : '#D3D5D7' }]} />

        <TouchableOpacity onPress={() => setCarPlayEnabled(!carPlayEnabled)} style={styles.settingRow}>
          <View style={styles.settingLeft}>
            <Ionicons name="bluetooth-outline" size={20} color={isDark ? '#AEAEB2' : '#8A8D91'} />
            <Text style={[styles.settingLabel, { color: isDark ? '#F5F5F7' : '#4A4F55' }]}>CarPlay Connection</Text>
          </View>
          <ToggleSwitch enabled={carPlayEnabled} onChange={() => setCarPlayEnabled(!carPlayEnabled)} />
        </TouchableOpacity>

        <View style={[styles.settingDivider, { backgroundColor: isDark ? '#3A3A3C' : '#D3D5D7' }]} />

        <TouchableOpacity onPress={() => navigation.navigate('MoreSettings')} style={styles.settingRow}>
          <View style={styles.settingLeft}>
            <Ionicons name="settings-outline" size={20} color={isDark ? '#AEAEB2' : '#8A8D91'} />
            <Text style={[styles.settingLabel, { color: isDark ? '#F5F5F7' : '#4A4F55' }]}>More Settings</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={isDark ? '#AEAEB2' : '#8A8D91'} />
        </TouchableOpacity>
      </View>

      <View style={{ height: 100 }} />

      <SubscriptionModal visible={showSubscription} onClose={() => setShowSubscription(false)} />
      <DurationModal
        visible={showDuration}
        onClose={() => setShowDuration(false)}
        currentDuration={defaultDuration}
        onSelect={setDefaultDuration}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 60 },
  headerTitle: { fontSize: 24, fontWeight: '700', marginBottom: 20 },
  card: {
    borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatar: {
    width: 64, height: 64, borderRadius: 32,
    borderWidth: 2, alignItems: 'center', justifyContent: 'center',
  },
  profileInfo: { flex: 1 },
  name: { fontSize: 20, fontWeight: '700' },
  email: { fontSize: 14, marginTop: 2 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  trustIcon: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(127, 169, 142, 0.2)',
    borderWidth: 1, borderColor: '#7FA98E', alignItems: 'center', justifyContent: 'center',
  },
  statLabel: { fontSize: 13 },
  statBig: { fontSize: 24, fontWeight: '700' },
  tierBadge: {
    borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4, marginTop: 4,
    backgroundColor: '#7FA98E',
  },
  tierText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  divider: { height: 1, marginVertical: 16 },
  creditValue: { fontSize: 32, fontWeight: '700' },
  earnButton: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999,
    backgroundColor: 'rgba(127, 169, 142, 0.2)', borderWidth: 1, borderColor: '#7FA98E',
  },
  earnText: { fontSize: 13, fontWeight: '600', color: '#5F7A61' },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  gridRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  gridCard: {
    flex: 1, borderRadius: 16, borderWidth: 1, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  gridIconRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  gridLabel: { fontSize: 13 },
  gridValue: { fontSize: 28, fontWeight: '700' },
  upgradeCard: { borderRadius: 16, padding: 24, marginBottom: 24 },
  upgradeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  upgradeTitle: { fontSize: 20, fontWeight: '700', color: '#FFFFFF' },
  upgradeSub: { fontSize: 14, color: 'rgba(255, 255, 255, 0.9)' },
  settingsCard: {
    borderRadius: 16, borderWidth: 1, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  settingRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16,
  },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  settingLabel: { fontSize: 15 },
  settingValue: { fontSize: 14 },
  settingDivider: { height: StyleSheet.hairlineWidth, marginHorizontal: 16 },
});
