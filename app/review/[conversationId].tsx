import { Ionicons } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PrimaryButton } from "@/components/primary-button";
import { ScreenHeader } from "@/components/screen-header";
import { colors } from "@/constants/theme";
import { isSupabaseConfigured } from "@/lib/supabase";
import { trustRpc } from "@/features/confianza/api";
import { submitRemoteReview } from "@/services/social";
export default function ReviewScreen() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const cache = useQueryClient();
  const lock = useRef(false);
  const [rating, setRating] = useState(0),
    [comment, setComment] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [done, setDone] = useState(false);
  const context = useQuery({
    queryKey: ["review-context", conversationId],
    queryFn: () =>
      trustRpc<{ completed: boolean; reviewed: boolean }>(
        "get_review_context",
        { p_conversation_id: conversationId },
      ),
    enabled: isSupabaseConfigured && Boolean(conversationId),
  });
  async function submit() {
    if (lock.current) return;
    setError("");
    if (!rating) {
      setError("Elige una calificación de una a cinco estrellas.");
      return;
    }
    if (!context.data?.completed || context.data.reviewed) return;
    lock.current = true;
    setBusy(true);
    try {
      await submitRemoteReview(conversationId, rating, comment.trim());
      setDone(true);
      await Promise.all(
        [
          "review-context",
          "public-reviews",
          "trust-summary",
          "public-profile",
          "profile",
          "listings",
        ].map((key) => cache.invalidateQueries({ queryKey: [key] })),
      );
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "No se pudo publicar. Puedes reintentar sin duplicar la reseña.",
      );
      await context.refetch();
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-canvas">
      <ScreenHeader title="Reseña del trato" showBack />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="p-5 gap-4 pb-12"
        >
          {!isSupabaseConfigured ? (
            <Text className="text-muted">
              Las reseñas reales requieren una operación completada en Supabase.
              No se publican opiniones ficticias en modo demo.
            </Text>
          ) : context.isLoading ? (
            <ActivityIndicator color={colors.red} />
          ) : context.isError ? (
            <>
              <Text accessibilityRole="alert" className="text-brand">
                {context.error.message}
              </Text>
              <PrimaryButton
                label="Reintentar"
                onPress={() => void context.refetch()}
              />
            </>
          ) : done || context.data?.reviewed ? (
            <Text className="text-success">
              Tu reseña ya fue registrada. Las reseñas no se editan ni se
              duplican.
            </Text>
          ) : !context.data?.completed ? (
            <Text className="text-muted">
              Primero debe completarse la operación. En servicios, ambas partes
              deben confirmar la finalización con código.
            </Text>
          ) : (
            <View className="rounded-2xl bg-white p-4 gap-4">
              <Text className="font-display text-xl text-navy">
                ¿Cómo fue tu experiencia?
              </Text>
              <Text className="text-sm text-muted">
                Califica el trato realizado. No incluyas teléfonos, direcciones
                ni información privada. Una vez publicada no podrás editarla.
              </Text>
              <View className="flex-row justify-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Pressable
                    key={star}
                    accessibilityRole="button"
                    accessibilityLabel={`${star} estrellas`}
                    accessibilityState={{ selected: rating === star }}
                    disabled={busy}
                    onPress={() => setRating(star)}
                    className="h-12 w-12 items-center justify-center"
                  >
                    <Ionicons
                      name={star <= rating ? "star" : "star-outline"}
                      size={32}
                      color={colors.rating}
                    />
                  </Pressable>
                ))}
              </View>
              <TextInput
                accessibilityLabel="Comentario de la reseña"
                value={comment}
                onChangeText={setComment}
                editable={!busy}
                multiline
                maxLength={1000}
                placeholder="Comentario opcional"
                textAlignVertical="top"
                className="min-h-32 rounded-xl border border-line p-4 text-ink"
              />
              <Text className="text-xs text-muted">{comment.length}/1000</Text>
              <PrimaryButton
                label="Publicar reseña"
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
