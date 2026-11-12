import "../global.css";
import {
  Inter_400Regular,
  Inter_600SemiBold,
  useFonts as useInterFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { Image } from "expo-image";
import { cssInterop } from "nativewind";
import * as SplashScreen from "expo-splash-screen";
import { useCallback, useState } from "react";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AnimatedSplash } from "@/components/animated-splash";
import { AuthProvider } from "@/features/auth/auth-provider";
import { LocationProvider } from "@/features/location/location-provider";

cssInterop(Image, { className: "style" });
void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
      }),
  );
  const [fontsLoaded, fontError] = useInterFonts({ Inter_400Regular, Inter_600SemiBold });
  // Si las fuentes fallan, la app sigue con las del sistema en vez de quedarse cargando.
  const ready = fontsLoaded || Boolean(fontError);
  const [splashVisible, setSplashVisible] = useState(true);
  const hideSplash = useCallback(() => setSplashVisible(false), []);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#F4F5F7" }}>
      <SafeAreaProvider
        style={{
          flex: 1,
          width: "100%",
          maxWidth: Platform.OS === "web" ? 760 : undefined,
          alignSelf: "center",
        }}
      >
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <LocationProvider>
              {/* La app carga por debajo del logo, así al terminar la animación ya está lista. */}
              {ready && (
                <Stack
                  screenOptions={{
                    headerShown: false,
                    animation: "slide_from_right",
                  }}
                >
                  <Stack.Screen name="index" options={{ animation: "none" }} />
                  <Stack.Screen name="(auth)" options={{ animation: "fade" }} />
                  <Stack.Screen name="(tabs)" options={{ animation: "fade" }} />
                  <Stack.Screen name="listing/[id]" />
                  <Stack.Screen name="conversation/[id]" />
                  <Stack.Screen name="publish/[type]" />
                  <Stack.Screen name="notifications" />
                  <Stack.Screen
                    name="search"
                    options={{
                      presentation: "modal",
                      animation: "slide_from_bottom",
                    }}
                  />
                </Stack>
              )}
            </LocationProvider>
          </AuthProvider>
        </QueryClientProvider>
        {splashVisible && <AnimatedSplash ready={ready} onFinish={hideSplash} />}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
