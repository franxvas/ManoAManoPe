import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandLogo } from '@/components/brand-logo';
import { PrimaryButton } from '@/components/primary-button';
import { colors } from '@/constants/theme';
import { useAuth } from '@/features/auth/auth-provider';

export default function WelcomeScreen() {
  const { continueAsGuest, backendReady } = useAuth();
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-6 pb-6 pt-5">
        <BrandLogo compact />
        <View className="mt-8 flex-1 overflow-hidden rounded-[32px] bg-navy">
          <Image source={{ uri: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1200&auto=format&fit=crop' }} className="absolute h-full w-full opacity-50" contentFit="cover" />
          <View className="flex-1 justify-end p-7">
            <View className="mb-5 h-12 w-12 items-center justify-center rounded-full bg-brand">
              <Ionicons name="location" size={25} color={colors.white} />
            </View>
            <Text className="font-display text-4xl leading-[42px] text-white">Todo lo que necesitas, cerca de ti.</Text>
            <Text className="mt-3 font-sans text-base leading-6 text-white/80">Compra, ofrece servicios y llega a acuerdos con personas de tu comunidad.</Text>
          </View>
        </View>
        <View className="mt-6 gap-3">
          <PrimaryButton label="Iniciar sesión" onPress={() => router.push('/(auth)/login')} />
          <PrimaryButton label="Crear cuenta" variant="outline" onPress={() => router.push('/(auth)/signup')} />
          <Text
            className="py-2 text-center font-medium text-sm text-muted"
            onPress={() => { continueAsGuest(); router.replace('/(tabs)'); }}
          >
            Explorar como invitado
          </Text>
          {!backendReady && <Text className="text-center font-sans text-[11px] text-muted">Modo demostración · conecta Supabase desde .env para usar cuentas reales</Text>}
        </View>
      </View>
    </SafeAreaView>
  );
}
