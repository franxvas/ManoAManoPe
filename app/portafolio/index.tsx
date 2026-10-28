import { useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenHeader } from "@/components/screen-header";
import { PrimaryButton } from "@/components/primary-button";
import { EmptyState } from "@/components/empty-state";
import { useAuth } from "@/features/auth/auth-provider";
import { readWorks } from "@/features/portafolio/api";
import { isSupabaseConfigured } from "@/lib/supabase";
import { colors } from "@/constants/theme";
export default function PortfolioList() {
  const { ownerId } = useLocalSearchParams<{ ownerId?: string }>();
  const { session } = useAuth();
  const owner = ownerId ?? session?.user.id;
  const mine = Boolean(session && owner === session.user.id);
  const query = useQuery({
    queryKey: ["portfolio", owner],
    queryFn: () => readWorks(owner!),
    enabled: isSupabaseConfigured && Boolean(owner),
    staleTime: 60000,
  });
  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-canvas">
      <ScreenHeader title="Portafolio de trabajos" showBack />
      <View className="px-5 py-3 gap-3">
        <Text className="text-sm text-muted">
          Los trabajos manuales no acreditan una operación. El distintivo de
          servicio confirmado se calcula desde acuerdos completados con código.
        </Text>
        {mine && (
          <PrimaryButton
            label="Añadir trabajo"
            onPress={() => router.push("/portafolio/editar")}
          />
        )}
      </View>
      {!isSupabaseConfigured || !owner ? (
        <EmptyState
          icon="images-outline"
          title="Portafolio conectado a tu cuenta"
          description="Conecta Supabase y usa una cuenta real para crear y consultar trabajos. No se muestran servicios confirmados ficticios."
        />
      ) : query.isLoading ? (
        <ActivityIndicator color={colors.red} />
      ) : query.isError ? (
        <View className="p-5 gap-3">
          <Text accessibilityRole="alert" className="text-brand">
            No pudimos cargar el portafolio. {query.error.message}
          </Text>
          <PrimaryButton
            label="Reintentar"
            onPress={() => void query.refetch()}
          />
        </View>
      ) : (
        <FlatList
          data={query.data ?? []}
          keyExtractor={(w) => w.id}
          contentContainerClassName="p-5 gap-4 pb-10"
          refreshing={query.isRefetching}
          onRefresh={() => void query.refetch()}
          ListEmptyComponent={
            <EmptyState
              title="Todavía no hay trabajos visibles"
              description={
                mine
                  ? "Añade fotografías y describe tu experiencia."
                  : "Esta persona todavía no compartió trabajos en su portafolio."
              }
            />
          }
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Ver trabajo ${item.title}`}
              onPress={() =>
                router.push({
                  pathname: "/portafolio/[id]",
                  params: { id: item.id, ownerId: owner },
                })
              }
              className="rounded-2xl bg-white p-4"
            >
              <Image
                source={{ uri: item.media[0]?.url }}
                style={{ height: 180, width: "100%", borderRadius: 12 }}
                contentFit="cover"
              />
              <Text className="mt-3 font-display text-xl text-navy">
                {item.title}
              </Text>
              <Text className="mt-1 text-xs text-muted">
                {item.category} · {item.completed_month.slice(0, 7)}
                {!item.visible ? " · Solo tú puedes verlo" : ""}
              </Text>
              <Text
                className={`mt-2 text-xs ${item.confirmed ? "text-success" : "text-muted"}`}
              >
                {item.confirmed
                  ? "Servicio confirmado en la app"
                  : "Trabajo añadido al portafolio"}
              </Text>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}
