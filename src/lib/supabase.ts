// Supabase Client Configuration
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables!');
}

export const supabase = createClient(
    supabaseUrl || '',
    supabaseAnonKey || '',
    {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        }
    }
);

// Auth helpers
export const signUp = async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: fullName,
            }
        }
    });
    return { data, error };
};

export const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });
    return { data, error };
};

export const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
};

export const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
};

export const getSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
};

// Profile helpers with timeout protection
// Profile timeout in milliseconds
const PROFILE_FETCH_TIMEOUT_MS = 5000;

export const getProfile = async (userId: string) => {
    // Add timeout protection
    const timeoutPromise = new Promise<{ data: null, error: Error }>((resolve) => {
        setTimeout(() => {
            console.warn('[Supabase] getProfile timeout!');
            resolve({ data: null, error: new Error('Profile fetch timeout') });
        }, PROFILE_FETCH_TIMEOUT_MS);
    });

    const fetchPromise = (async () => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
        return { data, error };
    })();

    return Promise.race([fetchPromise, timeoutPromise]);
};

export const updateProfile = async (userId: string, updates: Partial<Omit<UserProfile, 'id' | 'created_at'>>) => {
    const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);
    return { data, error };
};

// Usage tracking
export const incrementUsage = async (userId: string, type: 'products' | 'articles') => {
    // Bypass for Mock Admin (DEV only)
    if (import.meta.env.DEV && userId === 'mock-admin-id') {
        return { data: null, error: null };
    }

    const field = type === 'products' ? 'products_used' : 'articles_used';

    // Try RPC function first
    const { error: rpcError } = await supabase.rpc('increment_usage', {
        user_id: userId,
        field_name: field
    });

    // Fallback: direct update if RPC fails (function might not exist)
    if (rpcError) {
        console.warn('[incrementUsage] RPC failed, using direct update:', rpcError.message);

        // Get current value
        const { data: profile } = await supabase
            .from('profiles')
            .select(field)
            .eq('id', userId)
            .single();

        if (profile) {
            const currentValue = (profile as Record<string, number>)[field] || 0;
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ [field]: currentValue + 1 })
                .eq('id', userId);

            if (updateError) {
                console.error('[incrementUsage] Direct update failed:', updateError);
                return { data: null, error: updateError };
            }
        }
    }

    return { data: null, error: null };
};

export const checkUsageLimit = async (userId: string, type: 'products' | 'articles') => {
    // Bypass for Mock Admin (DEV only)
    if (import.meta.env.DEV && userId === 'mock-admin-id') {
        return {
            allowed: true,
            remaining: 9999,
            used: 0,
            limit: 9999
        };
    }

    const { data: profile } = await getProfile(userId);
    if (!profile) return { allowed: false, remaining: 0 };

    const used = type === 'products' ? profile.products_used : profile.articles_used;
    const limit = type === 'products' ? profile.products_limit : profile.articles_limit;

    return {
        allowed: used < limit,
        remaining: limit - used,
        used,
        limit
    };
};

// Types
export interface UserProfile {
    id: string;
    email: string;
    full_name: string;
    role: 'admin' | 'user';
    products_limit: number;
    articles_limit: number;
    products_used: number;
    articles_used: number;
    created_at: string;
}

export interface Store {
    id?: string;
    user_id: string;
    platform: 'salla' | 'woocommerce';
    store_name?: string;
    store_url?: string;
    access_token?: string;
    consumer_key?: string;
    consumer_secret?: string;
    wp_username?: string;
    wp_app_password?: string;
    created_at?: string;
}

// ============================================
// User Store Settings (Database-linked)
// ============================================

// Get user's store by platform
export const getUserStore = async (userId: string, platform: 'salla' | 'woocommerce'): Promise<Store | null> => {
    const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('user_id', userId)
        .eq('platform', platform)
        .single();

    if (error || !data) return null;
    return data as Store;
};

