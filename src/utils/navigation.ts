import type { Href } from 'expo-router';
import { router } from 'expo-router';

export function goBackOr(fallback: Href = '/(tabs)') {
  if (router.canGoBack()) router.back();
  else router.replace(fallback);
}
