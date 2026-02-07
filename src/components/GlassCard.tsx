import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { useDarkMode } from '../context/DarkModeContext';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: number;
}

export default function GlassCard({ children, style, intensity = 80 }: GlassCardProps) {
  const { isDark } = useDarkMode();

  return (
    <View style={[styles.container, style]}>
      <BlurView
        intensity={intensity}
        tint={isDark ? 'dark' : 'light'}
        style={StyleSheet.absoluteFill}
      />
      <View
        style={[
          styles.overlay,
          {
            backgroundColor: isDark
              ? 'rgba(44, 44, 46, 0.6)'
              : 'rgba(255, 255, 255, 0.6)',
            borderColor: isDark ? '#3A3A3C' : '#D3D5D7',
          },
        ]}
      />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderRadius: 16,
  },
  content: {
    padding: 16,
  },
});
