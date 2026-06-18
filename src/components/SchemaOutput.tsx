import { useState } from 'react';
import { Code, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { clsx } from 'clsx';
import type { SEOContent } from '../utils/gemini';
import { generateProductSchema, schemaToJsonLd, schemaToHtmlScript } from '../utils/schemaGenerator';

interface SchemaOutputProps {
    content: SEOContent;
    productName: string;
    price?: number;
    salePrice?: number;
}

export function SchemaOutput({ content, productName, price, salePrice }: SchemaOutputProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const [outputType, setOutputType] = useState<'json' | 'html'>('json');

    const schema = generateProductSchema(content, productName, {
        price,
        salePrice,
        currency: 'SAR',
        inStock: true,
    });

    const output = outputType === 'json' ? schemaToJsonLd(schema) : schemaToHtmlScript(schema);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(output);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-2xl overflow-hidden">
            {/* Header */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full p-4 flex items-center justify-between hover:bg-slate-800/50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                        <Code className="w-5 h-5 text-purple-400" />
                    </div>
                    <div className="text-right">
                        <h3 className="font-bold text-slate-200">Schema Markup</h3>
                        <p className="text-xs text-slate-400">كود Structured Data للمنتج</p>
                    </div>
                </div>
                {isOpen ? (
                    <ChevronUp className="w-5 h-5 text-slate-400" />
                ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                )}
            </button>

            {/* Content */}
            {isOpen && (
                <div className="p-4 pt-0 space-y-3 animate-in slide-in-from-top-2">
                    {/* Type Toggle */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => setOutputType('json')}
                            className={clsx(
                                "flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors",
                                outputType === 'json'
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                            )}
                        >
                            JSON-LD
                        </button>
                        <button
                            onClick={() => setOutputType('html')}
                            className={clsx(
                                "flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors",
                                outputType === 'html'
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                            )}
                        >
                            HTML Script
                        </button>
                    </div>

                    {/* Code Output */}
                    <div className="relative">
                        <pre className="bg-slate-900 rounded-xl p-4 text-xs text-slate-300 overflow-x-auto max-h-64 overflow-y-auto">
                            <code>{output}</code>
                        </pre>

                        {/* Copy Button */}
                        <button
                            onClick={handleCopy}
                            className={clsx(
                                "absolute top-2 left-2 p-2 rounded-lg transition-all",
                                copied
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                            )}
                        >
                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                    </div>

                    {/* Instructions */}
                    <div className="bg-slate-900/50 rounded-lg p-3 text-xs text-slate-400">
                        <p className="font-medium text-slate-300 mb-1">💡 كيفية الاستخدام:</p>
                        <ul className="space-y-1 list-disc list-inside">
                            <li>انسخ الكود أعلاه</li>
                            <li>ألصقه في قسم {`<head>`} بصفحة المنتج</li>
                            <li>اختبره في <a href="https://search.google.com/test/rich-results" target="_blank" className="text-purple-400 hover:underline">Google Rich Results Test</a></li>
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
}
