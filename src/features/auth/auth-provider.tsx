import type { Session } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';

import { isSupabaseConfigured, supabase } from '@/lib/supabase';

interface AuthResult { error?: string; needsConfirmation?: boolean }

interface AuthContextValue {
  session: Session | null;
  loading: boolean;
  isGuest: boolean;
  isAuthenticated: boolean;
  backendReady: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (name: string, email: string, password: string) => Promise<AuthResult>;
  recoverPassword: (email: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  continueAsGuest: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [accessMode, setAccessMode] = useState<'none' | 'guest' | 'demo'>('none');

  useEffect(() => {
    if (!supabase) return;
    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => data.subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    if (!supabase) {
      if (email && password.length >= 6) {
        setAccessMode('demo');
        return {};
      }
      return { error: 'Ingresa un correo y una contraseña de al menos 6 caracteres.' };
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? { error: error.message } : {};
  }, []);

  const signUp = useCallback(async (name: string, email: string, password: string): Promise<AuthResult> => {
    if (!supabase) {
      setAccessMode('demo');
      return {};
    }
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { display_name: name } } });
    return error ? { error: error.message } : data.session ? {} : { needsConfirmation: true };
  }, []);

  const recoverPassword = useCallback(async (email: string): Promise<AuthResult> => {
    if (!supabase) return {};
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: 'manoamano://reset-password' });
    return error ? { error: error.message } : {};
  }, []);

  const signOut = useCallback(async () => {
    if (supabase) await supabase.auth.signOut();
    setSession(null);
    setAccessMode('none');
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    session, loading, isGuest: accessMode === 'guest', isAuthenticated: Boolean(session) || accessMode === 'demo', backendReady: isSupabaseConfigured,
    signIn, signUp, recoverPassword, signOut, continueAsGuest: () => setAccessMode('guest'),
  }), [accessMode, loading, recoverPassword, session, signIn, signOut, signUp]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return value;
}
