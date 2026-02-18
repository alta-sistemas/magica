import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { User, UserRole, UserStatus } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<string | null>;
  register: (email: string, pass: string, name: string) => Promise<string | null>;
  logout: () => void;
  deductCredit: () => Promise<boolean>;
  // Admin methods
  getAllUsers: () => Promise<User[]>;
  updateUserStatus: (userId: string, status: UserStatus) => Promise<void>;
  addCredits: (userId: string, amount: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // --- Fetch Profile Helper (with Retry) ---
  const fetchProfile = async (userId: string, retries = 3): Promise<User | null> => {
    try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
        
        if (error) {
          // Se não encontrou (PGRST116) ou erro de rede, e ainda tem tentativas
          if (retries > 0) {
             console.log(`Profile not found, retrying... (${retries} left)`);
             await new Promise(r => setTimeout(r, 1000)); // Espera 1 segundo
             return fetchProfile(userId, retries - 1);
          }
          console.error('Error fetching profile final:', error);
          return null;
        }
        return data as User;
    } catch (e) {
        console.error("Exception fetching profile:", e);
        return null;
    }
  };

  // --- Initialization ---
  useEffect(() => {
    // Check active session
    const initSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            const profile = await fetchProfile(session.user.id);
            if (profile) setUser(profile);
        }
        setLoading(false);
    };

    initSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        // Se for um novo login (SIGNED_IN), tentamos buscar o perfil
        if (!user || user.id !== session.user.id) {
            const profile = await fetchProfile(session.user.id);
            if (profile) setUser(profile);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []); // Remove user dependency to avoid loop

  // --- Actions ---

  const login = async (email: string, pass: string): Promise<string | null> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: pass,
    });

    if (error) {
        console.error("Login Error:", error);
        // Tratamento específico para erros comuns
        if (error.message.includes("Email not confirmed")) {
            return "Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada ou contate o admin.";
        }
        if (error.message.includes("Invalid login credentials")) {
            return "E-mail ou senha incorretos.";
        }
        return error.message; // Retorna a mensagem real para ajudar no debug
    }

    // Check status immediately after login
    if (data.user) {
        let profile = await fetchProfile(data.user.id);
        
        if (!profile) {
            // Se chegou aqui, o Auth existe mas o Profile não.
            // Tenta criar automaticamente o perfil (Self-Healing)
            console.log("Profile missing. Attempting auto-creation...");
            const { error: insertError } = await supabase.from('profiles').insert({
                id: data.user.id,
                email: data.user.email,
                name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User',
                role: 'user',
                status: 'pending',
                credits: 5
            });

            if (!insertError) {
                profile = await fetchProfile(data.user.id);
            }
        }

        if (!profile) {
             await supabase.auth.signOut();
             return 'Erro: Perfil de usuário não encontrado e não foi possível criá-lo automaticamente. Contate o suporte.';
        }

        if (profile.status === 'pending') {
            await supabase.auth.signOut();
            return 'Sua conta aguarda aprovação do administrador.';
        }
        if (profile.status === 'rejected') {
            await supabase.auth.signOut();
            return 'Sua conta foi recusada.';
        }
        
        setUser(profile);
        return null;
    }
    return 'Erro ao carregar perfil de usuário.';
  };

  const register = async (email: string, pass: string, name: string): Promise<string | null> => {
    const { error } = await supabase.auth.signUp({
      email,
      password: pass,
      options: {
        data: { name: name } // This triggers the handle_new_user function in SQL
      }
    });

    if (error) return error.message;
    return null;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const deductCredit = async (): Promise<boolean> => {
    if (!user) return false;
    
    // Call the PostgreSQL RPC function
    const { data, error } = await supabase.rpc('deduct_credit', {
      user_id: user.id
    });

    if (error) {
      console.error("Error deducting credit:", error);
      return false;
    }

    // data is the boolean returned from postgres function
    if (data === true) {
       // Optimistic update locally
       setUser(prev => prev ? { ...prev, credits: prev.credits > 0 ? prev.credits - 1 : 0 } : null);
       return true;
    }
    
    return false;
  };

  // --- Admin Methods ---

  const getAllUsers = async (): Promise<User[]> => {
    if (user?.role !== 'admin') return [];
    
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
        
    if (error) {
        console.error(error);
        return [];
    }
    return data as User[];
  };

  const updateUserStatus = async (userId: string, status: UserStatus) => {
    if (user?.role !== 'admin') return;
    await supabase.from('profiles').update({ status }).eq('id', userId);
  };

  const addCredits = async (userId: string, amount: number) => {
    if (user?.role !== 'admin') return;
    
    // Get current credits first to avoid overwriting updates (simple approach)
    // A better approach is an RPC 'increment_credits', but update is fine for admin panel
    const { data: current } = await supabase.from('profiles').select('credits').eq('id', userId).single();
    if (current) {
        const newTotal = (current.credits || 0) + amount;
        await supabase.from('profiles').update({ credits: newTotal }).eq('id', userId);
    }
  };

  return (
    <AuthContext.Provider value={{ 
        user, 
        loading, 
        login, 
        register, 
        logout, 
        deductCredit, 
        getAllUsers, 
        updateUserStatus, 
        addCredits 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
