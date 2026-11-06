import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, FlatList, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyState } from "@/components/empty-state";
import { ScreenHeader } from "@/components/screen-header";
import { SearchBar } from "@/components/search-bar";
import { colors } from "@/constants/theme";
import {
  CommunityCard,
  FilterChips,
  matches,
  SectionHero,
} from "@/features/comunidad/components";
import { fetchDonations } from "@/features/comunidad/donaciones/api";
import {
  conditionLabels,
  donationStatus,
} from "@/features/comunidad/donaciones/model";
import { useProtectedAction } from "@/hooks/use-protected-action";
import { isSupabaseConfigured } from "@/lib/supabase";

const filters = [
  { label: "Disponibles", value: true },
  { label: "Todas", value: false },
];

export default function DonationsScreen() {
  const [onlyAvailable, setOnlyAvailable] = useState(true);
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const protect = useProtectedAction();
  const query = useQuery({
    queryKey: ["donations"],
    queryFn: fetchDonations,
    enabled: isSupabaseConfigured,
  });
  const donations = (query.data ?? []).filter(
    (item) =>
      (!onlyAvailable || item.status === "available") &&
      matches(search, item.title, item.description, item.zone),
  );

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-canvas">
      <ScreenHeader
        title="Donaciones"
        showBack
        onSearch={() => setSearchOpen((v) => !v)}
      />
      {!isSupabaseConfigured ? (
        <EmptyState
          icon="cloud-offline-outline"
          title="Comunidad necesita conexión"
          description="Conecta Supabase para ver y publicar donaciones."
        />
      ) : (
        <FlatList
          data={donations}
          keyExtractor={(item) => item.id}
          contentContainerClassName="gap-4 p-5 pb-12"
          refreshing={query.isRefetching}
          onRefresh={() => void query.refetch()}
          ListHeaderComponent={
            <View className="gap-3">
              <SectionHero
                section="donaciones"
                actionLabel="Donar algo"
                onAction={() =>
                  protect(
                    () => router.push("/comunidad/donaciones/nueva"),
                    "/comunidad/donaciones",
                  )
                }
              />
              {searchOpen && (
                <SearchBar
                  value={search}
                  onChangeText={setSearch}
                  autoFocus
                  placeholder="Buscar mesa, ropa, juguetes..."
                />
              )}
              <FilterChips
                options={filters}
                value={onlyAvailable}
                onChange={setOnlyAvailable}
              />
            </View>
          }
          ListEmptyComponent={
            query.isLoading ? (
              <ActivityIndicator className="mt-10" color={colors.red} />
            ) : query.isError ? (
              <EmptyState
                icon="cloud-offline-outline"
                title="No pudimos cargar las donaciones"
                description={query.error.message}
              />
            ) : (
              <EmptyState
                icon="gift-outline"
                title={search ? "Sin resultados" : "Aún no hay donaciones"}
                description={
                  search
                    ? "Prueba con otra palabra."
                    : "Sé el primero en regalar algo que ya no usas."
                }
              />
            )
          }
          renderItem={({ item }) => (
            <CommunityCard
              section="donaciones"
              photo={item.photos[0]}
              title={item.title}
              subtitle={`${conditionLabels[item.condition]} · ${item.quantity} ${item.quantity === 1 ? "unidad" : "unidades"} · Gratis`}
              zone={item.zone}
              owner={`Dona ${item.owner_name}`}
              badge={donationStatus[item.status]}
              onPress={() =>
                router.push({
                  pathname: "/comunidad/donaciones/[id]",
                  params: { id: item.id },
                })
              }
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}
