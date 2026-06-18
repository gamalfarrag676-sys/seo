import { useState, useEffect } from 'react';
import { Sparkles, Brain, Wand2, CheckCircle, Loader2 } from 'lucide-react';

interface GenerationStep {
    id: string;
    label: string;
    icon: React.ReactNode;
}

const steps: GenerationStep[] = [
    { id: 'analyzing', label: 'تحليل الصورة...', icon: <Brain className="w-5 h-5" /> },
    { id: 'writing', label: 'كتابة المحتوى...', icon: <Wand2 className="w-5 h-5" /> },
    { id: 'optimizing', label: 'تحسين SEO...', icon: <Sparkles className="w-5 h-5" /> },
];

const messages = [
    'جاري تحليل الصورة بالذكاء الاصطناعي...',
    'استخراج تفاصيل المنتج...',
    'كتابة محتوى تسويقي احترافي...',
    'تطبيق معايير E-E-A-T...',
    'تحسين الكلمات المفتاحية...',
    'إنشاء وصف الميتا...',
    'مراجعة جودة المحتوى...',
];

export function TypewriterLoader() {
    const [currentStep, setCurrentStep] = useState(0);
    const [currentMessage, setCurrentMessage] = useState(0);
    const [displayedText, setDisplayedText] = useState('');
    const [isTyping, setIsTyping] = useState(true);

    // Cycle through steps
    useEffect(() => {
        const stepInterval = setInterval(() => {
            setCurrentStep((prev) => (prev + 1) % steps.length);
        }, 3000);
        return () => clearInterval(stepInterval);
    }, []);

    // Cycle through messages
    useEffect(() => {
        const messageInterval = setInterval(() => {
            setCurrentMessage((prev) => (prev + 1) % messages.length);
            setDisplayedText('');
            setIsTyping(true);
        }, 4000);
        return () => clearInterval(messageInterval);
    }, []);

    // Typewriter effect
    useEffect(() => {
        if (!isTyping) return;

        const message = messages[currentMessage];
        if (displayedText.length < message.length) {
            const timeout = setTimeout(() => {
                setDisplayedText(message.slice(0, displayedText.length + 1));
            }, 50);
            return () => clearTimeout(timeout);
        } else {
            setIsTyping(false);
        }
    }, [displayedText, currentMessage, isTyping]);

    return (
        <div className="flex flex-col items-center justify-center py-12 px-6">
            {/* Animated Brain Icon */}
            <div className="relative mb-8">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center animate-pulse-glow">
                    <Sparkles className="w-12 h-12 text-white animate-spin-slow" />
                </div>
                {/* Orbiting particles */}
                <div className="absolute inset-0 animate-spin-slow" style={{ animationDuration: '8s' }}>
                    <div className="absolute -top-2 left-1/2 w-3 h-3 bg-pink-500 rounded-full blur-sm" />
                </div>
                <div className="absolute inset-0 animate-spin-slow" style={{ animationDuration: '6s', animationDirection: 'reverse' }}>
                    <div className="absolute top-1/2 -right-2 w-2 h-2 bg-cyan-400 rounded-full blur-sm" />
                </div>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center gap-4 mb-8">
                {steps.map((step, index) => (
                    <div
                        key={step.id}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-500 ${index === currentStep
                                ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white scale-110'
                                : index < currentStep
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : 'bg-slate-800/50 text-slate-500'
                            }`}
                    >
                        {index < currentStep ? (
                            <CheckCircle className="w-4 h-4" />
                        ) : index === currentStep ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            step.icon
                        )}
                        <span className="text-xs font-bold hidden sm:inline">{step.label}</span>
                    </div>
                ))}
            </div>

            {/* Typewriter Message */}
            <div className="h-8 flex items-center">
                <p className="text-lg text-slate-300 font-medium">
                    {displayedText}
                    <span className="animate-pulse text-indigo-400">|</span>
                </p>
            </div>

            {/* Progress Bar */}
            <div className="w-full max-w-sm mt-6">
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full animate-progress"
                        style={{ width: '100%' }}
                    />
                </div>
            </div>
        </div>
    );
}
