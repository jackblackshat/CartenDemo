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

interface DurationModalProps {
  visible: boolean;
  onClose: () => void;
  currentDuration: string;
  onSelect: (duration: string) => void;
}

const durations = ['None', '30 min', '1 hour', '2 hours', '4 hours', 'All day'];

export default function DurationModal({
  visible,
  onClose,
  currentDuration,
  onSelect,
}: DurationModalProps) {
  const { isDark } = useDarkMode();

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View
          style={[
            styles.sheet,
            { backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF' },
          ]}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: isDark ? '#F5F5F7' : '#4A4F55' }]}>
              Default Duration
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={isDark ? '#AEAEB2' : '#8A8D91'} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.description, { color: isDark ? '#AEAEB2' : '#8A8D91' }]}>
            Set how long you typically park. This helps us find the best spots for you.
          </Text>

          <ScrollView style={styles.list}>
            {durations.map((duration) => {
              const isSelected = currentDuration === duration;
              return (
                <TouchableOpacity
                  key={duration}
                  onPress={() => {
                    onSelect(duration);
                    onClose();
                  }}
                  style={[
                    styles.option,
                    {
                      borderColor: isSelected ? '#7FA98E' : isDark ? '#3A3A3C' : '#D3D5D7',
                      backgroundColor: isSelected
                        ? 'rgba(127, 169, 142, 0.1)'
                        : isDark
                        ? '#3A3A3C'
                        : '#FFFFFF',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.optionText,
                      { color: isSelected ? '#7FA98E' : isDark ? '#F5F5F7' : '#4A4F55' },
                    ]}
                  >
                    {duration}
                  </Text>
                  {isSelected && (
                    <View style={styles.checkmark}>
                      <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
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
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '70%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  description: {
    fontSize: 14,
    marginBottom: 16,
  },
  list: {
    gap: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  checkmark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#7FA98E',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
