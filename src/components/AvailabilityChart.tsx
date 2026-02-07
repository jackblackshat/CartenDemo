import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { useDarkMode } from '../context/DarkModeContext';

interface DataPoint {
  hour: string;
  availability: number;
}

interface AvailabilityChartProps {
  data: DataPoint[];
  height?: number;
  compact?: boolean;
}

export default function AvailabilityChart({
  data,
  height = 120,
  compact = true,
}: AvailabilityChartProps) {
  const { isDark } = useDarkMode();
  const chartWidth = Dimensions.get('window').width - 64;

  if (data.length === 0) return null;

  const maxValue = 100;
  const barWidth = Math.max(4, (chartWidth / data.length) - 4);

  return (
    <View style={[styles.container, { height }]}>
      <View style={styles.barsContainer}>
        {data.map((point, index) => {
          const barHeight = (point.availability / maxValue) * (height - (compact ? 20 : 40));
          const color =
            point.availability >= 70
              ? '#7FA98E'
              : point.availability >= 30
              ? '#C9A96E'
              : '#B87C7C';

          return (
            <View key={index} style={styles.barWrapper}>
              <View
                style={[
                  styles.bar,
                  {
                    height: barHeight,
                    width: barWidth,
                    backgroundColor: color,
                    opacity: 0.8,
                  },
                ]}
              />
              {!compact && index % 3 === 0 && (
                <Text
                  style={[
                    styles.label,
                    { color: isDark ? '#AEAEB2' : '#8A8D91' },
                  ]}
                >
                  {point.hour}
                </Text>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    flex: 1,
    paddingBottom: 4,
  },
  barWrapper: {
    alignItems: 'center',
    flex: 1,
  },
  bar: {
    borderRadius: 3,
    minHeight: 4,
  },
  label: {
    fontSize: 9,
    marginTop: 4,
  },
});