// Save or update user's store
export const saveUserStore = async (store: Store): Promise<{ success: boolean; error?: string }> => {
    // Check if store exists
    const existing = await getUserStore(store.user_id, store.platform);

    if (existing) {
        // Update existing store
        const { error } = await supabase
            .from('stores')
            .update({
                store_name: store.store_name,
                store_url: store.store_url,
                access_token: store.access_token,
                consumer_key: store.consumer_key,
                consumer_secret: store.consumer_secret,
                wp_username: store.wp_username,
                wp_app_password: store.wp_app_password,
            })
            .eq('id', existing.id);

        if (error) return { success: false, error: error.message };
    } else {
        // Insert new store
        const { error } = await supabase
            .from('stores')
            .insert(store);

        if (error) return { success: false, error: error.message };
    }

    return { success: true };
};

// Get all user stores
export const getUserStores = async (userId: string): Promise<Store[]> => {
    const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('user_id', userId);

    if (error || !data) return [];
    return data as Store[];
};

// Delete user store
export const deleteUserStore = async (userId: string, platform: 'salla' | 'woocommerce'): Promise<{ success: boolean; error?: string }> => {
    const { error } = await supabase
        .from('stores')
        .delete()
        .eq('user_id', userId)
        .eq('platform', platform);

    if (error) return { success: false, error: error.message };
    return { success: true };
};

// ============================================
// App Settings (Global API Keys - Admin Only)
// ============================================

// Get a global setting (available to all authenticated users)
export const getGlobalSetting = async (key: string): Promise<string | null> => {
    const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', key)
        .single();

    if (error || !data) return null;
    return data.value;
};

// Set a global setting (admin only - enforced by RLS)
export const setGlobalSetting = async (key: string, value: string): Promise<{ success: boolean; error?: string }> => {
    const { error } = await supabase
        .from('app_settings')
        .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });

    if (error) return { success: false, error: error.message };
    return { success: true };
};

// Get all global settings (for admin panel)
export const getAllGlobalSettings = async (): Promise<Record<string, string>> => {
    const { data, error } = await supabase
        .from('app_settings')
        .select('key, value');

    if (error || !data) return {};

    const settings: Record<string, string> = {};
    data.forEach(item => {
        settings[item.key] = item.value || '';
    });
    return settings;
};

// ============================================
// Admin User Management
// ============================================

// Create a new user (admin only)
export const createUserByAdmin = async (
    email: string,
    password: string,
    fullName: string,
    role: 'user' | 'admin' = 'user',
    productsLimit: number = 10,
    articlesLimit: number = 5
): Promise<{ success: boolean; userId?: string; error?: string }> => {
    try {
        // Create user via Supabase Auth Admin API
        const { data, error } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { full_name: fullName }
        });

        if (error) {
            // Fallback: try regular signup
            const { data: signupData, error: signupError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: { full_name: fullName }
                }
            });

            if (signupError) return { success: false, error: signupError.message };

            // Update profile with custom limits and role
            if (signupData.user) {
                await supabase.from('profiles').update({
                    role,
                    products_limit: productsLimit,
                    articles_limit: articlesLimit
                }).eq('id', signupData.user.id);
            }

            return { success: true, userId: signupData.user?.id };
        }

        // Update profile with custom limits and role
        if (data.user) {
            await supabase.from('profiles').update({
                role,
                products_limit: productsLimit,
                articles_limit: articlesLimit
            }).eq('id', data.user.id);
        }

        return { success: true, userId: data.user?.id };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
};

// Send password reset email
export const sendPasswordResetEmail = async (email: string): Promise<{ success: boolean; error?: string }> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/login'
    });

    if (error) return { success: false, error: error.message };
    return { success: true };
};

// Update user email (requires admin privileges in Supabase)
export const updateUserEmail = async (userId: string, newEmail: string): Promise<{ success: boolean; error?: string }> => {
    // Update in profiles table
    const { error } = await supabase
        .from('profiles')
        .update({ email: newEmail })
        .eq('id', userId);

    if (error) return { success: false, error: error.message };
    return { success: true };
};

// Delete user profile (the auth user must be deleted separately via Supabase dashboard)
export const deleteUserProfile = async (userId: string): Promise<{ success: boolean; error?: string }> => {
    const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

    if (error) return { success: false, error: error.message };
    return { success: true };
};
