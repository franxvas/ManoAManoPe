import { Ionicons } from "@expo/vector-icons";
import { router, type Href } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { colors } from "@/constants/theme";
const entries: {
  title: string;
  path: Href;
  icon: keyof typeof Ionicons.glyphMap;
  featured?: boolean;
}[] = [
  {
    title: "Pide una mano",
    path: "/mano",
    icon: "hand-left-outline",
    featured: true,
  },
  { title: "Comunidad", path: "/comunidad", icon: "people-outline" },
  { title: "Préstamos", path: "/prestamos", icon: "swap-horizontal-outline" },
  { title: "Alquileres", path: "/alquileres", icon: "key-outline" },
];
export function CommunityShortcuts() {
  return (
    <View className="flex-row flex-wrap gap-3 px-5 py-3">
      {entries.map((item) => (
        <Pressable
          key={item.title}
          accessibilityRole="button"
          accessibilityLabel={item.title}
          onPress={() => router.push(item.path)}
          className={`min-h-28 flex-grow rounded-3xl p-4 ${item.featured ? "bg-navy" : "bg-white"}`}
          style={{ width: "45%" }}
        >
          <View className="flex-row items-start justify-between">
            <Ionicons
              name={item.icon}
              size={25}
              color={item.featured ? "#FFFFFF" : colors.navy}
            />
            <Ionicons
              name="arrow-forward"
              size={15}
              color={item.featured ? "#BFCDE0" : "#A3AFBD"}
            />
          </View>
          <Text
            className={`mt-5 font-medium text-sm ${item.featured ? "text-white" : "text-navy"}`}
          >
            {item.title}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
