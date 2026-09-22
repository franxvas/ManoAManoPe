import { ActivityIndicator, Pressable, Text, type PressableProps } from 'react-native';

import { colors } from '@/constants/theme';

interface Props extends PressableProps {
  label: string;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
}

export function PrimaryButton({ label, loading, variant = 'primary', disabled, className = '', ...props }: Props) {
  const backgrounds = variant === 'primary' ? 'bg-brand' : variant === 'secondary' ? 'bg-navy' : 'border border-navy bg-white';
  return (
    <Pressable {...props} disabled={disabled || loading} className={`h-14 items-center justify-center rounded-2xl ${backgrounds} ${(disabled || loading) ? 'opacity-50' : ''} ${className}`}>
      {loading ? <ActivityIndicator color={colors.white} /> : <Text className={`font-medium text-base ${variant === 'outline' ? 'text-navy' : 'text-white'}`}>{label}</Text>}
    </Pressable>
  );
}
