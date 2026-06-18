// Authentication Context - Manages user auth state across the app
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase, signIn as supabaseSignIn, signUp as supabaseSignUp, signOut as supabaseSignOut, getProfile, type UserProfile } from '../lib/supabase';

interface AuthContextType {
    user: User | null;
    profile: UserProfile | null;
    session: Session | null;
    loading: boolean;
    isAdmin: boolean;
    signIn: (email: string, password: string) => Promise<{ error: any }>;
    signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
    demoLogin: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    // Fetch profile from Supabase for a given user ID
    const fetchProfile = useCallback(async (userId: string) => {
        try {
            const { data, error } = await getProfile(userId);
            if (error) {
                console.error('[Auth] Error fetching profile:', error);
                setProfile(null);
            } else {
                setProfile(data as UserProfile | null);
            }
        } catch (err) {
            console.error('[Auth] Exception fetching profile:', err);
            setProfile(null);
        }
    }, []);

    // Listen to auth state changes
    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
            setSession(initialSession);
            setUser(initialSession?.user ?? null);
            if (initialSession?.user) {
                fetchProfile(initialSession.user.id).finally(() => setLoading(false));
            } else {
                setLoading(false);
            }
        });

        // Subscribe to auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, newSession) => {
                setSession(newSession);
                setUser(newSession?.user ?? null);
                if (newSession?.user) {
                    await fetchProfile(newSession.user.id);
                } else {
                    setProfile(null);
                }
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, [fetchProfile]);

    // Refresh profile from Supabase
    const refreshProfile = useCallback(async () => {
        if (user) {
            await fetchProfile(user.id);
        }
    }, [user, fetchProfile]);

    // Real Sign In
    const signIn = useCallback(async (email: string, password: string) => {
        const { error } = await supabaseSignIn(email, password);
        return { error };
    }, []);

    // Real Sign Up
    const signUp = useCallback(async (email: string, password: string, fullName: string) => {
        const { error } = await supabaseSignUp(email, password, fullName);
        return { error };
    }, []);

    // Real Sign Out
    const signOut = useCallback(async () => {
        if (import.meta.env.DEV && user?.id === 'mock-admin-id') {
            // Demo user — skip Supabase sign out
        } else {
            await supabaseSignOut();
        }
        setUser(null);
        setProfile(null);
        setSession(null);
    }, [user]);

    // Demo Login — ONLY available in development mode
    const demoLogin = useCallback(() => {
        if (!import.meta.env.DEV) {
            console.warn('[Auth] Demo login is disabled in production.');
            return;
        }
        setUser({ id: 'mock-admin-id', email: 'demo@example.com' } as User);
        setProfile({
            id: 'mock-admin-id',
            email: 'demo@example.com',
            full_name: 'مدير تجريبي',
            role: 'admin',
            products_limit: 9999,
            articles_limit: 9999,
            products_used: 0,
            articles_used: 0,
            created_at: new Date().toISOString()
        });
        setSession({
            user: { id: 'mock-admin-id' },
            access_token: 'mock-token'
        } as Session);
    }, []);

    const value = {
        user,
        profile,
        session,
        loading,
        isAdmin: profile?.role === 'admin',
        signIn,
        signUp,
        signOut,
        refreshProfile,
        demoLogin,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
