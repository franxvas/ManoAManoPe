import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { FormField } from '@/components/form-field';
import { PrimaryButton } from '@/components/primary-button';
import { colors } from '@/constants/theme';
import { useProtectedAction } from '@/hooks/use-protected-action';
import { StatusBadge } from '../components';
import { requestStatusLabels } from '../solicitudes';
import { useCommunityAction } from '../use-action';
import {
  cancelDonationAgreement,
  fetchDonationRequests,
  markDonationDelivered,
  requestDonation,
  selectDonationRequest,
  withdrawDonationRequest,
} from './api';
import type { Donation, DonationRequest } from './model';

export function DonationRequestsPanel({ donation, userId }: { donation: Donation; userId?: string }) {
  const isOwner = donation.owner_id === userId;
  const requests = useQuery({
    queryKey: ['donation-requests', donation.id, userId],
    queryFn: () => fetchDonationRequests(donation.id),
    enabled: Boolean(userId),
  });
  const action = useCommunityAction([['donation-requests', donation.id], ['donation', donation.id], ['donations']]);

  if (userId && requests.isLoading) return <ActivityIndicator className="my-6" color={colors.red} />;
  const list = requests.data ?? [];

  if (isOwner) {
    const selected = list.find((item) => item.status === 'selected');
    const pending = list.filter((item) => item.status === 'pending');
    return (
      <View className="mt-3 bg-white p-5">
        <Text className="font-display text-xl text-navy">Solicitudes ({pending.length + (selected ? 1 : 0)})</Text>
        <Text className="mt-1 font-sans text-xs text-muted">Solo tú ves estos mensajes.</Text>
        {selected && (
          <View className="mt-4 rounded-2xl bg-amber-50 p-4">
            <Text className="font-medium text-ink">Reservado para {selected.requester_name}</Text>
            <Text className="mt-1 font-sans text-sm text-muted">“{selected.message}”</Text>
            <Text className="mt-2 font-sans text-xs text-muted">Márcalo como entregado solo cuando la persona ya lo haya recogido.</Text>
            <PrimaryButton className="mt-3" label="Marcar como entregado" loading={action.busy} onPress={() => void action.run(() => markDonationDelivered(donation.id))} />
            <PrimaryButton className="mt-2" variant="outline" label="Cancelar acuerdo y volver a disponible" disabled={action.busy} onPress={() => void action.run(() => cancelDonationAgreement(donation.id))} />
          </View>
        )}
        {donation.status === 'available' && pending.length === 0 && <Text className="mt-4 font-sans text-sm text-muted">Todavía nadie la ha solicitado.</Text>}
        {pending.map((request) => (
          <View key={request.id} className="mt-3 rounded-2xl border border-line p-4">
            <Text className="font-medium text-ink">{request.requester_name}</Text>
            <Text className="mt-1 font-sans text-sm leading-5 text-ink">“{request.message}”</Text>
            {donation.status === 'available' && (
              <PrimaryButton className="mt-3 h-11" variant="secondary" label="Elegir a esta persona" disabled={action.busy} onPress={() => void action.run(() => selectDonationRequest(request.id))} />
            )}
          </View>
        ))}
        {Boolean(action.error) && <Text accessibilityRole="alert" className="mt-3 font-sans text-sm text-brand">{action.error}</Text>}
      </View>
    );
  }

  const mine = list.find((item) => item.status === 'pending' || item.status === 'selected') ?? list.at(-1);
  return (
    <View className="mt-3 bg-white p-5">
      {mine && ['pending', 'selected', 'delivered'].includes(mine.status) ? (
        <MyRequest
          status={mine.status}
          message={mine.message}
          busy={action.busy}
          onWithdraw={() => void action.run(() => withdrawDonationRequest(mine.id))}
          onCancel={() => void action.run(() => cancelDonationAgreement(donation.id))}
        />
      ) : donation.status === 'available' ? (
        <RequestForm busy={action.busy} onSend={(message) => action.run(() => requestDonation(donation.id, message))} />
      ) : (
        <Text className="font-sans text-sm text-muted">{donation.status === 'reserved' ? 'Ya está reservada para otra persona.' : 'Esta donación ya fue entregada.'}</Text>
      )}
      {Boolean(action.error) && <Text accessibilityRole="alert" className="mt-3 font-sans text-sm text-brand">{action.error}</Text>}
    </View>
  );
}

function MyRequest({ status, message, busy, onWithdraw, onCancel }: { status: DonationRequest['status']; message: string; busy: boolean; onWithdraw: () => void; onCancel: () => void }) {
  return (
    <>
      <Text className="font-display text-xl text-navy">Tu solicitud</Text>
      <View className="mt-2">
        <StatusBadge label={requestStatusLabels[status]} tone={status === 'selected' ? 'amber' : status === 'delivered' ? 'green' : 'navy'} />
      </View>
      <Text className="mt-2 font-sans text-sm text-muted">“{message}”</Text>
      {status === 'selected' && <Text className="mt-2 font-sans text-sm text-ink">¡Te eligieron! Coordina el recojo con quien dona.</Text>}
      {status === 'pending' && <PrimaryButton className="mt-3" variant="outline" label="Retirar solicitud" disabled={busy} onPress={onWithdraw} />}
      {status === 'selected' && <PrimaryButton className="mt-3" variant="outline" label="Ya no la necesito" disabled={busy} onPress={onCancel} />}
    </>
  );
}

function RequestForm({ busy, onSend }: { busy: boolean; onSend: (message: string) => Promise<boolean> }) {
  const protect = useProtectedAction();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  if (!open) return <PrimaryButton label="Solicitar donación" onPress={() => protect(() => setOpen(true))} />;
  return (
    <>
      <FormField label="Escribe un mensaje corto" value={message} onChangeText={setMessage} maxLength={300} multiline placeholder="Cuéntale para qué lo necesitas y cuándo podrías recogerlo" />
      <PrimaryButton label="Enviar solicitud" loading={busy} disabled={message.trim().length < 5} onPress={() => void onSend(message).then((sent) => sent && setOpen(false))} />
    </>
  );
}
