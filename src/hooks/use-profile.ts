import { useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/features/auth/auth-provider';
import { isSupabaseConfigured } from '@/lib/supabase';
import { fetchProfile, updateRemoteProfile } from '@/services/profile';
import { useAppStore } from '@/stores/app-store';
import type { Profile } from '@/types/domain';

export function useProfile() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const localProfile = useAppStore((state) => state.profile);
  const updateLocalProfile = useAppStore((state) => state.updateProfile);
  const remote = useQuery({ queryKey: ['profile', session?.user.id], queryFn: fetchProfile, enabled: isSupabaseConfigured && Boolean(session) });
  const updateProfile = async (changes: Partial<Profile>) => {
    if (isSupabaseConfigured) {
      await updateRemoteProfile(changes);
      await queryClient.invalidateQueries({ queryKey: ['profile', session?.user.id] });
    } else updateLocalProfile(changes);
  };
  return { profile: isSupabaseConfigured ? remote.data : localProfile, isLoading: remote.isLoading, updateProfile };
}
