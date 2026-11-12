import { Redirect } from 'expo-router';
import { View } from 'react-native';

import { useAuth } from '@/features/auth/auth-provider';

// Decide a dónde ir apenas se conoce la sesión. El logo animado (AnimatedSplash) cubre este momento.
export default function StartRoute() {
  const { loading, isAuthenticated, isGuest } = useAuth();
  if (loading) return <View style={{ flex: 1, backgroundColor: '#FFFFFF' }} />;
  return <Redirect href={isAuthenticated || isGuest ? '/(tabs)' : '/(auth)/welcome'} />;
}
