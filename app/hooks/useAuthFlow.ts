// hooks/useAuthFlow.ts
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';  // Changed from '@/lib/supabase'
import { User } from '@supabase/supabase-js';

interface Profile {
  id: string;
  email: string;
  display_name: string;
  credits: number;
  has_accepted_legal: boolean;
  subscription_status: string;
  subscription_plan: string;
  created_at: string;
}

export function useAuthFlow() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [deviceInfo, setDeviceInfo] = useState({
    isMobile: false,
    os: 'Unknown',
    browser: 'Unknown',
    browserVersion: 'Unknown',
  });

  // Detect device, OS, and Browser
  useEffect(() => {
    const ua = navigator.userAgent;
    
    // Detect Mobile
    const isMobile = /iPhone|iPad|iPod|Android|Mobile/i.test(ua) || window.innerWidth < 768;
    
    // Detect OS
    let os = 'Unknown';
    if (ua.includes('Win')) os = 'Windows';
    else if (ua.includes('Mac')) os = 'MacOS';
    else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('Linux')) os = 'Linux';
    
    // Detect Browser
    let browser = 'Unknown';
    let browserVersion = 'Unknown';
    if (ua.includes('Chrome') && !ua.includes('Edg')) {
      browser = 'Chrome';
      const match = ua.match(/Chrome\/(\d+)/);
      browserVersion = match ? match[1] : 'Unknown';
    } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
      browser = 'Safari';
      const match = ua.match(/Version\/(\d+)/);
      browserVersion = match ? match[1] : 'Unknown';
    } else if (ua.includes('Firefox')) {
      browser = 'Firefox';
      const match = ua.match(/Firefox\/(\d+)/);
      browserVersion = match ? match[1] : 'Unknown';
    } else if (ua.includes('Edg')) {
      browser = 'Edge';
      const match = ua.match(/Edg\/(\d+)/);
      browserVersion = match ? match[1] : 'Unknown';
    }
    
    setDeviceInfo({ isMobile, os, browser, browserVersion });
  }, []);

  // Auth state listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user || null);
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    // Initial check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (!error && data) {
      setProfile(data);
    }
  };

  const initializeNewUser = async (displayName: string, email: string) => {
    if (!user) return false;
    
    // Update profile with legal acceptance and give 100 credits
    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: displayName,
        email: email,
        has_accepted_legal: true,
        credits: 100,
        subscription_status: 'explorer',
        subscription_plan: 'Free Explorer',
      })
      .eq('id', user.id);
    
    if (!error) {
      await fetchProfile(user.id);
      return true;
    }
    return false;
  };

  const updateCredits = async (newCredits: number) => {
    if (!user) return;
    const { error } = await supabase
      .from('profiles')
      .update({ credits: newCredits })
      .eq('id', user.id);
    if (!error) {
      await fetchProfile(user.id);
    }
  };

  return {
    user,
    profile,
    loading,
    deviceInfo,
    initializeNewUser,
    updateCredits,
    fetchProfile,
  };
}