import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { colors } from '@/constants/theme';

export function EmptyState({ icon = 'search-outline', title, description }: { icon?: keyof typeof Ionicons.glyphMap; title: string; description: string }) {
  return (
    <View className="items-center px-8 py-16">
      <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-white">
        <Ionicons name={icon} size={30} color={colors.navy} />
      </View>
      <Text className="text-center font-display text-xl text-navy">{title}</Text>
      <Text className="mt-2 text-center font-sans leading-5 text-muted">{description}</Text>
    </View>
  );
}
