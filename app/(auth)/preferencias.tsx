import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/primary-button';
import { colors } from '@/constants/theme';
import { guardarIntereses, intereses, type InteresId } from '@/features/preferencias/intereses';

export default function PreferenciasScreen() {
  const [elegidos, setElegidos] = useState<InteresId[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const toggle = (id: InteresId) => setElegidos((now) => (now.includes(id) ? now.filter((item) => item !== id) : [...now, id]));
  const entrar = () => router.replace('/(tabs)');

  const guardar = async () => {
    setSaving(true);
    try {
      await guardarIntereses(elegidos);
      entrar();
    } catch {
      setError('No pudimos guardar tus preferencias. Inténtalo otra vez u omite este paso.');
      setSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-canvas">
      <ScrollView contentContainerClassName="px-6 pb-8 pt-5">
        <Pressable accessibilityRole="button" onPress={entrar} className="self-end p-2">
          <Text className="font-medium text-muted">Omitir</Text>
        </Pressable>
        <Text className="mt-2 font-display text-2xl text-ink">¿Qué te interesa?</Text>
        <Text className="mb-6 mt-2 font-sans text-sm leading-5 text-muted">Elige tus intereses y te mostraremos primero las promociones que van contigo. Puedes elegir varios.</Text>

        <View className="gap-3">
          {intereses.map((item) => {
            const on = elegidos.includes(item.id);
            return (
              <Pressable
                key={item.id}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: on }}
                onPress={() => toggle(item.id)}
                className={`min-h-14 flex-row items-center gap-3 rounded-2xl border px-4 ${on ? 'border-brand bg-red-50' : 'border-line bg-white'}`}
              >
                <Ionicons name={item.icon} size={22} color={on ? colors.red : colors.muted} />
                <Text className="flex-1 font-medium text-base text-ink">{item.label}</Text>
                <Ionicons name={on ? 'checkmark-circle' : 'ellipse-outline'} size={22} color={on ? colors.red : colors.muted} />
              </Pressable>
            );
          })}
        </View>

        {!!error && <Text accessibilityRole="alert" className="mt-4 text-sm text-red-600">{error}</Text>}
        <View className="mt-6">
          <PrimaryButton label="Guardar y continuar" onPress={() => void guardar()} disabled={!elegidos.length || saving} loading={saving} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
