import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';

import { BrandLogo } from '@/components/brand-logo';
import { FormField } from '@/components/form-field';
import { PrimaryButton } from '@/components/primary-button';
import { useAuth } from '@/features/auth/auth-provider';
import { goBackOr } from '@/utils/navigation';

const schema = z.object({ email: z.string().email('Ingresa un correo válido'), password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres') });
type FormValues = z.infer<typeof schema>;

export default function LoginScreen() {
  const { signIn, backendReady } = useAuth();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const { control, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema), defaultValues: { email: backendReady ? '' : 'demo@manoamano.pe', password: backendReady ? '' : 'demo123' },
  });

  const submit = handleSubmit(async (values) => {
    const result = await signIn(values.email.trim(), values.password);
    if (result.error) {
      setError('root', { message: result.error });
      return;
    }
    router.replace(returnTo ? returnTo as '/(tabs)' : '/(tabs)');
  });

  return (
    <SafeAreaView className="flex-1 bg-canvas">
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerClassName="flex-grow px-6 pb-8 pt-5" keyboardShouldPersistTaps="handled">
          <Pressable onPress={() => goBackOr('/(auth)/welcome')}><Text className="font-medium text-navy">← Volver</Text></Pressable>
          <View className="mt-10"><BrandLogo /></View>
          <Text className="mt-10 font-display text-3xl text-navy">Qué bueno verte</Text>
          <Text className="mb-8 mt-2 font-sans text-base text-muted">Ingresa para publicar, negociar y conversar.</Text>
          <Controller control={control} name="email" render={({ field }) => <FormField label="Correo electrónico" autoCapitalize="none" keyboardType="email-address" value={field.value} onBlur={field.onBlur} onChangeText={field.onChange} error={errors.email?.message} />} />
          <Controller control={control} name="password" render={({ field }) => <FormField label="Contraseña" secureTextEntry value={field.value} onBlur={field.onBlur} onChangeText={field.onChange} error={errors.password?.message} />} />
          <Pressable className="mb-6 self-end" onPress={() => router.push('/(auth)/forgot-password')}><Text className="font-medium text-sm text-brand">¿Olvidaste tu contraseña?</Text></Pressable>
          {errors.root?.message && <Text className="mb-4 rounded-xl bg-red-50 p-3 font-sans text-sm text-brand">{errors.root.message}</Text>}
          <PrimaryButton label="Ingresar" loading={isSubmitting} onPress={submit} />
          <Text className="mt-6 text-center font-sans text-muted">¿Aún no tienes cuenta? <Text className="font-medium text-brand" onPress={() => router.push('/(auth)/signup')}>Regístrate</Text></Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
