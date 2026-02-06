import React, { createContext, useContext, useState, useEffect } from 'react';
import { Profile } from '../types';
import { supabase } from '../supabaseClient';

interface SessionContextType {
  user: Profile | null;
  setUser: (user: Profile | null) => void;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  loading: boolean;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUserState] = useState<Profile | null>(() => {
    try {
      const cached = localStorage.getItem('pk_user_profile');
      return cached ? JSON.parse(cached) : null;
    } catch (e) {
      return null;
    }
  });
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      try {
        // 1. Check Local Cache First (Fast Load)
        const cached = localStorage.getItem('pk_user_profile');
        if (cached) {
            setUserState(JSON.parse(cached));
            if (mounted) setLoading(false);
        }

        // 2. Check Supabase Session (Verification)
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        if (!session) {
            if (mounted) {
                // Only clear if we had a user but session is gone from server
                if (localStorage.getItem('pk_user_profile')) {
                    handleLocalLogout();
                }
                setLoading(false);
            }
            return;
        }

        // 3. Fetch/Update Profile if session exists
        if (session.user) {
           await fetchProfile(session.user.id);
        } else {
           if(mounted) setLoading(false);
        }
      } catch (error: any) {
        // Ignore abort errors (common in React Strict Mode / Fast Refresh)
        if (error.name === 'AbortError' || error.message?.includes('signal is aborted')) {
            return;
        }
        console.error("Auth init error:", error);
        if (mounted) setLoading(false);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
         await fetchProfile(session.user.id);
      } else if (event === 'SIGNED_OUT') {
         if (mounted) handleLocalLogout();
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (data) {
        setUserState(data as Profile);
        localStorage.setItem('pk_user_profile', JSON.stringify(data));
      } else if (error) {
         console.error("Profile fetch error:", error);
      }
    } catch (error) {
      console.error('Fetch profile catch', error);
    } finally {
      setLoading(false);
    }
  };

  const setUser = (user: Profile | null) => {
    setUserState(user);
    if (user) {
      localStorage.setItem('pk_user_profile', JSON.stringify(user));
    } else {
      localStorage.removeItem('pk_user_profile');
    }
  };

  const handleLocalLogout = () => {
      setUserState(null);
      // Preserve settings, clear sensitive data
      const settings = localStorage.getItem('pk_settings');
      localStorage.clear(); 
      if(settings) localStorage.setItem('pk_settings', settings);
  };

  const logout = async () => {
    try {
        handleLocalLogout();
        await supabase.auth.signOut();
    } catch (e) {
        console.warn("Supabase signout warning:", e);
    } finally {
        window.location.reload(); 
    }
  };

  return (
    <SessionContext.Provider value={{ user, setUser, logout, isAuthenticated: !!user, loading }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(SessionContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};