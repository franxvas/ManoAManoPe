import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Alert, FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/empty-state';
import { ScreenHeader } from '@/components/screen-header';
import { colors } from '@/constants/theme';
import { useProfile } from '@/hooks/use-profile';
import { isSupabaseConfigured } from '@/lib/supabase';
import { deleteRemoteListing, fetchMyListings, updateRemoteListingStatus } from '@/services/listings';
import { useAppStore } from '@/stores/app-store';
import type { ListingStatus } from '@/types/domain';
import { formatMoney, getListingAmount } from '@/utils/format';

const statusLabels: Record<ListingStatus, string> = { draft: 'Borrador', published: 'Publicada', paused: 'Pausada', sold: 'Vendida', completed: 'Finalizada' };

export default function MyListingsScreen() {
  const localProfileId = useAppStore((state) => state.profile.id);
  const { profile } = useProfile();
  const queryClient = useQueryClient();
  const localListings = useAppStore((state) => state.listings);
  const remote = useQuery({ queryKey: ['my-listings'], queryFn: fetchMyListings, enabled: isSupabaseConfigured });
  const listings = (isSupabaseConfigured ? (remote.data ?? []) : localListings).filter((item) => item.ownerId === (profile?.id ?? localProfileId));
  const updateStatus = useAppStore((state) => state.updateListingStatus);
  const deleteListing = useAppStore((state) => state.deleteListing);
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['my-listings'] });
  const changeStatus = async (id: string, status: ListingStatus) => { if (isSupabaseConfigured) { await updateRemoteListingStatus(id, status); await refresh(); } else updateStatus(id, status); };
  const removeListing = async (id: string) => { if (isSupabaseConfigured) { await deleteRemoteListing(id); await refresh(); } else deleteListing(id); };
  const confirmDelete = (id: string, title: string) => Alert.alert('Eliminar publicación', `¿Seguro que deseas eliminar “${title}”?`, [
    { text: 'Cancelar', style: 'cancel' }, { text: 'Eliminar', style: 'destructive', onPress: () => void removeListing(id) },
  ]);
  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-canvas">
      <ScreenHeader title="Mis publicaciones" showBack />
      <FlatList data={listings} keyExtractor={(item) => item.id} contentContainerClassName="p-5" ListEmptyComponent={<EmptyState icon="albums-outline" title="Aún no has publicado" description="Comparte un producto, servicio, promoción o necesidad." />} renderItem={({ item }) => (
        <View className="mb-4 rounded-2xl border border-line bg-white p-4">
          <View className="flex-row items-start justify-between"><View className="flex-1"><Text className="font-display text-xl text-navy">{item.title}</Text><Text className="mt-1 font-display text-lg text-brand">{formatMoney(getListingAmount(item.price, item.budget))}</Text></View><View className={`rounded-full px-3 py-1 ${item.status === 'published' ? 'bg-green-50' : 'bg-slate-100'}`}><Text className={`font-medium text-[10px] ${item.status === 'published' ? 'text-success' : 'text-muted'}`}>{statusLabels[item.status]}</Text></View></View>
          <View className="mt-4 flex-row gap-2">
            <Action icon="create-outline" label="Editar" onPress={() => router.push({ pathname: '/publish/[type]', params: { type: item.type, listingId: item.id } })} />
            {item.status === 'published' ? <Action icon="pause-outline" label="Pausar" onPress={() => void changeStatus(item.id, 'paused')} /> : <Action icon="play-outline" label="Reactivar" onPress={() => void changeStatus(item.id, 'published')} />}
            <Action icon="checkmark-outline" label="Finalizar" onPress={() => void changeStatus(item.id, 'completed')} />
            <Action icon="trash-outline" label="Eliminar" danger onPress={() => confirmDelete(item.id, item.title)} />
          </View>
        </View>
      )} />
    </SafeAreaView>
  );
}

function Action({ icon, label, danger, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; danger?: boolean; onPress: () => void }) {
  return <Pressable onPress={onPress} className="flex-1 items-center rounded-xl bg-canvas py-2.5"><Ionicons name={icon} size={19} color={danger ? colors.red : colors.navy} /><Text className={`mt-1 font-medium text-[9px] ${danger ? 'text-brand' : 'text-navy'}`}>{label}</Text></Pressable>;
}
