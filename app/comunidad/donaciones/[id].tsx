import { goBackOr } from "@/utils/navigation";
import { useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/empty-state';
import { PrimaryButton } from '@/components/primary-button';
import { ScreenHeader } from '@/components/screen-header';
import { colors } from '@/constants/theme';
import { useAuth } from '@/features/auth/auth-provider';
import { ActionFeedback, DetailSheet, InfoRow, OwnerCard, PhotoGallery, QuickFacts, StatusBadge } from '@/features/comunidad/components';
import { DonationRequestsPanel } from '@/features/comunidad/donaciones/solicitudes';
import { deleteDonation, fetchDonation } from '@/features/comunidad/donaciones/api';
import { conditionLabels, donationStatus } from '@/features/comunidad/donaciones/model';
import { sections } from '@/features/comunidad/theme';
import { useCommunityAction } from '@/features/comunidad/use-action';

export default function DonationDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const query = useQuery({ queryKey: ['donation', id], queryFn: () => fetchDonation(id) });
  const action = useCommunityAction([['donations']]);
  const donation = query.data;
  const isOwner = Boolean(donation && donation.owner_id === session?.user.id);

  async function remove() {
    const removed = await action.run(() => deleteDonation(id), {
      confirm: { title: 'Retirar donación', message: 'La publicación y sus solicitudes se borrarán. ¿Quieres continuar?', confirmLabel: 'Retirar' },
    });
    if (removed) goBackOr('/(tabs)');
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
          <DetailSheet>
            <StatusBadge {...donationStatus[donation.status]} />
            <Text className="mt-3 font-display text-[26px] leading-8 text-navy">{donation.title}</Text>
            <QuickFacts
              color={sections.donaciones.color}
              facts={[
                { icon: 'sparkles-outline', label: 'Estado', value: conditionLabels[donation.condition] },
                { icon: 'layers-outline', label: 'Cantidad', value: String(donation.quantity) },
                { icon: 'heart-outline', label: 'Precio', value: 'Gratis' },
              ]}
            />
            {Boolean(donation.description) && <Text className="mt-4 font-sans leading-6 text-ink">{donation.description}</Text>}
            <View className="mt-4">
              <InfoRow icon="location-outline" label="Zona" value={donation.zone} />
              <InfoRow icon="time-outline" label="Condiciones y horario de recojo" value={donation.pickup_terms} />
            </View>
            <OwnerCard name={donation.owner_name} avatar={donation.owner_avatar} label="Dona" />
          </DetailSheet>
          <DonationRequestsPanel donation={donation} userId={session?.user.id} />
          {isOwner && (
            <View className="mt-3 gap-3 bg-white p-5">
              <PrimaryButton variant="outline" label="Editar donación" onPress={() => router.push({ pathname: '/comunidad/donaciones/nueva', params: { id } })} />
              {donation.status === 'available' && <PrimaryButton variant="outline" label="Retirar publicación" loading={action.busy} onPress={() => void remove()} />}
              <ActionFeedback error={action.error} notice={action.notice} />
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
