"use client";

import { useState, useEffect } from "react";

interface ShareButtonsProps {
    title: string;
    text?: string;
    url?: string;
}

export default function ShareButtons({ title, text, url }: ShareButtonsProps) {
    const [shareUrl, setShareUrl] = useState("");
    const [copied, setCopied] = useState(false);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        setShareUrl(url || window.location.href);
        // Show after a short delay so it doesn't flash on page load
        const timer = setTimeout(() => setVisible(true), 1500);
        return () => clearTimeout(timer);
    }, [url]);

    const shareText = text || `Check out ${title} on VedaWell Tools!`;

    const handleNativeShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({ title, text: shareText, url: shareUrl });
            } catch {
                // User cancelled
            }
        }
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback
            const input = document.createElement("input");
            input.value = shareUrl;
            document.body.appendChild(input);
            input.select();
            document.execCommand("copy");
            document.body.removeChild(input);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + " " + shareUrl)}`;
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;

    if (!visible) return null;

    return (
        <div className="flex flex-col gap-2 items-center">
            {/* Share buttons group */}
            <p className="text-sm text-muted">Share this tool</p>
            <div className="flex gap-2 bg-card border border-border rounded-full px-3 py-2 shadow-sm">
                {/* WhatsApp */}
                <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-green-500/20 transition-colors"
                    title="Share on WhatsApp"
                >
                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-green-500">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                </a>

                {/* Telegram */}
                <a
                    href={telegramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-blue-400/20 transition-colors"
                    title="Share on Telegram"
                >
                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-blue-400">
                        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                    </svg>
                </a>

                {/* X (Twitter) */}
                <a
                    href={twitterUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-foreground/10 transition-colors"
                    title="Share on X"
                >
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-foreground">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                </a>

                {/* Native Share (mobile) */}
                {"share" in navigator && (
                    <button
                        onClick={handleNativeShare}
                        className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-primary/20 transition-colors"
                        title="Share"
                    >
                        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-primary">
                            <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z" />
                        </svg>
                    </button>
                )}

                {/* Copy Link */}
                <button
                    onClick={handleCopy}
                    className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-primary/20 transition-colors"
                    title={copied ? "Copied!" : "Copy Link"}
                >
                    {copied ? (
                        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-green-500">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                        </svg>
                    ) : (
                        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-muted">
                            <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z" />
                        </svg>
                    )}
                </button>
            </div>
        </div>
    );
}
