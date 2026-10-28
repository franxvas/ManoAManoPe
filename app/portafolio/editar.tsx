import { useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenHeader } from "@/components/screen-header";
import { PrimaryButton } from "@/components/primary-button";
import { FormField } from "@/components/form-field";
import { colors } from "@/constants/theme";
import { useAuth } from "@/features/auth/auth-provider";
import { trustRpc } from "@/features/confianza/api";
import { readWorks, saveWork } from "@/features/portafolio/api";
import { PhotoKind, validateWork } from "@/features/portafolio/model";
import { isSupabaseConfigured } from "@/lib/supabase";
export default function EditWork() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { session } = useAuth();
  const owner = session?.user.id;
  const cache = useQueryClient();
  const lock = useRef(false),
    initialized = useRef(false);
  const [title, setTitle] = useState(""),
    [category, setCategory] = useState(""),
    [description, setDescription] = useState(""),
    [month, setMonth] = useState(""),
    [visible, setVisible] = useState(true),
    [dealId, setDealId] = useState<string | null>(null),
    [photos, setPhotos] = useState<
      { uri: string; path?: string; kind: PhotoKind }[]
    >([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [saved, setSaved] = useState<string>();
  const query = useQuery({
    queryKey: ["portfolio", owner],
    queryFn: () => readWorks(owner!),
    enabled: Boolean(owner && id),
  });
  const work = query.data?.find((w) => w.id === id);
  const deals = useQuery({
    queryKey: ["portfolio-linkable", owner],
    queryFn: () =>
      trustRpc<{ id: string; title: string }[]>("get_my_confirmed_services"),
    enabled: Boolean(owner),
  });
  useEffect(() => {
    if (work && !initialized.current) {
      initialized.current = true;
      setTitle(work.title);
      setCategory(work.category);
      setDescription(work.description);
      setMonth(work.completed_month.slice(0, 7));
      setVisible(work.visible);
      setDealId(work.deal_id);
      setPhotos(
        work.media.map((m) => ({ uri: m.url, path: m.path, kind: m.kind })),
      );
    }
  }, [work]);
  async function addPhotos() {
    setError("");
    try {
      if (Platform.OS !== "web") {
        const permission =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted)
          throw new Error("Permite el acceso a la galería para añadir fotos.");
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: true,
        selectionLimit: 6 - photos.length,
        quality: 0.8,
      });
      if (!result.canceled)
        setPhotos((p) =>
          [
            ...p,
            ...result.assets.map((a) => ({
              uri: a.uri,
              kind: "work" as PhotoKind,
            })),
          ].slice(0, 6),
        );
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo abrir la galería");
    }
  }
  async function submit() {
    if (lock.current) return;
    setError("");
    try {
      validateWork(title, category, description, month, photos.length);
    } catch (e) {
      setError((e as Error).message);
      return;
    }
    lock.current = true;
    setBusy(true);
    try {
      const result = await saveWork(
        { id, title, category, description, month, visible, dealId, photos },
        work,
      );
      await cache.invalidateQueries({ queryKey: ["portfolio", owner] });
      setSaved(result.id);
      setError(result.warning);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar");
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-canvas">
      <ScreenHeader title={id ? "Editar trabajo" : "Añadir trabajo"} showBack />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="p-5 pb-12 gap-3"
        >
          {!owner || !isSupabaseConfigured ? (
            <Text className="text-muted">
              Inicia sesión con Supabase para gestionar tu portafolio. Los
              trabajos de demostración no generan confianza real.
            </Text>
          ) : id && query.isLoading ? (
            <ActivityIndicator color={colors.red} />
          ) : id && (query.isError || !work) ? (
            <>
              <Text className="text-brand">
                No pudimos abrir este trabajo. Solo puedes editar tus trabajos.
              </Text>
              <PrimaryButton
                label="Reintentar"
                onPress={() => void query.refetch()}
              />
            </>
          ) : saved ? (
            <>
              <Text className="text-success">
                El trabajo se guardó correctamente.
              </Text>
              <PrimaryButton
                label="Ver trabajo"
                onPress={() =>
                  router.replace({
                    pathname: "/portafolio/[id]",
                    params: { id: saved, ownerId: owner },
                  })
                }
              />
            </>
          ) : (
            <View pointerEvents={busy ? "none" : "auto"}>
              <FormField
                label="Título"
                value={title}
                onChangeText={setTitle}
                maxLength={100}
              />
              <FormField
                label="Categoría"
                value={category}
                onChangeText={setCategory}
                maxLength={80}
              />
              <FormField
                label="Descripción"
                value={description}
                onChangeText={setDescription}
                maxLength={4000}
                multiline
              />
              <FormField
                label="Mes aproximado de realización (AAAA-MM)"
                value={month}
                onChangeText={setMonth}
                placeholder="2026-10"
                maxLength={7}
              />
              <View className="mb-4 flex-row items-center justify-between">
                <Text className="text-ink">Visible en mi perfil público</Text>
                <Switch
                  accessibilityLabel="Mostrar trabajo públicamente"
                  value={visible}
                  onValueChange={setVisible}
                />
              </View>
              <Text className="font-medium text-navy">
                Servicio confirmado relacionado (opcional)
              </Text>
              <Text className="mt-1 text-xs text-muted">
                Solo puedes vincular servicios reales completados a tu nombre.
                Una carga manual no se confirma por sí sola.
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => setDealId(null)}
                className="my-2 min-h-11 justify-center rounded-xl border border-line px-3"
              >
                <Text className="text-ink">
                  {dealId === null ? "✓ " : ""}Trabajo añadido manualmente
                </Text>
              </Pressable>
              {deals.isLoading ? (
                <ActivityIndicator color={colors.red} />
              ) : deals.isError ? (
                <Text className="text-brand">
                  No se pudo consultar servicios confirmados. Puedes guardar un
                  trabajo manual.
                </Text>
              ) : (
                (deals.data ?? []).map((deal) => (
                  <Pressable
                    key={deal.id}
                    accessibilityRole="button"
                    onPress={() => setDealId(deal.id)}
                    className="mb-2 min-h-11 justify-center rounded-xl border border-line px-3"
                  >
                    <Text className="text-ink">
                      {dealId === deal.id ? "✓ " : ""}
                      {deal.title}
                    </Text>
                  </Pressable>
                ))
              )}
              <Text className="mt-3 font-medium text-navy">
                Fotos del trabajo (hasta seis)
              </Text>
              {photos.map((photo, index) => (
                <View
                  key={photo.path ?? photo.uri}
                  className="mt-3 rounded-xl bg-white p-3"
                >
                  <Image
                    source={{ uri: photo.uri }}
                    style={{ height: 160, width: "100%", borderRadius: 10 }}
                    contentFit="contain"
                  />
                  <View className="mt-2 flex-row flex-wrap gap-2">
                    {(["work", "before", "after"] as PhotoKind[]).map(
                      (kind) => (
                        <Pressable
                          key={kind}
                          accessibilityRole="button"
                          accessibilityState={{ selected: photo.kind === kind }}
                          onPress={() =>
                            setPhotos((p) =>
                              p.map((a, i) =>
                                i === index ? { ...a, kind } : a,
                              ),
                            )
                          }
                          className={`min-h-11 justify-center rounded-xl px-3 ${photo.kind === kind ? "bg-brand" : "bg-canvas"}`}
                        >
                          <Text
                            className={
                              photo.kind === kind ? "text-white" : "text-ink"
                            }
                          >
                            {kind === "work"
                              ? "Trabajo"
                              : kind === "before"
                                ? "Antes"
                                : "Después"}
                          </Text>
                        </Pressable>
                      ),
                    )}
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Quitar foto ${index + 1}`}
                      onPress={() =>
                        setPhotos((p) => p.filter((_, i) => i !== index))
                      }
                      className="min-h-11 justify-center px-3"
                    >
                      <Text className="text-brand">Quitar</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
              {photos.length < 6 && (
                <PrimaryButton
                  variant="outline"
                  label="Añadir fotos"
                  onPress={() => void addPhotos()}
                  className="my-4"
                />
              )}
              <PrimaryButton
                label="Guardar trabajo"
                loading={busy}
                onPress={() => void submit()}
              />
            </View>
          )}
          {Boolean(error) && (
            <Text accessibilityRole="alert" className="text-brand">
              {error}
            </Text>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
