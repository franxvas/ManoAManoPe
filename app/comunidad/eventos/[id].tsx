import { goBackOr } from "@/utils/navigation";
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Image } from 'expo-image';
import * as Linking from 'expo-linking';
import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/empty-state';
import { PrimaryButton } from '@/components/primary-button';
import { ScreenHeader } from '@/components/screen-header';
import { colors } from '@/constants/theme';
import { useAuth } from '@/features/auth/auth-provider';
import { photoUrl } from '@/features/comunidad/api';
import { ActionFeedback, DetailSheet, InfoRow, QuickFacts, StatusBadge } from '@/features/comunidad/components';
import { sections } from '@/features/comunidad/theme';
import { dayTitle } from '@/features/comunidad/eventos/components';
import { RegistrationPanel } from '@/features/comunidad/eventos/inscripcion';
import { categoryText, dayKey, durationText, eventPhase, phaseBadges, timeText } from '@/features/comunidad/eventos/model';
import { levelLabels, modalityLabels } from '@/features/comunidad/talleres/model';
import { deleteEvent, fetchEvent, fetchSavedEventIds, toggleSavedEvent } from '@/features/comunidad/eventos/api';
import { useCommunityAction } from '@/features/comunidad/use-action';
import { useProtectedAction } from '@/hooks/use-protected-action';

