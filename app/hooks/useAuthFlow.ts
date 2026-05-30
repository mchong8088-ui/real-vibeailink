import { useEffect, useState } from 'react';
import { supabase, onAuthChange } from '../lib/supabase';

export function useAuthFlow() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    // Check current session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('🔐 Initial session check:', session?.user?.email || 'No session');
      setUser(session?.user || null);
      if (session?.user && session.user.id && session.user.email) {
        await fetchProfile(session.user.id, session.user.email);
      } else {
        setLoading(false);
      }
    };
    
    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = onAuthChange(async (event, session) => {
      console.log('🔄 Auth state changed:', event, session?.user?.email);
      setUser(session?.user || null);
      if (session?.user && session.user.id && session.user.email) {
        await fetchProfile(session.user.id, session.user.email);
      } else {
        setProfile(null);
        setLoading(false);
      }
      
      // Force reload on sign in to refresh all components
      if (event === 'SIGNED_IN') {
        window.location.reload();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const initializeNewUser = async (displayName: string, email: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user && user.id) {
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
      
      if (!error && user.id && email) {
        await fetchProfile(user.id, email);
      }
    }
  };

  return { user, profile, loading, initializeNewUser };
}
