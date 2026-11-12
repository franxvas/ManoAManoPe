import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/features/auth/auth-provider';

const logo = require('../assets/logo-mano-a-mano.png');
const SPLASH_MS = 2500;
const appStartedAt = Date.now();

export default function SplashRoute() {
  const { loading, isAuthenticated, isGuest } = useAuth();
  const [scale] = useState(() => new Animated.Value(0.6));
  const [shake] = useState(() => new Animated.Value(0));

  // El logo entra creciendo y luego se sacude, como un apretón de manos.
  useEffect(() => {
    const tilt = (to: number) => Animated.timing(shake, { toValue: to, duration: 140, easing: Easing.inOut(Easing.quad), useNativeDriver: true });
    Animated.sequence([
      Animated.spring(scale, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }),
      Animated.loop(Animated.sequence([tilt(1), tilt(-1), tilt(1), tilt(0), Animated.delay(350)])),
    ]).start();
  }, [scale, shake]);

  useEffect(() => {
    if (loading) return;
    // El logo se ve 2,5 s en total, aunque la sesión cargue antes.
    const wait = Math.max(SPLASH_MS - (Date.now() - appStartedAt), 0);
    const timer = setTimeout(() => router.replace(isAuthenticated || isGuest ? '/(tabs)' : '/(auth)/welcome'), wait);
    return () => clearTimeout(timer);
  }, [isAuthenticated, isGuest, loading]);

  const rotate = shake.interpolate({ inputRange: [-1, 1], outputRange: ['-10deg', '10deg'] });
  const lift = shake.interpolate({ inputRange: [-1, 0, 1], outputRange: [4, 0, -4] });

  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-white">
      <Animated.View accessible accessibilityLabel="mano a mano punto pe" style={{ transform: [{ scale }, { rotate }, { translateY: lift }] }}>
        <Image source={logo} style={{ width: 200, height: 200 }} contentFit="contain" />
      </Animated.View>
    </SafeAreaView>
  );
}
