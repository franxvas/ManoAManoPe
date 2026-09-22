import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/screen-header';
import { colors } from '@/constants/theme';
import { useAuth } from '@/features/auth/auth-provider';

export default function AccountScreen() {
  const { session, backendReady } = useAuth();
  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-canvas">
      <ScreenHeader title="Cuenta y seguridad" showBack />
      <View className="m-5 rounded-3xl bg-white p-5">
        <Text className="font-medium text-xs uppercase tracking-wide text-muted">Correo de acceso</Text><Text className="mt-2 font-sans text-base text-ink">{session?.user.email ?? 'demo@manoamano.pe'}</Text>
        <Pressable onPress={() => router.push('/(auth)/forgot-password')} className="mt-5 flex-row items-center border-t border-line py-4"><Ionicons name="key-outline" size={22} color={colors.navy} /><View className="ml-3 flex-1"><Text className="font-medium text-ink">Cambiar contraseña</Text><Text className="mt-1 text-xs text-muted">Recibe un enlace seguro por correo</Text></View><Ionicons name="chevron-forward" size={18} color={colors.muted} /></Pressable>
        <View className="border-t border-line py-4"><Text className="font-medium text-ink">Sesión protegida</Text><Text className="mt-1 font-sans text-xs leading-5 text-muted">{backendReady ? 'La sesión se almacena cifrada mediante Secure Store.' : 'El modo demo no almacena credenciales reales.'}</Text></View>
      </View>
    </SafeAreaView>
  );
}
