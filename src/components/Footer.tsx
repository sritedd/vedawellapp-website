import Link from "next/link";

export default function Footer() {
    return (
        <footer className="border-t border-border py-8 px-6">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-muted text-sm">
                    © {new Date().getFullYear()} VedaWell Tools. Free & Open Source.
                </p>
                <div className="flex items-center gap-6 text-sm">
                    <Link href="/about" className="text-muted hover:text-foreground transition-colors">
                        About
                    </Link>
                    <Link href="/privacy" className="text-muted hover:text-foreground transition-colors">
                        Privacy
                    </Link>
                    <Link
                        href="https://buymeacoffee.com/vedawell"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted hover:text-foreground transition-colors"
                    >
                        ☕ Support
                    </Link>
                </div>
            </div>
        </footer>
    );
}
