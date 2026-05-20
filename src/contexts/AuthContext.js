import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isConfigured } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession]   = useState(undefined); // undefined = loading
  const [family,  setFamily]    = useState(null);

  useEffect(() => {
    if (!isConfigured) {
      setSession(null);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load/create family row whenever session changes
  useEffect(() => {
    if (!session || !isConfigured) { setFamily(null); return; }

    supabase
      .from('families')
      .select('*')
      .eq('id', session.user.id)
      .single()
      .then(({ data, error }) => {
        if (data) {
          setFamily(data);
        } else if (error?.code === 'PGRST116') {
          // No row yet — create it (first sign-in)
          supabase.from('families')
            .insert({ id: session.user.id, email: session.user.email })
            .select()
            .single()
            .then(({ data }) => setFamily(data));
        }
      });
  }, [session]);

  const signUp = (email, password) =>
    supabase.auth.signUp({ email, password });

  const signIn = (email, password) =>
    supabase.auth.signInWithPassword({ email, password });

  const signOut = () => supabase.auth.signOut();

  return (
    <AuthContext.Provider value={{ session, family, setFamily, signUp, signIn, signOut, isConfigured }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
