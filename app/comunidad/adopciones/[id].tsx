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
import { FavoriteButton } from '@/features/guardados/favorite-button';
import { AdoptionRequestsPanel } from '@/features/comunidad/adopciones/solicitudes';
import { deleteAdoption, fetchAdoption } from '@/features/comunidad/adopciones/api';
import { adoptionStatus, sizeLabels, speciesLabels } from '@/features/comunidad/adopciones/model';
import { ActionFeedback, DetailSheet, InfoRow, OwnerCard, PhotoGallery, QuickFacts, StatusBadge } from '@/features/comunidad/components';
import { sections } from '@/features/comunidad/theme';
import { useCommunityAction } from '@/features/comunidad/use-action';

export default function AdoptionDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const query = useQuery({ queryKey: ['adoption', id], queryFn: () => fetchAdoption(id) });
  const action = useCommunityAction([['adoptions']]);
  const adoption = query.data;
  const isOwner = Boolean(adoption && adoption.owner_id === session?.user.id);

  async function remove() {
    const removed = await action.run(() => deleteAdoption(id), {
      confirm: { title: 'Retirar ficha', message: 'La ficha y sus solicitudes se borrarán. ¿Quieres continuar?', confirmLabel: 'Retirar' },
    });
    if (removed) goBackOr('/(tabs)');
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-canvas">
      <ScreenHeader title="Adopción" showBack />
      {query.isLoading ? (
        <ActivityIndicator className="mt-10" color={colors.red} />
      ) : !adoption ? (
        <EmptyState icon="paw-outline" title="Ficha no encontrada" description="Puede que la hayan retirado." />
      ) : (
        <ScrollView contentContainerClassName="pb-12">
          <PhotoGallery paths={adoption.photos} />
          <DetailSheet>
            <StatusBadge {...adoptionStatus[adoption.status]} />
            <View className="mt-3 flex-row items-start">
              <Text className="flex-1 font-display text-[28px] leading-8 text-navy">{adoption.pet_name}</Text>
              <FavoriteButton type="adoption" id={adoption.id} />
            </View>
            <QuickFacts
              color={sections.adopciones.color}
              facts={[
                { icon: 'paw-outline', label: 'Especie', value: speciesLabels[adoption.species] },
                { icon: 'hourglass-outline', label: 'Edad', value: adoption.age_text },
                { icon: 'resize-outline', label: 'Tamaño', value: sizeLabels[adoption.size] },
              ]}
            />
            <Text className="mt-4 font-display text-lg text-navy">Cómo es</Text>
            <Text className="mt-1 font-sans leading-6 text-ink">{adoption.description}</Text>
            <View className="mt-4">
              <InfoRow icon="medkit-outline" label="Cuidados y salud" value={adoption.care_info} />
              <InfoRow icon="clipboard-outline" label="Condiciones de adopción" value={adoption.conditions} />
              <InfoRow icon="location-outline" label="Zona" value={adoption.zone} />
            </View>
            <OwnerCard name={adoption.owner_name} avatar={adoption.owner_avatar} label="Lo da en adopción" />
          </DetailSheet>
          <AdoptionRequestsPanel adoption={adoption} userId={session?.user.id} />
          {isOwner && (
            <View className="mt-3 gap-3 bg-white p-5">
              <PrimaryButton variant="outline" label="Editar ficha" onPress={() => router.push({ pathname: '/comunidad/adopciones/nueva', params: { id } })} />
              {adoption.status === 'seeking' && <PrimaryButton variant="outline" label="Retirar publicación" loading={action.busy} onPress={() => void remove()} />}
              <ActionFeedback error={action.error} notice={action.notice} />
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
