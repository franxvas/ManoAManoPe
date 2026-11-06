import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import * as Location from "expo-location";
import { router } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ListingCard } from "@/components/listing-card";
import { NearbyMap } from "@/components/nearby-map";
import type { MapRegion } from "@/components/nearby-map.types";
import { SearchBar } from "@/components/search-bar";
import { ScreenHeader } from "@/components/screen-header";
import { SelectField } from "@/components/select-field";
import { colors } from "@/constants/theme";
import { demoCategories } from "@/constants/demo";
import { useDeviceLocation } from "@/features/location/location-provider";
import { useNearbyListings } from "@/hooks/use-nearby-listings";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { fetchCategories } from "@/services/listings";
import type { Listing, ListingType } from "@/types/domain";
import { getListingAmount } from "@/utils/format";

import { useAuth } from "@/features/auth/auth-provider";
import { errorMessage } from "@/utils/errors";

const BAGUA_REGION: MapRegion = {
  latitude: -5.6395,
  longitude: -78.5325,
  latitudeDelta: 0.045,
  longitudeDelta: 0.045,
};
const filters: { label: string; value?: ListingType }[] = [
  { label: "Todos" },
  { label: "Productos", value: "product" },
  { label: "Servicios", value: "service" },
  { label: "Promos", value: "promotion" },
  { label: "Necesidades", value: "need" },
];

