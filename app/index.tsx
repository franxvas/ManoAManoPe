import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/features/auth/auth-provider';

// Mismo logo y tamaño que la pantalla de arranque (app.json), para que el paso sea invisible.
const logo = require('../assets/logo-mano-a-mano.png');
const SPLASH_MS = 2500;
const appStartedAt = Date.now();

export default function SplashRoute() {
  const { loading, isAuthenticated, isGuest } = useAuth();

  useEffect(() => {
    if (loading) return;
    // El logo se ve 2,5 s en total, aunque la sesión cargue antes.
    const wait = Math.max(SPLASH_MS - (Date.now() - appStartedAt), 0);
    const timer = setTimeout(() => router.replace(isAuthenticated || isGuest ? '/(tabs)' : '/(auth)/welcome'), wait);
    return () => clearTimeout(timer);
  }, [isAuthenticated, isGuest, loading]);

  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-white">
      <Image source={logo} style={{ width: 200, height: 200 }} contentFit="contain" accessibilityLabel="mano a mano punto pe" />
    </SafeAreaView>
  );
}
