/**
 * useRequireAuth
 * Redirige al usuario a la pantalla de login si no tiene sesión activa.
 * Úsalo al inicio de cualquier pantalla que requiera autenticación obligatoria
 * (no solo acciones puntuales, sino la pantalla entera).
 *
 * Ejemplo de uso:
 *   export default function PublishScreen() {
 *     const ready = useRequireAuth('/publish/[type]');
 *     if (!ready) return null;
 *     return <ActualContent />;
 *   }
 */
import { router } from 'expo-router';
import { useEffect } from 'react';

import { useAuth } from '@/features/auth/auth-provider';

/**
 * @param returnTo  Ruta a la que volver después de iniciar sesión.
 * @returns         `true` cuando la sesión está confirmada y la pantalla puede renderizarse.
 */
export function useRequireAuth(returnTo?: string): boolean {
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      router.replace({
        pathname: '/(auth)/login',
        params: returnTo ? { returnTo } : undefined,
      });
    }
  }, [isAuthenticated, loading, returnTo]);

  // Devuelve true solo cuando ya sabemos que el usuario está autenticado
  return !loading && isAuthenticated;
}

