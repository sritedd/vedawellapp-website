"use client";

import { useState } from "react";

interface FallbackImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    fallbackSrc?: string;
}

export default function FallbackImage({ src, alt, className, ...props }: FallbackImageProps) {
    const [error, setError] = useState(false);

    if (error || !src) {
        return (
            <div className={`bg-slate-100 dark:bg-slate-800 flex flex-col items-center justify-center text-slate-400 ${className} !transform-none !transition-none`}>
                <svg className="w-10 h-10 sm:w-16 sm:h-16 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-xs sm:text-sm font-medium uppercase tracking-wider">Image Unavailable</span>
            </div>
        );
    }

    return (
        <img
            src={src}
            alt={alt}
            className={className}
            onError={() => setError(true)}
            {...props}
        />
    );
}
