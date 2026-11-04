import AsyncStorage from "@react-native-async-storage/async-storage";
export async function readCache<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}
export async function writeCache(key: string, value: unknown) {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}
