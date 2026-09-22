import { Image } from 'expo-image';
import { View, Text } from 'react-native';

export function Avatar({ uri, name, size = 44 }: { uri?: string; name: string; size?: number }) {
  if (uri) {
    return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} contentFit="cover" transition={180} />;
  }
  return (
    <View className="items-center justify-center bg-navy" style={{ width: size, height: size, borderRadius: size / 2 }}>
      <Text className="font-display text-lg text-white">{name.slice(0, 1).toUpperCase()}</Text>
    </View>
  );
}
