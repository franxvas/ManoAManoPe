import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/screen-header';
import { colors } from '@/constants/theme';

const options: { title: string; description: string; icon: keyof typeof Ionicons.glyphMap; href?: Href }[] = [
  { title: 'Donaciones', description: 'Regala lo que ya no usas o pide algo que te sirva.', icon: 'gift-outline', href: '/comunidad/donaciones' },
  { title: 'Adopciones', description: 'Animales que buscan un hogar responsable.', icon: 'paw-outline', href: '/comunidad/adopciones' },
  { title: 'Eventos y campañas', description: 'Ferias, limpiezas, campañas de salud y más.', icon: 'calendar-outline' },
  { title: 'Talleres', description: 'Aprende algo nuevo e inscríbete con tu cupo.', icon: 'school-outline' },
];

export default function CommunityScreen() {
  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-canvas">
      <ScreenHeader title="Comunidad" showBack />
      <ScrollView contentContainerClassName="p-5 pb-12 gap-3">
        <Text className="font-sans text-sm leading-5 text-muted">
          Aquí no hay precios ni ofertas. Es un espacio para ayudarnos entre vecinos de Bagua.
        </Text>
        {options.map((option) => (
          <Pressable
            key={option.title}
            accessibilityRole="button"
            disabled={!option.href}
            onPress={() => option.href && router.push(option.href)}
            className={`flex-row items-center rounded-2xl bg-white p-4 ${option.href ? '' : 'opacity-60'}`}
          >
            <View className="h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
              <Ionicons name={option.icon} size={28} color={colors.red} />
            </View>
            <View className="ml-4 flex-1">
              <Text className="font-display text-xl text-navy">{option.title}</Text>
              <Text className="mt-1 font-sans text-sm text-muted">{option.href ? option.description : 'Muy pronto'}</Text>
            </View>
            {option.href && <Ionicons name="chevron-forward" size={20} color={colors.muted} />}
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
