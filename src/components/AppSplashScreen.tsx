import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Image, Dimensions, StatusBar, Platform } from 'react-native';

const { width: W } = Dimensions.get('window');

interface Props {
  onFinish?: () => void;
  isReady?: boolean;
}

export const AppSplashScreen: React.FC<Props> = ({ onFinish, isReady = true }) => {
  const scaleAnim = useRef(new Animated.Value(0.75)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const footerOpacity = useRef(new Animated.Value(0)).current;
  const containerOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 1. Icon zoom & fade in
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // 2. Text fade in
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();

      // 3. Footer fade in
      Animated.timing(footerOpacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }).start();
    });
  }, []);

  useEffect(() => {
    if (isReady) {
      const timer = setTimeout(() => {
        // Smooth fade out of splash screen
        Animated.timing(containerOpacity, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }).start(() => {
          if (onFinish) onFinish();
        });
      }, 1600);

      return () => clearTimeout(timer);
    }
  }, [isReady, onFinish]);

  return (
    <Animated.View style={[styles.container, { opacity: containerOpacity }]}>
      <StatusBar barStyle="light-content" backgroundColor="#09090B" />
      
      {/* Center Branding */}
      <View style={styles.centerWrap}>
        <Animated.View
          style={[
            styles.iconCircle,
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Image
            source={require('../../assets/icon.png')}
            style={styles.iconImage}
            resizeMode="contain"
          />
        </Animated.View>

        <Animated.View style={[styles.textBlock, { opacity: textOpacity }]}>
          <Text style={styles.appName}>
            Paisa<Text style={{ color: '#22C55E' }}>Pop</Text>
          </Text>
          <Text style={styles.tagline}>Smart Personal Expense & Budget Tracker</Text>
        </Animated.View>
      </View>

      {/* Footer Branding */}
      <Animated.View style={[styles.footerWrap, { opacity: footerOpacity }]}>
        <Text style={styles.footerBy}>DEVELOPED BY</Text>
        <Text style={styles.footerBrand}>Kerplunk Media</Text>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#09090B',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999999,
  },
  centerWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: '#121215',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(34, 197, 94, 0.45)',
    shadowColor: '#22C55E',
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
    marginBottom: 20,
  },
  iconImage: {
    width: '100%',
    height: '100%',
  },
  textBlock: {
    alignItems: 'center',
  },
  appName: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FAFAFA',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  tagline: {
    fontSize: 13,
    fontWeight: '500',
    color: '#A1A1AA',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  footerWrap: {
    position: 'absolute',
    bottom: 36,
    alignItems: 'center',
  },
  footerBy: {
    fontSize: 10,
    fontWeight: '700',
    color: '#71717A',
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  footerBrand: {
    fontSize: 14,
    fontWeight: '700',
    color: '#22C55E',
    letterSpacing: 0.5,
  },
});
