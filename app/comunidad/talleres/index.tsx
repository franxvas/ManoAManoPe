import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { ActivityIndicator, FlatList, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/empty-state';
import { PrimaryButton } from '@/components/primary-button';
import { ScreenHeader } from '@/components/screen-header';
import { colors } from '@/constants/theme';
import { EventCard } from '@/features/comunidad/eventos/components';
import { eventPhase } from '@/features/comunidad/eventos/model';
import { fetchEvents } from '@/features/comunidad/eventos/api';
import { useProtectedAction } from '@/hooks/use-protected-action';
import { isSupabaseConfigured } from '@/lib/supabase';

export default function WorkshopsScreen() {
  const protect = useProtectedAction();
  const query = useQuery({ queryKey: ['workshops'], queryFn: () => fetchEvents('workshop'), enabled: isSupabaseConfigured });
  const workshops = (query.data ?? []).filter((workshop) => eventPhase(workshop) !== 'finished');

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-canvas">
      <ScreenHeader title="Talleres" showBack />
      <View className="px-5 py-3">
        <PrimaryButton label="Crear taller" onPress={() => protect(() => router.push({ pathname: '/comunidad/eventos/nuevo', params: { kind: 'workshop' } }), '/comunidad/talleres')} />
      </View>
      {!isSupabaseConfigured ? (
        <EmptyState icon="cloud-offline-outline" title="Comunidad necesita conexión" description="Conecta Supabase para ver los talleres." />
      ) : query.isLoading ? (
        <ActivityIndicator className="mt-10" color={colors.red} />
      ) : query.isError ? (
        <EmptyState icon="cloud-offline-outline" title="No pudimos cargar los talleres" description={query.error.message} />
      ) : (
        <FlatList
          data={workshops}
          keyExtractor={(item) => item.id}
          contentContainerClassName="gap-3 px-5 pb-12"
          refreshing={query.isRefetching}
          onRefresh={() => void query.refetch()}
          ListEmptyComponent={<EmptyState icon="school-outline" title="No hay talleres próximos" description="¿Sabes hacer algo? Anímate a enseñarlo." />}
          renderItem={({ item }) => <EventCard event={item} showDate onPress={() => router.push({ pathname: '/comunidad/eventos/[id]', params: { id: item.id } })} />}
        />
      )}
    </SafeAreaView>
  );
}
