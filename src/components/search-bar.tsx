import { Ionicons } from '@expo/vector-icons';
import { TextInput, View } from 'react-native';

import { colors } from '@/constants/theme';

export function SearchBar({ value, onChangeText, placeholder = 'Celular, técnico, carpintero, ropa...' }: { value: string; onChangeText: (value: string) => void; placeholder?: string }) {
  return (
    <View className="h-14 flex-row items-center rounded-2xl border border-line bg-white px-4">
      <Ionicons name="search" size={22} color={colors.navy} />
      <TextInput
        className="ml-3 flex-1 font-sans text-[15px] text-ink"
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        returnKeyType="search"
        accessibilityLabel="Buscar publicaciones"
      />
      {value.length > 0 && <Ionicons name="close-circle" size={20} color={colors.muted} onPress={() => onChangeText('')} />}
    </View>
  );
}
