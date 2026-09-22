import '../global.css';
import { Inter_400Regular, Inter_600SemiBold, useFonts as useInterFonts } from '@expo-google-fonts/inter';
import { RobotoCondensed_700Bold, useFonts as useRobotoFonts } from '@expo-google-fonts/roboto-condensed';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from '@/features/auth/auth-provider';
import { LocationProvider } from '@/features/location/location-provider';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1 } } }));
  const [interLoaded] = useInterFonts({ Inter_400Regular, Inter_600SemiBold });
  const [robotoLoaded] = useRobotoFonts({ RobotoCondensed_700Bold });
  const ready = interLoaded && robotoLoaded;

  useEffect(() => { if (ready) void SplashScreen.hideAsync(); }, [ready]);
  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <LocationProvider>
              <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
                <Stack.Screen name="index" options={{ animation: 'fade' }} />
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="listing/[id]" />
                <Stack.Screen name="conversation/[id]" />
                <Stack.Screen name="publish/[type]" />
                <Stack.Screen name="notifications" />
              </Stack>
            </LocationProvider>
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
