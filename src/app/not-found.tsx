import Link from "next/link";

export default function NotFoundPage() {
    return (
        <div className="py-20 px-6">
            <div className="max-w-lg mx-auto text-center">
                <div className="text-8xl mb-6">🔍</div>
                <h1 className="text-5xl font-extrabold mb-4">404</h1>
                <p className="text-xl text-muted mb-8">
                    Oops! This page doesn&apos;t exist.
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                    <Link href="/" className="btn-primary">Go Home</Link>
                    <Link href="/tools" className="btn-secondary">Browse Tools</Link>
                </div>
            </div>
        </div>
    );
}
