import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { BrandLogo } from "@/components/brand-logo";
import { colors } from "@/constants/theme";
import { useNotifications } from "@/hooks/use-notifications";
import { goBackOr } from "@/utils/navigation";

export function ScreenHeader({
  title,
  showBack = false,
  backFallback = "/(tabs)",
  onBack,
  onSearch,
  hideSearch = false,
}: {
  title?: string;
  showBack?: boolean;
  backFallback?:
    "/(tabs)" | "/(tabs)/profile" | "/(tabs)/messages" | "/(auth)/welcome";
  onBack?: () => void;
  onSearch?: () => void;
  hideSearch?: boolean;
}) {
  const { notifications } = useNotifications();
  const unread = notifications.filter((n) => !n.read).length;
  return (
    <View className="min-h-16 flex-row items-center justify-between bg-canvas px-5 py-3">
      <View className="min-w-0 flex-1 flex-row items-center pr-3">
        {showBack && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Volver"
            onPress={onBack ?? (() => goBackOr(backFallback))}
            className="mr-3 h-11 w-11 items-center justify-center rounded-full bg-white"
          >
            <Ionicons name="arrow-back" size={21} color={colors.navy} />
          </Pressable>
        )}
        {title ? (
          <Text
            accessibilityRole="header"
            numberOfLines={1}
            className="flex-1 font-medium text-lg tracking-tight text-navy"
          >
            {title}
          </Text>
        ) : (
          <BrandLogo compact />
        )}
      </View>
      <View className="flex-row items-center gap-1">
        {!hideSearch && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Buscar"
            onPress={onSearch ?? (() => router.push("/search"))}
            className="h-11 w-11 items-center justify-center rounded-full"
          >
            <Ionicons name="search-outline" size={23} color={colors.navy} />
          </Pressable>
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Mensajes"
          onPress={() => router.push("/(tabs)/messages")}
          className="h-11 w-11 items-center justify-center rounded-full"
        >
          <Ionicons name="chatbubbles-outline" size={23} color={colors.navy} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            unread ? `Notificaciones, ${unread} sin leer` : "Notificaciones"
          }
          onPress={() => router.push("/notifications")}
          className="relative h-11 w-11 items-center justify-center rounded-full"
        >
          <Ionicons
            name="notifications-outline"
            size={23}
            color={colors.navy}
          />
          {unread > 0 && (
            <View className="absolute right-2.5 top-2 h-2 w-2 rounded-full border border-canvas bg-brand" />
          )}
        </Pressable>
      </View>
    </View>
  );
}
