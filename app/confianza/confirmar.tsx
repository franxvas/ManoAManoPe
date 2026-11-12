import { Ionicons } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, router } from "expo-router";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenHeader } from "@/components/screen-header";
import { PrimaryButton } from "@/components/primary-button";
import { colors } from "@/constants/theme";
import { ConfirmationState, trustRpc } from "@/features/confianza/api";
import { isSupabaseConfigured } from "@/lib/supabase";
export default function ConfirmationScreen() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const cache = useQueryClient();
  const lock = useRef(false);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [code, setCode] = useState(""),
    [issued, setIssued] = useState<{ code: string; expires_at: string }>();
  const state = useQuery({
    queryKey: ["service-confirmation", conversationId],
    queryFn: () =>
      trustRpc<ConfirmationState>("get_service_confirmation", {
        p_conversation_id: conversationId,
      }),
    enabled: isSupabaseConfigured && Boolean(conversationId),
    refetchInterval: 15000,
  });
  const product = state.data?.kind === "product";
  const what = product ? "el producto" : "el servicio";
  const step = !state.data || state.data.status === "not_requested" ? 1 : state.data.status === "confirmed" ? 3 : 2;
  const hint =
    state.data?.role === "worker"
      ? step === 1
        ? `Cuando entregues ${what}, pide la confirmación al cliente.`
        : "Pídele al cliente el código de 6 dígitos que le aparece en su pantalla y escríbelo aquí."
      : step === 1
        ? `Cuando ${product ? "te entreguen el producto" : "terminen el servicio"}, el vendedor te pedirá confirmar. Aquí aparecerá el botón para generar tu código.`
        : `Genera el código solo cuando ya tengas ${what} y muéstraselo en persona. El código confirma la entrega, nunca un pago.`;
  async function run(action: string) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      if (action === "issue") {
        setIssued(undefined);
        setIssued(
          await trustRpc("issue_service_code", {
            p_conversation_id: conversationId,
          }),
        );
      } else if (action === "request")
        await trustRpc("request_service_completion", {
          p_conversation_id: conversationId,
        });
      else {
        const result = await trustRpc<{
          ok: boolean;
          reason?: string;
          remaining?: number;
        }>("validate_service_code", {
          p_conversation_id: conversationId,
          p_code: code,
        });
        if (!result.ok)
          throw new Error(
            result.reason === "expired"
              ? "El código venció. El cliente debe generar otro."
              : result.reason === "incorrect"
                ? `Código incorrecto. Quedan ${result.remaining} intentos.`
                : "El código no está disponible o ya se utilizó. Actualiza el estado.",
          );
        setCode("");
      }
      await cache.invalidateQueries({
        queryKey: ["service-confirmation", conversationId],
      });
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No se pudo completar la acción.",
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-canvas">
      <ScreenHeader title={product ? "Confirmar entrega" : "Confirmar servicio"} showBack />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="p-5 pb-10 gap-4"
        >
          {state.data && <Steps current={step} product={product} />}
          {state.data && step < 3 && (
            <View className="flex-row gap-3 rounded-2xl bg-red-50 p-4">
              <Ionicons name="information-circle-outline" size={22} color={colors.red} />
              <Text className="flex-1 font-sans text-sm leading-5 text-ink">{hint}</Text>
            </View>
          )}
          {!isSupabaseConfigured ? (
            <Text className="text-ink">
              Conecta Supabase para utilizar confirmaciones reales. No hay
              simulación de códigos.
            </Text>
          ) : state.isLoading ? (
            <ActivityIndicator color={colors.red} />
          ) : state.isError ? (
            <>
              <Text accessibilityRole="alert" className="text-brand">
                {state.error.message}
              </Text>
              <PrimaryButton
                label="Reintentar"
                onPress={() => void state.refetch()}
              />
            </>
          ) : (
            state.data && (
              <View className="gap-4 rounded-2xl bg-white p-5">
                <Text className="font-medium text-navy">
                  {state.data.status === "confirmed"
                    ? product ? "Entrega confirmada" : "Servicio confirmado"
                    : state.data.status === "not_requested"
                      ? "Esperando la solicitud de confirmación"
                      : state.data.role === "worker" ? "Esperando el código del cliente" : "Genera tu código"}
                </Text>
                {state.data.status === "confirmed" ? (
                  <>
                    <Text className="text-success">
                      ¡Listo! Ahora califica {product ? "el producto" : "el servicio"} con estrellas y deja tu reseña.
                    </Text>
                    <PrimaryButton
                      label="Calificar y reseñar"
                      onPress={() =>
                        router.push({
                          pathname: "/review/[conversationId]",
                          params: { conversationId },
                        })
                      }
                    />
                  </>
                ) : state.data.role === "worker" ? (
                  <>
                    {state.data.status === "not_requested" ? (
                      <PrimaryButton
                        label={product ? "Ya entregué, pedir confirmación" : "Terminé, pedir confirmación"}
                        loading={busy}
                        onPress={() => void run("request")}
                      />
                    ) : (
                      <>
                        <TextInput
                          accessibilityLabel="Código de seis dígitos"
                          value={code}
                          onChangeText={(v) => setCode(v.replace(/\D/g, ""))}
                          keyboardType="number-pad"
                          maxLength={6}
                          placeholder="000000"
                          placeholderTextColor={colors.muted}
                          className="h-16 rounded-xl border border-line px-4 text-center font-display text-3xl tracking-widest text-ink"
                        />
                        <PrimaryButton
                          label="Confirmar con código"
                          loading={busy}
                          disabled={code.length !== 6}
                          onPress={() => void run("validate")}
                        />
                      </>
                    )}
                  </>
                ) : (
                  <>
                    {state.data.status === "not_requested" ? (
                      <Text className="text-muted">
                        Todavía no te pidieron confirmar. Vuelve aquí cuando
                        tengas {what}.
                      </Text>
                    ) : (
                      <>
                        <PrimaryButton
                          label={
                            issued
                              ? "Generar otro código"
                              : product ? "Recibí el producto, generar código" : "Recibí el servicio, generar código"
                          }
                          loading={busy}
                          onPress={() => void run("issue")}
                        />
                        {issued && (
                          <>
                            <View className="items-center rounded-2xl border-2 border-dashed border-brand bg-red-50 py-5">
                              <Text className="font-sans text-xs text-muted">Muestra este código al vendedor</Text>
                              <Text
                                selectable
                                className="mt-1 font-display text-5xl tracking-widest text-brand"
                              >
                                {issued.code}
                              </Text>
                            </View>
                            <Text className="text-muted">
                              Vence a las{" "}
                              {new Date(issued.expires_at).toLocaleTimeString(
                                "es-PE",
                              )}
                              . Al generar otro se invalida el anterior. El
                              código solo se muestra ahora; si sales, genera uno
                              nuevo.
                            </Text>
                          </>
                        )}
                      </>
                    )}
                  </>
                )}
              </View>
            )
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

// Los tres pasos: pedir confirmación, código y reseña.
function Steps({ current, product }: { current: number; product: boolean }) {
  const steps = [product ? "Entrega" : "Servicio", "Código", "Reseña"];
  return (
    <View className="flex-row items-center rounded-2xl bg-white p-4">
      {steps.map((label, i) => {
        const n = i + 1, done = n < current, on = n === current;
        return (
          <View key={label} className="flex-1 flex-row items-center">
            <View className="items-center">
              <View className={`h-9 w-9 items-center justify-center rounded-full ${done ? "bg-success" : on ? "bg-brand" : "bg-line"}`}>
                {done ? <Ionicons name="checkmark" size={18} color="white" /> : <Text className={`font-medium ${on ? "text-white" : "text-muted"}`}>{n}</Text>}
              </View>
              <Text className={`mt-1 text-xs ${on ? "font-medium text-ink" : "text-muted"}`}>{label}</Text>
            </View>
            {i < steps.length - 1 && <View className={`mx-2 mb-4 h-0.5 flex-1 ${done ? "bg-success" : "bg-line"}`} />}
          </View>
        );
      })}
    </View>
  );
}
