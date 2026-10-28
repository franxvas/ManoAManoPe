import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/empty-state';
import { PrimaryButton } from '@/components/primary-button';
import { ScreenHeader } from '@/components/screen-header';
import { colors } from '@/constants/theme';
import { useAuth } from '@/features/auth/auth-provider';
import { InfoRow, PhotoGallery, StatusBadge } from '@/features/comunidad/components';
import { DonationRequestsPanel } from '@/features/comunidad/donation-requests';
import { deleteDonation, fetchDonation } from '@/features/comunidad/donations';
import { conditionLabels, donationStatus } from '@/features/comunidad/model';

export default function DonationDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const cache = useQueryClient();
  const query = useQuery({ queryKey: ['donation', id], queryFn: () => fetchDonation(id) });
  const [error, setError] = useState('');
  const donation = query.data;
  const isOwner = Boolean(donation && donation.owner_id === session?.user.id);

  async function remove() {
    try {
      await deleteDonation(id);
      await cache.invalidateQueries({ queryKey: ['donations'] });
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo eliminar.');
    }
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-canvas">
      <ScreenHeader title="Donación" showBack />
      {query.isLoading ? (
        <ActivityIndicator className="mt-10" color={colors.red} />
      ) : !donation ? (
        <EmptyState icon="gift-outline" title="Donación no encontrada" description="Puede que la hayan retirado." />
      ) : (
        <ScrollView contentContainerClassName="pb-12">
          <PhotoGallery paths={donation.photos} />
          <View className="bg-white p-5">
            <StatusBadge {...donationStatus[donation.status]} />
            <Text className="mt-3 font-display text-2xl text-navy">{donation.title}</Text>
            <Text className="mt-1 font-sans text-sm text-muted">Dona {donation.owner_name} · Gratis</Text>
            {Boolean(donation.description) && <Text className="mt-4 font-sans leading-5 text-ink">{donation.description}</Text>}
            <View className="mt-4">
              <InfoRow icon="sparkles-outline" label="Estado del objeto" value={conditionLabels[donation.condition]} />
              <InfoRow icon="layers-outline" label="Cantidad" value={String(donation.quantity)} />
              <InfoRow icon="location-outline" label="Zona" value={donation.zone} />
              <InfoRow icon="time-outline" label="Condiciones y horario de recojo" value={donation.pickup_terms} />
            </View>
          </View>
          <DonationRequestsPanel donation={donation} userId={session?.user.id} />
          {isOwner && (
            <View className="mt-3 gap-3 bg-white p-5">
              <PrimaryButton variant="outline" label="Editar donación" onPress={() => router.push({ pathname: '/comunidad/donaciones/nueva', params: { id } })} />
              {donation.status === 'available' && <PrimaryButton variant="outline" label="Retirar publicación" onPress={() => void remove()} />}
            </View>
          )}
          {Boolean(error) && <Text accessibilityRole="alert" className="px-5 pt-3 font-sans text-sm text-brand">{error}</Text>}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
