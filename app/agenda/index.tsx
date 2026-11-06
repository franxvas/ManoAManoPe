import { Disclosure } from "@/components/disclosure";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { router } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenHeader } from "@/components/screen-header";
import { PrimaryButton } from "@/components/primary-button";
import { FormField } from "@/components/form-field";
import { ChoiceChips } from "@/features/comunidad/components";
import { useAuth } from "@/features/auth/auth-provider";
import { useRequireAuth } from "@/hooks/use-require-auth";
import {
  agendaData,
  agendaAction,
  futureInterval,
} from "@/features/agenda/api";
import { errorMessage } from "@/utils/errors";
export default function Agenda() {
  const authReady = useRequireAuth("/agenda");
  const { session } = useAuth();
  const user = session?.user.id;
  const query = useQuery({
    queryKey: ["agenda", user],
    queryFn: agendaData,
    // Solo ejecuta la query cuando el usuario está autenticado
    enabled: authReady && !!user,
  });
  const [service, S] = useState(""),
    [day, D] = useState(""),
    [start, A] = useState("09:00"),
    [end, E] = useState("10:00"),
    [note, N] = useState(""),
    [target, T] = useState(""),
    [busy, B] = useState(false),
    [error, X] = useState("");
  const [now] = useState(() => Date.now());
  const data = query.data;
  const label = (id: string) => {
    const s = data?.slots.find((s) => s.id === id);
    return s
      ? `${data?.services.find((v) => v.id === s.listing_id)?.title ?? "Servicio"} · ${new Date(s.starts_at).toLocaleString("es-PE", { timeZone: "America/Lima" })} – ${new Date(s.ends_at).toLocaleTimeString("es-PE", { timeZone: "America/Lima", hour: "2-digit", minute: "2-digit" })}`
      : "Horario no disponible";
  };
  async function run(fn: () => Promise<unknown>) {
    if (busy) return;
    B(true);
    X("");
    try {
      await fn();
      await query.refetch();
    } catch (e) {
      X(errorMessage(e));
    } finally {
      B(false);
    }
  }
  const status = {
    pending: "Pendiente",
    confirmed: "Confirmada",
    completed: "Realizada",
    cancelled: "Cancelada",
  };
  if (!authReady) return null;
  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-canvas">
      <ScreenHeader title="Agenda" showBack />
      <ScrollView
        contentContainerClassName="p-5 gap-4 pb-12"
        keyboardShouldPersistTaps="handled"
      >
        {!user ? (
          <PrimaryButton
            label="Iniciar sesión"
            onPress={() =>
              router.push({
                pathname: "/(auth)/login",
                params: { returnTo: "/agenda" },
              })
            }
          />
        ) : (
          <>
            {query.isLoading && <Text>Cargando agenda…</Text>}
            {(query.isError || !!error) && (
              <View>
                <Text className="mb-3 text-brand">
                  {error || errorMessage(query.error)}
                </Text>
                <PrimaryButton
                  label="Reintentar"
                  variant="outline"
                  onPress={() => void query.refetch()}
                />
              </View>
            )}
            {!!data && (
              <>
                <Disclosure title="Mi disponibilidad">
                  <ChoiceChips
                    label="Servicio propio"
                    options={Object.fromEntries(
                      data.services
                        .filter((s) => s.owner_id === user)
                        .map((s) => [s.id, s.title]),
                    )}
                    value={service}
                    onChange={S}
                  />
                  {!data.services.some((s) => s.owner_id === user) && (
                    <Text className="text-muted">
                      Publica un servicio para ofrecer citas.
                    </Text>
                  )}
                  <FormField
                    label="Fecha (AAAA-MM-DD)"
                    value={day}
                    onChangeText={D}
                  />
                  <FormField
                    label="Desde (HH:MM, hora de Perú)"
                    value={start}
                    onChangeText={A}
                  />
                  <FormField
                    label="Hasta (HH:MM)"
                    value={end}
                    onChangeText={E}
                  />
                  <PrimaryButton
                    label="Añadir horario"
                    loading={busy}
                    disabled={!service}
                    onPress={() =>
                      void run(async () => {
                        const t = futureInterval(day, start, end);
                        await agendaAction("create_service_slot", {
                          p_listing: service,
                          p_start: t.start,
                          p_end: t.end,
                        });
                        D("");
                      })
                    }
                  />
                </Disclosure>
                <View className="rounded-2xl bg-white p-4">
                  <Text className="mb-3 font-display text-xl text-navy">
                    Horarios disponibles
                  </Text>
                  <FormField
                    label="¿Qué necesitas?"
                    value={note}
                    onChangeText={N}
                    maxLength={1000}
                  />
                  {data.slots
                    .filter(
                      (s) =>
                        s.owner_id !== user && +new Date(s.starts_at) > now,
                    )
                    .map((s) => (
                      <View
                        key={s.id}
                        className="mb-3 gap-2 border-t border-line pt-3"
                      >
                        <Text className="text-navy">{label(s.id)}</Text>
                        <PrimaryButton
                          label="Solicitar cita"
                          loading={busy}
                          disabled={note.trim().length < 5}
                          onPress={() =>
                            void run(() =>
                              agendaAction("book_service_slot", {
                                p_slot: s.id,
                                p_note: note,
                              }),
                            )
                          }
                        />
                      </View>
                    ))}
                  {!data.slots.some(
                    (s) => s.owner_id !== user && +new Date(s.starts_at) > now,
                  ) && (
                    <Text className="text-muted">
                      Todavía no hay horarios disponibles de otros trabajadores.
                    </Text>
                  )}
                </View>
                <Text className="font-display text-xl text-navy">
                  Mis citas y solicitudes
                </Text>
                {!data.bookings.length && (
                  <Text className="text-muted">No tienes citas todavía.</Text>
                )}
                {data.bookings.map((b) => {
                  const s = data.slots.find((s) => s.id === b.slot_id);
                  const active = ["pending", "confirmed"].includes(b.status);
                  const act = (action: string) =>
                    void run(() =>
                      agendaAction("change_service_booking", {
                        p_booking: b.id,
                        p_action: action,
                        p_slot: target || null,
                      }),
                    );
                  return (
                    <View key={b.id} className="gap-3 rounded-2xl bg-white p-4">
                      <Text className="font-medium text-navy">
                        {label(b.slot_id)}
                      </Text>
                      <Text>
                        {status[b.status]} · {b.note}
                      </Text>
                      {b.status === "pending" && s?.owner_id === user && (
                        <PrimaryButton
                          label="Confirmar cita"
                          loading={busy}
                          onPress={() => act("confirm")}
                        />
                      )}
                      {active && (
                        <PrimaryButton
                          label="Cancelar cita"
                          variant="outline"
                          loading={busy}
                          onPress={() => act("cancel")}
                        />
                      )}
                      {b.status === "confirmed" && (
                        <>
                          {s && +new Date(s.ends_at) <= now ? (
                            <PrimaryButton
                              label="Marcar realizada"
                              loading={busy}
                              onPress={() => act("complete")}
                            />
                          ) : (
                            <>
                              <ChoiceChips
                                label="Proponer otro horario"
                                value={target}
                                options={Object.fromEntries(
                                  data.slots
                                    .filter(
                                      (x) =>
                                        x.id !== s?.id &&
                                        x.listing_id === s?.listing_id &&
                                        +new Date(x.starts_at) > now,
                                    )
                                    .map((x) => [x.id, label(x.id)]),
                                )}
                                onChange={T}
                              />
                              <PrimaryButton
                                label="Proponer cambio"
                                disabled={!target}
                                loading={busy}
                                onPress={() => act("reschedule")}
                              />
                            </>
                          )}
                          {!!b.proposed_slot_id && (
                            <>
                              <Text>
                                Cambio propuesto: {label(b.proposed_slot_id)}.
                                La cita original sigue vigente hasta su
                                aceptación.
                              </Text>
                              {b.proposed_by !== user && (
                                <>
                                  <PrimaryButton
                                    label="Aceptar nuevo horario"
                                    loading={busy}
                                    onPress={() => act("accept_reschedule")}
                                  />
                                  <PrimaryButton
                                    label="Mantener horario original"
                                    variant="outline"
                                    loading={busy}
                                    onPress={() => act("reject_reschedule")}
                                  />
                                </>
                              )}
                            </>
                          )}
                        </>
                      )}
                    </View>
                  );
                })}
              </>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
