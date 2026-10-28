import { useQuery } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { FormField } from '@/components/form-field';
import { PrimaryButton } from '@/components/primary-button';
import { colors } from '@/constants/theme';
import { useProtectedAction } from '@/hooks/use-protected-action';
import { StatusBadge } from './components';
import type { Adoption } from './model';
import {
  applyForAdoption,
  cancelAdoptionProcess,
  completeAdoption,
  fetchAdoptionApplications,
  requestStatusLabels,
  reviewApplication,
  withdrawApplication,
  type AdoptionApplication,
} from './requests';
import { useCommunityAction } from './use-action';

export function AdoptionRequestsPanel({ adoption, userId }: { adoption: Adoption; userId?: string }) {
  const isOwner = adoption.owner_id === userId;
  const applications = useQuery({
    queryKey: ['adoption-applications', adoption.id, userId],
    queryFn: () => fetchAdoptionApplications(adoption.id),
    enabled: Boolean(userId),
  });
  const action = useCommunityAction([['adoption-applications', adoption.id], ['adoption', adoption.id], ['adoptions']]);

  if (userId && applications.isLoading) return <ActivityIndicator className="my-6" color={colors.red} />;
  const list = applications.data ?? [];
  const errorText = Boolean(action.error) && <Text accessibilityRole="alert" className="mt-3 font-sans text-sm text-brand">{action.error}</Text>;

  if (isOwner) {
    const accepted = list.find((item) => item.status === 'accepted');
    const open = list.filter((item) => item.status === 'pending' || item.status === 'evaluating');
    const canDecide = adoption.status === 'seeking' || adoption.status === 'evaluating';
    return (
      <View className="mt-3 bg-white p-5">
        <Text className="font-display text-xl text-navy">Solicitudes de adopción</Text>
        <Text className="mt-1 font-sans text-xs text-muted">Los datos de cada persona son privados. Revisa con calma: la primera no gana automáticamente.</Text>
        {accepted && (
          <View className="mt-4 rounded-2xl bg-amber-50 p-4">
            <Text className="font-medium text-ink">Adopción acordada con {accepted.applicant_name}</Text>
            <Text className="mt-1 font-sans text-xs text-muted">Confirma solo cuando {adoption.pet_name} ya esté en su nuevo hogar.</Text>
            <PrimaryButton className="mt-3" label="Confirmar entrega" loading={action.busy} onPress={() => void action.run(() => completeAdoption(adoption.id))} />
            <PrimaryButton className="mt-2" variant="outline" label="Cancelar proceso" disabled={action.busy} onPress={() => void action.run(() => cancelAdoptionProcess(adoption.id))} />
          </View>
        )}
        {adoption.status === 'adopted' && <Text className="mt-4 font-sans text-sm text-success">¡{adoption.pet_name} ya tiene un hogar!</Text>}
        {canDecide && open.length === 0 && <Text className="mt-4 font-sans text-sm text-muted">Todavía no hay solicitudes.</Text>}
        {open.map((application) => (
          <ApplicationCard key={application.id} application={application}>
            {canDecide && (
              <View className="mt-3 gap-2">
                {application.status === 'pending' && (
                  <PrimaryButton className="h-11" variant="outline" label="Pasar a evaluación" disabled={action.busy} onPress={() => void action.run(() => reviewApplication(application.id, 'evaluate'))} />
                )}
                <PrimaryButton className="h-11" variant="secondary" label="Acordar adopción" disabled={action.busy} onPress={() => void action.run(() => reviewApplication(application.id, 'agree'))} />
                <PrimaryButton className="h-11" variant="outline" label="No seleccionar" disabled={action.busy} onPress={() => void action.run(() => reviewApplication(application.id, 'decline'))} />
              </View>
            )}
          </ApplicationCard>
        ))}
        {errorText}
      </View>
    );
  }

  const mine = list.find((item) => ['pending', 'evaluating', 'accepted', 'completed'].includes(item.status));
  return (
    <View className="mt-3 bg-white p-5">
      {mine ? (
        <>
          <Text className="font-display text-xl text-navy">Tu solicitud</Text>
          <View className="mt-2">
            <StatusBadge label={requestStatusLabels[mine.status]} tone={mine.status === 'accepted' ? 'amber' : mine.status === 'completed' ? 'green' : 'navy'} />
          </View>
          {mine.status === 'accepted' && <Text className="mt-2 font-sans text-sm text-ink">¡Acordaron la adopción! Coordina la entrega con quien publicó.</Text>}
          {(mine.status === 'pending' || mine.status === 'evaluating') && (
            <PrimaryButton className="mt-3" variant="outline" label="Retirar solicitud" disabled={action.busy} onPress={() => void action.run(() => withdrawApplication(mine.id))} />
          )}
          {mine.status === 'accepted' && (
            <PrimaryButton className="mt-3" variant="outline" label="Cancelar proceso" disabled={action.busy} onPress={() => void action.run(() => cancelAdoptionProcess(adoption.id))} />
          )}
        </>
      ) : adoption.status === 'seeking' || adoption.status === 'evaluating' ? (
        <ApplicationForm petName={adoption.pet_name} busy={action.busy} onSend={(answers) => action.run(() => applyForAdoption(adoption.id, answers))} />
      ) : (
        <Text className="font-sans text-sm text-muted">{adoption.status === 'agreed' ? 'Ya se acordó la adopción con otra persona.' : `${adoption.pet_name} ya fue adoptado.`}</Text>
      )}
      {errorText}
    </View>
  );
}

