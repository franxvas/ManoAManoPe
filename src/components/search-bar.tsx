import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
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
  const [focused, setFocused] = useState(false);
  return (
    <View className="h-14 flex-row items-center rounded-2xl border px-3" style={{ backgroundColor: focused ? "#FFFFFF" : "#F1F2F5", borderColor: focused ? colors.red : "#E5E7EC" }}>
      <View className="h-9 w-9 items-center justify-center rounded-xl bg-white"><Ionicons name="search-outline" size={21} color={focused ? colors.red : colors.navy} /></View>
      <TextInput
        autoFocus={autoFocus}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="ml-2 flex-1 font-sans text-[15px] text-ink"
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
