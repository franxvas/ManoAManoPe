import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { ActivityIndicator, Text, View } from "react-native";
import { PrimaryButton } from "@/components/primary-button";
import { colors } from "@/constants/theme";
import { isSupabaseConfigured } from "@/lib/supabase";
import { trustRpc } from "./api";
import {
  badges,
  FEW_REVIEWS,
  TrustIndicators,
  trustLevel,
  trustLevelInfo,
} from "./indicators";

const toneClass = {
  muted: "bg-gray-100 text-muted",
  info: "bg-blue-50 text-navy",
  success: "bg-green-50 text-success",
  warning: "bg-amber-50 text-amber-700",
} as const;
export function TrustSummary({
  ownerId,
  own = false,
}: {
  ownerId: string;
  own?: boolean;
}) {
  const query = useQuery({
    queryKey: ["trust-summary", ownerId],
    queryFn: () =>
      trustRpc<TrustIndicators>("get_profile_trust", { p_owner_id: ownerId }),
    enabled: isSupabaseConfigured && Boolean(ownerId),
  });
  return (
    <View className="my-4 gap-3 rounded-2xl border border-line bg-white p-4">
      <Text className="font-display text-xl text-navy">Actividad</Text>
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
            {(() => {
              const info = trustLevelInfo[trustLevel(query.data)];
              return (
                <View className="gap-1">
                  <Text
                    className={`self-start rounded-full px-3 py-1 text-sm font-medium ${toneClass[info.tone]}`}
                  >
                    Estado: {info.label}
                  </Text>
                  <Text className="text-xs text-muted">{info.description}</Text>
                </View>
              );
            })()}
            <Text className="text-ink">
              Miembro desde{" "}
              {new Date(query.data.joined_at).toLocaleDateString("es-PE", {
                month: "long",
                year: "numeric",
              })}
            </Text>
            <Text className="text-ink">
              {query.data.completed_operations} operaciones completadas ·{" "}
              {query.data.confirmed_services} servicios confirmados
            </Text>
            <Text className="text-ink">
              {query.data.review_count
                ? `${query.data.review_average.toFixed(1)} de 5 · ${query.data.review_count} reseñas válidas`
                : "Sin reseñas todavía"}
            </Text>
            {query.data.review_count > 0 &&
              query.data.review_count < FEW_REVIEWS && (
                <Text className="text-xs text-muted">
                  Pocas reseñas: la nota se ajusta para no exagerar con una o
                  dos opiniones.
                </Text>
              )}
            {badges(query.data).map((badge) => (
              <Text
                key={badge}
                className="self-start rounded-full bg-green-50 px-3 py-2 text-xs text-success"
              >
                {badge}
              </Text>
            ))}
            {own && !query.data.verified && (
              <PrimaryButton
                label="Verificar mi identidad con DNI"
                variant="secondary"
                onPress={() => router.push("/confianza/verificar")}
              />
            )}
          </>
        )
      )}
    </View>
  );
}
