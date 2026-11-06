import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { EmptyState } from "@/components/empty-state";
import { ListingCard } from "@/components/listing-card";
import { ScreenHeader } from "@/components/screen-header";
import { CommunityShortcuts } from "@/components/community-shortcuts";
import { colors } from "@/constants/theme";
import { useDeviceLocation } from "@/features/location/location-provider";
import { useListings } from "@/hooks/use-listings";
import { useNearbyListings } from "@/hooks/use-nearby-listings";
import type { ListingType } from "@/types/domain";

const filters: { label: string; type?: ListingType }[] = [
  { label: "Todo" },
  { label: "Productos", type: "product" },
  { label: "Servicios", type: "service" },
  { label: "Promos", type: "promotion" },
  { label: "Se busca", type: "need" },
];
export default function HomeScreen() {
  const [type, T] = useState<ListingType>();
  const { listings, isLoading, isError, refresh, cached } = useListings(
    "",
    type,
  );
  const {
    coordinates,
    permissionStatus,
    canAskAgain,
    isLocating,
    error: locationError,
    requestLocation,
    openLocationSettings,
  } = useDeviceLocation();
  const nearby = useNearbyListings(coordinates, 15, type);
  useEffect(() => {
    void requestLocation();
  }, [requestLocation]);
  const ask = () =>
    void (canAskAgain ? requestLocation() : openLocationSettings());
  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-canvas">
      <ScreenHeader />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-36"
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={() => void refresh()}
            tintColor={colors.red}
          />
        }
      >
        {cached && (
          <Text className="mx-5 mb-2 text-xs text-muted">
            Sin conexión · contenido guardado
          </Text>
        )}
        <CommunityShortcuts />
        <View className="flex-row items-center gap-3 px-5 pb-5 pt-1">
          {[
            ["calendar-outline", "Agenda", "/agenda"],
            ["notifications-outline", "Mis alertas", "/alertas"],
          ].map(([icon, label, path]) => (
            <Pressable
              key={path}
              accessibilityRole="button"
              onPress={() => router.push(path as "/agenda" | "/alertas")}
              className="flex-1 flex-row items-center justify-between rounded-2xl bg-white px-4 py-3"
            >
              <View className="flex-row items-center gap-2">
                <Ionicons
                  name={icon as "calendar-outline"}
                  size={17}
                  color={colors.navy}
                />
                <Text className="font-medium text-xs text-navy">{label}</Text>
              </View>
              <Ionicons name="chevron-forward" size={13} color={colors.muted} />
            </Pressable>
          ))}
        </View>
        <View className="mb-3 flex-row items-center justify-between px-5">
          <Text className="font-medium text-lg tracking-tight text-navy">
            Lo último
          </Text>
          <Pressable
            accessibilityLabel="Explorar publicaciones"
            onPress={() => router.push("/(tabs)/explore")}
            hitSlop={12}
          >
            <Ionicons name="arrow-forward" size={21} color={colors.navy} />
          </Pressable>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-2 px-5 pb-4"
          style={{ flexGrow: 0 }}
        >
          {filters.map((f) => (
            <Pressable
              key={f.label}
              accessibilityRole="button"
              accessibilityState={{ selected: type === f.type }}
              onPress={() => T(f.type)}
              className={`rounded-full px-4 py-2.5 ${type === f.type ? "bg-navy" : "bg-white"}`}
            >
              <Text
                className={`font-medium text-xs ${type === f.type ? "text-white" : "text-muted"}`}
              >
                {f.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
        {isLoading ? (
          <ActivityIndicator className="my-12" color={colors.red} />
        ) : isError ? (
          <EmptyState
            icon="cloud-offline-outline"
            title="No pudimos cargar"
            description="Desliza para reintentar."
          />
        ) : !listings.length ? (
          <EmptyState
            title="Sin publicaciones"
            description="Prueba otra categoría."
          />
        ) : (
          <FlatList
            horizontal
            data={listings.slice(0, 8)}
            keyExtractor={(x) => x.id}
            renderItem={({ item }) => <ListingCard listing={item} horizontal />}
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="px-5"
          />
        )}
        <View className="mb-4 mt-6 flex-row items-center justify-between px-5">
          <Text className="font-medium text-lg tracking-tight text-navy">
            Cerca de ti
          </Text>
          <View className="flex-row items-center gap-1">
            <Ionicons name="location-outline" size={13} color={colors.muted} />
            <Text className="font-sans text-xs text-muted">15 km</Text>
          </View>
        </View>
        {permissionStatus === Location.PermissionStatus.DENIED ? (
          <Pressable
            onPress={ask}
            accessibilityRole="button"
            className="mx-5 flex-row items-center gap-3 rounded-3xl bg-white p-5"
          >
            <Ionicons name="location-outline" size={25} color={colors.navy} />
            <View className="flex-1">
              <Text className="font-medium text-sm text-navy">
                Activar ubicación
              </Text>
              <Text className="mt-1 text-xs text-muted">
                Sin permiso no hay recomendaciones cercanas.
              </Text>
            </View>
            <Ionicons name="arrow-forward" size={18} color={colors.navy} />
          </Pressable>
        ) : isLocating || nearby.isLoading ? (
          <ActivityIndicator className="my-8" color={colors.red} />
        ) : locationError ? (
          <Pressable onPress={ask} className="mx-5 rounded-2xl bg-white p-5">
            <Text className="text-sm text-muted">
              Ubicación no disponible. Toca para reintentar.
            </Text>
          </Pressable>
        ) : nearby.isError ? (
          <Text className="px-5 text-sm text-muted">
            No pudimos cargar la zona. Desliza para reintentar.
          </Text>
        ) : nearby.data?.length ? (
          <View className="flex-row flex-wrap justify-between px-5">
            {nearby.data.map((item) => (
              <View key={item.id} style={{ width: "48%" }}>
                <ListingCard listing={item} />
              </View>
            ))}
          </View>
        ) : (
          <Text className="px-5 text-sm text-muted">
            Todavía no hay publicaciones en esta zona.
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
