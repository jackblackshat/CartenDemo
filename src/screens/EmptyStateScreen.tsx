import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDarkMode } from '../context/DarkModeContext';
import type { MapStackParamList } from '../navigation/types';

type NavProp = NativeStackNavigationProp<MapStackParamList>;

export default function EmptyStateScreen() {
  const navigation = useNavigation<NavProp>();
  const { isDark } = useDarkMode();

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#1C1C1E' : '#F5F1E8' }]}>
      <View style={styles.content}>
        {/* Illustration */}
        <View style={styles.illustrationWrap}>
          <View style={styles.illustrationBg} />
          <Ionicons name="location" size={96} color="#B87C7C" />
        </View>

        {/* Message */}
        <Text style={[styles.title, { color: isDark ? '#F5F5F7' : '#4A4F55' }]}>
          No free spots nearby
        </Text>
        <Text style={[styles.subtitle, { color: isDark ? '#AEAEB2' : '#8A8D91' }]}>
          All street parking is currently occupied in this area. Check out paid options or get notified when spots open up.
        </Text>

        {/* Prediction */}
        <View style={[styles.predictionCard, {
          backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF',
          borderColor: isDark ? '#3A3A3C' : '#D3D5D7',
        }]}>
          <Ionicons name="time-outline" size={20} color="#C9A96E" />
          <Text style={styles.predictionText}>Usually opens in ~12 mins</Text>
        </View>

        {/* Actions */}
        <TouchableOpacity
          onPress={() => navigation.navigate('GaragePaid', { id: '1' })}
          style={styles.primaryBtn}
        >
          <Text style={styles.primaryBtnText}>Try paid parking</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.secondaryBtn, {
          backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF',
          borderColor: isDark ? '#3A3A3C' : '#D3D5D7',
        }]}>
          <Ionicons name="notifications-outline" size={20} color={isDark ? '#F5F5F7' : '#4A4F55'} />
          <Text style={[styles.secondaryBtnText, { color: isDark ? '#F5F5F7' : '#4A4F55' }]}>
            Notify when open
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  content: { maxWidth: 340, alignItems: 'center' },
  illustrationWrap: { width: 192, height: 192, alignItems: 'center', justifyContent: 'center', marginBottom: 32 },
  illustrationBg: {
    position: 'absolute', width: 192, height: 192, borderRadius: 96,
    backgroundColor: 'rgba(184, 124, 124, 0.2)',
  },
  title: { fontSize: 24, fontWeight: '700', textAlign: 'center', marginBottom: 12 },
  subtitle: { fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  predictionCard: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 16, paddingHorizontal: 20, borderRadius: 16, borderWidth: 1,
    marginBottom: 24, width: '100%', justifyContent: 'center',
  },
  predictionText: { fontSize: 14, fontWeight: '500', color: '#C9A96E' },
  primaryBtn: {
    width: '100%', paddingVertical: 16, borderRadius: 16,
    backgroundColor: '#7FA98E', alignItems: 'center', marginBottom: 12,
  },
  primaryBtnText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  secondaryBtn: {
    width: '100%', paddingVertical: 16, borderRadius: 16, borderWidth: 1,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  secondaryBtnText: { fontSize: 16, fontWeight: '600' },
});
