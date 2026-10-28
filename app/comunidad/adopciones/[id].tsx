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
import { AdoptionRequestsPanel } from '@/features/comunidad/adoption-requests';
import { deleteAdoption, fetchAdoption } from '@/features/comunidad/adoptions';
import { InfoRow, PhotoGallery, StatusBadge } from '@/features/comunidad/components';
import { adoptionStatus, sizeLabels, speciesLabels } from '@/features/comunidad/model';

export default function AdoptionDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const cache = useQueryClient();
  const query = useQuery({ queryKey: ['adoption', id], queryFn: () => fetchAdoption(id) });
  const [error, setError] = useState('');
  const adoption = query.data;
  const isOwner = Boolean(adoption && adoption.owner_id === session?.user.id);

  async function remove() {
    try {
      await deleteAdoption(id);
      await cache.invalidateQueries({ queryKey: ['adoptions'] });
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo eliminar.');
    }
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
          <View className="bg-white p-5">
            <StatusBadge {...adoptionStatus[adoption.status]} />
            <Text className="mt-3 font-display text-2xl text-navy">{adoption.pet_name}</Text>
            <Text className="mt-1 font-sans text-sm text-muted">
              {speciesLabels[adoption.species]} · {adoption.age_text} · {sizeLabels[adoption.size]}
            </Text>
            <Text className="mt-4 font-sans leading-5 text-ink">{adoption.description}</Text>
            <View className="mt-4">
              <InfoRow icon="medkit-outline" label="Cuidados y salud" value={adoption.care_info} />
              <InfoRow icon="clipboard-outline" label="Condiciones de adopción" value={adoption.conditions} />
              <InfoRow icon="location-outline" label="Zona" value={adoption.zone} />
              <InfoRow icon="person-outline" label="Publicado por" value={adoption.owner_name} />
            </View>
          </View>
          <AdoptionRequestsPanel adoption={adoption} userId={session?.user.id} />
          {isOwner && (
            <View className="mt-3 gap-3 bg-white p-5">
              <PrimaryButton variant="outline" label="Editar ficha" onPress={() => router.push({ pathname: '/comunidad/adopciones/nueva', params: { id } })} />
              {adoption.status === 'seeking' && <PrimaryButton variant="outline" label="Retirar publicación" onPress={() => void remove()} />}
            </View>
          )}
          {Boolean(error) && <Text accessibilityRole="alert" className="px-5 pt-3 font-sans text-sm text-brand">{error}</Text>}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
