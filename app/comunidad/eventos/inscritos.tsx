import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { EmptyState } from '@/components/empty-state';
import { ScreenHeader } from '@/components/screen-header';
import { colors } from '@/constants/theme';
import { useAuth } from '@/features/auth/auth-provider';
import { eventPhase, seatsInfo } from '@/features/comunidad/eventos/model';
import { fetchAttendees, fetchEvent, setAttendance, type Attendee } from '@/features/comunidad/eventos/api';
import { useCommunityAction } from '@/features/comunidad/use-action';
import { formatRelativeDate } from '@/utils/format';

export default function AttendeesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const event = useQuery({ queryKey: ['event', id], queryFn: () => fetchEvent(id) });
  const attendees = useQuery({ queryKey: ['attendees', id], queryFn: () => fetchAttendees(id), enabled: Boolean(event.data) });
  const action = useCommunityAction([['attendees', id]]);

  if (event.isLoading || attendees.isLoading) {
    return (
      <SafeAreaView edges={['top']} className="flex-1 bg-canvas">
        <ScreenHeader title="Inscritos" showBack />
        <ActivityIndicator className="mt-10" color={colors.red} />
      </SafeAreaView>
    );
  }
  if (!event.data || event.data.organizer_id !== session?.user.id) {
    return (
      <SafeAreaView edges={['top']} className="flex-1 bg-canvas">
        <ScreenHeader title="Inscritos" showBack />
        <EmptyState icon="lock-closed-outline" title="Solo para quien organiza" description="La lista de inscritos es privada." />
      </SafeAreaView>
    );
  }

  const active = (attendees.data ?? []).filter((item) => item.status === 'active');
  const cancelled = (attendees.data ?? []).filter((item) => item.status === 'cancelled').length;
  const started = eventPhase(event.data) !== 'upcoming';
  const attended = active.filter((item) => item.attended).length;

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-canvas">
      <ScreenHeader title="Inscritos" showBack />
      <FlatList
        data={active}
        keyExtractor={(item) => item.id}
        contentContainerClassName="gap-3 p-5 pb-12"
        refreshing={attendees.isRefetching}
        onRefresh={() => void attendees.refetch()}
        ListHeaderComponent={
          <View className="mb-1 rounded-2xl bg-white p-4">
            <Text className="font-display text-xl text-navy">{event.data.title}</Text>
            <Text className="mt-1 font-sans text-sm text-ink">
              {active.length} {active.length === 1 ? 'inscrito' : 'inscritos'}
              {event.data.capacity ? ` · ${seatsInfo(event.data).text}` : ''}
            </Text>
            {started && <Text className="mt-1 font-sans text-sm text-success">{attended} {attended === 1 ? 'asistió' : 'asistieron'}</Text>}
            {cancelled > 0 && <Text className="mt-1 font-sans text-xs text-muted">{cancelled} cancelaron su inscripción</Text>}
            <Text className="mt-2 font-sans text-xs text-muted">
              {started ? 'Marca quién llegó. Estar inscrito no significa haber asistido.' : 'Podrás marcar la asistencia cuando empiece el evento.'}
            </Text>
            {Boolean(action.error) && <Text accessibilityRole="alert" className="mt-2 font-sans text-sm text-brand">{action.error}</Text>}
          </View>
        }
        ListEmptyComponent={<EmptyState icon="people-outline" title="Aún no hay inscritos" description="Cuando alguien se inscriba aparecerá aquí." />}
        renderItem={({ item }) => <AttendeeRow attendee={item} canMark={started} busy={action.busy} onMark={(value) => void action.run(() => setAttendance(item.id, value))} />}
      />
    </SafeAreaView>
  );
}

function AttendeeRow({ attendee, canMark, busy, onMark }: { attendee: Attendee; canMark: boolean; busy: boolean; onMark: (attended: boolean) => void }) {
  return (
    <View className="flex-row items-center rounded-2xl bg-white p-3">
      <Avatar name={attendee.name} size={42} />
      <View className="ml-3 flex-1">
        <Text className="font-medium text-ink">{attendee.name}</Text>
        <Text className="font-sans text-xs text-muted">Se inscribió {formatRelativeDate(attendee.created_at)}</Text>
      </View>
      {canMark && (
        <View className="flex-row gap-2">
          <AttendanceButton label="Asistió" active={attendee.attended === true} disabled={busy} onPress={() => onMark(true)} />
          <AttendanceButton label="No vino" active={attendee.attended === false} disabled={busy} onPress={() => onMark(false)} />
        </View>
      )}
    </View>
  );
}

function AttendanceButton({ label, active, disabled, onPress }: { label: string; active: boolean; disabled: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      disabled={disabled}
      onPress={onPress}
      className={`rounded-full border px-3 py-2 ${active ? 'border-navy bg-navy' : 'border-line bg-white'}`}
    >
      <Text className={`font-medium text-xs ${active ? 'text-white' : 'text-navy'}`}>{label}</Text>
    </Pressable>
  );
}
