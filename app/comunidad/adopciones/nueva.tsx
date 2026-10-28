import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FormField } from '@/components/form-field';
import { PrimaryButton } from '@/components/primary-button';
import { ScreenHeader } from '@/components/screen-header';
import { colors } from '@/constants/theme';
import { fetchAdoption, saveAdoption } from '@/features/comunidad/adoptions';
import { photoUrl } from '@/features/comunidad/api';
import { ChoiceChips, PhotoPicker, type Photo } from '@/features/comunidad/components';
import { sizeLabels, speciesLabels, validateAdoption, type Adoption } from '@/features/comunidad/model';

export default function AdoptionFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const existing = useQuery({ queryKey: ['adoption', id], queryFn: () => fetchAdoption(id!), enabled: Boolean(id) });

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-canvas">
      <ScreenHeader title={id ? 'Editar ficha' : 'Dar en adopción'} showBack />
      {id && existing.isLoading ? <ActivityIndicator className="mt-10" color={colors.red} /> : <AdoptionForm id={id} adoption={existing.data ?? undefined} />}
    </SafeAreaView>
  );
}

function AdoptionForm({ id, adoption }: { id?: string; adoption?: Adoption }) {
  const cache = useQueryClient();
  const [petName, setPetName] = useState(adoption?.pet_name ?? '');
  const [species, setSpecies] = useState<Adoption['species']>(adoption?.species ?? 'perro');
  const [ageText, setAgeText] = useState(adoption?.age_text ?? '');
  const [size, setSize] = useState<Adoption['size']>(adoption?.size ?? 'mediano');
  const [description, setDescription] = useState(adoption?.description ?? '');
  const [careInfo, setCareInfo] = useState(adoption?.care_info ?? '');
  const [conditions, setConditions] = useState(adoption?.conditions ?? '');
  const [zone, setZone] = useState(adoption?.zone ?? '');
  const [photos, setPhotos] = useState<Photo[]>(adoption?.photos.map((path) => ({ path, uri: photoUrl(path) })) ?? []);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError('');
    try {
      validateAdoption({ petName, ageText, description, conditions, zone, photos: photos.length });
      setBusy(true);
      const savedId = await saveAdoption({ petName, species, ageText, size, description, careInfo, conditions, zone, photos }, id);
      await cache.invalidateQueries({ queryKey: ['adoptions'] });
      await cache.invalidateQueries({ queryKey: ['adoption', savedId] });
      router.replace({ pathname: '/comunidad/adopciones/[id]', params: { id: savedId } });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar la ficha.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="p-5 pb-12">
        <Text className="mb-4 font-sans text-sm leading-5 text-muted">La adopción no tiene precio. Tú revisas las solicitudes y eliges con calma.</Text>
        <FormField label="Nombre del animal" value={petName} onChangeText={setPetName} maxLength={60} />
        <ChoiceChips label="Especie" options={speciesLabels} value={species} onChange={setSpecies} />
        <FormField label="Edad aproximada" value={ageText} onChangeText={setAgeText} maxLength={40} placeholder="Ej. 2 años, 6 meses" />
        <ChoiceChips label="Tamaño" options={sizeLabels} value={size} onChange={setSize} />
        <FormField label="Descripción y comportamiento" value={description} onChangeText={setDescription} maxLength={2000} multiline placeholder="Cómo es, si convive con niños u otros animales…" />
        <FormField label="Cuidados y salud que conoces (opcional)" value={careInfo} onChangeText={setCareInfo} maxLength={1000} multiline placeholder="Vacunas, esterilización, alimentación…" />
        <FormField label="Condiciones de adopción" value={conditions} onChangeText={setConditions} maxLength={1000} multiline placeholder="Ej. Casa con espacio, compromiso de esterilizar" />
        <FormField label="Zona o barrio" value={zone} onChangeText={setZone} maxLength={80} placeholder="Solo la zona, no tu dirección exacta" />
        <PhotoPicker photos={photos} onChange={setPhotos} onError={setError} />
        {Boolean(error) && <Text accessibilityRole="alert" className="mb-3 font-sans text-sm text-brand">{error}</Text>}
        <PrimaryButton label={id ? 'Guardar cambios' : 'Publicar ficha'} loading={busy} onPress={() => void submit()} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
