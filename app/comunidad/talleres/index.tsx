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
  FilterChips,
  matches,
  SectionHero,
} from "@/features/comunidad/components";
import { fetchEvents } from "@/features/comunidad/eventos/api";
import { EventCard } from "@/features/comunidad/eventos/components";
import { eventPhase, seatsInfo } from "@/features/comunidad/eventos/model";
import { useProtectedAction } from "@/hooks/use-protected-action";
import { isSupabaseConfigured } from "@/lib/supabase";

const filters = [
  { label: "Todos", value: false },
  { label: "Con cupos", value: true },
];

export default function WorkshopsScreen() {
  const protect = useProtectedAction();
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [onlyWithSeats, setOnlyWithSeats] = useState(false);
  const query = useQuery({
    queryKey: ["workshops"],
    queryFn: () => fetchEvents("workshop"),
    enabled: isSupabaseConfigured,
  });
  const workshops = (query.data ?? []).filter(
    (workshop) =>
      eventPhase(workshop) !== "finished" &&
      (!onlyWithSeats || !seatsInfo(workshop).full) &&
      matches(search, workshop.title, workshop.topic, workshop.instructor),
  );

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-canvas">
      <ScreenHeader
        title="Talleres"
        showBack
        onSearch={() => setSearchOpen((v) => !v)}
      />
      {!isSupabaseConfigured ? (
        <EmptyState
          icon="cloud-offline-outline"
          title="Comunidad necesita conexión"
          description="Conecta Supabase para ver los talleres."
        />
      ) : (
        <FlatList
          data={workshops}
          keyExtractor={(item) => item.id}
          contentContainerClassName="gap-3 p-5 pb-12"
          refreshing={query.isRefetching}
          onRefresh={() => void query.refetch()}
          ListHeaderComponent={
            <View className="gap-3">
              <SectionHero
                section="talleres"
                actionLabel="Crear taller"
                onAction={() =>
                  protect(
                    () =>
                      router.push({
                        pathname: "/comunidad/eventos/nuevo",
                        params: { kind: "workshop" },
                      }),
                    "/comunidad/talleres",
                  )
                }
              />
              {searchOpen && (
                <SearchBar
                  value={search}
                  onChangeText={setSearch}
                  autoFocus
                  placeholder="Buscar por tema o instructor..."
                />
              )}
              <FilterChips
                options={filters}
                value={onlyWithSeats}
                onChange={setOnlyWithSeats}
              />
            </View>
          }
          ListEmptyComponent={
            query.isLoading ? (
              <ActivityIndicator className="mt-10" color={colors.red} />
            ) : query.isError ? (
              <EmptyState
                icon="cloud-offline-outline"
                title="No pudimos cargar los talleres"
                description={query.error.message}
              />
            ) : (
              <EmptyState
                icon="school-outline"
                title="No hay talleres próximos"
                description="¿Sabes hacer algo? Anímate a enseñarlo."
              />
            )
          }
          renderItem={({ item }) => (
            <EventCard
              event={item}
              showDate
              onPress={() =>
                router.push({
                  pathname: "/comunidad/eventos/[id]",
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
