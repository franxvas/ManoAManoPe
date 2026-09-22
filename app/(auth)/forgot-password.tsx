import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';

import { FormField } from '@/components/form-field';
import { PrimaryButton } from '@/components/primary-button';
import { useAuth } from '@/features/auth/auth-provider';

const schema = z.object({ email: z.string().email('Ingresa un correo válido') });

export default function ForgotPasswordScreen() {
  const { recoverPassword } = useAuth();
  const [sent, setSent] = useState(false);
  const { control, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { email: '' } });
  const submit = handleSubmit(async ({ email }) => {
    const result = await recoverPassword(email.trim());
    if (result.error) return setError('root', { message: result.error });
    setSent(true);
  });
  return (
    <SafeAreaView className="flex-1 bg-canvas px-6 pt-5">
      <Pressable onPress={() => router.back()}><Text className="font-medium text-navy">← Volver</Text></Pressable>
      <View className="mt-16 rounded-3xl bg-white p-6">
        <Text className="font-display text-3xl text-navy">Recupera tu acceso</Text>
        <Text className="mb-8 mt-3 font-sans leading-6 text-muted">Te enviaremos un enlace seguro para cambiar tu contraseña.</Text>
        {sent ? (
          <View className="rounded-2xl bg-green-50 p-5"><Text className="font-medium text-success">Revisa tu correo. El enlace ya fue enviado.</Text></View>
        ) : (
          <>
            <Controller control={control} name="email" render={({ field }) => <FormField label="Correo electrónico" autoCapitalize="none" keyboardType="email-address" value={field.value} onChangeText={field.onChange} error={errors.email?.message} />} />
            {errors.root?.message && <Text className="mb-4 text-brand">{errors.root.message}</Text>}
            <PrimaryButton label="Enviar enlace" loading={isSubmitting} onPress={submit} />
          </>
        )}
      </View>
    </SafeAreaView>
  );
}
