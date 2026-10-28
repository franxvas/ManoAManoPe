import { useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import { useRef, useState } from "react";
import { ActivityIndicator, Modal, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenHeader } from "@/components/screen-header";
import { PrimaryButton } from "@/components/primary-button";
import { useAuth } from "@/features/auth/auth-provider";
import { readWorks, removeWork } from "@/features/portafolio/api";
import { colors } from "@/constants/theme";
export default function WorkDetail() {
  const { id, ownerId } = useLocalSearchParams<{
    id: string;
    ownerId: string;
  }>();
  const { session } = useAuth();
  const cache = useQueryClient();
  const lock = useRef(false);
  const [confirm, setConfirm] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [deleted, setDeleted] = useState(false);
  const query = useQuery({
    queryKey: ["portfolio", ownerId],
    queryFn: () => readWorks(ownerId),
    enabled: Boolean(ownerId),
    staleTime: 60000,
  });
  const work = query.data?.find((w) => w.id === id);
  const mine = Boolean(work && session?.user.id === work.owner_id);
  async function remove() {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      const warning = await removeWork(id);
      setConfirm(false);
      setDeleted(true);
      setError(warning);
      await cache.invalidateQueries({ queryKey: ["portfolio", ownerId] });
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo eliminar");
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-canvas">
      <ScreenHeader title="Detalle del trabajo" showBack />
      <ScrollView contentContainerClassName="p-5 pb-10 gap-4">
        {query.isLoading ? (
          <ActivityIndicator color={colors.red} />
        ) : query.isError ? (
          <>
            <Text className="text-brand" accessibilityRole="alert">
              {query.error.message}
            </Text>
            <PrimaryButton
              label="Reintentar"
              onPress={() => void query.refetch()}
            />
          </>
        ) : deleted ? (
          <>
            <Text className="text-success">El trabajo se eliminó.</Text>
            <PrimaryButton
              label="Volver al portafolio"
              onPress={() =>
                router.replace({ pathname: "/portafolio", params: { ownerId } })
              }
            />
          </>
        ) : !work ? (
          <Text className="text-muted">
            El trabajo no está disponible o no tienes permiso para verlo.
          </Text>
        ) : (
          <>
            <Text className="font-display text-2xl text-navy">
              {work.title}
            </Text>
            <Text className="text-muted">
              {work.category} · {work.completed_month.slice(0, 7)}
            </Text>
            <Text className={work.confirmed ? "text-success" : "text-muted"}>
              {work.confirmed
                ? "Servicio confirmado en la app"
                : "Trabajo añadido al portafolio"}
            </Text>
            <Text className="text-ink leading-6">{work.description}</Text>
            {work.media.map((photo) => (
              <View key={photo.path} className="rounded-2xl bg-white p-3">
                <Text className="mb-2 font-medium text-navy">
                  {photo.kind === "before"
                    ? "Antes"
                    : photo.kind === "after"
                      ? "Después"
                      : "Trabajo"}
                </Text>
                <Image
                  accessibilityLabel={`${work.title}: ${photo.kind === "before" ? "antes" : photo.kind === "after" ? "después" : "fotografía del trabajo"}`}
                  source={{ uri: photo.url }}
                  style={{ height: 250, width: "100%", borderRadius: 12 }}
                  contentFit="contain"
                />
              </View>
            ))}
            {mine && (
              <>
                <PrimaryButton
                  label="Editar trabajo"
                  onPress={() =>
                    router.push({
                      pathname: "/portafolio/editar",
                      params: { id },
                    })
                  }
                />
                <PrimaryButton
                  variant="outline"
                  label="Eliminar trabajo"
                  onPress={() => setConfirm(true)}
                />
              </>
            )}
          </>
        )}
        {Boolean(error) && (
          <Text accessibilityRole="alert" className="text-brand">
            {error}
          </Text>
        )}
      </ScrollView>
      <Modal
        visible={confirm}
        transparent
        onRequestClose={() => {
          if (!busy) setConfirm(false);
        }}
      >
        <View className="flex-1 justify-center bg-black/40 px-6">
          <View className="gap-4 rounded-2xl bg-white p-5">
            <Text className="font-display text-xl text-navy">
              ¿Eliminar este trabajo?
            </Text>
            <Text className="text-muted">
              Se retirará del portafolio y se intentarán borrar sus fotos. Esta
              acción no elimina el acuerdo relacionado.
            </Text>
            <PrimaryButton
              label="Eliminar trabajo definitivamente"
              loading={busy}
              onPress={() => void remove()}
            />
            <PrimaryButton
              variant="outline"
              label="Cancelar"
              disabled={busy}
              onPress={() => setConfirm(false)}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
