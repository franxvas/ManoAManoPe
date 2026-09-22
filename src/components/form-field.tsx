import { Text, TextInput, View, type TextInputProps } from 'react-native';

import { colors } from '@/constants/theme';

export function FormField({ label, error, multiline, ...props }: TextInputProps & { label: string; error?: string }) {
  return (
    <View className="mb-4">
      <Text className="mb-2 font-medium text-sm text-ink">{label}</Text>
      <TextInput
        {...props}
        multiline={multiline}
        placeholderTextColor={colors.muted}
        textAlignVertical={multiline ? 'top' : 'center'}
        className={`rounded-2xl border bg-white px-4 font-sans text-base text-ink ${multiline ? 'min-h-28 py-4' : 'h-14'} ${error ? 'border-brand' : 'border-line'}`}
      />
      {Boolean(error) && <Text className="mt-1.5 font-sans text-xs text-brand">{error}</Text>}
    </View>
  );
}
