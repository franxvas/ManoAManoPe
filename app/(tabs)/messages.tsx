import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { EmptyState } from '@/components/empty-state';
import { colors } from '@/constants/theme';
import { useAuth } from '@/features/auth/auth-provider';
import { PrimaryButton } from '@/components/primary-button';
import { isSupabaseConfigured } from '@/lib/supabase';
import { fetchRemoteConversations, removeRealtimeChannel, subscribeToConversationList } from '@/services/social';
import { useAppStore } from '@/stores/app-store';
import { formatRelativeDate } from '@/utils/format';

const statusLabels = { chatting: 'Conversando', negotiating: 'Negociando', offer_sent: 'Oferta enviada', waiting: 'En espera', accepted: 'Trato aceptado' } as const;

export default function MessagesScreen() {
  const localConversations = useAppStore((state) => state.conversations);
  const queryClient = useQueryClient();
  const { session, isAuthenticated } = useAuth();
  const remote = useQuery({ queryKey: ['conversations'], queryFn: fetchRemoteConversations, enabled: isSupabaseConfigured && Boolean(session), refetchInterval: 30_000 });
  const conversations = [...(isSupabaseConfigured ? (remote.data ?? []) : localConversations)].sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt));
  useEffect(() => {
    if (!isSupabaseConfigured || !session) return;
    const channel = subscribeToConversationList(() => void queryClient.invalidateQueries({ queryKey: ['conversations'] }));
    return () => { void removeRealtimeChannel(channel); };
  }, [queryClient, session]);
  if (!isAuthenticated) return <SafeAreaView className="flex-1 justify-center bg-canvas px-6"><EmptyState icon="chatbubbles-outline" title="Inicia sesión para conversar" description="Tus mensajes y ofertas aparecerán aquí cuando ingreses a tu cuenta." /><PrimaryButton label="Iniciar sesión" onPress={() => router.push({ pathname: '/(auth)/login', params: { returnTo: '/(tabs)/messages' } })} /></SafeAreaView>;
  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-canvas">
      <View className="bg-white px-5 pb-5 pt-3">
        <Text className="font-display text-3xl text-navy">Tus Conversaciones</Text>
        <Text className="mt-1 font-sans text-sm text-muted">Negocia y mantén tus tratos en orden</Text>
      </View>
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        contentContainerClassName="p-5 pb-28"
        ListEmptyComponent={<EmptyState icon="chatbubbles-outline" title="Aún no tienes conversaciones" description="Contacta a alguien desde una publicación para empezar." />}
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push({ pathname: '/conversation/[id]', params: { id: item.id } })} className="mb-3 flex-row items-center rounded-2xl border border-line bg-white p-4">
            <Avatar uri={item.participantAvatar} name={item.participantName} size={54} />
            <View className="ml-3 flex-1">
              <View className="flex-row items-center justify-between"><Text className="flex-1 font-display text-lg text-ink" numberOfLines={1}>{item.participantName}</Text><Text className="ml-2 font-sans text-[10px] text-muted">{formatRelativeDate(item.lastMessageAt)}</Text></View>
              <Text className="mt-1 font-sans text-sm text-muted" numberOfLines={1}>{item.lastMessage}</Text>
              <View className="mt-2 flex-row items-center"><View className={`h-2 w-2 rounded-full ${item.status === 'accepted' ? 'bg-success' : item.status === 'negotiating' || item.status === 'offer_sent' ? 'bg-brand' : 'bg-navy'}`} /><Text className="ml-1.5 font-medium text-[11px] text-navy">{statusLabels[item.status]}</Text></View>
            </View>
            {item.unreadCount > 0 && <View className="ml-2 min-w-6 items-center rounded-full bg-brand px-1.5 py-1"><Text className="font-medium text-[10px] text-white">{item.unreadCount}</Text></View>}
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}
