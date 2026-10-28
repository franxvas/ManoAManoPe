import { useQuery } from "@tanstack/react-query";
import { ActivityIndicator, Text, View } from "react-native";
import { PrimaryButton } from "@/components/primary-button";
import { trustRpc } from "./api";
import { isSupabaseConfigured } from "@/lib/supabase";
import { colors } from "@/constants/theme";
interface Review {
  id: string;
  rating: number;
  comment: string | null;
  reviewer_name: string;
  operation_type: string;
  created_at: string;
}
export function PublicReviews({
  ownerId,
  listingId,
}: {
  ownerId: string;
  listingId?: string;
}) {
  const query = useQuery({
    queryKey: ["public-reviews", ownerId, listingId],
    queryFn: () =>
      trustRpc<Review[]>("list_public_reviews", {
        p_owner_id: ownerId,
        p_listing_id: listingId ?? null,
      }),
    enabled: isSupabaseConfigured,
  });
  const names: Record<string, string> = {
    service: "Servicio",
    product: "Compra de producto",
    promotion: "Promoción",
    need: "Acuerdo de ayuda",
  };
  return (
    <View className="mt-5 gap-3 rounded-2xl bg-white p-4">
      <Text className="font-display text-xl text-navy">
        Reseñas de operaciones completadas
      </Text>
      <Text className="text-xs text-muted">
        Una opinión por persona y operación. Las reseñas publicadas no se
        editan. No acreditan pagos ni verifican identidades.
      </Text>
      {!isSupabaseConfigured ? (
        <Text className="text-muted">
          No hay reputación real en modo demostración.
        </Text>
      ) : query.isLoading ? (
        <ActivityIndicator color={colors.red} />
      ) : query.isError ? (
        <>
          <Text accessibilityRole="alert" className="text-brand">
            No pudimos cargar las reseñas.
          </Text>
          <PrimaryButton
            label="Reintentar"
            onPress={() => void query.refetch()}
          />
        </>
      ) : !query.data?.length ? (
        <Text className="text-muted">
          Todavía no hay reseñas de operaciones completadas.
        </Text>
      ) : (
        <>
          {query.data.map((r) => (
            <View key={r.id} className="border-t border-line pt-3">
              <Text className="font-medium text-ink">
                {r.reviewer_name} · {r.rating}/5
              </Text>
              <Text className="mt-1 text-xs text-muted">
                {names[r.operation_type] ?? "Operación"} ·{" "}
                {new Date(r.created_at).toLocaleDateString("es-PE")}
              </Text>
              {Boolean(r.comment) && (
                <Text className="mt-2 text-sm text-ink">{r.comment}</Text>
              )}
            </View>
          ))}
          {query.data.length === 20 && (
            <Text className="text-xs text-muted">
              Mostrando las 20 reseñas más recientes.
            </Text>
          )}
        </>
      )}
    </View>
  );
}
