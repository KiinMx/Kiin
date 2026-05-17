import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Pivot } from '@/domain/entities/Pivot';

export interface ScheduleState {
  ids: number[];
  pivots: Pivot[];
  pinnedSubjects: number[];
  page?: number;
  selectedSubjectIds?: number[];
}

export function useGoogleAuth() {
  const supabase = useSupabaseClient();

  const signInWithGoogle = async (scheduleState?: ScheduleState) => {
    if (scheduleState) {
      localStorage.setItem(
        'schedule_state_before_oauth',
        JSON.stringify(scheduleState)
      );
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        scopes: 'https://www.googleapis.com/auth/calendar.events.owned',
        redirectTo: window.location.href,
      },
    });

    if (error) {
      console.error('OAuth redirect error:', error);
      throw error;
    }
  };

  return { signInWithGoogle };
}
