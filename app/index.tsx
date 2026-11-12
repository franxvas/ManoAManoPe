import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/features/auth/auth-provider';

// GIF del logo saludando: una vuelta dura 1,9 s, así que se espera ese tiempo antes de entrar.
const logo = require('../assets/logo-animado.gif');
const GREETING_MS = 1900;
const appStartedAt = Date.now();

export default function SplashRoute() {
  const { loading, isAuthenticated, isGuest } = useAuth();

  useEffect(() => {
    if (loading) return;
    const wait = Math.max(GREETING_MS - (Date.now() - appStartedAt), 0);
    const timer = setTimeout(() => router.replace(isAuthenticated || isGuest ? '/(tabs)' : '/(auth)/welcome'), wait);
    return () => clearTimeout(timer);
  }, [isAuthenticated, isGuest, loading]);

  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-white">
      <Image source={logo} style={{ width: 260, height: 260 }} contentFit="contain" autoplay accessibilityLabel="mano a mano punto pe" />
    </SafeAreaView>
  );
}
