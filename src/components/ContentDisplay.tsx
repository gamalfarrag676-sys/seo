import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Copy, Check, FileText, Tag, Link, Image as ImageIcon, Heading, Sparkles } from 'lucide-react';
import type { SEOContent } from '../utils/gemini';

interface ContentDisplayProps {
 content: SEOContent | string | null;
 loading: boolean;
}

// Helper to convert basic Markdown to styles HTML for clipboard
const markdownToHtml = (md: string): string => {
 let html = md
 // Force BOLD (<strong>) inside headers to satisfy user request
 .replace(/^# (.*$)/gim, '<h1><strong>$1</strong></h1>')
 .replace(/^## (.*$)/gim, '<h2><strong>$1</strong></h2>')
 .replace(/^### (.*$)/gim, '<h3><strong>$1</strong></h3>')
 .replace(/^\* (.*$)/gim, '<ul><li>$1</li></ul>')
 .replace(/^\- (.*$)/gim, '<ul><li>$1</li></ul>')
 .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
 .replace(/\n/gim, '<br>');
 
 // Cleanup lists (merge adjacent uls) - simplistic approach
 html = html.replace(/<\/ul><br><ul>/gim, '');
 return html;
};

const CopyButton = ({ text, isRichText = false }: { text: string, isRichText?: boolean }) => {
 const [copied, setCopied] = useState(false);

 const handleCopy = async () => {
 try {
 if (isRichText) {
 // Copy as Rich Text (HTML)
 const html = markdownToHtml(text);
 const blobInput = new Blob([html], { type: 'text/html' });
 const blobText = new Blob([text], { type: 'text/plain' });
 
 // Use ClipboardItem if available
 if (typeof ClipboardItem !== 'undefined') {
 await navigator.clipboard.write([
 new ClipboardItem({
 'text/html': blobInput,
 'text/plain': blobText,
 }),
 ]);
 } else {
 // Fallback
 await navigator.clipboard.writeText(text);
 }
 } else {
 // Simple text copy
 await navigator.clipboard.writeText(text);
 }
 setCopied(true);
 setTimeout(() => setCopied(false), 2000);
 } catch (err) {
 console.error('Copy failed', err);
 // Fallback to simple text if rich copy fails
 navigator.clipboard.writeText(text);
 setCopied(true);
 setTimeout(() => setCopied(false), 2000);
 }
 };

 return (
 <button
 onClick={handleCopy}
 className={`p-2 rounded-lg transition-all flex items-center gap-2 ${
 copied
 ? 'bg-emerald-500/20 text-emerald-400'
 : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-900'
 }`}
 title={isRichText ? "نسخ بالتنسيق (Rich Text)" : "نسخ النص"}
 >
 {copied ? <Check size={18} /> : <Copy size={18} />}
 {isRichText && !copied && <span className="text-xs font-bold">نسخ منسق</span>}
 {copied && <span className="text-xs">تم النسخ!</span>}
 </button>
 );
};

const SectionCard = ({ title, icon: Icon, content, isMarkdown = false, richCopy = false }: { title: string, icon: any, content: string | undefined, isMarkdown?: boolean, richCopy?: boolean }) => {
 if (!content) return null;

 return (
 <div className="card p-6 mb-6 animate-fade-in relative group">
 <div className="flex items-center justify-between mb-4 border-b border-gray-200 pb-3">
 <div className="flex items-center gap-2 text-emerald-400">
 <Icon size={20} />
 <h3 className="font-semibold">{title}</h3>
 </div>
 <CopyButton text={content} isRichText={richCopy} />
 </div>
 
 <div className="text-gray-700 leading-relaxed text-right md-content">
 {isMarkdown ? (
 <ReactMarkdown
 components={{
 h1: ({node, ...props}) => <h1 className="text-2xl font-bold text-gray-900 mb-4 mt-2" {...props} />,
 h2: ({node, ...props}) => <h2 className="text-xl font-bold text-emerald-400 mb-3 mt-6 border-b border-emerald-500/20 pb-2" {...props} />,
 h3: ({node, ...props}) => <h3 className="text-lg font-bold text-gray-900 mb-2 mt-4" {...props} />,
 p: ({node, ...props}) => <p className="mb-4 text-gray-600" {...props} />,
 ul: ({node, ...props}) => <ul className="list-disc list-inside space-y-2 mb-4 marker:text-emerald-500" {...props} />,
 li: ({node, ...props}) => <li className="text-gray-600" {...props} />,
 strong: ({node, ...props}) => <strong className="text-emerald-300 font-bold" {...props} />,
 }}
 >
 {content}
 </ReactMarkdown>
 ) : (
 <div className="whitespace-pre-wrap font-mono text-sm bg-gray-50 p-4 rounded-lg border border-gray-200">
 {content}
 </div>
 )}
 </div>
 </div>
 );
};

export const ContentDisplay: React.FC<ContentDisplayProps> = ({ content, loading }) => {
 if (loading) {
 return (
 <div className="space-y-4 animate-pulse">
 <div className="h-64 bg-gray-100 rounded-2xl w-full"></div>
 <div className="h-32 bg-gray-100 rounded-2xl w-full"></div>
 </div>
 );
 }

 if (!content) return null;

 // Handle Legacy String format (if any)
 if (typeof content === 'string') {
 return (
 <SectionCard 
 title="المتجر (النظام القديم)" 
 icon={FileText} 
 content={content} 
 isMarkdown={true} 
 />
 );
 }

 // Handle Structured Content
 return (
 <div className="space-y-6">
 {/* 
 User Request: "Title should be part of the content" 
 We combine H1 + Main Content into one "Copy Ready" block 
 Rich Copy Enabled!
 */}
 <SectionCard 
 title="المحتوى الكامل (منسق وجاهز للنسخ)" 
 icon={Sparkles} 
 content={`# ${content.h1Title}\n\n${content.mainContent}`} 
 isMarkdown={true} 
 richCopy={true}
 />

 {/* Helper Cards for segmented data */}
 <SectionCard 
 title="عنوان المنتج فقط" 
 icon={Heading} 
 content={content.h1Title} 
 />

 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <SectionCard 
 title="عنوان الميتا (Meta Title)" 
 icon={Tag} 
 content={content.metaTitle} 
 />
 <SectionCard 
 title="وصف الميتا (Meta Description)" 
 icon={FileText} 
 content={content.metaDescription} 
 />
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <SectionCard 
 title="الكلمات المفتاحية (Keywords)" 
 icon={Tag} 
 content={content.keywords} 
 />
 <SectionCard 
 title="رابط المنتج (URL)" 
 icon={Link} 
 content={content.urlSlug} 
 />
 </div>

 <SectionCard 
 title="نص بديل للصورة (ALT Text)" 
 icon={ImageIcon} 
 content={content.altText} 
 />
 </div>
 );
};
