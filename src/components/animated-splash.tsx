import { Image } from 'expo-image';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';

const logo = require('../../assets/logo-mano-a-mano.png');
const MIN_VISIBLE_MS = 2500;
const appStartedAt = Date.now();

// Capa con el logo animado. La app ya carga por debajo; cuando está lista y pasaron 2,5 s, se desvanece.
export function AnimatedSplash({ ready, onFinish }: { ready: boolean; onFinish: () => void }) {
  const [scale] = useState(() => new Animated.Value(0.6));
  const [shake] = useState(() => new Animated.Value(0));
  const [opacity] = useState(() => new Animated.Value(1));

  // La imagen fija del sistema se oculta enseguida para que se vea la animación.
  useEffect(() => {
    void SplashScreen.hideAsync();
    const tilt = (to: number) => Animated.timing(shake, { toValue: to, duration: 140, easing: Easing.inOut(Easing.quad), useNativeDriver: true });
    Animated.sequence([
      Animated.spring(scale, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }),
      Animated.loop(Animated.sequence([tilt(1), tilt(-1), tilt(1), tilt(0), Animated.delay(350)])),
    ]).start();
  }, [scale, shake]);

  useEffect(() => {
    if (!ready) return;
    const wait = Math.max(MIN_VISIBLE_MS - (Date.now() - appStartedAt), 0);
    const timer = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 350, useNativeDriver: true }).start(() => onFinish());
    }, wait);
    return () => clearTimeout(timer);
  }, [ready, opacity, onFinish]);

  const rotate = shake.interpolate({ inputRange: [-1, 1], outputRange: ['-10deg', '10deg'] });
  const lift = shake.interpolate({ inputRange: [-1, 0, 1], outputRange: [4, 0, -4] });

  return (
    <Animated.View style={[styles.overlay, { opacity }]} accessible accessibilityLabel="mano a mano punto pe">
      <Animated.View style={{ transform: [{ scale }, { rotate }, { translateY: lift }] }}>
        <Image source={logo} style={styles.logo} contentFit="contain" />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', zIndex: 100, pointerEvents: 'none' },
  logo: { width: 200, height: 200 },
});
