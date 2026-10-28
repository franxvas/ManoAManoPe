import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/empty-state';
import { PrimaryButton } from '@/components/primary-button';
import { ScreenHeader } from '@/components/screen-header';
import { colors } from '@/constants/theme';
import { fetchAdoptions } from '@/features/comunidad/adoptions';
import { CommunityCard } from '@/features/comunidad/components';
import { adoptionStatus, sizeLabels, speciesLabels, type Adoption } from '@/features/comunidad/model';
import { useProtectedAction } from '@/hooks/use-protected-action';
import { isSupabaseConfigured } from '@/lib/supabase';

const filters: { label: string; species?: Adoption['species'] }[] = [
  { label: 'Todos' },
  { label: 'Perros', species: 'perro' },
  { label: 'Gatos', species: 'gato' },
  { label: 'Otros', species: 'otro' },
];

export default function AdoptionsScreen() {
  const [species, setSpecies] = useState<Adoption['species']>();
  const protect = useProtectedAction();
  const query = useQuery({ queryKey: ['adoptions'], queryFn: fetchAdoptions, enabled: isSupabaseConfigured });
  const adoptions = (query.data ?? []).filter((item) => !species || item.species === species || (species === 'otro' && !['perro', 'gato'].includes(item.species)));

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-canvas">
      <ScreenHeader title="Adopciones" showBack />
      <View className="gap-3 px-5 py-3">
        <PrimaryButton label="Dar en adopción" onPress={() => protect(() => router.push('/comunidad/adopciones/nueva'), '/comunidad/adopciones')} />
        <View className="flex-row gap-2">
          {filters.map((filter) => (
            <Pressable
              key={filter.label}
              onPress={() => setSpecies(filter.species)}
              className={`rounded-full border px-4 py-2 ${species === filter.species ? 'border-brand bg-brand' : 'border-line bg-white'}`}
            >
              <Text className={`font-medium text-xs ${species === filter.species ? 'text-white' : 'text-navy'}`}>{filter.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
      {!isSupabaseConfigured ? (
        <EmptyState icon="cloud-offline-outline" title="Comunidad necesita conexión" description="Conecta Supabase para ver y publicar adopciones." />
      ) : query.isLoading ? (
        <ActivityIndicator className="mt-10" color={colors.red} />
      ) : query.isError ? (
        <EmptyState icon="cloud-offline-outline" title="No pudimos cargar las adopciones" description={query.error.message} />
      ) : (
        <FlatList
          data={adoptions}
          keyExtractor={(item) => item.id}
          contentContainerClassName="gap-3 px-5 pb-12"
          refreshing={query.isRefetching}
          onRefresh={() => void query.refetch()}
          ListEmptyComponent={<EmptyState icon="paw-outline" title="No hay animales en adopción" description="Cuando alguien publique uno, aparecerá aquí." />}
          renderItem={({ item }) => (
            <CommunityCard
              photo={item.photos[0]}
              title={item.pet_name}
              subtitle={`${speciesLabels[item.species]} · ${item.age_text} · ${sizeLabels[item.size]} · ${item.zone}`}
              badge={adoptionStatus[item.status]}
              onPress={() => router.push({ pathname: '/comunidad/adopciones/[id]', params: { id: item.id } })}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}
