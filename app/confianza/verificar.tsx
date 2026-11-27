import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import { ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PrimaryButton } from "@/components/primary-button";
import { ScreenHeader } from "@/components/screen-header";
import { useAuth } from "@/features/auth/auth-provider";
import { supabase } from "@/lib/supabase";

export default function VerifyIdentityScreen() {
  const { session } = useAuth();
  const cache = useQueryClient();
  const [dni, setDni] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const verify = async () => {
    if (!/^\d{8}$/.test(dni)) return setError("El DNI debe tener 8 dígitos.");
    if (!supabase || !session)
      return setError("Necesitas iniciar sesión con una cuenta real.");
    setBusy(true);
    setError("");
    const { data, error: fnError } = await supabase.functions.invoke(
      "verify-dni",
      { body: { dni } },
    );
    setBusy(false);
    if (fnError || !data?.verified) {
      let message = "No pudimos verificar tu identidad.";
      try {
        const body = await (fnError as { context?: Response })?.context?.json();
        if (body?.error) message = body.error;
      } catch {}
      return setError(message);
    }
    setDone(true);
    void cache.invalidateQueries({ queryKey: ["trust-summary"] });
  };

  return (
    <SafeAreaView className="flex-1 bg-canvas">
      <ScreenHeader title="Verificar identidad" showBack backFallback="/(tabs)/profile" />
      <ScrollView contentContainerClassName="gap-4 p-5">
        {done ? (
          <View className="gap-3 rounded-2xl bg-green-50 p-5">
            <Text className="font-display text-xl text-success">
              ¡Identidad verificada!
            </Text>
            <Text className="text-ink">
              Tu perfil ahora muestra la insignia "Identidad verificada" y ya no
              tienes límite diario de publicaciones.
            </Text>
            <PrimaryButton label="Volver" onPress={() => router.back()} />
          </View>
        ) : (
          <>
            <Text className="text-ink">
              Consultamos tu DNI en RENIEC y comprobamos que coincida con el
              nombre de tu perfil. No guardamos tu número de DNI: solo que tu
              cuenta fue verificada.
            </Text>
            <TextInput
              value={dni}
              onChangeText={(t) => setDni(t.replace(/\D/g, "").slice(0, 8))}
              placeholder="Número de DNI (8 dígitos)"
              keyboardType="number-pad"
              maxLength={8}
              className="rounded-xl border border-line bg-white px-4 py-3 text-lg text-ink"
            />
            {Boolean(error) && (
              <Text accessibilityRole="alert" className="text-brand">
                {error}
              </Text>
            )}
            <PrimaryButton
              label={busy ? "Verificando…" : "Verificar"}
              disabled={busy}
              onPress={() => void verify()}
            />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
