import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { colors } from '../theme/colors';

interface BarChartProps {
  data: number[];
  labels: string[];
}

export const BarChart = ({ data, labels }: BarChartProps) => {
  const maxValue = Math.max(...data, 1); // Avoid division by zero
  const maxHeight = 100;

  return (
    <View style={styles.container}>
      <View style={styles.chartArea}>
        {data.map((val, index) => {
          const height = (val / maxValue) * maxHeight;
          return (
            <View key={index} style={styles.barContainer}>
              <View style={[styles.bar, { height }]} />
            </View>
          );
        })}
      </View>
      <View style={styles.labelsArea}>
        {labels.map((label, index) => (
          <Text key={index} style={styles.label}>{label}</Text>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 140,
    width: '100%',
  },
  chartArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  barContainer: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bar: {
    width: 16,
    backgroundColor: colors.primary,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  labelsArea: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginTop: 8,
  },
  label: {
    width: 24,
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 12,
  },
});
