import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, SectionList, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/empty-state';
import { PrimaryButton } from '@/components/primary-button';
import { ScreenHeader } from '@/components/screen-header';
import { colors } from '@/constants/theme';
import { useAuth } from '@/features/auth/auth-provider';
import { DayStrip, EventCard, dayTitle, nextDays } from '@/features/comunidad/event-components';
import { dayKey, eventPhase } from '@/features/comunidad/event-model';
import { fetchEvents, fetchSavedEventIds } from '@/features/comunidad/events';
import { useProtectedAction } from '@/hooks/use-protected-action';
import { isSupabaseConfigured } from '@/lib/supabase';

type Tab = 'upcoming' | 'saved' | 'finished';
const tabs: { value: Tab; label: string }[] = [
  { value: 'upcoming', label: 'Próximos' },
  { value: 'saved', label: 'Guardados' },
  { value: 'finished', label: 'Finalizados' },
];

export default function EventsCalendarScreen() {
  const { session } = useAuth();
  const protect = useProtectedAction();
  const [tab, setTab] = useState<Tab>('upcoming');
  const [day, setDay] = useState<string>();
  const events = useQuery({ queryKey: ['events'], queryFn: () => fetchEvents('event'), enabled: isSupabaseConfigured });
  const saved = useQuery({ queryKey: ['event-saves', session?.user.id], queryFn: fetchSavedEventIds, enabled: Boolean(session) });
  const days = useMemo(() => nextDays(21), []);

  const all = events.data ?? [];
  const marked = new Set(all.filter((event) => eventPhase(event) !== 'finished').map((event) => dayKey(new Date(event.starts_at))));
  const visible = all.filter((event) => {
    const finished = eventPhase(event) === 'finished';
    if (tab === 'finished') return finished;
    if (finished) return false;
    if (tab === 'saved' && !saved.data?.has(event.id)) return false;
    return !day || dayKey(new Date(event.starts_at)) === day;
  });
  if (tab === 'finished') visible.reverse();

  const sections = Object.values(
    visible.reduce<Record<string, { title: string; data: typeof visible }>>((groups, event) => {
      const key = dayKey(new Date(event.starts_at));
      groups[key] ??= { title: dayTitle(key), data: [] };
      groups[key].data.push(event);
      return groups;
    }, {}),
  );

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-canvas">
      <ScreenHeader title="Eventos y campañas" showBack />
      <View className="gap-3 px-5 pt-3">
        <PrimaryButton label="Crear evento o campaña" onPress={() => protect(() => router.push('/comunidad/eventos/nuevo'), '/comunidad/eventos')} />
        <View className="flex-row gap-2">
          {tabs.map((item) => (
            <Pressable
              key={item.value}
              onPress={() => setTab(item.value)}
              className={`rounded-full border px-4 py-2 ${tab === item.value ? 'border-brand bg-brand' : 'border-line bg-white'}`}
            >
              <Text className={`font-medium text-xs ${tab === item.value ? 'text-white' : 'text-navy'}`}>{item.label}</Text>
            </Pressable>
          ))}
        </View>
        {tab !== 'finished' && <DayStrip days={days} selected={day} marked={marked} onSelect={(value) => setDay(value === day ? undefined : value)} />}
      </View>
      {!isSupabaseConfigured ? (
        <EmptyState icon="cloud-offline-outline" title="Comunidad necesita conexión" description="Conecta Supabase para ver el calendario." />
      ) : events.isLoading ? (
        <ActivityIndicator className="mt-10" color={colors.red} />
      ) : events.isError ? (
        <EmptyState icon="cloud-offline-outline" title="No pudimos cargar los eventos" description={events.error.message} />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 48 }}
          stickySectionHeadersEnabled={false}
          refreshing={events.isRefetching}
          onRefresh={() => void events.refetch()}
          renderSectionHeader={({ section }) => <Text className="px-5 pb-2 pt-4 font-display text-lg text-navy">{section.title}</Text>}
          renderItem={({ item }) => (
            <View className="px-5 pb-3">
              <EventCard event={item} onPress={() => router.push({ pathname: '/comunidad/eventos/[id]', params: { id: item.id } })} />
            </View>
          )}
          ListEmptyComponent={
            <EmptyState
              icon="calendar-clear-outline"
              title={tab === 'saved' ? 'No tienes eventos guardados' : day ? 'Nada para este día' : 'No hay eventos por ahora'}
              description={tab === 'saved' ? 'Toca "Guardar evento" en los que te interesen.' : 'Cuando alguien publique una actividad aparecerá aquí.'}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}