export default function ExploreScreen() {
  const { session } = useAuth();
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [type, setType] = useState<ListingType>();
  const [selected, setSelected] = useState<Listing>();
  const [region, setRegion] = useState(BAGUA_REGION);
  const [radiusKm, setRadiusKm] = useState(15);
  const [maxPrice, setMaxPrice] = useState<number>();
  const [categoryId, setCategoryId] = useState<string>();
  const hasCenteredOnUser = useRef(false);
  const {
    coordinates,
    permissionStatus,
    canAskAgain,
    isLocating,
    requestLocation,
    openLocationSettings,
  } = useDeviceLocation();
  const searchCenter = coordinates
    ? { latitude: region.latitude, longitude: region.longitude }
    : null;
  const nearby = useNearbyListings(searchCenter, radiusKm, type, categoryId);
  const remoteCategories = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
    enabled: isSupabaseConfigured,
  });
  const categories = (
    isSupabaseConfigured ? (remoteCategories.data ?? []) : demoCategories
  ).filter((item) => !type || item.type === type);
  const source = nearby.data ?? [];
  const normalizedQuery = query.trim().toLocaleLowerCase("es-PE");
  const listings = source.filter(
    (item) =>
      (!categoryId || item.categoryId === categoryId) &&
      (!maxPrice ||
        (getListingAmount(item.price, item.budget) ?? 0) <= maxPrice) &&
      (!normalizedQuery ||
        `${item.title} ${item.description} ${item.ownerName}`
          .toLocaleLowerCase("es-PE")
          .includes(normalizedQuery)),
  );

  const markers = useMemo(
    () =>
      listings.filter(
        (item) =>
          Number.isFinite(item.latitude) && Number.isFinite(item.longitude),
      ),
    [listings],
  );
  const selectListing = (listing: Listing) => setSelected(listing);

  useEffect(() => {
    void requestLocation();
  }, [requestLocation]);
  useEffect(() => {
    if (!coordinates || hasCenteredOnUser.current) return;
    hasCenteredOnUser.current = true;
    setRegion((current) => ({ ...current, ...coordinates }));
  }, [coordinates]);

  const askForLocation = () =>
    void (canAskAgain ? requestLocation() : openLocationSettings());
  const saveSearch = async () => {
    if (!session) {
      router.push({
        pathname: "/(auth)/login",
        params: { returnTo: "/(tabs)/explore" },
      });
      return;
    }
    if (!searchCenter) {
      setNotice("Activa tu ubicación para guardar una zona de búsqueda.");
      return;
    }
    setSaving(true);
    setNotice("");
    try {
      const { error } = await supabase!
        .from("saved_searches")
        .insert({
          owner_id: session.user.id,
          query: query.trim(),
          listing_type: type ?? null,
          category_id: categoryId ?? null,
          max_price: maxPrice ?? null,
          ...searchCenter,
          radius_km: radiusKm,
        });
      if (error) throw error;
      setNotice("Búsqueda guardada. Puedes revisarla en Mis alertas.");
    } catch (e) {
      setNotice(errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-white">
      <ScreenHeader title="Mapa" onSearch={() => setSearchOpen((v) => !v)} />
      {searchOpen && (
        <View className="px-5 pb-3">
          <SearchBar
            value={query}
            onChangeText={setQuery}
            autoFocus
            placeholder="Buscar en el mapa…"
          />
        </View>
      )}
      {!!notice && (
        <Text accessibilityRole="alert" className="px-5 pb-2 text-xs text-navy">
          {notice}
        </Text>
      )}
      <View className="flex-row items-center gap-1 pr-4">
        <View className="min-w-0 flex-1">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ flexGrow: 0 }}
            contentContainerClassName="gap-2 px-5 pb-3"
          >
            {filters.map((filter) => {
              const active = type === filter.value;
              return (
                <Pressable
                  key={filter.label}
                  onPress={() => {
                    setType(filter.value);
                    setCategoryId(undefined);
                  }}
                  className={`rounded-full border px-4 py-2 ${active ? "border-brand bg-brand" : "border-line bg-white"}`}
                >
                  <Text
                    className={`font-medium text-xs ${active ? "text-white" : "text-navy"}`}
                  >
                    {filter.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Filtros del mapa"
          accessibilityState={{ expanded: filtersOpen }}
          onPress={() => setFiltersOpen((v) => !v)}
          className="mb-3 h-10 w-10 items-center justify-center rounded-full bg-white"
        >
          <Ionicons name="options-outline" size={20} color={colors.navy} />
        </Pressable>
        <Pressable
          disabled={saving}
          accessibilityRole="button"
          accessibilityLabel="Guardar búsqueda"
          onPress={() => void saveSearch()}
          className="mb-3 h-10 w-10 items-center justify-center rounded-full bg-white"
        >
          <Ionicons name="bookmark-outline" size={20} color={colors.navy} />
        </Pressable>
      </View>
      {filtersOpen && (
        <View className="px-5 pb-2">
          <View className="flex-row gap-2">
            <View className="flex-1">
              <SelectField
                label="Radio"
                value={String(radiusKm)}
                options={[5, 15, 30].map((v) => ({
                  value: String(v),
                  label: v + " km",
                }))}
                onChange={(v) => setRadiusKm(Number(v))}
              />
            </View>
            <View className="flex-1">
              <SelectField
                label="Precio"
                value={maxPrice == null ? "all" : String(maxPrice)}
                options={[
                  { value: "all", label: "Todos" },
                  { value: "50", label: "Hasta S/ 50" },
                  { value: "200", label: "Hasta S/ 200" },
                ]}
                onChange={(v) =>
                  setMaxPrice(v === "all" ? undefined : Number(v))
                }
              />
            </View>
          </View>
          <SelectField
            label="Categoría"
            value={categoryId ?? "all"}
            options={[
              { value: "all", label: "Todas" },
              ...categories.map((c) => ({ value: c.id, label: c.name })),
            ]}
            onChange={(v) => setCategoryId(v === "all" ? undefined : v)}
          />
        </View>
      )}
      <View className="flex-1 overflow-hidden border-t border-line bg-slate-100">
        <NearbyMap
          listings={markers}
          region={region}
          selectedId={selected?.id}
          userCoordinates={coordinates}
          locationUnavailable={
            !isLocating &&
            permissionStatus !== Location.PermissionStatus.GRANTED
          }
          onRegionChange={setRegion}
          onSelect={selectListing}
          onRequestLocation={askForLocation}
        />
        <View className="absolute bottom-28 left-0 right-0">
          {selected ? (
            <View className="px-5">
              <ListingCard listing={selected} horizontal />
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerClassName="px-5"
            >
              {listings.slice(0, 5).map((item) => (
                <Pressable key={item.id} onPress={() => selectListing(item)}>
                  <ListingCard listing={item} horizontal />
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
