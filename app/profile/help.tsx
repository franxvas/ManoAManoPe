import { Ionicons } from '@expo/vector-icons';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/screen-header';
import { colors } from '@/constants/theme';

const faqs = [
  ['¿Cómo hago un trato?', 'Contacta desde una publicación, conversa y envía una oferta. Cuando la otra persona acepta, se registra el acuerdo.'],
  ['¿MANO A MANO.PE procesa pagos?', 'No. Por ahora el trato representa un acuerdo; coordina el pago y la entrega con responsabilidad.'],
  ['¿Cómo publico un servicio?', 'Pulsa el botón rojo +, elige Servicio, completa los datos y añade fotos antes de publicar.'],
  ['¿Cómo reporto un problema?', 'Conserva la conversación y los detalles del trato. El canal de soporte se habilitará en la configuración de producción.'],
];

export default function HelpScreen() {
  return <SafeAreaView edges={['top']} className="flex-1 bg-canvas"><ScreenHeader title="Centro de ayuda" showBack /><ScrollView contentContainerClassName="p-5 pb-10"><View className="mb-5 items-center rounded-3xl bg-navy p-6"><Ionicons name="help-buoy-outline" size={36} color="white" /><Text className="mt-3 font-display text-2xl text-white">Estamos para ayudarte</Text><Text className="mt-2 text-center font-sans text-sm text-white/70">Respuestas rápidas para comprar, ofrecer y negociar con confianza.</Text></View>{faqs.map(([question, answer]) => <View key={question} className="mb-3 rounded-2xl bg-white p-5"><Text className="font-display text-lg text-navy">{question}</Text><Text className="mt-2 font-sans text-sm leading-6 text-muted">{answer}</Text></View>)}<View className="mt-2 flex-row items-start rounded-2xl bg-amber-50 p-4"><Ionicons name="shield-checkmark-outline" size={22} color={colors.rating} /><Text className="ml-3 flex-1 font-sans text-xs leading-5 text-ink">Reúnete en lugares seguros, revisa la reputación del perfil y nunca compartas códigos de verificación.</Text></View></ScrollView></SafeAreaView>;
}
