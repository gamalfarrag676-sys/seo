// src/lib/supabase.ts — OPTIMIZED VERSION
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables!');
  throw new Error('Supabase configuration missing. Please check your .env.local file.');
}

// ===== Secure Client Configuration =====
export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      storageKey: 'seo-app-auth-token',
    },
    global: {
      headers: {
        'X-Client-Info': 'seo-content-generator',
      },
    },
    db: {
      schema: 'public',
    },
  }
);

// ===== Auth helpers with error handling =====
export const signUp = async (email: string, password: string, fullName: string) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        }
      }
    });
    
    if (error) throw error;
    return { data, error: null };
  } catch (err: any) {
    console.error('[Auth] Sign up error:', err);
    return { data: null, error: err };
  }
};

export const signIn = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    return { data, error: null };
  } catch (err: any) {
    console.error('[Auth] Sign in error:', err);
    return { data: null, error: err };
  }
};

export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { error: null };
  } catch (err: any) {
    console.error('[Auth] Sign out error:', err);
    return { error: err };
  }
};

export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  } catch (err) {
    console.error('[Auth] Get user error:', err);
    return null;
  }
};

export const getSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  } catch (err) {
    console.error('[Auth] Get session error:', err);
    return null;
  }
};

// ===== Profile helpers with timeout & retry =====
const PROFILE_FETCH_TIMEOUT_MS = 8000;
const MAX_RETRIES = 2;

async function withTimeoutAndRetry<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
  maxRetries: number
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), timeoutMs);
      });
      
      return await Promise.race([fn(), timeoutPromise]);
    } catch (err) {
      lastError = err as Error;
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }
  
  throw lastError;
}

export const getProfile = async (userId: string) => {
  try {
    const result = await withTimeoutAndRetry(
      async () => {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
        return { data, error };
      },
      PROFILE_FETCH_TIMEOUT_MS,
      MAX_RETRIES
    );
    
    return result;
  } catch (err) {
    console.error('[Supabase] getProfile failed after retries:', err);
    return { data: null, error: err as Error };
  }
};

export const updateProfile = async (userId: string, updates: Partial<UserProfile>) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);
    
    if (error) throw error;
    return { data, error: null };
  } catch (err: any) {
    console.error('[Supabase] updateProfile error:', err);
    return { data: null, error: err };
  }
};

// ===== Usage tracking with validation =====
export const incrementUsage = async (userId: string, type: 'products' | 'articles') => {
  // Validate inputs
  if (!userId || !type) {
    return { data: null, error: new Error('Missing userId or type') };
  }

  // Bypass for Mock Admin (DEV only)
  if (import.meta.env.DEV && userId === 'mock-admin-id') {
    return { data: null, error: null };
  }

  const field = type === 'products' ? 'products_used' : 'articles_used';

  try {
    // Try RPC function first
    const { error: rpcError } = await supabase.rpc('increment_usage', {
      user_id: userId,
      field_name: field
    });

    if (!rpcError) return { data: null, error: null };

    // Fallback: direct update
    console.warn('[incrementUsage] RPC failed, using direct update:', rpcError.message);

    const { data: profile } = await supabase
      .from('profiles')
      .select(field)
      .eq('id', userId)
      .single();

    if (profile) {
      const currentValue = (profile as Record<string, any>)[field] || 0;
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ [field]: currentValue + 1 })
        .eq('id', userId);

      if (updateError) throw updateError;
    }
    
    return { data: null, error: null };
  } catch (err: any) {
    console.error('[incrementUsage] Error:', err);
    return { data: null, error: err };
  }
};

export const checkUsageLimit = async (userId: string, type: 'products' | 'articles') => {
  if (import.meta.env.DEV && userId === 'mock-admin-id') {
    return {
      allowed: true,
      remaining: 9999,
      used: 0,
      limit: 9999
    };
  }

  try {
    const { data: profile } = await getProfile(userId);
    if (!profile) {
      return { allowed: false, remaining: 0, used: 0, limit: 0 };
    }

    const used = type === 'products' ? profile.products_used : profile.articles_used;
    const limit = type === 'products' ? profile.products_limit : profile.articles_limit;

    return {
      allowed: used < limit,
      remaining: Math.max(0, limit - used),
      used,
      limit
    };
  } catch (err) {
    console.error('[checkUsageLimit] Error:', err);
    return { allowed: false, remaining: 0, used: 0, limit: 0 };
  }
};

// ===== Types =====
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

// ===== Store Management =====
export const getUserStore = async (userId: string, platform: 'salla' | 'woocommerce'): Promise<Store | null> => {
  try {
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .eq('user_id', userId)
      .eq('platform', platform)
      .single();

    if (error || !data) return null;
    return data as Store;
  } catch (err) {
    console.error('[Supabase] getUserStore error:', err);
    return null;
  }
};

export const saveUserStore = async (store: Store): Promise<{ success: boolean; error?: string }> => {
  try {
    const existing = await getUserStore(store.user_id, store.platform);

    if (existing) {
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

      if (error) throw error;
    } else {
      const { error } = await supabase.from('stores').insert(store);
      if (error) throw error;
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
};

export const getUserStores = async (userId: string): Promise<Store[]> => {
  try {
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .eq('user_id', userId);

    if (error || !data) return [];
    return data as Store[];
  } catch (err) {
    return [];
  }
};

export const deleteUserStore = async (userId: string, platform: 'salla' | 'woocommerce'): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('stores')
      .delete()
      .eq('user_id', userId)
      .eq('platform', platform);

    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
};

// ===== App Settings =====
export const getGlobalSetting = async (key: string): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', key)
      .single();

    if (error || !data) return null;
    return data.value;
  } catch (err) {
    return null;
  }
};

export const setGlobalSetting = async (key: string, value: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('app_settings')
      .upsert(
        { key, value, updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      );

    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
};

export const getAllGlobalSettings = async (): Promise<Record<string, string>> => {
  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('key, value');

    if (error || !data) return {};

    const settings: Record<string, string> = {};
    data.forEach((item: any) => {
      settings[item.key] = item.value || '';
    });
    return settings;
  } catch (err) {
    return {};
  }
};

// ===== Admin Management =====
export const createUserByAdmin = async (
  email: string,
  password: string,
  fullName: string,
  role: 'user' | 'admin' = 'user',
  productsLimit: number = 10,
  articlesLimit: number = 5
): Promise<{ success: boolean; userId?: string; error?: string }> => {
  try {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName }
    });

    if (error) {
      // Fallback: regular signup
      const { data: signupData, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName }
        }
      });

      if (signupError) return { success: false, error: signupError.message };

      if (signupData.user) {
        await supabase.from('profiles').update({
          role,
          products_limit: productsLimit,
          articles_limit: articlesLimit
        }).eq('id', signupData.user.id);
      }

      return { success: true, userId: signupData.user?.id };
    }

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

export const sendPasswordResetEmail = async (email: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/login'
    });

    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
};

export const updateUserEmail = async (userId: string, newEmail: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ email: newEmail })
      .eq('id', userId);

    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
};

export const deleteUserProfile = async (userId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
};
