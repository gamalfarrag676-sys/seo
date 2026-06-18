import { useState, useCallback, useEffect } from 'react';
import type { SEOContent } from '../utils/gemini';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface HistoryItem {
    id: string;
    timestamp: number;
    keyword: string;
    productName: string;
    content: SEOContent;
    seoScore?: number;
}

const HISTORY_KEY = 'seo_generator_history';
const MAX_HISTORY = 10;

/**
 * Custom hook for managing generation history
 */
export function useHistory() {
    const { user } = useAuth();
    const [history, setHistory] = useState<HistoryItem[]>([]);

    // Load history
    useEffect(() => {
        const loadHistory = async () => {
            if (user && user.id !== 'mock-admin-id') {
                try {
                    const { data, error } = await supabase
                        .from('history')
                        .select('*')
                        .eq('user_id', user.id)
                        .order('timestamp', { ascending: false })
                        .limit(MAX_HISTORY);

                    if (!error && data) {
                        const parsedHistory = data.map(item => ({
                            ...item,
                            content: typeof item.content === 'string' ? JSON.parse(item.content) : item.content
                        }));
                        setHistory(parsedHistory);
                        // Sync to local
                        localStorage.setItem(HISTORY_KEY, JSON.stringify(parsedHistory));
                        return;
                    }
                } catch (err) {
                    console.error('[useHistory] Error loading from Supabase:', err);
                }
            }

            // Fallback to local
            try {
                const saved = localStorage.getItem(HISTORY_KEY);
                if (saved) {
                    setHistory(JSON.parse(saved));
                }
            } catch (err) {
                console.error('[useHistory] Error loading local history:', err);
            }
        };

        loadHistory();
    }, [user]);

    // Save history
    const saveHistory = useCallback(async (items: HistoryItem[]) => {
        try {
            localStorage.setItem(HISTORY_KEY, JSON.stringify(items));
            setHistory(items);
        } catch (err) {
            console.error('[useHistory] Error saving local history:', err);
        }
    }, []);

    // Add new item to history
    const addToHistory = useCallback(async (
        content: SEOContent,
        keyword: string,
        productName: string,
        seoScore?: number
    ) => {
        const newItem: HistoryItem = {
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            keyword,
            productName,
            content,
            seoScore,
        };

        setHistory(prev => {
            const updatedHistory = [newItem, ...prev].slice(0, MAX_HISTORY);
            try {
                localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
            } catch (err) {
                console.error('[useHistory] Error saving local history:', err);
            }
            return updatedHistory;
        });

        if (user && user.id !== 'mock-admin-id') {
            try {
                await supabase.from('history').insert({
                    id: newItem.id,
                    user_id: user.id,
                    timestamp: newItem.timestamp,
                    keyword: newItem.keyword,
                    product_name: newItem.productName,
                    content: newItem.content,
                    seo_score: newItem.seoScore
                });
            } catch (error) {
                console.error('[useHistory] Supabase sync error:', error);
            }
        }

        return newItem.id;
    }, [user]);

    // Remove item from history
    const removeFromHistory = useCallback(async (id: string) => {
        setHistory(prev => {
            const updatedHistory = prev.filter(item => item.id !== id);
            try {
                localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
            } catch (err) {
                console.error('[useHistory] Error saving local history:', err);
            }
            return updatedHistory;
        });

        if (user && user.id !== 'mock-admin-id') {
            try {
                await supabase.from('history').delete().eq('id', id);
            } catch (error) {
                console.error('[useHistory] Supabase delete error:', error);
            }
        }
    }, [user]);

    // Clear all history
    const clearHistory = useCallback(async () => {
        saveHistory([]);
        if (user && user.id !== 'mock-admin-id') {
            try {
                await supabase.from('history').delete().eq('user_id', user.id);
            } catch (error) {
                console.error('[useHistory] Supabase clear error:', error);
            }
        }
    }, [saveHistory, user]);

    // Get item by ID
    const getHistoryItem = useCallback((id: string): HistoryItem | undefined => {
        return history.find(item => item.id === id);
    }, [history]);

    return {
        history,
        addToHistory,
        removeFromHistory,
        clearHistory,
        getHistoryItem,
    };
}
