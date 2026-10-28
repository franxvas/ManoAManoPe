import { useQuery } from '@tanstack/react-query';
import { Text, View } from 'react-native';

import { PrimaryButton } from '@/components/primary-button';
import { useProtectedAction } from '@/hooks/use-protected-action';
import { registrationClosed } from '../talleres/model';
import { eventPhase, seatsInfo, type CommunityEvent } from './model';
import { cancelRegistration, isRegistered, registerForEvent } from './api';
import { useCommunityAction } from '../use-action';

export function RegistrationPanel({ event, userId }: { event: CommunityEvent; userId?: string }) {
  const protect = useProtectedAction();
  const registered = useQuery({ queryKey: ['event-registration', event.id, userId], queryFn: () => isRegistered(event.id, userId!), enabled: Boolean(userId) });
  const action = useCommunityAction([['event-registration', event.id], ['event', event.id], ['events'], ['workshops']]);
  const finished = eventPhase(event) === 'finished';
  const closed = registrationClosed(event);
  const seats = seatsInfo(event);

  if (!event.requires_registration) {
    return (
      <View className="mt-3 bg-white p-5">
        <Text className="font-medium text-ink">No necesita inscripción</Text>
        <Text className="mt-1 font-sans text-sm text-muted">{finished ? 'Este evento ya finalizó.' : 'Solo acércate en el horario indicado.'}</Text>
      </View>
    );
  }

  return (
    <View className="mt-3 bg-white p-5">
      <Text className="font-display text-xl text-navy">Inscripción</Text>
      <Text className={`mt-1 font-medium text-sm ${seats.full ? 'text-brand' : 'text-success'}`}>{seats.text}</Text>
      {finished ? (
        <Text className="mt-3 font-sans text-sm text-muted">Este evento ya finalizó. Estar inscrito no significa que se haya asistido.</Text>
      ) : event.organizer_id === userId ? (
        <Text className="mt-3 font-sans text-sm text-muted">Eres quien organiza este evento.</Text>
      ) : registered.data ? (
        <>
          <Text className="mt-3 font-sans text-sm text-ink">Ya estás inscrito.</Text>
          <PrimaryButton className="mt-3" variant="outline" label="Cancelar mi inscripción" loading={action.busy} onPress={() => void action.run(() => cancelRegistration(event.id))} />
        </>
      ) : closed ? (
        <Text className="mt-3 font-sans text-sm text-muted">Las inscripciones ya cerraron.</Text>
      ) : (
        <PrimaryButton
          className="mt-3"
          label={seats.full ? 'Sin cupos' : 'Inscribirme'}
          disabled={seats.full || registered.isLoading}
          loading={action.busy}
          onPress={() => protect(() => void action.run(() => registerForEvent(event.id)))}
        />
      )}
      {Boolean(action.error) && <Text accessibilityRole="alert" className="mt-3 font-sans text-sm text-brand">{action.error}</Text>}
    </View>
  );
}
