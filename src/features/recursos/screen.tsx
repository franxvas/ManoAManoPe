import { Disclosure } from "@/components/disclosure";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenHeader } from "@/components/screen-header";
import { FormField } from "@/components/form-field";
import { PrimaryButton } from "@/components/primary-button";
import { PeruLocationPicker } from "@/components/peru-location-picker";
import { SelectField } from "@/components/select-field";
import { useAuth } from "@/features/auth/auth-provider";
import { supabase } from "@/lib/supabase";
import { errorMessage } from "@/utils/errors";
import { Image } from "expo-image";
import { PhotoPicker, type Photo } from "@/features/comunidad/components";
import { photoUrl, uploadPhotos } from "@/features/comunidad/api";
import { FavoriteButton } from "@/features/guardados/favorite-button";
interface Post {
  photos: string[];
  id: string;
  owner_id: string;
  title: string;
  description: string;
  zone: string;
  price: number;
  unit: string;
  deposit: number;
  starts_at: string;
  ends_at: string;
}
interface Response {
  id: string;
  post_id: string;
  user_id: string;
  message: string;
  status: string;
}
export function ResourceScreen({ kind }: { kind: "loan" | "rental" }) {
  const { postId } = useLocalSearchParams<{ postId?: string }>();
  const { session } = useAuth();
  const user = session?.user.id;
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [title, T] = useState(""),
    [description, D] = useState(""),
    [region, R] = useState(""),
    [city, C] = useState(""),
    [start, S] = useState(""),
    [end, E] = useState(""),
    [price, P] = useState(""),
    [deposit, G] = useState("0"),
    [unit, U] = useState("dia"),
    [message, M] = useState(""),
    [busy, B] = useState(false),
    [error, X] = useState("");
  const query = useQuery({
    queryKey: ["resource-posts", kind, user, postId],
    queryFn: async () => {
      if (!supabase)
        throw new Error("Conecta tu cuenta para usar esta sección.");
      const postQuery = supabase.from("resource_posts").select("*").eq("kind", kind).order("created_at", { ascending: false }).limit(100);
      if (postId) postQuery.eq("id", postId);
      const [posts, responses] = await Promise.all([
        postQuery,
        user
          ? supabase.from("resource_responses").select("*")
          : Promise.resolve({ data: [], error: null }),
      ]);
      if (posts.error || responses.error) throw posts.error || responses.error;
      return {
        posts: posts.data as Post[],
        responses: responses.data as Response[],
      };
    },
  });
  async function run(action: () => Promise<unknown>) {
    if (busy) return;
    B(true);
    X("");
    try {
      await action();
      await query.refetch();
    } catch (e) {
      X(errorMessage(e));
    } finally {
      B(false);
    }
  }
  async function publish() {
    if (!user) throw new Error("Inicia sesión.");
    const a = new Date(`${start}T00:00:00-05:00`),
      b = new Date(`${end}T23:59:00-05:00`);
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(start) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(end) ||
      !Number.isFinite(+a) ||
      !Number.isFinite(+b) ||
      +a <= Date.now() ||
      +b <= +a ||
      a.toISOString().slice(0, 10) !== start ||
      b.toLocaleDateString("sv-SE", { timeZone: "America/Lima" }) !== end
    )
      throw new Error("Selecciona fechas válidas y futuras (AAAA-MM-DD).");
    const amount = Number(price.replace(",", ".")),
      guarantee = Number(deposit.replace(",", "."));
    if (
      title.trim().length < 5 ||
      description.trim().length < 10 ||
      !city ||
      !region
    )
      throw new Error("Completa el título, los detalles y la localidad.");
    if (
      kind === "rental" &&
      (!price ||
        !Number.isFinite(amount) ||
        amount <= 0 ||
        !Number.isFinite(guarantee) ||
        guarantee < 0)
    )
      throw new Error("Revisa el precio y la garantía.");
    if (kind === "rental" && !photos.length)
      throw new Error("Añade al menos una foto del objeto.");
    const paths = await uploadPhotos("recursos", photos);
    const result = await supabase!.from("resource_posts").insert({
      owner_id: user,
      kind,
      title: title.trim(),
      description: description.trim(),
      zone: `${city}, ${region}`,
      starts_at: a.toISOString(),
      ends_at: b.toISOString(),
      price: kind === "loan" ? 0 : amount,
      deposit: kind === "loan" ? 0 : guarantee,
      unit,
      photos: paths,
    });
    if (result.error) throw result.error;
    T("");
    D("");
    setPhotos([]);
  }
  const status: Record<string, string> = {
    pending: "Pendiente",
    accepted: "Acordado",
    declined: "No seleccionado",
    delivered: "En uso, pendiente de devolución",
    completed: "Devuelto",
    cancelled: "Cancelado",
  };
  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-canvas">
      <ScreenHeader
        title={kind === "loan" ? "Pedir un objeto" : "Alquileres"}
        showBack
      />
      <ScrollView
        contentContainerClassName="p-5 gap-4 pb-12"
        keyboardShouldPersistTaps="handled"
      >
        {kind === "loan" && <Text className="font-sans text-sm text-muted">Pide un objeto por un tiempo y acuerda su devolución. Esta sección no es para dinero.</Text>}
        {!!error && (
          <Text accessibilityRole="alert" className="text-brand">
            {error}
          </Text>
        )}
        {query.isError && (
          <>
            <Text className="text-brand">{errorMessage(query.error)}</Text>
            <PrimaryButton
              label="Reintentar"
              onPress={() => void query.refetch()}
            />
          </>
        )}
        {!user ? (
          <PrimaryButton
            label="Iniciar sesión para publicar"
            onPress={() => router.push("/(auth)/login")}
          />
        ) : (
          <Disclosure
            title={kind === "loan" ? "Pedir un objeto" : "Ofrecer un alquiler"}
          >
            <PhotoPicker photos={photos} onChange={setPhotos} onError={X} />
            <FormField
              label={
                kind === "loan" ? "¿Qué necesitas?" : "Objeto para alquilar"
              }
              value={title}
              onChangeText={T}
              maxLength={100}
            />
            <FormField
              label="Detalles y condiciones"
              value={description}
              onChangeText={D}
              multiline
              maxLength={2000}
            />
            <PeruLocationPicker
              region={region}
              city={city}
              onChange={(r, c) => {
                R(r);
                C(c);
              }}
            />
            <FormField
              label="Desde (AAAA-MM-DD)"
              value={start}
              onChangeText={S}
            />
            <FormField
              label="Hasta (AAAA-MM-DD)"
              value={end}
              onChangeText={E}
            />
            {kind === "rental" && (
              <>
                <FormField
                  label="Precio por unidad (S/)"
                  value={price}
                  onChangeText={P}
                  keyboardType="decimal-pad"
                />
                <SelectField
                  label="Unidad"
                  value={unit}
                  onChange={U}
                  options={[
                    { value: "dia", label: "Por día" },
                    { value: "hora", label: "Por hora" },
                  ]}
                />
                <FormField
                  label="Garantía (S/), separada del alquiler"
                  value={deposit}
                  onChangeText={G}
                  keyboardType="decimal-pad"
                />
              </>
            )}
            <PrimaryButton
              label={
                kind === "loan" ? "Publicar solicitud" : "Publicar alquiler"
              }
              loading={busy}
              onPress={() => void run(publish)}
            />
          </Disclosure>
        )}
        {query.isLoading && <Text>Cargando publicaciones…</Text>}
        {query.data?.posts.length === 0 && <Text className="text-muted">{postId ? 'Este contenido ya no está disponible.' : 'Todavía no hay publicaciones.'}</Text>}
        {!!postId && <PrimaryButton variant="outline" label={kind === 'loan' ? 'Ver todos los préstamos' : 'Ver todos los alquileres'} onPress={() => router.replace(kind === 'loan' ? '/prestamos' : '/alquileres')} />}
        {!!user && (query.data?.posts.length ?? 0) > 0 && (
          <FormField
            label={
              kind === "loan"
                ? "Mensaje para prestar el objeto"
                : "Mensaje para solicitar el alquiler"
            }
            placeholder={kind === "loan" ? "Escribe aquí y luego toca «Puedo prestártelo» en la publicación" : "Escribe aquí y luego toca «Solicitar alquiler» en la publicación"}
            value={message}
            onChangeText={M}
            multiline
            maxLength={1000}
          />
        )}
        {query.data?.posts.filter((p) => !postId || p.id === postId).map((p) => (
          <View key={p.id} className="gap-3 rounded-2xl bg-white p-4">
            <View className="flex-row items-start">
              <Text className="flex-1 font-display text-xl text-navy">{p.title}</Text>
              <FavoriteButton type="resource" id={p.id} size="sm" />
            </View>
            {p.photos?.map((path) => (
              <Image
                key={path}
                source={{ uri: photoUrl(path) }}
                style={{ width: "100%", height: 180, borderRadius: 12 }}
                contentFit="cover"
              />
            ))}
            <Text>{p.description}</Text>
            <Text className="text-muted">
              {p.zone} ·{" "}
              {new Date(p.starts_at).toLocaleDateString("es-PE", {
                timeZone: "America/Lima",
              })}{" "}
              al{" "}
              {new Date(p.ends_at).toLocaleDateString("es-PE", {
                timeZone: "America/Lima",
              })}
            </Text>
            {kind === "rental" && (
              <Text>
                S/ {p.price} por {p.unit === "dia" ? "día" : "hora"} · Garantía
                S/ {p.deposit}
              </Text>
            )}
            {user &&
              p.owner_id !== user &&
              !query.data.responses.some(
                (r) => r.post_id === p.id && r.user_id === user,
              ) && (
                <PrimaryButton
                  label={
                    kind === "loan" ? "Puedo prestártelo" : "Solicitar alquiler"
                  }
                  loading={busy}
                  disabled={message.trim().length < 5}
                  onPress={() =>
                    void run(async () => {
                      const r = await supabase!
                        .from("resource_responses")
                        .insert({
                          post_id: p.id,
                          user_id: user,
                          message: message.trim(),
                        });
                      if (r.error) throw r.error;
                    })
                  }
                />
              )}
            {query.data.responses
              .filter((r) => r.post_id === p.id)
              .map((r) => {
                const provider = kind === "loan" ? r.user_id : p.owner_id;
                const action = (name: string) =>
                  void run(async () => {
                    const result = await supabase!.rpc(
                      "change_resource_response",
                      { p_response: r.id, p_action: name },
                    );
                    if (result.error) throw result.error;
                  });
                return (
                  <View key={r.id} className="gap-2 border-t border-line pt-3">
                    <Text>
                      {status[r.status]} · {r.message}
                    </Text>
                    {r.status === "pending" && p.owner_id === user && (
                      <PrimaryButton
                        label="Aceptar"
                        loading={busy}
                        onPress={() => action("accept")}
                      />
                    )}
                    {r.status === "accepted" && provider === user && (
                      <PrimaryButton
                        label="Registrar entrega"
                        loading={busy}
                        onPress={() => action("deliver")}
                      />
                    )}
                    {r.status === "delivered" && provider === user && (
                      <PrimaryButton
                        label="Confirmar devolución recibida"
                        loading={busy}
                        onPress={() => action("return")}
                      />
                    )}
                    {["pending", "accepted"].includes(r.status) && (
                      <PrimaryButton
                        label="Cancelar acuerdo"
                        loading={busy}
                        variant="outline"
                        onPress={() => action("cancel")}
                      />
                    )}
                  </View>
                );
              })}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
