import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../supabase/config';
import type { UserProfile } from '../types';

// Minimal shape kept stable across backends so the rest of the app only
// ever needs `user.uid`, regardless of which auth provider is behind it.
interface AuthUser {
  uid: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  profile: UserProfile | null;
  initializing: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  initializing: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setInitializing(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  const uid = session?.user?.id ?? null;

  useEffect(() => {
    if (!uid) {
      setProfile(null);
      return;
    }

    let cancelled = false;

    async function loadProfile() {
      const { data } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle();
      if (cancelled || !data) return;
      setProfile({
        uid: data.id,
        displayName: data.display_name,
        email: data.email,
        phoneNumber: data.phone_number,
        createdAt: new Date(data.created_at).getTime(),
      });
    }
    loadProfile();

    const channel = supabase
      .channel(`profile-${uid}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${uid}` },
        loadProfile
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [uid]);

  const user = useMemo<AuthUser | null>(() => (uid ? { uid } : null), [uid]);
  const value = useMemo(() => ({ user, profile, initializing }), [user, profile, initializing]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
