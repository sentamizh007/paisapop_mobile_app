import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

interface Props {
  segments: { value: number; color: string; label: string; percent: number }[];
  total: number;
  currencySymbol: string;
}

export const DonutChart = ({ segments, total, currencySymbol }: Props) => {
  const size = 130;
  const stroke = 18;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const circ = 2 * Math.PI * r;
  let currentAngle = -90;

  if (!segments.length || total <= 0) {
    return (
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={size} height={size}>
          <Circle cx={cx} cy={cx} r={r} stroke="#3F3F46" strokeWidth={stroke} fill="none" />
        </Svg>
        <View style={{ position: 'absolute', justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: '#888', fontSize: 11 }}>No data</Text>
        </View>
      </View>
    );
  }

  const innerDiameter = size - stroke * 2;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      <Svg width={size} height={size}>
        <G>
          {/* Background track */}
          <Circle cx={cx} cy={cx} r={r} stroke="#27272A" strokeWidth={stroke} fill="none" />
          
          {segments.map((seg, i) => {
            const len = (seg.value / (total || 1)) * circ;
            const rot = currentAngle;
            const segmentAngle = (len / circ) * 360;
            currentAngle += segmentAngle;
            
            return (
              <Circle
                key={i}
                cx={cx}
                cy={cx}
                r={r}
                stroke={seg.color}
                strokeWidth={stroke}
                fill="none"
                strokeDasharray={`${len} ${circ}`}
                strokeLinecap="butt"
                transform={`rotate(${rot} ${cx} ${cx})`}
              />
            );
          })}
        </G>
      </Svg>

      <View
        style={{
          position: 'absolute',
          width: innerDiameter - 4,
          maxWidth: innerDiameter - 4,
          height: innerDiameter - 4,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 4,
        }}
      >
        <Text
          style={{
            color: '#FAFAFA',
            fontSize: 13,
            fontWeight: '800',
            textAlign: 'center',
            width: '100%',
          }}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.45}
        >
          {currencySymbol}{total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
        </Text>
        <Text style={{ color: '#A1A1AA', fontSize: 10, marginTop: 1, fontWeight: '500' }}>Total</Text>
      </View>
    </View>
  );
};
