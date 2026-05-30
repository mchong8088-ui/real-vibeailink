import { useEffect, useState } from 'react';
import { supabase, onAuthChange } from '../lib/supabase';

export function useAuthFlow() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('🔐 Initial session check:', session?.user?.email || 'No session');
      setUser(session?.user || null);
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = onAuthChange((event, session) => {
      console.log('🔄 Auth state changed:', event, session?.user?.email);
      setUser(session?.user || null);
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string, email: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
      }
      
      setProfile(data);
      setLoading(false);
    } catch (err) {
      console.error('Profile fetch error:', err);
      setLoading(false);
    }
  };

  const initializeNewUser = async (displayName: string, email: string) => {
    // This function is called when user accepts terms
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          display_name: displayName || email.split('@')[0],
          email: email,
          has_accepted_legal: true,
          credits: 100,
          subscription_status: 'explorer',
          subscription_plan: 'Free Explorer',
        });
      
      if (!error) {
        await fetchProfile(user.id, email);
      }
    }
  };

  return { user, profile, loading, initializeNewUser };
}