function ApplicationCard({ application, children }: { application: AdoptionApplication; children: ReactNode }) {
  return (
    <View className="mt-3 rounded-2xl border border-line p-4">
      <View className="flex-row items-center justify-between">
        <Text className="font-medium text-ink">{application.applicant_name}</Text>
        <StatusBadge label={requestStatusLabels[application.status]} tone={application.status === 'evaluating' ? 'navy' : 'gray'} />
      </View>
      <Answer label="Dónde vivirá" value={application.housing} />
      <Answer label="Otros animales" value={application.other_pets} />
      <Answer label="Quién lo cuidará" value={application.daily_care} />
      <Answer label="Experiencia" value={application.experience} />
      <Answer label="Mensaje" value={application.message} />
      {children}
    </View>
  );
}

function Answer({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <Text className="mt-2 font-sans text-sm leading-5 text-ink">
      <Text className="text-muted">{label}: </Text>
      {value}
    </Text>
  );
}

function ApplicationForm({ petName, busy, onSend }: { petName: string; busy: boolean; onSend: (answers: { housing: string; otherPets: string; dailyCare: string; experience: string; message: string }) => Promise<boolean> }) {
  const protect = useProtectedAction();
  const [open, setOpen] = useState(false);
  const [housing, setHousing] = useState('');
  const [otherPets, setOtherPets] = useState('');
  const [dailyCare, setDailyCare] = useState('');
  const [experience, setExperience] = useState('');
  const [message, setMessage] = useState('');
  const complete = [housing, otherPets, dailyCare, experience].every((answer) => answer.trim().length >= 2);

  if (!open) return <PrimaryButton label="Quiero adoptar" onPress={() => protect(() => setOpen(true))} />;
  return (
    <>
      <Text className="mb-3 font-display text-xl text-navy">Cuéntanos sobre el hogar para {petName}</Text>
      <FormField label="¿Dónde vivirá? (casa, departamento, patio…)" value={housing} onChangeText={setHousing} maxLength={500} />
      <FormField label="¿Tienes otros animales?" value={otherPets} onChangeText={setOtherPets} maxLength={500} />
      <FormField label="¿Quién lo cuidará y cuánto tiempo pasará solo?" value={dailyCare} onChangeText={setDailyCare} maxLength={500} multiline />
      <FormField label="¿Has tenido mascotas antes?" value={experience} onChangeText={setExperience} maxLength={500} />
      <FormField label="Mensaje (opcional)" value={message} onChangeText={setMessage} maxLength={500} multiline />
      <Text className="mb-3 font-sans text-xs text-muted">Solo quien publicó verá tus respuestas.</Text>
      <PrimaryButton label="Enviar solicitud" loading={busy} disabled={!complete} onPress={() => void onSend({ housing, otherPets, dailyCare, experience, message }).then((sent) => sent && setOpen(false))} />
    </>
  );
}
