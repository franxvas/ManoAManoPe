import { zodResolver } from '@hookform/resolvers/zod';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';

import { Avatar } from '@/components/avatar';
import { FormField } from '@/components/form-field';
import { PrimaryButton } from '@/components/primary-button';
import { ScreenHeader } from '@/components/screen-header';
import { useProfile } from '@/hooks/use-profile';
import { isSupabaseConfigured } from '@/lib/supabase';
import { uploadRemoteAvatar, uploadRemoteCover } from '@/services/profile';
import type { Profile } from '@/types/domain';

const schema = z.object({
  displayName: z.string().min(3, 'Ingresa tu nombre'), profession: z.string().min(2, 'Ingresa tu ocupación'), bio: z.string().max(300, 'Máximo 300 caracteres'),
  phone: z.string().optional(), city: z.string().min(2, 'Ingresa tu ciudad'), region: z.string().min(2, 'Ingresa tu región'), serviceArea: z.string().optional(), availability: z.string().optional(), avatarUrl: z.string(), coverUrl: z.string().optional(),
});
type Values = z.infer<typeof schema>;

export default function EditProfileScreen() {
  const { profile, updateProfile } = useProfile();
  if (!profile) return <SafeAreaView className="flex-1 items-center justify-center bg-canvas"><Text className="font-medium text-navy">Cargando perfil…</Text></SafeAreaView>;
  return <EditProfileForm profile={profile} updateProfile={updateProfile} />;
}

function EditProfileForm({ profile, updateProfile }: { profile: Profile; updateProfile: (changes: Partial<Profile>) => Promise<void> }) {
  const [submitError, setSubmitError] = useState('');
  const { control, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: profile });
  const avatarUrl = useWatch({ control, name: 'avatarUrl' });
  const coverUrl = useWatch({ control, name: 'coverUrl' });
  const chooseAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (!result.canceled && result.assets[0]) setValue('avatarUrl', result.assets[0].uri, { shouldDirty: true });
  };
  const chooseCover = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [16, 7], quality: 0.8 });
    if (!result.canceled && result.assets[0]) setValue('coverUrl', result.assets[0].uri, { shouldDirty: true });
  };
  const submit = handleSubmit(async (values) => {
    try {
      const avatarUrl = isSupabaseConfigured && !values.avatarUrl.startsWith('http') ? await uploadRemoteAvatar(values.avatarUrl) : values.avatarUrl;
      const coverUrl = isSupabaseConfigured && values.coverUrl && !values.coverUrl.startsWith('http') ? await uploadRemoteCover(values.coverUrl) : values.coverUrl;
      await updateProfile({ ...values, avatarUrl, coverUrl });
      router.back();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'No se pudo actualizar el perfil.');
    }
  });
  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-canvas">
      <ScreenHeader title="Editar perfil" showBack />
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerClassName="px-5 pb-10 pt-5" keyboardShouldPersistTaps="handled">
          <Pressable onPress={() => void chooseCover()} className="mb-4 h-32 overflow-hidden rounded-2xl bg-navy">{coverUrl ? <Image source={{ uri: coverUrl }} className="h-full w-full opacity-70" contentFit="cover" /> : null}<View className="absolute inset-0 items-center justify-center"><Text className="rounded-full bg-white/90 px-4 py-2 font-medium text-xs text-navy">Cambiar portada</Text></View></Pressable>
          <Pressable onPress={() => void chooseAvatar()} className="mb-7 items-center"><Avatar uri={avatarUrl} name={profile.displayName} size={96} /><Text className="mt-2 font-medium text-sm text-brand">Cambiar foto</Text></Pressable>
          <Controller control={control} name="displayName" render={({ field }) => <FormField label="Nombre" value={field.value} onChangeText={field.onChange} error={errors.displayName?.message} />} />
          <Controller control={control} name="profession" render={({ field }) => <FormField label="Profesión u ocupación" value={field.value} onChangeText={field.onChange} error={errors.profession?.message} />} />
          <Controller control={control} name="bio" render={({ field }) => <FormField label="Biografía" multiline value={field.value} onChangeText={field.onChange} error={errors.bio?.message} />} />
          <Controller control={control} name="phone" render={({ field }) => <FormField label="Teléfono (opcional)" keyboardType="phone-pad" value={field.value} onChangeText={field.onChange} />} />
          <View className="flex-row gap-3"><View className="flex-1"><Controller control={control} name="city" render={({ field }) => <FormField label="Ciudad" value={field.value} onChangeText={field.onChange} error={errors.city?.message} />}/></View><View className="flex-1"><Controller control={control} name="region" render={({ field }) => <FormField label="Región" value={field.value} onChangeText={field.onChange} error={errors.region?.message} />}/></View></View>
          <Controller control={control} name="serviceArea" render={({ field }) => <FormField label="Zona de atención" value={field.value} onChangeText={field.onChange} />} />
          <Controller control={control} name="availability" render={({ field }) => <FormField label="Disponibilidad" value={field.value} onChangeText={field.onChange} />} />
          {Boolean(submitError) && <Text className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-brand">{submitError}</Text>}
          <PrimaryButton label="Guardar cambios" loading={isSubmitting} onPress={submit} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
