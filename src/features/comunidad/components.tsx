import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Platform, Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';

import { colors } from '@/constants/theme';
import { photoUrl } from './api';
import { sections, type SectionKey } from './theme';
import type { Tone } from './types';

export type Photo = { uri: string; path?: string };

const toneClasses: Record<Tone, string> = {
  green: 'bg-green-50 text-success',
  amber: 'bg-amber-50 text-amber-700',
  navy: 'bg-blue-50 text-navy',
  gray: 'bg-gray-100 text-muted',
  red: 'bg-red-50 text-brand',
};

export function StatusBadge({ label, tone }: { label: string; tone: Tone }) {
  const [background, text] = toneClasses[tone].split(' ');
  return (
    <View className={`self-start rounded-full px-3 py-1 ${background}`}>
      <Text className={`font-medium text-xs ${text}`}>{label}</Text>
    </View>
  );
}

export function ChoiceChips<T extends string>({ label, options, value, onChange }: { label: string; options: Record<T, string>; value: T; onChange: (value: T) => void }) {
  return (
    <View className="mb-4">
      <Text className="mb-2 font-medium text-sm text-ink">{label}</Text>
      <View className="flex-row flex-wrap gap-2">
        {(Object.keys(options) as T[]).map((key) => (
          <Pressable
            key={key}
            accessibilityRole="button"
            accessibilityState={{ selected: value === key }}
            onPress={() => onChange(key)}
            className={`rounded-full border px-4 py-2 ${value === key ? 'border-brand bg-brand' : 'border-line bg-white'}`}
          >
            <Text className={`font-medium text-xs ${value === key ? 'text-white' : 'text-navy'}`}>{options[key]}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export function PhotoPicker({ photos, onChange, onError, max = 6, label = 'Fotografías (hasta seis)' }: { photos: Photo[]; onChange: (photos: Photo[]) => void; onError: (message: string) => void; max?: number; label?: string }) {
  async function pick() {
    if (Platform.OS !== 'web') {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) return onError('Permite el acceso a tus fotos para poder añadirlas.');
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: max > 1, selectionLimit: max - photos.length, quality: 0.8 });
    if (!result.canceled) onChange([...photos, ...result.assets.map((asset) => ({ uri: asset.uri }))].slice(0, max));
  }

  return (
    <View className="mb-4">
      <Text className="mb-2 font-medium text-sm text-ink">{label}</Text>
      <View className="flex-row flex-wrap gap-2">
        {photos.map((photo, index) => (
          <View key={photo.path ?? photo.uri} className="relative">
            <Image source={{ uri: photo.uri }} style={{ width: 96, height: 96, borderRadius: 14 }} contentFit="cover" />
            <Pressable
              accessibilityLabel={`Quitar foto ${index + 1}`}
              onPress={() => onChange(photos.filter((_, i) => i !== index))}
              className="absolute right-1 top-1 h-7 w-7 items-center justify-center rounded-full bg-white"
            >
              <Ionicons name="close" size={16} color={colors.red} />
            </Pressable>
          </View>
        ))}
        {photos.length < max && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Añadir fotos"
            onPress={() => void pick()}
            className="h-24 w-24 items-center justify-center rounded-2xl border border-dashed border-navy bg-white"
          >
            <Ionicons name="camera-outline" size={26} color={colors.navy} />
            <Text className="mt-1 font-medium text-[11px] text-navy">Añadir</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

export function PhotoGallery({ paths }: { paths: string[] }) {
  const { width } = useWindowDimensions();
  return (
    <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} className="bg-navy">
      {paths.map((path) => (
        <Image key={path} source={{ uri: photoUrl(path) }} style={{ width, height: 280 }} contentFit="cover" />
      ))}
    </ScrollView>
  );
}

export function InfoRow({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  if (!value) return null;
  return (
    <View className="flex-row border-t border-line py-3">
      <Ionicons name={icon} size={20} color={colors.navy} />
      <View className="ml-3 flex-1">
        <Text className="font-sans text-xs text-muted">{label}</Text>
        <Text className="mt-0.5 font-sans text-sm leading-5 text-ink">{value}</Text>
      </View>
    </View>
  );
}

export function CommunityCard({ photo, title, subtitle, zone, owner, badge, section, onPress }: { photo?: string; title: string; subtitle: string; zone: string; owner: string; badge: { label: string; tone: Tone }; section: SectionKey; onPress: () => void }) {
  const accent = sections[section];
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={onPress} className="overflow-hidden rounded-3xl bg-white">
      {photo ? (
        <Image source={{ uri: photoUrl(photo) }} style={{ width: '100%', height: 180 }} contentFit="cover" transition={150} />
      ) : (
        <View className={`h-[180px] items-center justify-center ${accent.soft}`}>
          <Ionicons name={accent.icon} size={40} color={accent.color} />
        </View>
      )}
      <View className="absolute left-3 top-3">
        <StatusBadge {...badge} />
      </View>
      <View className="p-4">
        <Text numberOfLines={2} className="font-display text-lg leading-6 text-navy">{title}</Text>
        <Text numberOfLines={1} className="mt-1 font-sans text-sm text-muted">{subtitle}</Text>
        <View className="mt-3 flex-row items-center border-t border-line pt-3">
          <Ionicons name="location-outline" size={15} color={accent.color} />
          <Text numberOfLines={1} className="ml-1 flex-1 font-sans text-xs text-ink">{zone}</Text>
          <Text numberOfLines={1} className="ml-2 max-w-[45%] font-sans text-xs text-muted">{owner}</Text>
        </View>
      </View>
    </Pressable>
  );
}

// Encabezado con el color de la sección y su acción principal.
export function SectionHero({ section, actionLabel, onAction }: { section: SectionKey; actionLabel: string; onAction: () => void }) {
  const item = sections[section];
  return (
    <View className={`rounded-3xl p-4 ${item.soft}`}>
      <View className="flex-row items-center">
        <View className="h-12 w-12 items-center justify-center rounded-2xl bg-white">
          <Ionicons name={item.icon} size={24} color={item.color} />
        </View>
        <Text className="ml-3 flex-1 font-sans text-sm leading-5 text-ink">{item.description}</Text>
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={onAction}
        className="mt-4 h-12 flex-row items-center justify-center rounded-2xl"
        style={{ backgroundColor: item.color }}
      >
        <Ionicons name="add-circle-outline" size={20} color={colors.white} />
        <Text className="ml-2 font-medium text-white">{actionLabel}</Text>
      </Pressable>
    </View>
  );
}

export function FilterChips<T>({ options, value, onChange }: { options: { label: string; value: T }[]; value: T; onChange: (value: T) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerClassName="gap-2">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.label}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(option.value)}
            className={`rounded-full border px-4 py-2 ${active ? 'border-navy bg-navy' : 'border-line bg-white'}`}
          >
            <Text className={`font-medium text-xs ${active ? 'text-white' : 'text-navy'}`}>{option.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export function matches(query: string, ...fields: string[]) {
  const text = query.trim().toLocaleLowerCase('es-PE');
  return !text || fields.join(' ').toLocaleLowerCase('es-PE').includes(text);
}
