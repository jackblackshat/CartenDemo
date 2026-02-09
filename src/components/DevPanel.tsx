import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { useDarkMode } from '../context/DarkModeContext';
import { useDemo, DemoOverrides } from '../context/DemoContext';
import ToggleSwitch from './ToggleSwitch';

interface DevPanelProps {
  visible: boolean;
  onClose: () => void;
  onApply?: (applied: DemoOverrides) => void;
}

const TRAFFIC_OPTIONS = ['light', 'moderate', 'heavy'] as const;

export default function DevPanel({ visible, onClose, onApply }: DevPanelProps) {
  const { isDark } = useDarkMode();
  const { overrides, setOccupancy, setTraffic, setForceReroute, setCameraSpotAvailable, setPhoneSpotFree, setWorkScenario, setParkingDuration, reset } = useDemo();

  // Local buffered state — only committed on Apply
  const [local, setLocal] = useState<DemoOverrides>({ ...overrides });

  // Sync local state from context when panel opens
  useEffect(() => {
    if (visible) {
      setLocal({ ...overrides });
    }
  }, [visible]);

  const bg = isDark ? '#1C1C1E' : '#FFFFFF';
  const cardBg = isDark ? '#2C2C2E' : '#F5F1E8';
  const textPrimary = isDark ? '#F5F5F7' : '#4A4F55';
  const textSecondary = isDark ? '#AEAEB2' : '#8A8D91';

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={[styles.panel, { backgroundColor: bg }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.devBadge}>
                <Text style={styles.devBadgeText}>DEV</Text>
              </View>
              <Text style={[styles.title, { color: textPrimary }]}>Demo Controls</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Ionicons name="close-circle" size={28} color={textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Lot Occupancy */}
          <View style={[styles.card, { backgroundColor: cardBg }]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: textPrimary }]}>Lot Occupancy</Text>
              <Text style={[styles.cardValue, { color: '#7FA98E' }]}>
                {local.occupancy !== null ? `${local.occupancy}%` : 'Auto'}
              </Text>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={100}
              step={5}
              value={local.occupancy ?? 30}
              onSlidingComplete={(value) => setLocal((prev) => ({ ...prev, occupancy: Math.round(value) }))}
              minimumTrackTintColor="#7FA98E"
              maximumTrackTintColor={isDark ? '#48484A' : '#D3D5D7'}
              thumbTintColor="#7FA98E"
            />
            <View style={styles.sliderLabels}>
              <Text style={[styles.sliderLabel, { color: textSecondary }]}>0%</Text>
              <Text style={[styles.sliderLabel, { color: textSecondary }]}>50%</Text>
              <Text style={[styles.sliderLabel, { color: textSecondary }]}>100%</Text>
            </View>
          </View>

          {/* Camera spot available */}
          <View style={[styles.card, { backgroundColor: cardBg }]}>
            <Text style={[styles.cardTitle, { color: textPrimary }]}>Camera spot available</Text>
            <Text style={[styles.cardSubtitle, { color: textSecondary }]}>Override what camera reports for spot availability</Text>
            <View style={styles.segmentRow}>
              {(['Auto', 'Available', 'Unavailable'] as const).map((opt) => {
                const value = opt === 'Auto' ? null : opt === 'Available';
                const isActive = local.cameraSpotAvailable === value;
                return (
                  <TouchableOpacity
                    key={opt}
                    onPress={() => setLocal((prev) => ({ ...prev, cameraSpotAvailable: value }))}
                    style={[
                      styles.segment,
                      isActive && styles.segmentActive,
                      !isActive && {
                        backgroundColor: isDark ? '#3A3A3C' : '#FFFFFF',
                        borderColor: isDark ? '#48484A' : '#D3D5D7',
                      },
                    ]}
                  >
                    <Text style={[styles.segmentText, { color: isActive ? '#FFFFFF' : textSecondary }]}>{opt}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Phone/Crowd: no one in spot */}
          <View style={[styles.card, { backgroundColor: cardBg }]}>
            <Text style={[styles.cardTitle, { color: textPrimary }]}>Phone/Crowd: no one in spot</Text>
            <Text style={[styles.cardSubtitle, { color: textSecondary }]}>Override queue / crowdsource (no simulated users when Yes)</Text>
            <View style={styles.segmentRow}>
              {(['Auto', 'Yes', 'No'] as const).map((opt) => {
                const value = opt === 'Auto' ? null : opt === 'Yes';
                const isActive = local.phoneSpotFree === value;
                return (
                  <TouchableOpacity
                    key={opt}
                    onPress={() => setLocal((prev) => ({ ...prev, phoneSpotFree: value }))}
                    style={[
                      styles.segment,
                      isActive && styles.segmentActive,
                      !isActive && {
                        backgroundColor: isDark ? '#3A3A3C' : '#FFFFFF',
                        borderColor: isDark ? '#48484A' : '#D3D5D7',
                      },
                    ]}
                  >
                    <Text style={[styles.segmentText, { color: isActive ? '#FFFFFF' : textSecondary }]}>{opt}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Traffic Level */}
          <View style={[styles.card, { backgroundColor: cardBg }]}>
            <Text style={[styles.cardTitle, { color: textPrimary }]}>Traffic Level</Text>
            <View style={styles.segmentRow}>
              {TRAFFIC_OPTIONS.map((level) => {
                const isActive = local.traffic === level;
                return (
                  <TouchableOpacity
                    key={level}
                    onPress={() => setLocal((prev) => ({ ...prev, traffic: isActive ? null : level }))}
                    style={[
                      styles.segment,
                      isActive && styles.segmentActive,
                      !isActive && {
                        backgroundColor: isDark ? '#3A3A3C' : '#FFFFFF',
                        borderColor: isDark ? '#48484A' : '#D3D5D7',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        { color: isActive ? '#FFFFFF' : textSecondary },
                      ]}
                    >
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Force Reroute */}
          <View style={[styles.card, { backgroundColor: cardBg }]}>
            <View style={styles.toggleRow}>
              <View>
                <Text style={[styles.cardTitle, { color: textPrimary }]}>Force Reroute</Text>
                <Text style={[styles.cardSubtitle, { color: textSecondary }]}>
                  Triggers reroute card regardless of confidence
                </Text>
              </View>
              <ToggleSwitch
                enabled={local.forceReroute}
                onChange={() => setLocal((prev) => ({ ...prev, forceReroute: !prev.forceReroute }))}
              />
            </View>
          </View>

          {/* Apply */}
          <TouchableOpacity
            onPress={() => {
              setOccupancy(local.occupancy);
              setTraffic(local.traffic);
              setForceReroute(local.forceReroute);
              setCameraSpotAvailable(local.cameraSpotAvailable);
              setPhoneSpotFree(local.phoneSpotFree);
              setWorkScenario(local.workScenario);
              setParkingDuration(local.parkingDuration);
              onClose();
              onApply?.(local);
            }}
            style={styles.applyButton}
          >
            <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
            <Text style={styles.applyText}>Apply</Text>
          </TouchableOpacity>

          {/* Reset */}
          <TouchableOpacity
            onPress={() => {
              reset();
              setLocal({
                occupancy: null,
                traffic: null,
                forceReroute: false,
                cameraSpotAvailable: null,
                phoneSpotFree: null,
                workScenario: false,
                parkingDuration: null,
              });
              onClose();
            }}
            style={styles.resetButton}
          >
            <Ionicons name="refresh" size={18} color="#FFFFFF" />
            <Text style={styles.resetText}>Reset All Overrides</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  panel: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  devBadge: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  devBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  cardSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  cardValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  slider: {
    marginTop: 12,
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sliderLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  segmentRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  segmentActive: {
    backgroundColor: '#7FA98E',
    borderColor: '#7FA98E',
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  applyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#7FA98E',
    borderRadius: 16,
    paddingVertical: 14,
    marginTop: 8,
  },
  applyText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#B87C7C',
    borderRadius: 16,
    paddingVertical: 14,
    marginTop: 8,
  },
  resetText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
