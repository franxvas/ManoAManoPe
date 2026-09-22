import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/primary-button';
import { ScreenHeader } from '@/components/screen-header';
import { colors } from '@/constants/theme';
import { isSupabaseConfigured } from '@/lib/supabase';
import { submitRemoteReview } from '@/services/social';
import { useAppStore } from '@/stores/app-store';

export default function ReviewScreen() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const submitLocalReview = useAppStore((state) => state.submitReview);
  const reviewed = useAppStore((state) => state.reviewedConversations.includes(conversationId));
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const submit = async () => {
    setLoading(true); setError('');
    try {
      if (isSupabaseConfigured) await submitRemoteReview(conversationId, rating, comment.trim());
      else submitLocalReview(conversationId, rating);
      router.replace('/(tabs)/messages');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo guardar la reseña.'); }
    finally { setLoading(false); }
  };
  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-canvas">
      <ScreenHeader title="Calificar trato" showBack />
      <View className="m-5 rounded-3xl bg-white p-6">
        {reviewed && !isSupabaseConfigured ? <Text className="text-center font-medium text-success">Ya calificaste este trato.</Text> : <>
          <Text className="text-center font-display text-2xl text-navy">¿Cómo fue tu experiencia?</Text><Text className="mt-2 text-center font-sans text-sm text-muted">Tu reseña ayuda a construir una comunidad confiable.</Text>
          <View className="my-8 flex-row justify-center gap-2">{[1, 2, 3, 4, 5].map((star) => <Pressable key={star} onPress={() => setRating(star)} className="p-1" accessibilityLabel={`${star} estrellas`}><Ionicons name={star <= rating ? 'star' : 'star-outline'} size={38} color={colors.rating} /></Pressable>)}</View>
          <TextInput value={comment} onChangeText={setComment} multiline maxLength={1000} placeholder="Cuéntanos más (opcional)" placeholderTextColor={colors.muted} className="mb-5 min-h-32 rounded-2xl border border-line p-4 font-sans text-ink" textAlignVertical="top" />
          {Boolean(error) && <Text className="mb-4 text-sm text-brand">{error}</Text>}<PrimaryButton label="Publicar reseña" loading={loading} onPress={() => void submit()} />
        </>}
      </View>
    </SafeAreaView>
  );
}
