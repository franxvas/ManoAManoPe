import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';

import { FormField } from '@/components/form-field';
import { PrimaryButton } from '@/components/primary-button';
import { useAuth } from '@/features/auth/auth-provider';

const schema = z.object({
  name: z.string().min(3, 'Ingresa tu nombre completo'), email: z.string().email('Ingresa un correo válido'),
  password: z.string().min(8, 'Usa al menos 8 caracteres'), confirmPassword: z.string(),
}).refine((values) => values.password === values.confirmPassword, { message: 'Las contraseñas no coinciden', path: ['confirmPassword'] });
type FormValues = z.infer<typeof schema>;

export default function SignupScreen() {
  const { signUp } = useAuth();
  const [confirmationSent, setConfirmationSent] = useState(false);
  const { control, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema), defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  });
  const submit = handleSubmit(async ({ name, email, password }) => {
    const result = await signUp(name.trim(), email.trim(), password);
    if (result.error) return setError('root', { message: result.error });
    if (result.needsConfirmation) return setConfirmationSent(true);
    router.replace('/(tabs)');
  });

  return (
    <SafeAreaView className="flex-1 bg-canvas">
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerClassName="px-6 pb-8 pt-5" keyboardShouldPersistTaps="handled">
          <Pressable onPress={() => router.back()}><Text className="font-medium text-navy">← Volver</Text></Pressable>
          <Text className="mt-10 font-display text-3xl text-navy">Crea tu cuenta</Text>
          <Text className="mb-8 mt-2 font-sans text-base text-muted">Únete a la comunidad y haz tu próximo trato.</Text>
          {confirmationSent ? <View className="rounded-2xl bg-green-50 p-5"><Text className="font-medium text-success">Cuenta creada. Revisa tu correo para confirmarla y luego inicia sesión.</Text><Text className="mt-4 font-medium text-brand" onPress={() => router.replace('/(auth)/login')}>Ir a iniciar sesión</Text></View> : <>{(['name', 'email', 'password', 'confirmPassword'] as const).map((name) => (
            <Controller key={name} control={control} name={name} render={({ field }) => (
              <FormField
                label={{ name: 'Nombre completo', email: 'Correo electrónico', password: 'Contraseña', confirmPassword: 'Confirmar contraseña' }[name]}
                autoCapitalize={name === 'email' ? 'none' : undefined}
                keyboardType={name === 'email' ? 'email-address' : undefined}
                secureTextEntry={name.includes('Password') || name === 'password'} value={field.value} onBlur={field.onBlur} onChangeText={field.onChange} error={errors[name]?.message}
              />
            )} />
          ))}
          {errors.root?.message && <Text className="mb-4 rounded-xl bg-red-50 p-3 font-sans text-sm text-brand">{errors.root.message}</Text>}
          <PrimaryButton label="Crear cuenta" loading={isSubmitting} onPress={submit} />
          <Text className="mt-5 text-center font-sans text-muted">Al continuar aceptas los términos y la política de privacidad.</Text>
          </>}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
