import { useQuery } from "@tanstack/react-query";
import { ActivityIndicator, Text, View } from "react-native";
import { PrimaryButton } from "@/components/primary-button";
import { colors } from "@/constants/theme";
import { isSupabaseConfigured } from "@/lib/supabase";
import { trustRpc } from "./api";
import { badges, TrustIndicators } from "./indicators";
export function TrustSummary({ ownerId }: { ownerId: string }) {
  const query = useQuery({
    queryKey: ["trust-summary", ownerId],
    queryFn: () =>
      trustRpc<TrustIndicators>("get_profile_trust", { p_owner_id: ownerId }),
    enabled: isSupabaseConfigured && Boolean(ownerId),
  });
  return (
    <View className="my-4 gap-3 rounded-2xl border border-line bg-white p-4">
      <Text className="font-display text-xl text-navy">
        Actividad y confianza
      </Text>
      {!isSupabaseConfigured ? (
        <Text className="text-muted">
          Modo demostración: no se acredita identidad, antigüedad ni reputación
          real.
        </Text>
      ) : query.isLoading ? (
        <ActivityIndicator color={colors.red} />
      ) : query.isError ? (
        <>
          <Text accessibilityRole="alert" className="text-brand">
            No pudimos verificar la actividad de este perfil.
          </Text>
          <PrimaryButton
            label="Reintentar"
            onPress={() => void query.refetch()}
          />
        </>
      ) : (
        query.data && (
          <>
            <Text className="text-ink">
              Miembro desde{" "}
              {new Date(query.data.joined_at).toLocaleDateString("es-PE", {
                month: "long",
                year: "numeric",
              })}
            </Text>
            <Text className="text-ink">
              {query.data.confirmed_services} servicios confirmados
            </Text>
            <Text className="text-ink">
              {query.data.review_count
                ? `${query.data.review_average.toFixed(1)} de 5 · ${query.data.review_count} reseñas válidas`
                : "Todavía no hay reseñas de operaciones completadas"}
            </Text>
            {badges(query.data).map((badge) => (
              <Text
                key={badge}
                className="self-start rounded-full bg-green-50 px-3 py-2 text-xs text-success"
              >
                {badge}
              </Text>
            ))}
            <Text className="text-xs leading-5 text-muted">
              Servicios: finalizados mediante confirmación de ambas partes. Los
              indicadores de préstamos y alquileres se mostrarán cuando sus
              módulos aporten operaciones verificables. Ninguna insignia
              acredita identidad ni pagos.
            </Text>
          </>
        )
      )}
    </View>
  );
}
