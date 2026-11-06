import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, FlatList, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyState } from "@/components/empty-state";
import { ScreenHeader } from "@/components/screen-header";
import { SearchBar } from "@/components/search-bar";
import { colors } from "@/constants/theme";
import { fetchAdoptions } from "@/features/comunidad/adopciones/api";
import {
  adoptionStatus,
  sizeLabels,
  speciesLabels,
  type Adoption,
} from "@/features/comunidad/adopciones/model";
import {
  CommunityCard,
  FilterChips,
  matches,
  SectionHero,
} from "@/features/comunidad/components";
import { useProtectedAction } from "@/hooks/use-protected-action";
import { isSupabaseConfigured } from "@/lib/supabase";

const filters: { label: string; value: Adoption["species"] | undefined }[] = [
  { label: "Todos", value: undefined },
  { label: "Perros", value: "perro" },
  { label: "Gatos", value: "gato" },
  { label: "Otros", value: "otro" },
];

export default function AdoptionsScreen() {
  const [species, setSpecies] = useState<Adoption["species"]>();
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const protect = useProtectedAction();
  const query = useQuery({
    queryKey: ["adoptions"],
    queryFn: fetchAdoptions,
    enabled: isSupabaseConfigured,
  });
  const adoptions = (query.data ?? []).filter(
    (item) =>
      (!species ||
        item.species === species ||
        (species === "otro" && !["perro", "gato"].includes(item.species))) &&
      matches(search, item.pet_name, item.description, item.zone),
  );

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-canvas">
      <ScreenHeader
        title="Adopciones"
        showBack
        onSearch={() => setSearchOpen((v) => !v)}
      />
      {!isSupabaseConfigured ? (
        <EmptyState
          icon="cloud-offline-outline"
          title="Comunidad necesita conexión"
          description="Conecta Supabase para ver y publicar adopciones."
        />
      ) : (
        <FlatList
          data={adoptions}
          keyExtractor={(item) => item.id}
          contentContainerClassName="gap-4 p-5 pb-12"
          refreshing={query.isRefetching}
          onRefresh={() => void query.refetch()}
          ListHeaderComponent={
            <View className="gap-3">
              <SectionHero
                section="adopciones"
                actionLabel="Dar en adopción"
                onAction={() =>
                  protect(
                    () => router.push("/comunidad/adopciones/nueva"),
                    "/comunidad/adopciones",
                  )
                }
              />
              {searchOpen && (
                <SearchBar
                  value={search}
                  onChangeText={setSearch}
                  autoFocus
                  placeholder="Buscar por nombre o zona..."
                />
              )}
              <FilterChips
                options={filters}
                value={species}
                onChange={setSpecies}
              />
            </View>
          }
          ListEmptyComponent={
            query.isLoading ? (
              <ActivityIndicator className="mt-10" color={colors.red} />
            ) : query.isError ? (
              <EmptyState
                icon="cloud-offline-outline"
                title="No pudimos cargar las adopciones"
                description={query.error.message}
              />
            ) : (
              <EmptyState
                icon="paw-outline"
                title={
                  search || species
                    ? "Sin resultados"
                    : "No hay animales en adopción"
                }
                description={
                  search || species
                    ? "Prueba con otro filtro."
                    : "Cuando alguien publique uno, aparecerá aquí."
                }
              />
            )
          }
          renderItem={({ item }) => (
            <CommunityCard
              section="adopciones"
              photo={item.photos[0]}
              title={item.pet_name}
              subtitle={`${speciesLabels[item.species]} · ${item.age_text} · ${sizeLabels[item.size]}`}
              zone={item.zone}
              owner={`Publica ${item.owner_name}`}
              badge={adoptionStatus[item.status]}
              onPress={() =>
                router.push({
                  pathname: "/comunidad/adopciones/[id]",
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
