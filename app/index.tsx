import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/features/auth/auth-provider';

// Misma imagen y tamaño que la pantalla de arranque (app.json), para que el paso sea invisible.
const logo = require('../assets/splash-icon.png');

export default function SplashRoute() {
  const { loading, isAuthenticated, isGuest } = useAuth();

  useEffect(() => {
    if (loading) return;
    const timer = setTimeout(() => router.replace(isAuthenticated || isGuest ? '/(tabs)' : '/(auth)/welcome'), 600);
    return () => clearTimeout(timer);
  }, [isAuthenticated, isGuest, loading]);

  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-white">
      <Image source={logo} style={{ width: 280, height: 84 }} contentFit="contain" accessibilityLabel="mano a mano punto pe" />
    </SafeAreaView>
  );
}
