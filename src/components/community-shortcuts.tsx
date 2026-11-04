import { router, type Href } from "expo-router";
import { Pressable, Text, View } from "react-native";
const entries = [
  ["Necesito una mano", "/mano"],
  ["Comunidad", "/comunidad"],
  ["Agenda de servicios", "/agenda"],
  ["Mis alertas", "/alertas"],
  ["Préstamos", "/prestamos"],
  ["Alquileres", "/alquileres"],
] as const;
export function CommunityShortcuts() {
  return (
    <View className="flex-row flex-wrap gap-2 px-5 py-3">
      {entries.map(([title, path]) => (
        <Pressable
          key={path}
          accessibilityRole="button"
          onPress={() => router.push(path as Href)}
          className="rounded-2xl border border-line bg-white px-4 py-3"
        >
          <Text className="font-medium text-sm text-navy">{title}</Text>
        </Pressable>
      ))}
    </View>
  );
}
