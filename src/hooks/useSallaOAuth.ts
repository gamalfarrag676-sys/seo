import { useEffect, useCallback } from 'react';
import { exchangeCodeForToken, testSallaConnection, type SallaOAuthConfig } from '../utils/salla';
import { useToast } from '../components/Toast';

/**
 * Custom hook for handling Salla OAuth callback
 * Processes the OAuth code from URL and exchanges it for access token
 */
export function useSallaOAuth() {
    const toast = useToast();

    const handleOAuthCallback = useCallback(async () => {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const returnedState = urlParams.get('state');
        const error = urlParams.get('error');

        // Handle OAuth error
        if (error) {
            const errorDesc = urlParams.get('error_description');
            console.error('[Salla OAuth] Error:', error, errorDesc);
            toast.error(`خطأ في سلة: ${errorDesc || error}`);
            window.history.replaceState({}, document.title, '/');
            return;
        }

        // Check for code in URL (Salla OAuth callback)
        if (!code) return;

        // IMMEDIATELY clear URL to prevent code reuse
        window.history.replaceState({}, document.title, '/');

        // Prevent duplicate processing
        if (localStorage.getItem('salla_oauth_processing') === 'true') {
            // console.log('[Salla OAuth] Already processing...');
            return;
        }
        localStorage.setItem('salla_oauth_processing', 'true');

        // console.log('[Salla OAuth] Code received');

        // Verify state parameter
        const savedState = sessionStorage.getItem('salla_oauth_state');
        if (returnedState && savedState && returnedState !== savedState) {
            console.error('[Salla OAuth] State mismatch!');
            toast.error('خطأ أمني: state غير متطابق');
            localStorage.removeItem('salla_oauth_processing');
            return;
        }
        sessionStorage.removeItem('salla_oauth_state');

        const clientId = localStorage.getItem('salla_client_id');
        const clientSecret = localStorage.getItem('salla_client_secret');

        if (!clientId || !clientSecret) {
            console.warn('[Salla OAuth] Missing credentials');
            localStorage.removeItem('salla_oauth_processing');
            return;
        }

        // console.log('[Salla OAuth] Exchanging code for token...');

        const config: SallaOAuthConfig = {
            clientId,
            clientSecret,
            redirectUri: window.location.origin + '/callback'
        };

        try {
            const result = await exchangeCodeForToken(code, config);
            // console.log('[Salla OAuth] Result:', result.success ? 'SUCCESS' : result.error);

            if (result.success && result.accessToken) {
                localStorage.setItem('salla_access_token', result.accessToken);
                if (result.refreshToken) {
                    localStorage.setItem('salla_refresh_token', result.refreshToken);
                }

                // Get store name
                const testResult = await testSallaConnection({ accessToken: result.accessToken });
                if (testResult.success && testResult.storeName) {
                    localStorage.setItem('salla_store_name', testResult.storeName);
                }

                localStorage.removeItem('salla_oauth_processing');
                toast.success('تم ربط متجر سلة بنجاح! 🛍️');
                window.location.reload();
            } else {
                toast.error('فشل ربط سلة: ' + (result.error || 'خطأ غير معروف'));
                localStorage.removeItem('salla_oauth_processing');
            }
        } catch (err: any) {
            console.error('[Salla OAuth] Exception:', err);
            toast.error('خطأ في الاتصال: ' + err.message);
            localStorage.removeItem('salla_oauth_processing');
        }
    }, [toast]);

    // Run on mount
    useEffect(() => {
        handleOAuthCallback();
    }, [handleOAuthCallback]);
}
