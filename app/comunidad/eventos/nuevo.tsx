import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FormField } from '@/components/form-field';
import { PrimaryButton } from '@/components/primary-button';
import { ScreenHeader } from '@/components/screen-header';
import { colors } from '@/constants/theme';
import { photoUrl } from '@/features/comunidad/api';
import { ChoiceChips, PhotoPicker, type Photo } from '@/features/comunidad/components';
import { DayStrip, nextDays } from '@/features/comunidad/event-components';
import {
  categoryLabels,
  dayKey,
  deadlineFrom,
  levelLabels,
  modalityLabels,
  parseCapacity,
  timeText,
  validateEvent,
  validateWorkshop,
  type CommunityEvent,
} from '@/features/comunidad/event-model';
import { fetchEvent, saveEvent } from '@/features/comunidad/events';

const costOptions = { free: 'Gratuito', paid: 'Tiene un costo' };
const registrationOptions = { no: 'No, entrada libre', yes: 'Sí, con inscripción' };

export default function EventFormScreen() {
  const { id, kind } = useLocalSearchParams<{ id?: string; kind?: CommunityEvent['kind'] }>();
  const existing = useQuery({ queryKey: ['event', id], queryFn: () => fetchEvent(id!), enabled: Boolean(id) });
  const isWorkshop = (existing.data?.kind ?? kind) === 'workshop';
  const noun = isWorkshop ? 'taller' : 'evento';

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-canvas">
      <ScreenHeader title={id ? `Editar ${noun}` : `Nuevo ${noun}`} showBack />
      {id && existing.isLoading ? (
        <ActivityIndicator className="mt-10" color={colors.red} />
      ) : (
        <EventForm id={id} event={existing.data ?? undefined} isWorkshop={isWorkshop} />
      )}
    </SafeAreaView>
  );
}

