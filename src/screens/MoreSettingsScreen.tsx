import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useDarkMode } from '../context/DarkModeContext';
import ToggleSwitch from '../components/ToggleSwitch';

type SettingItem = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  sublabel?: string;
  color?: string;
};

export default function MoreSettingsScreen() {
  const navigation = useNavigation();
  const { isDark, toggleDarkMode } = useDarkMode();

  const card = {
    backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF',
    borderColor: isDark ? '#3A3A3C' : '#D3D5D7',
  };
  const divider = { borderBottomWidth: 1, borderBottomColor: isDark ? '#3A3A3C' : '#D3D5D7' };
  const iconColor = isDark ? '#AEAEB2' : '#8A8D91';
  const textColor = isDark ? '#F5F5F7' : '#4A4F55';

  const renderRow = (item: SettingItem, hasDivider: boolean = true) => (
    <TouchableOpacity
      key={item.label}
      style={[styles.row, hasDivider && divider]}
    >
      <View style={styles.rowLeft}>
        <Ionicons name={item.icon} size={20} color={item.color || iconColor} />
        <View>
          <Text style={[styles.rowLabel, { color: item.color || textColor }]}>{item.label}</Text>
          {item.sublabel && (
            <Text style={[styles.rowSublabel, { color: isDark ? '#AEAEB2' : '#8A8D91' }]}>{item.sublabel}</Text>
          )}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color={isDark ? '#AEAEB2' : '#8A8D91'} />
    </TouchableOpacity>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: isDark ? '#1C1C1E' : '#F5F1E8' }]}>
      {/* Header */}
      <LinearGradient colors={['#8B9D83', '#7FA98E']} style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>More Settings</Text>
        </View>
        <Text style={styles.headerSub}>App preferences and account management</Text>
      </LinearGradient>

      <View style={styles.body}>
        {/* Appearance */}
        <View>
          <Text style={[styles.sectionLabel, { color: isDark ? '#AEAEB2' : '#8A8D91' }]}>APPEARANCE</Text>
          <View style={[styles.card, card]}>
            <View style={styles.toggleRow}>
              <View style={styles.rowLeft}>
                <Ionicons name="moon" size={20} color={iconColor} />
                <View>
                  <Text style={[styles.rowLabel, { color: textColor }]}>Dark Mode</Text>
                  <Text style={[styles.rowSublabel, { color: isDark ? '#AEAEB2' : '#8A8D91' }]}>
                    {isDark ? 'Enabled' : 'Disabled'}
                  </Text>
                </View>
              </View>
              <ToggleSwitch enabled={isDark} onChange={toggleDarkMode} />
            </View>
          </View>
        </View>

        {/* Preferences */}
        <View>
          <Text style={[styles.sectionLabel, { color: isDark ? '#AEAEB2' : '#8A8D91' }]}>PREFERENCES</Text>
          <View style={[styles.card, card]}>
            {renderRow({ icon: 'globe', label: 'Language', sublabel: 'English (US)' })}
            {renderRow({ icon: 'phone-portrait', label: 'Map Style', sublabel: 'Standard' }, false)}
          </View>
        </View>

        {/* Privacy & Security */}
        <View>
          <Text style={[styles.sectionLabel, { color: isDark ? '#AEAEB2' : '#8A8D91' }]}>PRIVACY & SECURITY</Text>
          <View style={[styles.card, card]}>
            {renderRow({ icon: 'shield-checkmark', label: 'Privacy Policy' })}
            {renderRow({ icon: 'document-text', label: 'Terms of Service' }, false)}
          </View>
        </View>

        {/* Support */}
        <View>
          <Text style={[styles.sectionLabel, { color: isDark ? '#AEAEB2' : '#8A8D91' }]}>SUPPORT</Text>
          <View style={[styles.card, card]}>
            {renderRow({ icon: 'help-circle', label: 'Help & Support' })}
            {renderRow({ icon: 'share-social', label: 'Share App' }, false)}
          </View>
        </View>

        {/* Account */}
        <View>
          <Text style={[styles.sectionLabel, { color: isDark ? '#AEAEB2' : '#8A8D91' }]}>ACCOUNT</Text>
          <View style={[styles.card, card]}>
            {renderRow({ icon: 'log-out', label: 'Sign Out', color: '#C9A96E' })}
            {renderRow({ icon: 'trash', label: 'Delete Account', color: '#B87C7C' }, false)}
          </View>
        </View>

        {/* Version */}
        <View style={styles.versionWrap}>
          <Text style={[styles.versionText, { color: isDark ? '#AEAEB2' : '#8A8D91' }]}>Version 1.2.4</Text>
          <Text style={[styles.versionText, { color: isDark ? '#AEAEB2' : '#8A8D91' }]}>© 2026 Carten</Text>
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
  sectionLabel: { fontSize: 12, fontWeight: '600', marginBottom: 8, paddingLeft: 4 },
  card: { borderRadius: 16, borderWidth: 1 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  rowLabel: { fontSize: 14, fontWeight: '500' },
  rowSublabel: { fontSize: 12, marginTop: 2 },
  versionWrap: { alignItems: 'center', paddingVertical: 16 },
  versionText: { fontSize: 12 },
});
