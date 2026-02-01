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

    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (session?.user) {
          // If we have a session but no local user state, or ID mismatch, fetch profile
          if (!user || user.id !== session.user.id) {
             await fetchProfile(session.user.id);
          } else {
             if (mounted) setLoading(false);
          }
        } else {
          // No session found
          if (mounted) {
             setUserState(null);
             localStorage.removeItem('pk_user_profile');
             setLoading(false);
          }
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        if (mounted) setLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.user) {
           if (!user || user.id !== session.user.id) {
              await fetchProfile(session.user.id);
           }
        }
      } else if (event === 'SIGNED_OUT') {
        if (mounted) {
           setUserState(null);
           localStorage.removeItem('pk_user_profile');
           setLoading(false);
        }
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

      if (error) {
        console.error('Error fetching profile:', error);
      } else if (data) {
        setUserState(data as Profile);
        localStorage.setItem('pk_user_profile', JSON.stringify(data));
      }
    } catch (error) {
      console.error('Auth fetch error:', error);
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

  const logout = async () => {
    try {
        await supabase.auth.signOut();
    } catch (e) {
        console.error("Sign out error", e);
    } finally {
        setUserState(null);
        localStorage.removeItem('pk_user_profile');
        localStorage.clear(); // Clear all app data on logout for safety
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