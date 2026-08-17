import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Text as SvgText, G } from 'react-native-svg';

interface Props {
  segments: { value: number; color: string; label: string; percent: number }[];
  total: number;
  currencySymbol: string;
}

export const DonutChart = ({ segments, total, currencySymbol }: Props) => {
  const size = 160;
  const stroke = 24;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const circ = 2 * Math.PI * r;
  let currentAngle = -90;

  if (!segments.length) {
    return (
      <View style={{ alignItems: 'center', justifyContent: 'center', height: size }}>
        <Text style={{ color: '#888', fontSize: 13 }}>No data</Text>
      </View>
    );
  }

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      <Svg width={size + 60} height={size + 60} style={{ position: 'absolute' }}>
        <G x={30} y={30}>
          {/* Background */}
          <Circle cx={cx} cy={cx} r={r} stroke="#27272A" strokeWidth={stroke} fill="none" />
          
          {segments.map((seg, i) => {
            const len = (seg.value / (total || 1)) * circ;
            const rot = currentAngle;
            const segmentAngle = (len / circ) * 360;
            
            // Text position (midpoint of the arc, slightly outside)
            const midAngle = rot + segmentAngle / 2;
            const textR = r + 24;
            const textX = cx + textR * Math.cos((midAngle * Math.PI) / 180);
            const textY = cx + textR * Math.sin((midAngle * Math.PI) / 180);
            
            currentAngle += segmentAngle;
            
            return (
              <G key={i}>
                <Circle
                  cx={cx} cy={cx} r={r}
                  stroke={seg.color} strokeWidth={stroke} fill="none"
                  strokeDasharray={`${len} ${circ}`}
                  transform={`rotate(${rot} ${cx} ${cx})`}
                />
                {seg.percent >= 5 && (
                  <SvgText
                    x={textX} y={textY + 4}
                    fill="#FFF" fontSize="12" fontWeight="700" textAnchor="middle"
                  >
                    {seg.percent}%
                  </SvgText>
                )}
              </G>
            );
          })}
        </G>
      </Svg>

      <View style={{ position: 'absolute', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '700' }}>
          {currencySymbol}{total.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
        </Text>
        <Text style={{ color: '#888', fontSize: 11, marginTop: 2 }}>Total</Text>
      </View>
    </View>
  );
};
