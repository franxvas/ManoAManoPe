import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/empty-state';
import { PrimaryButton } from '@/components/primary-button';
import { ScreenHeader } from '@/components/screen-header';
import { colors } from '@/constants/theme';
import { CommunityCard } from '@/features/comunidad/components';
import { fetchDonations } from '@/features/comunidad/donations';
import { conditionLabels, donationStatus } from '@/features/comunidad/model';
import { useProtectedAction } from '@/hooks/use-protected-action';
import { isSupabaseConfigured } from '@/lib/supabase';

export default function DonationsScreen() {
  const [onlyAvailable, setOnlyAvailable] = useState(true);
  const protect = useProtectedAction();
  const query = useQuery({ queryKey: ['donations'], queryFn: fetchDonations, enabled: isSupabaseConfigured });
  const donations = (query.data ?? []).filter((item) => !onlyAvailable || item.status === 'available');

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-canvas">
      <ScreenHeader title="Donaciones" showBack />
      <View className="gap-3 px-5 py-3">
        <PrimaryButton label="Donar algo" onPress={() => protect(() => router.push('/comunidad/donaciones/nueva'), '/comunidad/donaciones')} />
        <View className="flex-row gap-2">
          {[true, false].map((value) => (
            <Pressable
              key={String(value)}
              onPress={() => setOnlyAvailable(value)}
              className={`rounded-full border px-4 py-2 ${onlyAvailable === value ? 'border-brand bg-brand' : 'border-line bg-white'}`}
            >
              <Text className={`font-medium text-xs ${onlyAvailable === value ? 'text-white' : 'text-navy'}`}>{value ? 'Disponibles' : 'Todas'}</Text>
            </Pressable>
          ))}
        </View>
      </View>
      {!isSupabaseConfigured ? (
        <EmptyState icon="cloud-offline-outline" title="Comunidad necesita conexión" description="Conecta Supabase para ver y publicar donaciones." />
      ) : query.isLoading ? (
        <ActivityIndicator className="mt-10" color={colors.red} />
      ) : query.isError ? (
        <EmptyState icon="cloud-offline-outline" title="No pudimos cargar las donaciones" description={query.error.message} />
      ) : (
        <FlatList
          data={donations}
          keyExtractor={(item) => item.id}
          contentContainerClassName="gap-3 px-5 pb-12"
          refreshing={query.isRefetching}
          onRefresh={() => void query.refetch()}
          ListEmptyComponent={<EmptyState icon="gift-outline" title="Aún no hay donaciones" description="Sé el primero en regalar algo que ya no usas." />}
          renderItem={({ item }) => (
            <CommunityCard
              photo={item.photos[0]}
              title={item.title}
              subtitle={`${conditionLabels[item.condition]} · ${item.quantity} ${item.quantity === 1 ? 'unidad' : 'unidades'} · ${item.zone}`}
              badge={donationStatus[item.status]}
              onPress={() => router.push({ pathname: '/comunidad/donaciones/[id]', params: { id: item.id } })}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}
