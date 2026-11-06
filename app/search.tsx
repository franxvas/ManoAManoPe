import { Ionicons } from "@expo/vector-icons";
import { router, type Href } from "expo-router";
import { useDeferredValue, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Pressable,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenHeader } from "@/components/screen-header";
import { SearchBar } from "@/components/search-bar";
import { ListingCard } from "@/components/listing-card";
import { EmptyState } from "@/components/empty-state";
import { colors } from "@/constants/theme";
import { useListings } from "@/hooks/use-listings";
const shortcuts: {
  name: string;
  route: Href;
  icon: keyof typeof Ionicons.glyphMap;
  terms: string;
}[] = [
  {
    name: "Pedir ayuda",
    route: "/mano",
    icon: "hand-left-outline",
    terms: "ayuda reparacion presupuesto proyecto",
  },
  {
    name: "Objetos compartidos",
    route: "/prestamos",
    icon: "swap-horizontal-outline",
    terms: "prestamo prestar",
  },
  {
    name: "Alquileres",
    route: "/alquileres",
    icon: "key-outline",
    terms: "alquilar alquiler moto",
  },
  {
    name: "Donaciones",
    route: "/comunidad/donaciones",
    icon: "gift-outline",
    terms: "donar donacion gratis",
  },
  {
    name: "Adopciones",
    route: "/comunidad/adopciones",
    icon: "paw-outline",
    terms: "adoptar adopcion mascotas",
  },
  {
    name: "Eventos",
    route: "/comunidad/eventos",
    icon: "calendar-outline",
    terms: "evento campaña feria",
  },
  {
    name: "Talleres",
    route: "/comunidad/talleres",
    icon: "school-outline",
    terms: "taller curso aprender",
  },
  {
    name: "Mi agenda",
    route: "/agenda",
    icon: "time-outline",
    terms: "agenda cita reservar",
  },
];
export default function SearchScreen() {
  const [query, Q] = useState("");
  const deferred = useDeferredValue(query.trim());
  const { listings, isLoading, isError, refresh } = useListings(
    deferred,
    undefined,
    deferred.length >= 2,
  );
  const normalized = deferred
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  const actions = shortcuts.filter(
    (s) =>
      !normalized ||
      `${s.name} ${s.terms}`
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .includes(normalized),
  );
  return (
    <SafeAreaView className="flex-1 bg-canvas">
      <ScreenHeader title="Buscar" showBack hideSearch />
      <View className="px-5 pb-4">
        <SearchBar
          value={query}
          onChangeText={Q}
          autoFocus
          placeholder="Productos, ayuda, talleres…"
        />
      </View>
      <FlatList
        automaticallyAdjustKeyboardInsets
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        data={deferred.length >= 2 ? listings : []}
        numColumns={2}
        columnWrapperStyle={{ gap: 12 }}
        keyExtractor={(x) => x.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
        renderItem={({ item }) => (
          <View style={{ flex: 1, maxWidth: "49%" }}>
            <ListingCard listing={item} />
          </View>
        )}
        ListHeaderComponent={
          <>
            {actions.length > 0 && (
              <View className="mb-4 overflow-hidden rounded-3xl bg-white">
                {actions.map((a, i) => (
                  <Pressable
                    key={a.name}
                    accessibilityRole="button"
                    onPress={() => {
                      Keyboard.dismiss();
                      router.push(a.route);
                    }}
                    className={`flex-row items-center gap-3 px-4 py-4 ${i ? "border-t border-line" : ""}`}
                  >
                    <Ionicons name={a.icon} size={20} color={colors.navy} />
                    <Text className="flex-1 font-medium text-sm text-navy">
                      {a.name}
                    </Text>
                    <Ionicons
                      name="arrow-forward"
                      size={16}
                      color={colors.muted}
                    />
                  </Pressable>
                ))}
              </View>
            )}
            {isLoading && (
              <ActivityIndicator color={colors.red} className="my-8" />
            )}
            {isError && (
              <Pressable onPress={() => void refresh()}>
                <Text className="py-5 text-center text-brand">
                  No pudimos buscar. Reintentar
                </Text>
              </Pressable>
            )}
          </>
        }
        ListEmptyComponent={
          deferred.length >= 2 && !isLoading && !isError && !actions.length ? (
            <EmptyState
              title="Sin resultados"
              description="Prueba otra palabra."
            />
          ) : null
        }
      />
    </SafeAreaView>
  );
}
