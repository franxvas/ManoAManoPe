import { router } from 'expo-router';
import { useEffect } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandLogo } from '@/components/brand-logo';
import { useAuth } from '@/features/auth/auth-provider';

export default function SplashRoute() {
  const { loading, isAuthenticated, isGuest } = useAuth();

  useEffect(() => {
    if (loading) return;
    const timer = setTimeout(() => router.replace(isAuthenticated || isGuest ? '/(tabs)' : '/(auth)/welcome'), 120);
    return () => clearTimeout(timer);
  }, [isAuthenticated, isGuest, loading]);

  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-white">
      <BrandLogo />
      <Text className="mt-7 font-medium text-base text-navy">Encuentra. Ofrece. Haz tu trato.</Text>
      <View className="absolute bottom-14 h-1 w-20 rounded-full bg-brand" />
    </SafeAreaView>
  );
}
