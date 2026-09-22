import { MaterialCommunityIcons } from '@expo/vector-icons';
import { View, Text } from 'react-native';

import { colors } from '@/constants/theme';

export function BrandLogo({ compact = false }: { compact?: boolean }) {
  return (
    <View className="flex-row items-center" accessibilityLabel="MANO A MANO punto pe">
      <View className={`${compact ? 'h-9 w-9' : 'h-14 w-14'} items-center justify-center rounded-full bg-brand`}>
        <MaterialCommunityIcons name="handshake-outline" size={compact ? 22 : 32} color={colors.white} />
      </View>
      <View className="ml-2">
        <Text className={`${compact ? 'text-xl' : 'text-3xl'} font-display tracking-tight text-navy`}>
          MANO A MANO<Text className="text-brand">.PE</Text>
        </Text>
        {!compact && <Text className="mt-0.5 font-medium text-[10px] uppercase tracking-[2px] text-muted">Comunidad que conecta</Text>}
      </View>
    </View>
  );
}