export default function EventDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const protect = useProtectedAction();
  const query = useQuery({ queryKey: ['event', id], queryFn: () => fetchEvent(id) });
  const saves = useQuery({ queryKey: ['event-saves', session?.user.id], queryFn: fetchSavedEventIds, enabled: Boolean(session) });
  const action = useCommunityAction([['event-saves'], ['events'], ['workshops']]);
  const event = query.data;

  if (query.isLoading) {
    return (
      <SafeAreaView edges={['top']} className="flex-1 bg-canvas">
        <ScreenHeader title="Evento" showBack />
        <ActivityIndicator className="mt-10" color={colors.red} />
      </SafeAreaView>
    );
  }
  if (!event) {
    return (
      <SafeAreaView edges={['top']} className="flex-1 bg-canvas">
        <ScreenHeader title="Evento" showBack />
        <EmptyState icon="calendar-clear-outline" title="Evento no encontrado" description="Puede que lo hayan eliminado." />
      </SafeAreaView>
    );
  }

  const start = new Date(event.starts_at);
  const isWorkshop = event.kind === 'workshop';
  const isVirtual = event.modality === 'virtual';
  const isOrganizer = event.organizer_id === session?.user.id;
  const section = sections[isWorkshop ? 'talleres' : 'eventos'];
  const saved = saves.data?.has(event.id) ?? false;
  const openMap = () => void Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${event.place}, Bagua`)}`);

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-canvas">
      <ScreenHeader title={isWorkshop ? 'Taller' : 'Evento'} showBack />
      <ScrollView contentContainerClassName="pb-12">
        {event.photo ? (
          <Image source={{ uri: photoUrl(event.photo) }} style={{ width: '100%', height: 260 }} contentFit="cover" transition={150} />
        ) : (
          <View className={`h-48 items-center justify-center ${section.soft}`}>
            <Ionicons name={section.icon} size={56} color={section.color} />
          </View>
        )}
        <DetailSheet>
          <View className="flex-row gap-2">
            <StatusBadge label={categoryText(event)} tone={isWorkshop ? 'green' : 'red'} />
            <StatusBadge {...phaseBadges[eventPhase(event)]} />
          </View>
          <Text className="mt-3 font-display text-[26px] leading-8 text-navy">{event.title}</Text>
          <Text className="mt-1 font-sans text-sm text-muted">Organiza {event.organizer_name}</Text>
          <QuickFacts
            color={section.color}
            facts={[
              { icon: 'calendar-outline', label: 'Fecha', value: format(start, "EEE d MMM", { locale: es }).replace('.', '') },
              { icon: 'time-outline', label: durationText(event.starts_at, event.ends_at), value: timeText(start) + '–' + timeText(new Date(event.ends_at)) },
              { icon: 'cash-outline', label: 'Costo', value: event.is_free ? 'Gratis' : 'Con costo' },
            ]}
          />
          <View className="mt-4">
            {isWorkshop && (
              <>
                <InfoRow icon="bulb-outline" label="Tema" value={event.topic} />
                <InfoRow icon="person-outline" label="Instructor" value={event.instructor} />
                <InfoRow icon="stats-chart-outline" label="Nivel y modalidad" value={`${levelLabels[event.level ?? 'basico']} · ${modalityLabels[event.modality ?? 'presencial']}`} />
              </>
            )}
            <InfoRow icon={isVirtual ? 'videocam-outline' : 'location-outline'} label={isVirtual ? 'Plataforma' : 'Lugar'} value={event.place} />
            {isWorkshop && <InfoRow icon="construct-outline" label="Materiales necesarios" value={event.materials} />}
            {event.registration_deadline && (
              <InfoRow icon="hourglass-outline" label="Inscripciones hasta" value={`${dayTitle(dayKey(new Date(event.registration_deadline)))}, ${timeText(new Date(event.registration_deadline))}`} />
            )}
            {!event.is_free && <InfoRow icon="cash-outline" label="Costo" value={event.cost_note} />}
            <InfoRow icon="clipboard-outline" label="Requisitos" value={event.requirements} />
          </View>
          <Text className="mt-3 font-sans leading-5 text-ink">{event.description}</Text>
          <View className="mt-5 flex-row gap-3">
            {!isVirtual && (
              <Pressable accessibilityRole="button" onPress={openMap} className="h-12 flex-1 flex-row items-center justify-center rounded-2xl border border-navy">
                <Ionicons name="map-outline" size={18} color={colors.navy} />
                <Text className="ml-2 font-medium text-sm text-navy">Ver ubicación</Text>
              </Pressable>
            )}
            <Pressable
              accessibilityRole="button"
              disabled={action.busy}
              onPress={() => protect(() => void action.run(() => toggleSavedEvent(event.id, saved), { success: saved ? 'Lo quitaste de tus guardados.' : 'Evento guardado.' }))}
              className={`h-12 flex-1 flex-row items-center justify-center rounded-2xl ${saved ? 'bg-navy' : 'border border-navy'}`}
            >
              <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={18} color={saved ? colors.white : colors.navy} />
              <Text className={`ml-2 font-medium text-sm ${saved ? 'text-white' : 'text-navy'}`}>{saved ? 'Guardado' : 'Guardar evento'}</Text>
            </Pressable>
          </View>
          <ActionFeedback error={action.error} notice={action.notice} />
        </DetailSheet>
        <RegistrationPanel event={event} userId={session?.user.id} />
        {isOrganizer && (
          <View className="mt-3 gap-3 bg-white p-5">
            {event.requires_registration && (
              <PrimaryButton variant="secondary" label={`Ver inscritos (${event.registered_count})`} onPress={() => router.push({ pathname: '/comunidad/eventos/inscritos', params: { id: event.id } })} />
            )}
            <PrimaryButton variant="outline" label={isWorkshop ? 'Editar taller' : 'Editar evento'} onPress={() => router.push({ pathname: '/comunidad/eventos/nuevo', params: { id: event.id } })} />
            <PrimaryButton variant="outline" label={isWorkshop ? 'Eliminar taller' : 'Eliminar evento'} disabled={action.busy} onPress={() => void action.run(() => deleteEvent(event.id), { confirm: { title: isWorkshop ? 'Eliminar taller' : 'Eliminar evento', message: 'Se borrará junto con sus inscripciones. No se puede deshacer.', confirmLabel: 'Eliminar' } }).then((ok) => ok && goBackOr('/(tabs)'))} />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
