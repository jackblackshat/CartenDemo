import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDarkMode } from '../context/DarkModeContext';

interface CrowdsourcePromptProps {
  spot: {
    id: string;
    name: string;
    lat: number;
    lng: number;
  };
  onResponse: (spotId: string, isOpen: boolean) => void;
  onDismiss: () => void;
}

export default function CrowdsourcePrompt({
  spot,
  onResponse,
  onDismiss,
}: CrowdsourcePromptProps) {
  const { isDark } = useDarkMode();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF',
          borderColor: isDark ? '#3A3A3C' : '#D3D5D7',
        },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="people" size={20} color="#7FA98E" />
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: isDark ? '#F5F5F7' : '#4A4F55' }]}>
            Help the community!
          </Text>
          <Text style={[styles.subtitle, { color: isDark ? '#AEAEB2' : '#8A8D91' }]}>
            Is this spot available?
          </Text>
        </View>
        <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close" size={20} color={isDark ? '#AEAEB2' : '#8A8D91'} />
        </TouchableOpacity>
      </View>

      <Text
        style={[styles.spotName, { color: isDark ? '#F5F5F7' : '#4A4F55' }]}
        numberOfLines={1}
      >
        {spot.name}
      </Text>

      <View style={styles.buttons}>
        <TouchableOpacity
          onPress={() => onResponse(spot.id, true)}
          style={[styles.button, styles.yesButton]}
          activeOpacity={0.8}
        >
          <Ionicons name="checkmark" size={20} color="#FFFFFF" />
          <Text style={styles.yesText}>Available</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onResponse(spot.id, false)}
          style={[
            styles.button,
            styles.noButton,
            {
              backgroundColor: isDark ? '#3A3A3C' : '#F5F1E8',
              borderColor: isDark ? '#48484A' : '#D3D5D7',
            },
          ]}
          activeOpacity={0.8}
        >
          <Ionicons name="close" size={20} color={isDark ? '#F5F5F7' : '#4A4F55'} />
          <Text style={[styles.noText, { color: isDark ? '#F5F5F7' : '#4A4F55' }]}>
            Taken
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.rewardBanner}>
        <Ionicons name="trophy" size={16} color="#7FA98E" />
        <Text style={styles.rewardText}>Earn 5 credits for reporting</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    width: '90%',
    maxWidth: 340,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    zIndex: 1000,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(127, 169, 142, 0.2)',
    borderWidth: 1,
    borderColor: '#7FA98E',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  spotName: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 16,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
  },
  yesButton: {
    backgroundColor: '#7FA98E',
  },
  noButton: {
    borderWidth: 1,
  },
  yesText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  noText: {
    fontSize: 15,
    fontWeight: '600',
  },
  rewardBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(127, 169, 142, 0.1)',
    borderRadius: 12,
    paddingVertical: 8,
  },
  rewardText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#7FA98E',
  },
});
