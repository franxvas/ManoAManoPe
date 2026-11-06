import { Ionicons } from "@expo/vector-icons";
import { Pressable, TextInput, View } from "react-native";

import { colors } from "@/constants/theme";

export function SearchBar({
  value,
  onChangeText,
  placeholder = "Buscar…",
  autoFocus = false,
}: {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  return (
    <View className="h-12 flex-row items-center rounded-full bg-white px-4">
      <Ionicons name="search" size={22} color={colors.navy} />
      <TextInput
        autoFocus={autoFocus}
        className="ml-3 flex-1 font-sans text-[15px] text-ink"
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        returnKeyType="search"
        accessibilityLabel="Buscar publicaciones"
      />
      {value.length > 0 && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Limpiar búsqueda"
          onPress={() => onChangeText("")}
          className="h-10 w-10 items-center justify-center"
        >
          <Ionicons name="close-circle" size={20} color={colors.muted} />
        </Pressable>
      )}
    </View>
  );
}
