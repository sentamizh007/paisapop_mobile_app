import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

interface Props {
  segments: { value: number; color: string; label: string; percent: number }[];
  total: number;
  currencySymbol: string;
  colors: any;
}

export const DonutChart = ({ segments, total, currencySymbol, colors }: Props) => {
  const size = 180;
  const stroke = 22;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const circ = 2 * Math.PI * r;
  let angle = -90;

  if (!segments.length) {
    return (
      <View style={{ alignItems: 'center', paddingVertical: 20 }}>
        <Text style={{ color: colors.textSecondary, fontSize: 14 }}>No data for this period</Text>
      </View>
    );
  }

  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{ width: size, height: size, position: 'relative' }}>
        <Svg width={size} height={size}>
          {/* Background circle */}
          <Circle cx={cx} cy={cx} r={r} stroke={colors.surfaceLight} strokeWidth={stroke} fill="none" />
          {segments.map((seg, i) => {
            const len = (seg.value / (total || 1)) * circ;
            const rot = angle;
            angle += (len / circ) * 360;
            return (
              <Circle
                key={i} cx={cx} cy={cx} r={r}
                stroke={seg.color} strokeWidth={stroke} fill="none"
                strokeDasharray={`${len} ${circ}`}
                strokeLinecap="round"
                transform={`rotate(${rot} ${cx} ${cx})`}
              />
            );
          })}
        </Svg>
        {/* Center text */}
        <View style={StyleSheet.absoluteFill}>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: colors.textSecondary, fontSize: 10, fontWeight: '600', letterSpacing: 0.5 }}>
              TOTAL SPENT
            </Text>
            <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: '800', marginTop: 2 }}>
              {currencySymbol}{total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>
        </View>
      </View>
      {/* Legend row below donut */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 16, gap: 14 }}>
        {segments.map((seg, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: seg.color }} />
            <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '500' }}>
              {seg.label} ({seg.percent}%)
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};
