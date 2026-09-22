import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, ScrollView, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { EmptyState } from '@/components/empty-state';
import { PrimaryButton } from '@/components/primary-button';
import { colors, listingLabels } from '@/constants/theme';
import { useProtectedAction } from '@/hooks/use-protected-action';
import { useFavorites } from '@/hooks/use-favorites';
import { isSupabaseConfigured } from '@/lib/supabase';
import { fetchListing } from '@/services/listings';
import { openRemoteConversation, sendRemoteOffer } from '@/services/social';
import { useAppStore } from '@/stores/app-store';
import { formatMoney, getListingAmount } from '@/utils/format';

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width } = useWindowDimensions();
  const localListing = useAppStore((state) => state.listings.find((item) => item.id === id));
  const remote = useQuery({ queryKey: ['listing', id], queryFn: () => fetchListing(id), enabled: isSupabaseConfigured && Boolean(id) });
  const listing = isSupabaseConfigured ? remote.data : localListing;
  const { favorites, toggleFavorite } = useFavorites();
  const openConversation = useAppStore((state) => state.openConversation);
  const sendOffer = useAppStore((state) => state.sendOffer);
  const protect = useProtectedAction();
  const [offerVisible, setOfferVisible] = useState(false);
  const [offerAmount, setOfferAmount] = useState('');
  const [actionError, setActionError] = useState('');
  const favorite = listing ? favorites.includes(listing.id) : false;
  const amount = useMemo(() => listing ? getListingAmount(listing.price, listing.budget) : undefined, [listing]);

  if (!listing) {
    return <SafeAreaView className="flex-1 bg-canvas"><View className="px-5 pt-3"><Pressable onPress={() => router.back()}><Ionicons name="arrow-back" size={25} color={colors.navy} /></Pressable></View><EmptyState title="Publicación no disponible" description="Pudo ser pausada, finalizada o eliminada por su autor." /></SafeAreaView>;
  }

  const contact = () => protect(async () => {
    try {
      const conversationId = isSupabaseConfigured ? await openRemoteConversation(listing.id) : openConversation(listing).id;
      router.push({ pathname: '/conversation/[id]', params: { id: conversationId } });
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'No se pudo abrir la conversación.');
    }
  }, `/listing/${listing.id}`);
  const submitOffer = async () => {
    const parsed = Number(offerAmount.replace(',', '.'));
    if (!Number.isFinite(parsed) || parsed <= 0) return;
    try {
      const conversationId = isSupabaseConfigured ? await openRemoteConversation(listing.id) : openConversation(listing).id;
      if (isSupabaseConfigured) await sendRemoteOffer(conversationId, parsed);
      else sendOffer(conversationId, listing.id, parsed);
      setOfferVisible(false);
      router.push({ pathname: '/conversation/[id]', params: { id: conversationId } });
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'No se pudo enviar la oferta.');
    }
  };

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-white">
      <View className="absolute left-4 right-4 top-14 z-10 flex-row justify-between">
        <Pressable onPress={() => router.back()} className="h-11 w-11 items-center justify-center rounded-full bg-white/95 shadow"><Ionicons name="arrow-back" size={24} color={colors.navy} /></Pressable>
        <Pressable onPress={() => protect(() => { void toggleFavorite(listing.id); }, `/listing/${listing.id}`)} className="h-11 w-11 items-center justify-center rounded-full bg-white/95 shadow"><Ionicons name={favorite ? 'heart' : 'heart-outline'} size={24} color={colors.red} /></Pressable>
      </View>
      <ScrollView contentContainerClassName="pb-32" showsVerticalScrollIndicator={false}>
        <FlatList horizontal pagingEnabled data={listing.images.length ? listing.images : ['']} keyExtractor={(_, index) => String(index)} renderItem={({ item }) => item ? <Image source={{ uri: item }} style={{ width, height: 330 }} contentFit="cover" /> : <View style={{ width, height: 330 }} className="bg-slate-200" />} showsHorizontalScrollIndicator={false} />
        <View className="px-5 py-5">
          <View className="self-start rounded-full bg-navy px-3 py-1.5"><Text className="font-medium text-[10px] uppercase text-white">{listingLabels[listing.type]}</Text></View>
          <Text className="mt-3 font-display text-3xl leading-9 text-navy">{listing.title}</Text>
          <View className="mt-2 flex-row items-baseline"><Text className="font-display text-3xl text-brand">{formatMoney(amount)}</Text>{listing.originalPrice && <Text className="ml-2 font-sans text-base text-muted line-through">{formatMoney(listing.originalPrice)}</Text>}{listing.negotiable && <Text className="ml-3 rounded-full bg-red-50 px-2 py-1 font-medium text-[10px] text-brand">NEGOCIABLE</Text>}</View>
          <View className="mt-4 flex-row items-center"><Ionicons name="star" size={17} color={colors.rating} /><Text className="ml-1 font-medium text-sm text-ink">{listing.rating.toFixed(1)}</Text><Ionicons name="location-outline" size={17} color={colors.muted} style={{ marginLeft: 16 }} /><Text className="ml-1 flex-1 font-sans text-sm text-muted">{listing.city} · {listing.address}</Text></View>
          <View className="my-6 h-px bg-line" />
          <Text className="font-display text-xl text-navy">Descripción</Text><Text className="mt-3 font-sans text-[15px] leading-6 text-ink">{listing.description}</Text>
          <View className="mt-6 rounded-2xl bg-canvas p-4"><Text className="mb-3 font-display text-lg text-navy">Información</Text>{listing.condition && <Info icon="sparkles-outline" text={`Condición: ${listing.condition}`} />}{listing.serviceArea && <Info icon="map-outline" text={`Zona de atención: ${listing.serviceArea}`} />}{listing.availability && <Info icon="time-outline" text={`Disponibilidad: ${listing.availability}`} />}{listing.homeService && <Info icon="home-outline" text="Atención a domicilio" />}{listing.shippingAvailable && <Info icon="cube-outline" text="Envío disponible" />}</View>
          <View className="mt-5 rounded-2xl border border-line p-4"><Text className="mb-4 font-display text-xl text-navy">Publicado por</Text><View className="flex-row items-center"><Avatar uri={listing.ownerAvatar} name={listing.ownerName} size={58} /><View className="ml-3 flex-1"><View className="flex-row items-center"><Text className="font-display text-lg text-ink">{listing.ownerName}</Text>{listing.ownerVerified && <Ionicons name="checkmark-circle" size={17} color={colors.navy} style={{ marginLeft: 5 }} />}</View><Text className="mt-1 font-sans text-xs text-muted">{listing.ownerProfession}</Text><Text className="mt-1 font-medium text-xs text-ink">★ {listing.rating.toFixed(1)}</Text></View><Ionicons name="chevron-forward" size={20} color={colors.muted} /></View></View>
          <View className="mt-5 h-36 items-center justify-center rounded-2xl bg-blue-50"><Ionicons name="map" size={34} color={colors.navy} /><Text className="mt-2 font-medium text-sm text-navy">{listing.city}, {listing.region}</Text><Text className="mt-1 font-sans text-xs text-muted">Ubicación aproximada por seguridad</Text></View>
        </View>
      </ScrollView>
      {actionError && <Pressable onPress={() => setActionError('')} className="absolute bottom-24 left-5 right-5 z-20 rounded-xl bg-red-50 p-3"><Text className="text-center text-sm text-brand">{actionError}</Text></Pressable>}
      <View className="absolute bottom-0 left-0 right-0 flex-row gap-2 border-t border-line bg-white px-4 pb-7 pt-3">
        <Pressable onPress={() => protect(() => { void toggleFavorite(listing.id); }, `/listing/${listing.id}`)} className="h-14 w-14 items-center justify-center rounded-2xl border border-line"><Ionicons name={favorite ? 'heart' : 'heart-outline'} size={24} color={colors.red} /></Pressable>
        <PrimaryButton label="Contactar" variant="secondary" className="flex-1" onPress={contact} />
        <PrimaryButton label="Hacer oferta" className="flex-1" onPress={() => protect(() => { setOfferAmount(amount ? String(Math.round(amount * 0.9)) : ''); setOfferVisible(true); }, `/listing/${listing.id}`)} />
      </View>
      <Modal visible={offerVisible} transparent animationType="slide" onRequestClose={() => setOfferVisible(false)}>
        <Pressable className="flex-1 justify-end bg-black/40" onPress={() => setOfferVisible(false)}>
          <Pressable className="rounded-t-[32px] bg-white p-6 pb-10" onPress={(event) => event.stopPropagation()}>
            <View className="mb-5 h-1 w-12 self-center rounded-full bg-line" /><Text className="font-display text-2xl text-navy">Haz una oferta</Text><Text className="mt-2 font-sans text-sm text-muted">Precio publicado: {formatMoney(amount)}</Text>
            <View className="my-6 flex-row items-center rounded-2xl border border-line px-4"><Text className="font-display text-2xl text-brand">S/</Text><TextInput value={offerAmount} onChangeText={setOfferAmount} keyboardType="decimal-pad" className="ml-3 h-16 flex-1 font-display text-3xl text-ink" autoFocus /></View>
            <PrimaryButton label="Enviar oferta" onPress={() => void submitOffer()} /><Pressable onPress={() => setOfferVisible(false)} className="mt-3 py-3"><Text className="text-center font-medium text-muted">Cancelar</Text></Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function Info({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return <View className="mb-2 flex-row items-center"><Ionicons name={icon} size={18} color={colors.navy} /><Text className="ml-2 font-sans text-sm text-ink">{text}</Text></View>;
}
