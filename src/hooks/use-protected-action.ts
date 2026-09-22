import { router } from 'expo-router';
import { useCallback } from 'react';

import { useAuth } from '@/features/auth/auth-provider';

export function useProtectedAction() {
  const { isAuthenticated } = useAuth();
  return useCallback((action: () => void, returnTo?: string) => {
    if (isAuthenticated) action();
    else router.push({ pathname: '/(auth)/login', params: returnTo ? { returnTo } : undefined });
  }, [isAuthenticated]);
}
