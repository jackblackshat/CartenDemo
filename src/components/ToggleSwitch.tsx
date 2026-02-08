import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { useDarkMode } from '../context/DarkModeContext';

interface ToggleSwitchProps {
  enabled: boolean;
  onChange: () => void;
}

export default function ToggleSwitch({ enabled, onChange }: ToggleSwitchProps) {
  const { isDark } = useDarkMode();

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onChange}
      style={[
        styles.track,
        {
          backgroundColor: enabled
            ? '#7FA98E'
            : isDark
            ? '#48484A'
            : '#D3D5D7',
        },
      ]}
    >
      <View
        style={[
          styles.thumb,
          enabled ? styles.thumbEnabled : styles.thumbDisabled,
        ]}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  track: {
    width: 48,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  thumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  thumbEnabled: {
    alignSelf: 'flex-end',
  },
  thumbDisabled: {
    alignSelf: 'flex-start',
  },
});
