import { Ionicons } from "@expo/vector-icons";
import { router, type Href } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenHeader } from "@/components/screen-header";
import { colors } from "@/constants/theme";
import { useProtectedAction } from "@/hooks/use-protected-action";
type Entry = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  href: Href;
};
const groups: { title: string; entries: Entry[] }[] = [
  {
    title: "Ofrecer",
    entries: [
      {
        label: "Producto",
        icon: "bag-handle-outline",
        href: "/publish/product",
      },
      {
        label: "Servicio",
        icon: "construct-outline",
        href: "/publish/service",
      },
      {
        label: "Promoción",
        icon: "pricetag-outline",
        href: "/publish/promotion",
      },
      { label: "Alquiler", icon: "key-outline", href: "/alquileres" },
    ],
  },
  {
    title: "Pedir",
    entries: [
      { label: "Una mano", icon: "hand-left-outline", href: "/mano" },
      {
        label: "Pedir un objeto",
        icon: "swap-horizontal-outline",
        href: "/prestamos",
      },
    ],
  },
  {
    title: "Compartir",
    entries: [
      {
        label: "Donación",
        icon: "gift-outline",
        href: "/comunidad/donaciones/nueva",
      },
      {
        label: "Adopción",
        icon: "paw-outline",
        href: "/comunidad/adopciones/nueva",
      },
    ],
  },
  {
    title: "Organizar",
    entries: [
      {
        label: "Evento o campaña",
        icon: "calendar-outline",
        href: "/comunidad/eventos/nuevo",
      },
      {
        label: "Taller",
        icon: "school-outline",
        href: {
          pathname: "/comunidad/eventos/nuevo",
          params: { kind: "workshop" },
        },
      },
    ],
  },
];
export default function PublishChoiceScreen() {
  const protect = useProtectedAction();
  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-canvas">
      <ScreenHeader title="Publicar" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-5 pb-36"
      >
        {groups.map((group) => (
          <View key={group.title} className="mt-4">
            <Text className="mb-3 font-medium text-xs uppercase tracking-widest text-muted">
              {group.title}
            </Text>
            <View className="flex-row flex-wrap justify-between gap-y-3">
              {group.entries.map((entry) => (
                <Pressable
                  key={entry.label}
                  accessibilityRole="button"
                  onPress={() =>
                    protect(() => router.push(entry.href), "/(tabs)/publish")
                  }
                  className="min-h-28 w-[48%] justify-between rounded-2xl border border-line bg-white p-4"
                  style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                >
                  <View className="flex-row items-center justify-between">
                    <View className="h-10 w-10 items-center justify-center rounded-xl bg-red-50"><Ionicons name={entry.icon} size={23} color={colors.red} /></View>
                    <Ionicons name="add" size={17} color={colors.muted} />
                  </View>
                  <Text className="mt-3 font-medium text-sm text-navy">
                    {entry.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        ))}
        <View className="mt-6 flex-row gap-3">
          <Pressable accessibilityRole="button" onPress={() => router.push('/agenda')} className="min-h-12 flex-1 flex-row items-center justify-center gap-2 rounded-2xl bg-white px-3"><Ionicons name="calendar-outline" size={18} color={colors.navy}/><Text className="font-medium text-xs text-navy">Agenda</Text></Pressable>
          <Pressable accessibilityRole="button" onPress={() => router.push('/alertas')} className="min-h-12 flex-1 flex-row items-center justify-center gap-2 rounded-2xl bg-white px-3"><Ionicons name="notifications-outline" size={18} color={colors.navy}/><Text className="font-medium text-xs text-navy">Mis alertas</Text></Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
