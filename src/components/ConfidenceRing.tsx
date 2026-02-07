import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

interface ConfidenceRingProps {
  confidence: number;
  size?: number;
  strokeWidth?: number;
}

function getConfidenceColor(confidence: number): string {
  if (confidence >= 90) return '#7FA98E';
  if (confidence >= 70) return '#C9A96E';
  return '#B87C7C';
}

export default function ConfidenceRing({
  confidence,
  size = 128,
  strokeWidth = 8,
}: ConfidenceRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = circumference * (1 - confidence / 100);
  const color = getConfidenceColor(confidence);
  const center = size / 2;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Defs>
          <LinearGradient id="ringGradient" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0%" stopColor="#8B9D83" />
            <Stop offset="100%" stopColor="#7FA98E" />
          </LinearGradient>
        </Defs>
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke="rgba(127, 169, 142, 0.15)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={progress}
          strokeLinecap="round"
        />
      </Svg>
      <View style={styles.centerText}>
        <Text style={[styles.value, { color }]}>{confidence}%</Text>
        <Text style={styles.label}>Confidence</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerText: {
    position: 'absolute',
    alignItems: 'center',
  },
  value: {
    fontSize: 28,
    fontWeight: '700',
  },
  label: {
    fontSize: 11,
    color: '#8A8D91',
    marginTop: 2,
  },
});
