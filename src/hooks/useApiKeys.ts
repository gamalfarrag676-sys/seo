import { useState, useEffect, useCallback } from 'react';
import { getGlobalSetting } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface UseApiKeysReturn {
    apiKey: string;
    openaiKey: string;
    aiProvider: 'gemini' | 'openai';
    setApiKey: (key: string) => void;
    setOpenaiKey: (key: string) => void;
    setAiProvider: (provider: 'gemini' | 'openai') => void;
    hasApiKey: boolean;
    reloadKeys: () => void;
}

/**
 * Custom hook for managing AI API keys
 * - Admins: load from localStorage
 * - Regular users: load from Supabase global settings
 */
export function useApiKeys(): UseApiKeysReturn {
    const { isAdmin, profile } = useAuth();
    const profileLoaded = profile !== undefined;
    const [apiKey, setApiKey] = useState('');
    const [openaiKey, setOpenaiKey] = useState('');
    const [aiProvider, setAiProvider] = useState<'gemini' | 'openai'>('gemini');

    // Load keys based on user role
    const loadKeys = useCallback(async () => {
        // Load saved provider preference
        const savedProvider = localStorage.getItem('ai_provider') as 'gemini' | 'openai' | null;
        if (savedProvider) setAiProvider(savedProvider);

        if (isAdmin) {
            // Admin: use localStorage keys
            const savedKey = localStorage.getItem('gemini_api_key');
            const savedOpenaiKey = localStorage.getItem('openai_api_key');
            if (savedOpenaiKey) setOpenaiKey(savedOpenaiKey);
            if (savedKey) setApiKey(savedKey);
        } else {
            // Regular user: load global keys from database
            try {
                const globalGeminiKey = await getGlobalSetting('gemini_api_key');
                const globalOpenaiKey = await getGlobalSetting('openai_api_key');

                if (globalGeminiKey) setApiKey(globalGeminiKey);
                if (globalOpenaiKey) setOpenaiKey(globalOpenaiKey);
            } catch (err) {
                console.error('[useApiKeys] Error loading global API keys:', err);
            }
        }
    }, [isAdmin]);

    // Load keys when profile is loaded or when keys are updated
    useEffect(() => {
        if (profileLoaded) {
            loadKeys();
        }

        const handleKeysUpdated = () => {
            loadKeys();
        };

        window.addEventListener('api-keys-updated', handleKeysUpdated);
        // Also listen to storage events across tabs
        window.addEventListener('storage', handleKeysUpdated);

        return () => {
            window.removeEventListener('api-keys-updated', handleKeysUpdated);
            window.removeEventListener('storage', handleKeysUpdated);
        };
    }, [profileLoaded, loadKeys]);

    // Handle provider change
    const handleSetAiProvider = useCallback((provider: 'gemini' | 'openai') => {
        setAiProvider(provider);
        localStorage.setItem('ai_provider', provider);
        window.dispatchEvent(new Event('api-keys-updated'));
    }, []);

    // Reload keys from localStorage (for modal close)
    const reloadKeys = useCallback(() => {
        const savedKey = localStorage.getItem('gemini_api_key');
        const savedOpenaiKey = localStorage.getItem('openai_api_key');
        if (savedKey) setApiKey(savedKey);
        if (savedOpenaiKey) setOpenaiKey(savedOpenaiKey);
    }, []);

    // Check if current provider has a key
    const hasApiKey = aiProvider === 'gemini' ? !!apiKey : !!openaiKey;

    return {
        apiKey,
        openaiKey,
        aiProvider,
        setApiKey,
        setOpenaiKey,
        setAiProvider: handleSetAiProvider,
        hasApiKey,
        reloadKeys,
    };
}
