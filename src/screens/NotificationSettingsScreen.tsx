import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useDarkMode } from '../context/DarkModeContext';
import ToggleSwitch from '../components/ToggleSwitch';

export default function NotificationSettingsScreen() {
  const navigation = useNavigation();
  const { isDark } = useDarkMode();
  const [pushEnabled, setPushEnabled] = useState(true);
  const [spotAlerts, setSpotAlerts] = useState(true);
  const [parkingReminders, setParkingReminders] = useState(true);
  const [creditUpdates, setCreditUpdates] = useState(false);
  const [promoAlerts, setPromoAlerts] = useState(false);
  const [communityUpdates, setCommunityUpdates] = useState(true);

  const card = {
    backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF',
    borderColor: isDark ? '#3A3A3C' : '#D3D5D7',
  };
  const divider = { borderBottomWidth: 1, borderBottomColor: isDark ? '#3A3A3C' : '#D3D5D7' };

  return (
    <ScrollView style={[styles.container, { backgroundColor: isDark ? '#1C1C1E' : '#F5F1E8' }]}>
      {/* Header */}
      <LinearGradient colors={['#8B9D83', '#7FA98E']} style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
        </View>
        <Text style={styles.headerSub}>Manage your alert preferences</Text>
      </LinearGradient>

      <View style={styles.body}>
        {/* Master Toggle */}
        <View style={[styles.card, card]}>
          <View style={styles.masterRow}>
            <View style={styles.masterLeft}>
              <View style={styles.masterIcon}>
                <Ionicons name="notifications" size={24} color="#7FA98E" />
              </View>
              <View>
                <Text style={[styles.label, { color: isDark ? '#F5F5F7' : '#4A4F55' }]}>Push Notifications</Text>
                <Text style={[styles.sublabel, { color: isDark ? '#AEAEB2' : '#8A8D91' }]}>Enable all notifications</Text>
              </View>
            </View>
            <ToggleSwitch enabled={pushEnabled} onChange={() => setPushEnabled(!pushEnabled)} />
          </View>
        </View>

        {/* Parking Alerts */}
        <View style={[styles.card, card]}>
          <Text style={[styles.sectionLabel, { color: isDark ? '#AEAEB2' : '#8A8D91' }]}>PARKING ALERTS</Text>

          <View style={[styles.settingRow, divider]}>
            <View style={styles.settingLeft}>
              <Ionicons name="location" size={20} color="#7FA98E" />
              <View>
                <Text style={[styles.label, { color: isDark ? '#F5F5F7' : '#4A4F55' }]}>Spot Availability</Text>
                <Text style={[styles.sublabel, { color: isDark ? '#AEAEB2' : '#8A8D91' }]}>When spots open nearby</Text>
              </View>
            </View>
            <ToggleSwitch enabled={spotAlerts} onChange={() => setSpotAlerts(!spotAlerts)} />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="alert-circle" size={20} color="#7FA98E" />
              <View>
                <Text style={[styles.label, { color: isDark ? '#F5F5F7' : '#4A4F55' }]}>Parking Reminders</Text>
                <Text style={[styles.sublabel, { color: isDark ? '#AEAEB2' : '#8A8D91' }]}>Time limit & meter expiry</Text>
              </View>
            </View>
            <ToggleSwitch enabled={parkingReminders} onChange={() => setParkingReminders(!parkingReminders)} />
          </View>
        </View>

        {/* Account & Updates */}
        <View style={[styles.card, card]}>
          <Text style={[styles.sectionLabel, { color: isDark ? '#AEAEB2' : '#8A8D91' }]}>ACCOUNT & UPDATES</Text>

          <View style={[styles.settingRow, divider]}>
            <View style={styles.settingLeft}>
              <Ionicons name="trending-up" size={20} color="#7FA98E" />
              <View>
                <Text style={[styles.label, { color: isDark ? '#F5F5F7' : '#4A4F55' }]}>Credit Updates</Text>
                <Text style={[styles.sublabel, { color: isDark ? '#AEAEB2' : '#8A8D91' }]}>When you earn or spend credits</Text>
              </View>
            </View>
            <ToggleSwitch enabled={creditUpdates} onChange={() => setCreditUpdates(!creditUpdates)} />
          </View>

          <View style={[styles.settingRow, divider]}>
            <View style={styles.settingLeft}>
              <Ionicons name="camera" size={20} color="#7FA98E" />
              <View>
                <Text style={[styles.label, { color: isDark ? '#F5F5F7' : '#4A4F55' }]}>Promotions & Offers</Text>
                <Text style={[styles.sublabel, { color: isDark ? '#AEAEB2' : '#8A8D91' }]}>Special deals and discounts</Text>
              </View>
            </View>
            <ToggleSwitch enabled={promoAlerts} onChange={() => setPromoAlerts(!promoAlerts)} />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="people" size={20} color="#7FA98E" />
              <View>
                <Text style={[styles.label, { color: isDark ? '#F5F5F7' : '#4A4F55' }]}>Community Updates</Text>
                <Text style={[styles.sublabel, { color: isDark ? '#AEAEB2' : '#8A8D91' }]}>New features & tips</Text>
              </View>
            </View>
            <ToggleSwitch enabled={communityUpdates} onChange={() => setCommunityUpdates(!communityUpdates)} />
          </View>
        </View>

        {/* Tip */}
        <View style={styles.tipBanner}>
          <Text style={styles.tipText}>
            Tip: Keep spot availability alerts on to never miss a great parking spot!
          </Text>
        </View>
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 60, paddingHorizontal: 16, paddingBottom: 24 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#FFFFFF' },
  headerSub: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginLeft: 52 },
  body: { padding: 16, gap: 16 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16 },
  masterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  masterLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  masterIcon: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(127, 169, 142, 0.2)', borderWidth: 1, borderColor: '#7FA98E',
    alignItems: 'center', justifyContent: 'center',
  },
  sectionLabel: { fontSize: 12, fontWeight: '600', marginBottom: 16 },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  label: { fontSize: 14, fontWeight: '500' },
  sublabel: { fontSize: 12, marginTop: 2 },
  tipBanner: {
    backgroundColor: 'rgba(127, 169, 142, 0.1)', borderRadius: 12,
    padding: 16, borderWidth: 1, borderColor: '#7FA98E',
  },
  tipText: { fontSize: 14, color: '#5F7A61' },
});
