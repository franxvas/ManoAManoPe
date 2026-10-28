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
      <ScreenHeader title="Confirmar servicio" showBack />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="p-5 pb-10 gap-4"
        >
          <Text className="font-sans text-sm text-muted">
            El cliente genera el código después de recibir el servicio y se lo
            muestra al trabajador. No lo envíes antes. El código confirma la
            finalización, nunca un pago.
          </Text>
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
                    ? "Servicio confirmado"
                    : state.data.status === "not_requested"
                      ? "Pendiente de solicitud"
                      : "Confirmación pendiente"}
                </Text>
                {state.data.status === "confirmed" ? (
                  <>
                    <Text className="text-success">
                      La operación se completó correctamente.
                    </Text>
                    <PrimaryButton
                      label="Escribir reseña"
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
                        label="Solicitar confirmación al cliente"
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
                          className="h-14 rounded-xl border border-line px-4 text-xl text-ink"
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
                        El trabajador todavía no solicitó confirmar la
                        finalización.
                      </Text>
                    ) : (
                      <>
                        <PrimaryButton
                          label={
                            issued
                              ? "Generar otro código"
                              : "Recibí el servicio y generar código"
                          }
                          loading={busy}
                          onPress={() => void run("issue")}
                        />
                        {issued && (
                          <>
                            <Text
                              selectable
                              className="text-center font-display text-3xl text-brand"
                            >
                              {issued.code}
                            </Text>
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
