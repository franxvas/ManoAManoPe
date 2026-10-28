import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/empty-state';
import { ScreenHeader } from '@/components/screen-header';
import { colors } from '@/constants/theme';
import { useAuth } from '@/features/auth/auth-provider';
import { StatusBadge } from '@/features/comunidad/components';
import { fetchMyRequests, requestStatusLabels } from '@/features/comunidad/requests';
import { formatRelativeDate } from '@/utils/format';

export default function MyRequestsScreen() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const query = useQuery({ queryKey: ['my-community-requests', userId], queryFn: () => fetchMyRequests(userId!), enabled: Boolean(userId) });

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-canvas">
      <ScreenHeader title="Mis solicitudes" showBack />
      {!userId ? (
        <EmptyState icon="lock-closed-outline" title="Inicia sesión" description="Aquí verás las donaciones y adopciones que pediste." />
      ) : query.isLoading ? (
        <ActivityIndicator className="mt-10" color={colors.red} />
      ) : query.isError ? (
        <EmptyState icon="cloud-offline-outline" title="No pudimos cargar tus solicitudes" description={query.error.message} />
      ) : (
        <FlatList
          data={query.data}
          keyExtractor={(item) => item.id}
          contentContainerClassName="gap-3 p-5 pb-12"
          refreshing={query.isRefetching}
          onRefresh={() => void query.refetch()}
          ListEmptyComponent={<EmptyState icon="file-tray-outline" title="Aún no enviaste solicitudes" description="Cuando pidas una donación o quieras adoptar, aparecerá aquí." />}
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              onPress={() =>
                item.kind === 'donation'
                  ? router.push({ pathname: '/comunidad/donaciones/[id]', params: { id: item.targetId } })
                  : router.push({ pathname: '/comunidad/adopciones/[id]', params: { id: item.targetId } })
              }
              className="flex-row items-center rounded-2xl bg-white p-4"
            >
              <Ionicons name={item.kind === 'donation' ? 'gift-outline' : 'paw-outline'} size={24} color={colors.navy} />
              <View className="ml-3 flex-1">
                <Text className="font-medium text-ink">{item.title}</Text>
                <Text className="mb-2 mt-0.5 font-sans text-xs text-muted">
                  {item.kind === 'donation' ? 'Donación' : 'Adopción'} · {formatRelativeDate(item.created_at)}
                </Text>
                <StatusBadge label={requestStatusLabels[item.status]} tone={['selected', 'accepted'].includes(item.status) ? 'amber' : ['delivered', 'completed'].includes(item.status) ? 'green' : 'gray'} />
              </View>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}
