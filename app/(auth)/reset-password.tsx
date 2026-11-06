import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';

import { FormField } from '@/components/form-field';
import { PrimaryButton } from '@/components/primary-button';
import { ScreenHeader } from '@/components/screen-header';
import { useAuth } from '@/features/auth/auth-provider';
import { supabase } from '@/lib/supabase';

const schema = z
  .object({
    password: z.string().min(8, 'Usa al menos 8 caracteres'),
    confirmation: z.string(),
  })
  .refine((v) => v.password === v.confirmation, {
    path: ['confirmation'],
    message: 'Las contraseñas no coinciden',
  });

export default function ResetPasswordScreen() {
  const { session } = useAuth();
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { password: '', confirmation: '' },
  });

  const submit = handleSubmit(async ({ password }) => {
    if (!supabase) {
      setError('root', { message: 'Conecta Supabase para cambiar una contraseña real.' });
      return;
    }
    // La sesión de PASSWORD_RECOVERY ya está activa gracias al AuthProvider.
    // updateUser actualiza la contraseña con esa sesión temporal y luego
    // Supabase emite SIGNED_IN con la sesión definitiva.
    if (!session) {
      setError('root', { message: 'El enlace de recuperación ha expirado. Solicita uno nuevo.' });
      return;
    }
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError('root', { message: error.message });
      return;
    }
    // Tras actualizar la contraseña el usuario queda autenticado normalmente.
    router.replace('/(tabs)');
  });

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-canvas">
      <ScreenHeader title="Nueva contraseña" showBack backFallback="/(auth)/welcome" />
      <View className="m-6 rounded-3xl bg-white p-6">
        <Text className="font-display text-3xl text-navy">Nueva contraseña</Text>
        <Text className="mb-7 mt-2 font-sans text-muted">
          Elige una contraseña segura para tu cuenta.
        </Text>
        <Controller
          control={control}
          name="password"
          render={({ field }) => (
            <FormField
              label="Nueva contraseña"
              secureTextEntry
              value={field.value}
              onChangeText={field.onChange}
              error={errors.password?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="confirmation"
          render={({ field }) => (
            <FormField
              label="Confirmar contraseña"
              secureTextEntry
              value={field.value}
              onChangeText={field.onChange}
              error={errors.confirmation?.message}
            />
          )}
        />
        {errors.root?.message && (
          <Text className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-brand">
            {errors.root.message}
          </Text>
        )}
        <PrimaryButton label="Guardar contraseña" loading={isSubmitting} onPress={submit} />
      </View>
    </SafeAreaView>
  );
}
