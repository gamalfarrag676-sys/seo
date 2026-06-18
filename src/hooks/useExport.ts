import { useState, useCallback } from 'react';
import { useToast } from '../components/Toast';
import { createProductInWooCommerce, type WooCommerceConfig, type ExportData } from '../utils/wooCommerce';
import { createProductInSalla, type SallaConfig, type SallaExportData } from '../utils/salla';
import type { SEOContent } from '../utils/gemini';

interface PublishStatus {
    success: boolean;
    message: string;
}

interface UseExportReturn {
    publishStatus: PublishStatus | null;
    isExporting: boolean;
    exportToStore: (
        content: SEOContent,
        imageBlob: Blob,
        imageName: string,
        productName: string,
        exportData: ExportData
    ) => Promise<boolean>;
    clearStatus: () => void;
    canExport: boolean;
    openExportModal: () => boolean;
}

/**
 * Custom hook for exporting products to Salla/WooCommerce
 */
export function useExport(): UseExportReturn {
    const toast = useToast();
    const [publishStatus, setPublishStatus] = useState<PublishStatus | null>(null);
    const [isExporting, setIsExporting] = useState(false);

    const clearStatus = useCallback(() => setPublishStatus(null), []);

    // Check if any store is connected
    const canExport = useCallback(() => {
        const savedWcStr = localStorage.getItem('wc_config');
        const sallaToken = localStorage.getItem('salla_access_token');
        return !!(savedWcStr || sallaToken);
    }, []);

    // Open export modal (returns false if no store connected)
    const openExportModal = useCallback((): boolean => {
        if (!canExport()) {
            toast.warning('الرجاء ربط متجر سلة أو WooCommerce أولاً من الإعدادات (⚙️)');
            return false;
        }
        return true;
    }, [canExport, toast]);

    // Export to store
    const exportToStore = useCallback(async (
        content: SEOContent,
        imageBlob: Blob,
        imageName: string,
        productName: string,
        exportData: ExportData
    ): Promise<boolean> => {
        setIsExporting(true);
        setPublishStatus(null);

        try {
            const sallaToken = localStorage.getItem('salla_access_token');

            if (exportData.exportPlatform === 'salla' && sallaToken) {
                // Export to Salla
                const sallaConfig: SallaConfig = { accessToken: sallaToken };
                const sallaData: SallaExportData = {
                    productType: exportData.productType,
                    regularPrice: exportData.regularPrice,
                    salePrice: exportData.salePrice,
                    stockQuantity: exportData.stockQuantity,
                    categoryId: exportData.categoryId,
                    variations: exportData.variations.map(v => ({
                        color: v.color,
                        size: v.size,
                        price: v.price,
                        stock: v.stock
                    })),
                    hasColors: exportData.hasColors,
                    hasSizes: exportData.hasSizes,
                    colorDisplayType: exportData.colorDisplayType
                };

                const result = await createProductInSalla(
                    sallaConfig,
                    content,
                    imageBlob,
                    imageName,
                    productName,
                    sallaData
                );

                if (result.success) {
                    setPublishStatus({
                        success: true,
                        message: `تم نشر المنتج في سلة! 🛍️ ID: ${result.productId}`
                    });
                    setIsExporting(false);
                    return true;
                } else {
                    throw new Error(result.error || 'فشل النشر في سلة');
                }
            } else {
                // Export to WooCommerce
                const savedWcStr = localStorage.getItem('wc_config');
                if (!savedWcStr) {
                    throw new Error('بيانات المتجر غير موجودة. اربط سلة أو WooCommerce أولاً.');
                }

                const config: WooCommerceConfig = JSON.parse(savedWcStr);

                const result = await createProductInWooCommerce(
                    config,
                    content,
                    imageBlob,
                    imageName,
                    productName,
                    exportData
                );

                setPublishStatus({
                    success: true,
                    message: `تم نشر المنتج بنجاح! ID: ${result.id}`
                });
                setIsExporting(false);
                return true;
            }
        } catch (err: any) {
            setPublishStatus({
                success: false,
                message: err.message || 'فشل النشر'
            });
            setIsExporting(false);
            return false;
        }
    }, []);

    return {
        publishStatus,
        isExporting,
        exportToStore,
        clearStatus,
        canExport: canExport(),
        openExportModal,
    };
}
