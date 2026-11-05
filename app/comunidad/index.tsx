import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { router } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/screen-header';
import { colors } from '@/constants/theme';
import { fetchAdoptions } from '@/features/comunidad/adopciones/api';
import { fetchDonations } from '@/features/comunidad/donaciones/api';
import { fetchEvents } from '@/features/comunidad/eventos/api';
import { eventPhase, timeText, type CommunityEvent } from '@/features/comunidad/eventos/model';
import { sections, type SectionKey } from '@/features/comunidad/theme';
import { isSupabaseConfigured } from '@/lib/supabase';

export default function CommunityScreen() {
  const enabled = isSupabaseConfigured;
  const donations = useQuery({ queryKey: ['donations'], queryFn: fetchDonations, enabled });
  const adoptions = useQuery({ queryKey: ['adoptions'], queryFn: fetchAdoptions, enabled });
  const events = useQuery({ queryKey: ['events'], queryFn: () => fetchEvents('event'), enabled });
  const workshops = useQuery({ queryKey: ['workshops'], queryFn: () => fetchEvents('workshop'), enabled });

  const upcomingEvents = (events.data ?? []).filter((event) => eventPhase(event) !== 'finished');
  const upcomingWorkshops = (workshops.data ?? []).filter((workshop) => eventPhase(workshop) !== 'finished');
  const next = [...upcomingEvents, ...upcomingWorkshops].sort((a, b) => a.starts_at.localeCompare(b.starts_at)).slice(0, 5);

  const counts: Record<SectionKey, string | undefined> = {
    donaciones: donations.data && plural(donations.data.filter((item) => item.status === 'available').length, 'disponible', 'disponibles'),
    adopciones: adoptions.data && plural(adoptions.data.filter((item) => item.status === 'seeking' || item.status === 'evaluating').length, 'busca hogar', 'buscan hogar'),
    eventos: events.data && plural(upcomingEvents.length, 'próximo', 'próximos'),
    talleres: workshops.data && `${upcomingWorkshops.filter((w) => w.capacity == null || w.registered_count < w.capacity).length} con cupos`,
  };

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-canvas">
      <ScreenHeader title="Comunidad" showBack />
      <ScrollView contentContainerClassName="p-5 pb-12" showsVerticalScrollIndicator={false}>
        <View className="overflow-hidden rounded-3xl bg-navy p-5">
          <View className="absolute -right-6 -top-4 opacity-10">
            <Ionicons name="people" size={150} color={colors.white} />
          </View>
          <View className="self-start rounded-full bg-white/15 px-3 py-1">
            <Text className="font-medium text-[11px] text-white">Sin precios · Sin ofertas</Text>
          </View>
          <Text className="mt-3 font-display text-[26px] leading-8 text-white">Ayudémonos{'\n'}entre todos</Text>
          <Text className="mt-2 font-sans text-sm leading-5 text-white/80">
            Aquí no hay precios ni ofertas. Es un espacio para ayudarnos entre todos.
          </Text>
        </View>

        <View className="mt-5 flex-row flex-wrap justify-between gap-y-3">
          {(Object.keys(sections) as SectionKey[]).map((key) => (
            <SectionTile key={key} section={key} count={counts[key]} />
          ))}
        </View>

        <View className="mb-3 mt-7 flex-row items-end justify-between">
          <Text className="font-display text-xl text-navy">Próximamente</Text>
          <Pressable hitSlop={10} onPress={() => router.push('/comunidad/eventos')}>
            <Text className="font-medium text-sm text-brand">Ver calendario</Text>
          </Pressable>
        </View>
        {next.length === 0 ? (
          <View className="rounded-2xl bg-white p-5">
            <Text className="font-sans text-sm text-muted">No hay eventos ni talleres próximos. ¡Anímate a organizar uno!</Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-3">
            {next.map((event) => (
              <UpcomingCard key={event.id} event={event} />
            ))}
          </ScrollView>
        )}

        <Text className="mb-3 mt-7 font-display text-xl text-navy">Tu actividad</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/comunidad/mis-solicitudes')}
          className="flex-row items-center rounded-2xl bg-white p-4"
        >
          <View className="h-11 w-11 items-center justify-center rounded-xl bg-canvas">
            <Ionicons name="file-tray-outline" size={22} color={colors.navy} />
          </View>
          <View className="ml-3 flex-1">
            <Text className="font-medium text-ink">Mis solicitudes</Text>
            <Text className="font-sans text-xs text-muted">Donaciones y adopciones que pediste</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.muted} />
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function plural(count: number, one: string, many: string) {
  return `${count} ${count === 1 ? one : many}`;
}

function SectionTile({ section, count }: { section: SectionKey; count?: string }) {
  const item = sections[section];
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={item.title} onPress={() => router.push(item.href)} className="min-h-[190px] w-[48%] justify-between rounded-3xl bg-white p-4">
      <View>
        <View className={`h-12 w-12 items-center justify-center rounded-2xl ${item.soft}`}>
          <Ionicons name={item.icon} size={24} color={item.color} />
        </View>
        <Text className="mt-3 font-display text-lg leading-6 text-navy">{item.title}</Text>
        <Text numberOfLines={2} className="mt-1 font-sans text-xs leading-4 text-muted">{item.description}</Text>
      </View>
      <Text className={`mt-3 font-medium text-xs ${count?.startsWith('0 ') ? 'text-muted' : item.text}`}>{count ?? ' '}</Text>
    </Pressable>
  );
}

function UpcomingCard({ event }: { event: CommunityEvent }) {
  const start = new Date(event.starts_at);
  const section = sections[event.kind === 'workshop' ? 'talleres' : 'eventos'];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={event.title}
      onPress={() => router.push({ pathname: '/comunidad/eventos/[id]', params: { id: event.id } })}
      className="w-64 flex-row rounded-2xl bg-white p-3"
    >
      <View className="h-16 w-14 items-center justify-center rounded-xl" style={{ backgroundColor: section.color }}>
        <Text className="font-display text-xl leading-6 text-white">{start.getDate()}</Text>
        <Text className="font-medium text-[10px] uppercase text-white">{format(start, 'MMM', { locale: es }).replace('.', '')}</Text>
      </View>
      <View className="ml-3 flex-1 justify-center">
        <Text numberOfLines={2} className="font-medium text-sm text-ink">{event.title}</Text>
        <Text numberOfLines={1} className="mt-1 font-sans text-xs text-muted">
          {timeText(start)} · {event.place}
        </Text>
      </View>
    </Pressable>
  );
}