function EventForm({ id, event, isWorkshop }: { id?: string; event?: CommunityEvent; isWorkshop: boolean }) {
  const cache = useQueryClient();
  const days = useMemo(() => nextDays(60), []);
  const start = event ? new Date(event.starts_at) : undefined;
  const [category, setCategory] = useState<keyof typeof categoryLabels>(event && event.category !== 'taller' ? event.category : 'campana');
  const [title, setTitle] = useState(event?.title ?? '');
  const [organizerName, setOrganizerName] = useState(event?.organizer_name ?? '');
  const [description, setDescription] = useState(event?.description ?? '');
  const [day, setDay] = useState(start ? dayKey(start) : '');
  const [startTime, setStartTime] = useState(start ? timeText(start) : '');
  const [endTime, setEndTime] = useState(event ? timeText(new Date(event.ends_at)) : '');
  const [place, setPlace] = useState(event?.place ?? '');
  const [photos, setPhotos] = useState<Photo[]>(event?.photo ? [{ path: event.photo, uri: photoUrl(event.photo) }] : []);
  const [cost, setCost] = useState<keyof typeof costOptions>(event && !event.is_free ? 'paid' : 'free');
  const [costNote, setCostNote] = useState(event?.cost_note ?? '');
  const [requirements, setRequirements] = useState(event?.requirements ?? '');
  const [registration, setRegistration] = useState<keyof typeof registrationOptions>(event?.requires_registration ? 'yes' : 'no');
  const [capacity, setCapacity] = useState(event?.capacity ? String(event.capacity) : '');
  const [topic, setTopic] = useState(event?.topic ?? '');
  const [instructor, setInstructor] = useState(event?.instructor ?? '');
  const [level, setLevel] = useState<keyof typeof levelLabels>(event?.level ?? 'basico');
  const [modality, setModality] = useState<keyof typeof modalityLabels>(event?.modality ?? 'presencial');
  const [materials, setMaterials] = useState(event?.materials ?? '');
  const [deadlineDay, setDeadlineDay] = useState(event?.registration_deadline ? dayKey(new Date(event.registration_deadline)) : '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError('');
    try {
      const isFree = cost === 'free';
      const dates = validateEvent({ title, organizerName, description, place, day, startTime, endTime, isFree, costNote });
      const requiresRegistration = isWorkshop || registration === 'yes';
      const workshop = isWorkshop
        ? {
            kind: 'workshop' as const,
            category: 'taller' as const,
            capacity: validateWorkshop({ topic, instructor, capacity }),
            topic: topic.trim(),
            instructor: instructor.trim(),
            level,
            modality,
            materials: materials.trim(),
            registration_deadline: deadlineFrom(deadlineDay, dates.start).toISOString(),
          }
        : { kind: 'event' as const, category, capacity: requiresRegistration ? parseCapacity(capacity) : null };
      setBusy(true);
      const savedId = await saveEvent(
        {
          title: title.trim(),
          organizer_name: organizerName.trim(),
          description: description.trim(),
          starts_at: dates.start.toISOString(),
          ends_at: dates.end.toISOString(),
          place: place.trim(),
          photo: photos[0] ?? null,
          is_free: isFree,
          cost_note: isFree ? '' : costNote.trim(),
          requirements: requirements.trim(),
          requires_registration: requiresRegistration,
          ...workshop,
        },
        id,
      );
      await cache.invalidateQueries({ queryKey: [isWorkshop ? 'workshops' : 'events'] });
      await cache.invalidateQueries({ queryKey: ['event', savedId] });
      router.replace({ pathname: '/comunidad/eventos/[id]', params: { id: savedId } });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="p-5 pb-12">
        {!isWorkshop && <ChoiceChips label="Tipo" options={categoryLabels} value={category} onChange={setCategory} />}
        <FormField label="Nombre" value={title} onChangeText={setTitle} maxLength={100} placeholder={isWorkshop ? 'Ej. Taller básico de reparación de bicicletas' : 'Ej. Campaña de evaluación visual'} />
        {isWorkshop && (
          <>
            <FormField label="Tema" value={topic} onChangeText={setTopic} maxLength={100} placeholder="Ej. Mecánica de bicicletas" />
            <FormField label="Instructor" value={instructor} onChangeText={setInstructor} maxLength={100} />
            <ChoiceChips label="Nivel" options={levelLabels} value={level} onChange={setLevel} />
            <ChoiceChips label="Modalidad" options={modalityLabels} value={modality} onChange={setModality} />
          </>
        )}
        <FormField label="Organizador" value={organizerName} onChangeText={setOrganizerName} maxLength={100} placeholder="Persona, institución o grupo" />
        <FormField label="Descripción" value={description} onChangeText={setDescription} maxLength={2000} multiline />
        <Text className="mb-2 font-medium text-sm text-ink">Día</Text>
        <DayStrip days={days} selected={day} onSelect={setDay} />
        <View className="mt-4 flex-row gap-3">
          <View className="flex-1">
            <FormField label="Hora de inicio" value={startTime} onChangeText={setStartTime} maxLength={5} placeholder="09:00" />
          </View>
          <View className="flex-1">
            <FormField label="Hora de fin" value={endTime} onChangeText={setEndTime} maxLength={5} placeholder="13:00" />
          </View>
        </View>
        <FormField
          label={isWorkshop && modality === 'virtual' ? 'Plataforma o enlace' : 'Lugar'}
          value={place}
          onChangeText={setPlace}
          maxLength={200}
          placeholder={isWorkshop && modality === 'virtual' ? 'Ej. Google Meet, el enlace se envía a inscritos' : 'Ej. Plaza de Armas de Bagua'}
        />
        {isWorkshop && <FormField label="Materiales necesarios (opcional)" value={materials} onChangeText={setMaterials} maxLength={500} multiline placeholder="Ej. Traer tu bicicleta y una llave inglesa" />}
        <PhotoPicker label="Imagen (opcional)" max={1} photos={photos} onChange={setPhotos} onError={setError} />
        <ChoiceChips label="Costo" options={costOptions} value={cost} onChange={setCost} />
        {cost === 'paid' && <FormField label="¿Cuánto cuesta?" value={costNote} onChangeText={setCostNote} maxLength={100} placeholder="Ej. S/ 5 por persona, se paga en el lugar" />}
        <FormField label="Requisitos (opcional)" value={requirements} onChangeText={setRequirements} maxLength={500} multiline placeholder="Ej. Traer DNI, ropa cómoda" />
        {isWorkshop ? (
          <>
            <FormField label="Cupos" value={capacity} onChangeText={setCapacity} keyboardType="number-pad" maxLength={4} placeholder="Ej. 15" />
            <Text className="mb-2 font-medium text-sm text-ink">Cierre de inscripción</Text>
            <DayStrip days={days} selected={deadlineDay} onSelect={setDeadlineDay} />
            <View className="h-4" />
          </>
        ) : (
          <>
            <ChoiceChips label="¿Necesita inscripción?" options={registrationOptions} value={registration} onChange={setRegistration} />
            {registration === 'yes' && (
              <FormField label="Capacidad (opcional)" value={capacity} onChangeText={setCapacity} keyboardType="number-pad" maxLength={4} placeholder="Déjalo vacío si no hay límite" />
            )}
          </>
        )}
        {Boolean(error) && <Text accessibilityRole="alert" className="mb-3 font-sans text-sm text-brand">{error}</Text>}
        <PrimaryButton label={id ? 'Guardar cambios' : isWorkshop ? 'Publicar taller' : 'Publicar evento'} loading={busy} onPress={() => void submit()} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
