import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { EmptyState } from '@/components/empty-state';
import { PrimaryButton } from '@/components/primary-button';
import { DEMO_USER_ID } from '@/constants/demo';
import { colors } from '@/constants/theme';
import { useAuth } from '@/features/auth/auth-provider';
import { isSupabaseConfigured } from '@/lib/supabase';
import { fetchRemoteConversation, fetchRemoteMessages, markRemoteMessagesRead, removeRealtimeChannel, respondRemoteOffer, sendRemoteMessage, sendRemoteOffer, subscribeToConversation } from '@/services/social';
import { useAppStore } from '@/stores/app-store';
import type { Offer } from '@/types/domain';
import { formatMoney, getListingAmount } from '@/utils/format';
import { goBackOr } from '@/utils/navigation';

export default function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const localConversation = useAppStore((state) => state.conversations.find((item) => item.id === id));
  const allLocalMessages = useAppStore((state) => state.messages);
  const localMessages = allLocalMessages.filter((item) => item.conversationId === id);
  const localListing = useAppStore((state) => state.listings.find((item) => item.id === localConversation?.listingId));
  const allLocalOffers = useAppStore((state) => state.offers);
  const localOffers = allLocalOffers.filter((item) => item.conversationId === id);
  const remoteConversation = useQuery({ queryKey: ['conversation', id], queryFn: () => fetchRemoteConversation(id), enabled: isSupabaseConfigured && Boolean(id) });
  const remoteMessages = useQuery({ queryKey: ['conversation-messages', id], queryFn: () => fetchRemoteMessages(id), enabled: isSupabaseConfigured && Boolean(id) });
  const conversation = isSupabaseConfigured ? remoteConversation.data?.conversation : localConversation;
  const listing = isSupabaseConfigured ? remoteConversation.data?.listing : localListing;
  const messages = isSupabaseConfigured ? (remoteMessages.data?.messages ?? []) : localMessages;
  const offers = isSupabaseConfigured ? (remoteMessages.data?.offers ?? []) : localOffers;
  const sendMessage = useAppStore((state) => state.sendMessage);
  const sendOffer = useAppStore((state) => state.sendOffer);
  const resolveOffer = useAppStore((state) => state.resolveOffer);
  const [body, setBody] = useState('');
  const [offerVisible, setOfferVisible] = useState(false);
  const [counterParent, setCounterParent] = useState<string>();
  const [amount, setAmount] = useState('');
  const [actionError, setActionError] = useState('');
  const offersById = Object.fromEntries(offers.map((offer) => [offer.id, offer]));

  useEffect(() => {
    if (!isSupabaseConfigured || !id) return;
    const channel = subscribeToConversation(id, () => {
      void queryClient.invalidateQueries({ queryKey: ['conversation-messages', id] });
      void queryClient.invalidateQueries({ queryKey: ['conversations'] });
    });
    return () => { void removeRealtimeChannel(channel); };
  }, [id, queryClient]);

  useEffect(() => {
    if (isSupabaseConfigured && remoteMessages.data) void markRemoteMessagesRead(id).catch(() => undefined);
  }, [id, remoteMessages.data]);

  if (remoteConversation.isLoading || remoteMessages.isLoading) return <SafeAreaView className="flex-1 items-center justify-center bg-canvas"><ActivityIndicator color={colors.red} /><Text className="mt-3 text-muted">Cargando conversación…</Text></SafeAreaView>;
  if (!conversation || !listing || remoteConversation.isError || remoteMessages.isError) return <SafeAreaView edges={['top']} className="flex-1 bg-canvas"><View className="px-4 py-3"><Pressable onPress={() => goBackOr('/(tabs)/messages')} className="h-10 w-10 items-center justify-center"><Ionicons name="arrow-back" size={24} color={colors.navy} /></Pressable></View><EmptyState icon="chatbubble-ellipses-outline" title="Conversación no disponible" description="No pudimos encontrar esta conversación." /></SafeAreaView>;
  const submitText = async () => { const value = body.trim(); if (!value) return; try { if (isSupabaseConfigured) { await sendRemoteMessage(id, value); await queryClient.invalidateQueries({ queryKey: ['conversation-messages', id] }); } else sendMessage(id, value); setBody(''); } catch (error) { setActionError(error instanceof Error ? error.message : 'No se pudo enviar el mensaje.'); } };
  const openOffer = (parent?: Offer) => { setCounterParent(parent?.id); setAmount(parent ? String(Math.round(parent.amount * 1.05)) : String(getListingAmount(listing.price, listing.budget) ?? '')); setOfferVisible(true); };
  const submitOffer = async () => { const value = Number(amount.replace(',', '.')); if (!Number.isFinite(value) || value <= 0) return setActionError('Ingresa un monto válido para la oferta.'); try { if (isSupabaseConfigured) { await sendRemoteOffer(id, value, counterParent); await queryClient.invalidateQueries({ queryKey: ['conversation-messages', id] }); } else sendOffer(id, listing.id, value, counterParent); setOfferVisible(false); setCounterParent(undefined); } catch (error) { setActionError(error instanceof Error ? error.message : 'No se pudo enviar la oferta.'); } };
  const resolve = async (offer: Offer, action: 'accepted' | 'rejected') => { try { if (isSupabaseConfigured) { await respondRemoteOffer(offer.id, action === 'accepted' ? 'accept' : 'reject'); await queryClient.invalidateQueries({ queryKey: ['conversation-messages', id] }); } else resolveOffer(offer.id, action); } catch (error) { setActionError(error instanceof Error ? error.message : 'La oferta ya no puede modificarse.'); } };

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-canvas">
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={0}>
        <View className="flex-row items-center border-b border-line bg-white px-4 py-3">
          <Pressable onPress={() => goBackOr('/(tabs)/messages')} className="mr-3 h-10 w-10 items-center justify-center"><Ionicons name="arrow-back" size={24} color={colors.navy} /></Pressable>
          <Avatar uri={conversation.participantAvatar} name={conversation.participantName} size={43} />
          <View className="ml-3 flex-1"><Text className="font-display text-lg text-navy">{conversation.participantName}</Text><Text className="font-sans text-[11px] text-success">Activo recientemente</Text></View>
          <Pressable onPress={() => Alert.alert('Conversación', undefined, [{ text: 'Ver publicación', onPress: () => router.push({ pathname: '/listing/[id]', params: { id: listing.id } }) }, { text: 'Cancelar', style: 'cancel' }])} className="h-10 w-10 items-center justify-center" accessibilityLabel="Opciones de conversación"><Ionicons name="ellipsis-vertical" size={22} color={colors.navy} /></Pressable>
        </View>
        <Pressable onPress={() => router.push({ pathname: '/listing/[id]', params: { id: listing.id } })} className="mx-4 mt-3 flex-row items-center rounded-2xl border border-line bg-white p-3">
          <View className="h-11 w-11 items-center justify-center rounded-xl bg-red-50"><Ionicons name="pricetag-outline" size={21} color={colors.red} /></View>
          <View className="ml-3 flex-1"><Text className="font-medium text-sm text-ink" numberOfLines={1}>{listing.title}</Text><Text className="mt-1 font-display text-base text-brand">{formatMoney(getListingAmount(listing.price, listing.budget))}</Text></View>
          <Ionicons name="chevron-forward" size={19} color={colors.muted} />
        </Pressable>
        <ScrollView className="flex-1" contentContainerClassName="gap-3 px-4 py-5" keyboardShouldPersistTaps="handled">
          {messages.map((message) => {
            const mine = message.senderId === (session?.user.id ?? DEMO_USER_ID);
            if (message.messageType === 'system') return <View key={message.id} className="my-2 items-center"><View className={`items-center rounded-2xl px-5 py-3 ${message.body === 'Trato Aceptado' ? 'bg-green-100' : 'bg-slate-200'}`}><View className="flex-row items-center"><Ionicons name={message.body === 'Trato Aceptado' ? 'checkmark-circle' : 'information-circle'} size={22} color={message.body === 'Trato Aceptado' ? colors.success : colors.navy} /><Text className={`ml-2 font-display text-lg ${message.body === 'Trato Aceptado' ? 'text-success' : 'text-navy'}`}>{message.body}</Text></View>{message.body === 'Trato Aceptado' && <Pressable onPress={() => router.push({ pathname: '/review/[conversationId]', params: { conversationId: id } })} className="mt-2 rounded-full bg-success px-4 py-2"><Text className="font-medium text-xs text-white">Finalizar y calificar</Text></Pressable>}</View></View>;
            if (message.messageType === 'offer' && message.offerId) {
              const offer = offersById[message.offerId];
              return offer ? <OfferBubble key={message.id} offer={offer} mine={mine} onAccept={() => void resolve(offer, 'accepted')} onReject={() => void resolve(offer, 'rejected')} onCounter={() => openOffer(offer)} /> : null;
            }
            return <View key={message.id} className={`max-w-[82%] rounded-2xl px-4 py-3 ${mine ? 'self-end rounded-br-sm bg-navy' : 'self-start rounded-bl-sm bg-white'}`}><Text className={`font-sans text-[15px] leading-5 ${mine ? 'text-white' : 'text-ink'}`}>{message.body}</Text><Text className={`mt-1 self-end font-sans text-[9px] ${mine ? 'text-white/60' : 'text-muted'}`}>{format(new Date(message.createdAt), 'HH:mm')}</Text></View>;
          })}
        </ScrollView>
        {Boolean(actionError) && <Pressable onPress={() => setActionError('')} className="mx-4 mb-2 rounded-xl bg-red-50 p-3"><Text className="text-center text-xs text-brand">{actionError}</Text></Pressable>}
        <View className="flex-row items-end gap-2 border-t border-line bg-white px-3 py-3">
          <Pressable onPress={() => openOffer()} className="h-11 w-11 items-center justify-center rounded-full bg-red-50" accessibilityLabel="Hacer oferta"><Ionicons name="pricetag" size={21} color={colors.red} /></Pressable>
          <View className="min-h-11 flex-1 flex-row items-center rounded-2xl bg-canvas px-4"><TextInput value={body} onChangeText={setBody} placeholder="Escribe un mensaje..." placeholderTextColor={colors.muted} multiline className="max-h-24 flex-1 py-3 font-sans text-[15px] text-ink" /></View>
          <Pressable disabled={!body.trim()} onPress={() => void submitText()} className={`h-11 w-11 items-center justify-center rounded-full bg-brand ${body.trim() ? '' : 'opacity-40'}`} accessibilityLabel="Enviar mensaje"><Ionicons name="send" size={19} color="white" /></Pressable>
        </View>
      </KeyboardAvoidingView>
      <Modal visible={offerVisible} transparent animationType="slide" onRequestClose={() => setOfferVisible(false)}>
        <Pressable className="flex-1 justify-end bg-black/40" onPress={() => setOfferVisible(false)}><Pressable className="rounded-t-[32px] bg-white p-6 pb-10" onPress={(event) => event.stopPropagation()}><View className="mb-5 h-1 w-12 self-center rounded-full bg-line" /><Text className="font-display text-2xl text-navy">{counterParent ? 'Enviar contraoferta' : 'Hacer una oferta'}</Text><Text className="mt-2 font-sans text-sm text-muted">Propón un monto para llegar a un acuerdo.</Text><View className="my-6 flex-row items-center rounded-2xl border border-line px-4"><Text className="font-display text-2xl text-brand">S/</Text><TextInput value={amount} onChangeText={setAmount} keyboardType="decimal-pad" className="ml-3 h-16 flex-1 font-display text-3xl text-ink" /></View><PrimaryButton label={counterParent ? 'Enviar contraoferta' : 'Enviar oferta'} onPress={() => void submitOffer()} /></Pressable></Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function OfferBubble({ offer, mine, onAccept, onReject, onCounter }: { offer: Offer; mine: boolean; onAccept: () => void; onReject: () => void; onCounter: () => void }) {
  const status = { pending: 'Pendiente', accepted: 'Aceptada', rejected: 'Rechazada', countered: 'Contraofertada', cancelled: 'Cancelada' }[offer.status];
  return (
    <View className={`w-[86%] rounded-2xl border bg-white p-4 ${mine ? 'self-end border-navy' : 'self-start border-brand'}`}>
      <View className="flex-row items-center justify-between"><View className="flex-row items-center"><Ionicons name="pricetag" size={18} color={colors.red} /><Text className="ml-2 font-medium text-xs uppercase text-brand">{mine ? 'Tu oferta' : 'Oferta recibida'}</Text></View><Text className="font-medium text-[10px] text-muted">{status}</Text></View>
      <Text className="my-3 font-display text-3xl text-navy">{formatMoney(offer.amount)}</Text>
      {offer.status === 'pending' && !mine && <View className="gap-2"><View className="flex-row gap-2"><Pressable onPress={onReject} className="flex-1 items-center rounded-xl border border-line py-2.5"><Text className="font-medium text-xs text-brand">Rechazar</Text></Pressable><Pressable onPress={onAccept} className="flex-1 items-center rounded-xl bg-success py-2.5"><Text className="font-medium text-xs text-white">Aceptar</Text></Pressable></View><Pressable onPress={onCounter} className="items-center rounded-xl bg-navy py-2.5"><Text className="font-medium text-xs text-white">Contraofertar</Text></Pressable></View>}
    </View>
  );
}
