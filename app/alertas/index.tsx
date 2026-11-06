import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { router } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenHeader } from "@/components/screen-header";
import { PrimaryButton } from "@/components/primary-button";
import { FormField } from "@/components/form-field";
import { useAuth } from "@/features/auth/auth-provider";
import { supabase } from "@/lib/supabase";
import { errorMessage } from "@/utils/errors";
export default function Alerts() {
  const { session } = useAuth();
  const [error, E] = useState(""),
    [busy, B] = useState(false);
  const query = useQuery({
    queryKey: ["saved-searches", session?.user.id],
    enabled: !!session,
    refetchInterval: 60000,
    queryFn: async () => {
      const refresh = await supabase!.rpc("refresh_saved_searches");
      if (refresh.error) throw refresh.error;
      const { data, error } = await supabase!
        .from("saved_searches")
        .select("*,saved_search_matches(listing_id,created_at)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as {
        id: string;
        query: string;
        max_price: number | null;
        radius_km: number;
        latitude: number;
        longitude: number;
        active: boolean;
        saved_search_matches: { listing_id: string; created_at: string }[];
      }[];
    },
  });
  async function change(id: string, values?: Record<string, unknown>) {
    B(true);
    E("");
    try {
      const r = values
        ? await supabase!.from("saved_searches").update(values).eq("id", id)
        : await supabase!.from("saved_searches").delete().eq("id", id);
      if (r.error) throw r.error;
      await query.refetch();
    } catch (e) {
      E(errorMessage(e));
    } finally {
      B(false);
    }
  }
  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-canvas">
      <ScreenHeader title="Mis alertas" showBack />
      <ScrollView contentContainerClassName="p-5 gap-4 pb-12">
        {!session ? (
          <PrimaryButton
            label="Iniciar sesión"
            onPress={() =>
              router.push({
                pathname: "/(auth)/login",
                params: { returnTo: "/alertas" },
              })
            }
          />
        ) : (
          <>
            <Text className="text-xs text-muted">
              Coincidencias de tus búsquedas guardadas.
            </Text>
            {(!!error || query.isError) && (
              <Text className="text-brand">
                {error || errorMessage(query.error)}
              </Text>
            )}
            {query.isLoading && <Text>Cargando alertas…</Text>}
            {query.isError && (
              <PrimaryButton
                label="Reintentar"
                onPress={() => void query.refetch()}
              />
            )}
            {!query.isLoading && !query.isError && !query.data?.length && (
              <PrimaryButton
                label="Buscar en Explorar"
                onPress={() => router.push("/(tabs)/explore")}
              />
            )}
            {query.data?.map((s) => (
              <View key={s.id} className="gap-3 rounded-2xl bg-white p-4">
                <Text className="font-display text-xl text-navy">
                  {s.query || "Publicaciones cercanas"}
                </Text>
                <Text>
                  {s.active ? "Activa" : "Pausada"} · {s.radius_km} km ·{" "}
                  {s.max_price == null
                    ? "Cualquier precio"
                    : `Hasta S/ ${s.max_price}`}
                </Text>
                <Text className="text-xs text-muted">
                  Zona guardada: {s.latitude.toFixed(3)},{" "}
                  {s.longitude.toFixed(3)}
                </Text>
                <SearchEditor
                  initial={s.query}
                  save={(v) => void change(s.id, { query: v.trim() })}
                  busy={busy}
                />
                <PrimaryButton
                  label={s.active ? "Pausar" : "Activar"}
                  loading={busy}
                  onPress={() => void change(s.id, { active: !s.active })}
                />
                <PrimaryButton
                  label="Eliminar alerta"
                  variant="outline"
                  loading={busy}
                  onPress={() => void change(s.id)}
                />
                {s.saved_search_matches.map((m) => (
                  <PrimaryButton
                    key={m.listing_id}
                    label="Ver coincidencia"
                    variant="outline"
                    onPress={() =>
                      router.push({
                        pathname: "/listing/[id]",
                        params: { id: m.listing_id },
                      })
                    }
                  />
                ))}
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
function SearchEditor({
  initial,
  save,
  busy,
}: {
  initial: string;
  save: (v: string) => void;
  busy: boolean;
}) {
  const [value, V] = useState(initial);
  return (
    <>
      <FormField
        label="Palabras de búsqueda"
        value={value}
        onChangeText={V}
        maxLength={120}
      />
      <PrimaryButton
        label="Guardar palabras"
        variant="outline"
        loading={busy}
        onPress={() => save(value)}
      />
    </>
  );
}
