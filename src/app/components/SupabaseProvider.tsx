'use client';

import supabase, { isDevMode } from '@/utils/supabaseClient';
import { Session, SupabaseClient } from '@supabase/supabase-js';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

interface SupabaseContextValue {
  supabase: SupabaseClient;
  session: Session | null;
  isLoading: boolean;
}

const SupabaseContext = createContext<SupabaseContextValue>({
  supabase,
  session: null,
  isLoading: true,
});

export function useSupabase() {
  return useContext(SupabaseContext);
}

export default function SupabaseProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDevWarning, setShowDevWarning] = useState(false);

  useEffect(() => {
    if (isDevMode) {
      setShowDevWarning(true);
      const timer = setTimeout(() => setShowDevWarning(false), 5000);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    const getSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (!error) {
        setSession(data.session);
      }
      setIsLoading(false);
    };

    getSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <SupabaseContext.Provider value={{ supabase, session, isLoading }}>
      {showDevWarning && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-yellow-500 text-black px-6 py-3 rounded-lg shadow-lg animate-fade-in max-w-md text-center">
          ⚠️ Ambiente de desarrollo sin credenciales: La exportación a Google Calendar no estará disponible
        </div>
      )}
      {children}
    </SupabaseContext.Provider>
  );
}
