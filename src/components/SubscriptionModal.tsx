import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDarkMode } from '../context/DarkModeContext';

interface SubscriptionModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function SubscriptionModal({ visible, onClose }: SubscriptionModalProps) {
  const { isDark } = useDarkMode();

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <ScrollView
          style={[styles.sheet, { backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF' }]}
          contentContainerStyle={styles.sheetContent}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: isDark ? '#F5F5F7' : '#4A4F55' }]}>
              Choose Your Plan
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={isDark ? '#AEAEB2' : '#8A8D91'} />
            </TouchableOpacity>
          </View>

          {/* Free Plan */}
          <View
            style={[
              styles.planCard,
              {
                borderColor: isDark ? '#3A3A3C' : '#D3D5D7',
                backgroundColor: isDark ? '#3A3A3C' : '#FFFFFF',
              },
            ]}
          >
            <View style={styles.planHeader}>
              <View>
                <Text style={[styles.planName, { color: isDark ? '#F5F5F7' : '#4A4F55' }]}>
                  Free
                </Text>
                <Text style={[styles.planPrice, { color: isDark ? '#AEAEB2' : '#8A8D91' }]}>
                  $0<Text style={styles.perMonth}>/mo</Text>
                </Text>
              </View>
              <View style={styles.currentBadge}>
                <Text style={styles.currentBadgeText}>Current Plan</Text>
              </View>
            </View>

            {[
              { text: 'Prediction data after 30 days', included: true },
              { text: '"Likely available" labels', included: true },
              { text: 'Basic spot search', included: true },
              { text: 'No real-time camera feeds', included: false },
              { text: 'Standard notifications', included: false },
            ].map((item, i) => (
              <View key={i} style={styles.featureRow}>
                <Ionicons
                  name={item.included ? 'checkmark' : 'close'}
                  size={18}
                  color={item.included ? '#7FA98E' : '#8A8D91'}
                />
                <Text
                  style={[
                    styles.featureText,
                    {
                      color: item.included
                        ? isDark
                          ? '#F5F5F7'
                          : '#4A4F55'
                        : '#8A8D91',
                    },
                  ]}
                >
                  {item.text}
                </Text>
              </View>
            ))}
          </View>

          {/* Pro Plan */}
          <View style={styles.proPlanWrapper}>
            <View
              style={[
                styles.planCard,
                { borderColor: 'transparent', backgroundColor: isDark ? '#3A3A3C' : '#FFFFFF' },
              ]}
            >
              <View style={styles.planHeader}>
                <View>
                  <View style={styles.proNameRow}>
                    <Text style={[styles.planName, { color: isDark ? '#F5F5F7' : '#4A4F55' }]}>
                      Pro
                    </Text>
                    <View style={styles.popularBadge}>
                      <Text style={styles.popularText}>POPULAR</Text>
                    </View>
                  </View>
                  <Text style={[styles.planPrice, { color: '#7FA98E' }]}>
                    $4.99<Text style={styles.perMonth}>/mo</Text>
                  </Text>
                </View>
              </View>

              {[
                { icon: 'flash-outline' as const, text: 'Real-time data always', bold: true },
                { icon: 'camera-outline' as const, text: 'Live camera feeds', bold: true },
                { icon: 'notifications-outline' as const, text: 'Priority alerts', bold: true },
                { icon: 'bar-chart-outline' as const, text: 'Advanced analytics', bold: true },
              ].map((item, i) => (
                <View key={i} style={styles.featureRow}>
                  <View style={styles.proIcon}>
                    <Ionicons name={item.icon} size={14} color="#7FA98E" />
                  </View>
                  <Text
                    style={[
                      styles.featureText,
                      { fontWeight: item.bold ? '600' : '400', color: isDark ? '#F5F5F7' : '#4A4F55' },
                    ]}
                  >
                    {item.text}
                  </Text>
                </View>
              ))}

              <TouchableOpacity style={styles.trialButton}>
                <Text style={styles.trialButtonText}>Start 7-Day Free Trial</Text>
              </TouchableOpacity>
              <Text style={styles.trialNote}>
                Cancel anytime. $4.99/month after trial.
              </Text>
            </View>
          </View>
        </ScrollView>
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
  sheet: {
    maxHeight: '90%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  sheetContent: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  planCard: {
    borderRadius: 16,
    borderWidth: 2,
    padding: 20,
    marginBottom: 16,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  planName: {
    fontSize: 20,
    fontWeight: '700',
  },
  planPrice: {
    fontSize: 28,
    fontWeight: '700',
    marginTop: 4,
  },
  perMonth: {
    fontSize: 15,
  },
  currentBadge: {
    backgroundColor: '#F5F1E8',
    borderWidth: 1,
    borderColor: '#D3D5D7',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  currentBadgeText: {
    fontSize: 13,
    color: '#8A8D91',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  featureText: {
    fontSize: 14,
    flex: 1,
  },
  proPlanWrapper: {
    borderRadius: 18,
    padding: 2,
    backgroundColor: '#7FA98E',
  },
  proNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  popularBadge: {
    backgroundColor: '#7FA98E',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  popularText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  proIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(127, 169, 142, 0.2)',
    borderWidth: 1,
    borderColor: '#7FA98E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trialButton: {
    backgroundColor: '#7FA98E',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  trialButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  trialNote: {
    fontSize: 12,
    color: '#8A8D91',
    textAlign: 'center',
    marginTop: 8,
  },
});
