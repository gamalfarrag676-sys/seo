import { useEffect, useState } from 'react';

interface AnimatedCounterProps {
    value: number;
    duration?: number;
    suffix?: string;
    className?: string;
}

/**
 * Animated counter that smoothly counts up from 0 to the target value
 */
export function AnimatedCounter({
    value,
    duration = 1500,
    suffix = '',
    className = ''
}: AnimatedCounterProps) {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        if (value === 0) {
            setDisplayValue(0);
            return;
        }

        const startTime = Date.now();
        const startValue = displayValue;
        const diff = value - startValue;

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function (ease-out cubic)
            const eased = 1 - Math.pow(1 - progress, 3);

            const current = Math.round(startValue + diff * eased);
            setDisplayValue(current);

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }, [value, duration]);

    return (
        <span className={className}>
            {displayValue}{suffix}
        </span>
    );
}

interface AnimatedScoreProps {
    score: number;
    maxScore: number;
    grade: string;
    gradeColor: string;
}

/**
 * Animated SEO score display with circular progress
 */
export function AnimatedScore({ score, maxScore, grade, gradeColor }: AnimatedScoreProps) {
    const [progress, setProgress] = useState(0);
    const percentage = Math.round((score / maxScore) * 100);
    const circumference = 2 * Math.PI * 45; // radius = 45

    useEffect(() => {
        const timer = setTimeout(() => {
            setProgress(percentage);
        }, 100);
        return () => clearTimeout(timer);
    }, [percentage]);

    return (
        <div className="relative w-32 h-32">
            {/* Background circle */}
            <svg className="w-full h-full transform -rotate-90">
                <circle
                    cx="64"
                    cy="64"
                    r="45"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    className="text-slate-800"
                />
                {/* Progress circle */}
                <circle
                    cx="64"
                    cy="64"
                    r="45"
                    stroke="url(#gradient)"
                    strokeWidth="8"
                    fill="transparent"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference - (progress / 100) * circumference}
                    className="transition-all duration-1000 ease-out"
                />
                <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="50%" stopColor="#a855f7" />
                        <stop offset="100%" stopColor="#ec4899" />
                    </linearGradient>
                </defs>
            </svg>

            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-3xl font-black ${gradeColor}`}>{grade}</span>
                <span className="text-sm text-slate-400">
                    <AnimatedCounter value={score} duration={1200} />/{maxScore}
                </span>
            </div>
        </div>
    );
}
