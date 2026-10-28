import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FormField } from '@/components/form-field';
import { PrimaryButton } from '@/components/primary-button';
import { ScreenHeader } from '@/components/screen-header';
import { colors } from '@/constants/theme';
import { photoUrl } from '@/features/comunidad/api';
import { ChoiceChips, PhotoPicker, type Photo } from '@/features/comunidad/components';
import { fetchDonation, saveDonation } from '@/features/comunidad/donations';
import { conditionLabels, validateDonation, type Donation } from '@/features/comunidad/model';

export default function DonationFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const existing = useQuery({ queryKey: ['donation', id], queryFn: () => fetchDonation(id!), enabled: Boolean(id) });

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-canvas">
      <ScreenHeader title={id ? 'Editar donación' : 'Donar algo'} showBack />
      {id && existing.isLoading ? <ActivityIndicator className="mt-10" color={colors.red} /> : <DonationForm id={id} donation={existing.data ?? undefined} />}
    </SafeAreaView>
  );
}

function DonationForm({ id, donation }: { id?: string; donation?: Donation }) {
  const cache = useQueryClient();
  const [title, setTitle] = useState(donation?.title ?? '');
  const [description, setDescription] = useState(donation?.description ?? '');
  const [condition, setCondition] = useState<Donation['condition']>(donation?.condition ?? 'buen_estado');
  const [quantity, setQuantity] = useState(String(donation?.quantity ?? 1));
  const [zone, setZone] = useState(donation?.zone ?? '');
  const [pickupTerms, setPickupTerms] = useState(donation?.pickup_terms ?? '');
  const [photos, setPhotos] = useState<Photo[]>(donation?.photos.map((path) => ({ path, uri: photoUrl(path) })) ?? []);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError('');
    try {
      validateDonation({ title, zone, pickupTerms, quantity, photos: photos.length });
      setBusy(true);
      const savedId = await saveDonation({ title, description, condition, quantity: Number(quantity), zone, pickupTerms, photos }, id);
      await cache.invalidateQueries({ queryKey: ['donations'] });
      await cache.invalidateQueries({ queryKey: ['donation', savedId] });
      router.replace({ pathname: '/comunidad/donaciones/[id]', params: { id: savedId } });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar la donación.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="p-5 pb-12">
        <Text className="mb-4 font-sans text-sm leading-5 text-muted">Las donaciones son gratis: no se pone precio ni se negocia.</Text>
        <FormField label="¿Qué donas?" value={title} onChangeText={setTitle} maxLength={100} placeholder="Ej. Mesa de madera en buen estado" />
        <FormField label="Detalles (opcional)" value={description} onChangeText={setDescription} maxLength={1000} multiline placeholder="Medidas, color, si tiene algún detalle…" />
        <ChoiceChips label="Estado" options={conditionLabels} value={condition} onChange={setCondition} />
        <FormField label="Cantidad" value={quantity} onChangeText={setQuantity} keyboardType="number-pad" maxLength={3} />
        <FormField label="Zona o barrio" value={zone} onChangeText={setZone} maxLength={80} placeholder="Ej. Centro de Bagua" />
        <FormField label="Condiciones y horario de recojo" value={pickupTerms} onChangeText={setPickupTerms} maxLength={500} multiline placeholder="Ej. Se recoge por el centro, sábados de 9 a 12" />
        <PhotoPicker photos={photos} onChange={setPhotos} onError={setError} />
        {Boolean(error) && <Text accessibilityRole="alert" className="mb-3 font-sans text-sm text-brand">{error}</Text>}
        <PrimaryButton label={id ? 'Guardar cambios' : 'Publicar donación'} loading={busy} onPress={() => void submit()} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
