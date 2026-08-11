import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { colors } from '../theme/colors';

interface DonutChartProps {
  total: number;
}

export const DonutChart = ({ total }: DonutChartProps) => {
  const size = 160;
  const strokeWidth = 20;
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;

  // Simple static donut for mock UI
  return (
    <View style={styles.container}>
      <Svg width={size} height={size}>
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={colors.primary}
          strokeWidth={strokeWidth}
          strokeDasharray={`${radius * Math.PI * 2 * 0.4} ${radius * Math.PI * 2}`}
          fill="none"
          transform={`rotate(-90 ${center} ${center})`}
        />
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={colors.info} // Blue
          strokeWidth={strokeWidth}
          strokeDasharray={`${radius * Math.PI * 2 * 0.3} ${radius * Math.PI * 2}`}
          fill="none"
          transform={`rotate(${360 * 0.4 - 90} ${center} ${center})`}
        />
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={colors.warning} // Yellow
          strokeWidth={strokeWidth}
          strokeDasharray={`${radius * Math.PI * 2 * 0.15} ${radius * Math.PI * 2}`}
          fill="none"
          transform={`rotate(${360 * 0.7 - 90} ${center} ${center})`}
        />
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={colors.textSecondary} // Gray
          strokeWidth={strokeWidth}
          strokeDasharray={`${radius * Math.PI * 2 * 0.15} ${radius * Math.PI * 2}`}
          fill="none"
          transform={`rotate(${360 * 0.85 - 90} ${center} ${center})`}
        />
      </Svg>
      <View style={styles.centerTextContainer}>
        <Text style={styles.centerLabel}>Total Spent</Text>
        <Text style={styles.centerValue}>₹{total.toLocaleString('en-IN')}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    height: 160,
    width: 160,
  },
  centerTextContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    marginBottom: 4,
  },
  centerValue: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
});
