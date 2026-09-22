import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/primary-button';
import { colors } from '@/constants/theme';
import { useAuth } from '@/features/auth/auth-provider';
import type { ListingType } from '@/types/domain';

const choices: { type: ListingType; title: string; description: string; icon: keyof typeof Ionicons.glyphMap; tint: string }[] = [
  { type: 'product', title: 'Producto', description: 'Vende algo nuevo o usado', icon: 'bag-handle-outline', tint: '#EAF0F8' },
  { type: 'service', title: 'Servicio', description: 'Ofrece tu experiencia', icon: 'construct-outline', tint: '#FDECEE' },
  { type: 'promotion', title: 'Promoción', description: 'Comparte una oferta especial', icon: 'pricetag-outline', tint: '#FFF5D9' },
  { type: 'need', title: 'Necesidad', description: 'Publica lo que estás buscando', icon: 'megaphone-outline', tint: '#E7F7EF' },
];

export default function PublishChoiceScreen() {
  const { isAuthenticated } = useAuth();
  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-canvas">
      <View className="flex-1 px-5 pt-5">
      <Text className="font-display text-3xl text-navy">¿Qué quieres publicar?</Text>
      <Text className="mt-2 font-sans text-base text-muted">Elige una opción para empezar</Text>
      {!isAuthenticated ? (
        <View className="mt-14 rounded-3xl bg-white p-7">
          <View className="mb-5 h-14 w-14 items-center justify-center rounded-2xl bg-red-50"><Ionicons name="lock-closed-outline" size={27} color={colors.red} /></View>
          <Text className="font-display text-2xl text-navy">Inicia sesión para publicar</Text>
          <Text className="mb-6 mt-2 font-sans leading-6 text-muted">Tu perfil ayuda a que la comunidad sepa con quién está haciendo un trato.</Text>
          <PrimaryButton label="Iniciar sesión" onPress={() => router.push({ pathname: '/(auth)/login', params: { returnTo: '/(tabs)/publish' } })} />
        </View>
      ) : (
        <View className="mt-8 flex-row flex-wrap justify-between gap-y-4">
          {choices.map((choice) => (
            <Pressable key={choice.type} onPress={() => router.push({ pathname: '/publish/[type]', params: { type: choice.type } })} className="min-h-48 w-[48%] rounded-3xl bg-white p-5">
              <View className="h-14 w-14 items-center justify-center rounded-2xl" style={{ backgroundColor: choice.tint }}><Ionicons name={choice.icon} size={28} color={colors.navy} /></View>
              <Text className="mt-5 font-display text-2xl text-navy">{choice.title}</Text>
              <Text className="mt-2 font-sans text-sm leading-5 text-muted">{choice.description}</Text>
              <Ionicons name="arrow-forward-circle" size={25} color={colors.red} style={{ marginTop: 12 }} />
            </Pressable>
          ))}
        </View>
      )}
      </View>
    </SafeAreaView>
  );
}
