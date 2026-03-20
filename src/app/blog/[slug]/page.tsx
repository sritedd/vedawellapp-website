import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BLOG_POSTS } from "@/data/blog/posts";
import FallbackImage from "@/components/ui/FallbackImage";

export function generateStaticParams() {
    return BLOG_POSTS.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const post = BLOG_POSTS.find((p) => p.slug === slug);
    if (!post) return {};
    return {
        title: post.title,
        description: post.description,
        keywords: post.keywords.join(", "),
        authors: [{ name: post.author }],
        openGraph: {
            title: post.title,
            description: post.description,
            type: "article",
            publishedTime: post.date,
            url: `https://vedawellapp.com/blog/${post.slug}`,
        },
        alternates: { canonical: `https://vedawellapp.com/blog/${post.slug}` },
    };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const postIdx = BLOG_POSTS.findIndex((p) => p.slug === slug);
    const post = BLOG_POSTS[postIdx];
    if (!post) notFound();

    const prevPost = postIdx > 0 ? BLOG_POSTS[postIdx - 1] : null;
    const nextPost = postIdx < BLOG_POSTS.length - 1 ? BLOG_POSTS[postIdx + 1] : null;

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: post.title,
        description: post.description,
        datePublished: post.date,
        author: { "@type": "Organization", name: "VedaWell" },
        publisher: { "@type": "Organization", name: "VedaWell", url: "https://vedawellapp.com" },
        mainEntityOfPage: `https://vedawellapp.com/blog/${post.slug}`,
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 selection:bg-indigo-500/30 font-sans">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

            {/* Premium Header */}
            <header className="relative pt-24 pb-16 lg:pt-32 lg:pb-24 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
                {/* Background ambient light */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-64 bg-indigo-500/5 dark:bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />
                
                <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
                    <Link href="/blog" className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-sm font-semibold mb-10 group">
                        <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                        Back to articles
                    </Link>

                    <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-sm font-medium mb-8">
                        <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 rounded-lg uppercase tracking-wider text-xs font-bold border border-indigo-100 dark:border-indigo-500/20">
                            {post.category}
                        </span>
                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            <time dateTime={post.date}>
                                {new Date(post.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                            </time>
                        </div>
                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <span>{post.readTime}</span>
                        </div>
                    </div>

                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white leading-[1.1] mb-8 tracking-tight">
                        {post.title}
                    </h1>

                    <p className="text-xl sm:text-2xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed font-light mb-12">
                        {post.description}
                    </p>
                </div>
                
                {/* Hero Image / Thumbnail */}
                <div className="relative max-w-5xl mx-auto px-6 mt-8 z-20">
                    <div className="w-full h-64 sm:h-96 lg:h-[500px] rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800">
                        <FallbackImage src={post.image} alt={post.title} className="w-full h-full object-cover" />
                    </div>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-6 py-16 lg:py-24 mt-4 lg:mt-10">
                {/* Promo Callout */}
                <div className="mb-14 rounded-3xl border border-teal-200 dark:border-teal-900/50 bg-gradient-to-br from-teal-50 to-white dark:from-slate-800 dark:to-slate-900 p-8 sm:p-10 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-teal-400/10 rounded-full blur-[80px]" />
                    <div className="relative z-10">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-teal-100 dark:bg-teal-900/50 text-teal-800 dark:text-teal-300 text-xs font-bold uppercase tracking-wider mb-5">
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                            AI Enabled
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mb-4 tracking-tight">
                            Guardian AI now supports every build stage
                        </h2>
                        <p className="text-lg text-slate-600 dark:text-slate-300 mb-8 leading-relaxed max-w-2xl">
                            Use AI Defect Assist, Stage Advice, Builder Check AI, and Guardian Chat to turn construction uncertainty into clear next actions.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <Link href="/guardian" className="px-6 py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-bold transition-all shadow-sm hover:shadow-md flex items-center gap-2">
                                Open Guardian AI
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                            </Link>
                            <Link href="/guardian/login?view=sign-up" className="px-6 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">
                                Start Free Trial
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Article Content */}
                <article
                    className="blog-content max-w-none"
                    dangerouslySetInnerHTML={{ __html: post.content }}
                />

                <hr className="my-16 border-slate-200 dark:border-slate-800" />

                {/* Related Tools */}
                {post.relatedTools.length > 0 && (
                    <div className="mb-16 p-8 bg-indigo-50/50 dark:bg-indigo-500/5 rounded-3xl border border-indigo-100 dark:border-indigo-500/10">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Explore Free Tools</h3>
                        <div className="flex flex-wrap gap-3">
                            {post.relatedTools.map((tool) => (
                                <Link
                                    key={tool}
                                    href={`/tools/${tool}`}
                                    className="px-5 py-3 bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-400 rounded-xl shadow-sm hover:shadow-md transition-all font-semibold border border-slate-200 dark:border-slate-700 flex items-center gap-2 group"
                                >
                                    {tool.split("-").map(w => w[0].toUpperCase() + w.slice(1)).join(" ")}
                                    <span className="transform group-hover:translate-x-1 transition-transform border border-indigo-200 dark:border-indigo-800 rounded-full w-6 h-6 flex items-center justify-center text-xs bg-indigo-50 dark:bg-indigo-900/50">&rarr;</span>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* Prev/Next Navigation */}
                <div className="grid sm:grid-cols-2 gap-6">
                    {prevPost ? (
                        <Link href={`/blog/${prevPost.slug}`} className="group p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 transition-all hover:shadow-lg flex flex-col items-start text-left">
                            <span className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mb-2 flex items-center gap-1 group-hover:text-indigo-500 transition-colors">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                                Previous
                            </span>
                            <span className="text-lg font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2 leading-snug">
                                {prevPost.title}
                            </span>
                        </Link>
                    ) : <div />}
                    {nextPost && (
                        <Link href={`/blog/${nextPost.slug}`} className="group p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 transition-all hover:shadow-lg flex flex-col items-end text-right">
                            <span className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mb-2 flex items-center gap-1 group-hover:text-indigo-500 transition-colors">
                                Next
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            </span>
                            <span className="text-lg font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2 leading-snug">
                                {nextPost.title}
                            </span>
                        </Link>
                    )}
                </div>

                {/* Bottom CTA */}
                <div className="mt-20 relative overflow-hidden bg-slate-900 dark:bg-slate-950 rounded-[2.5rem] border border-slate-800 p-10 sm:p-14 text-center text-white">
                    <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-teal-500/10 blur-[100px] pointer-events-none" />
                    
                    <div className="relative z-10">
                        <h3 className="text-3xl sm:text-4xl font-extrabold mb-4 tracking-tight">Building a Home in Australia?</h3>
                        <p className="text-slate-300 text-lg sm:text-xl mb-8 max-w-xl mx-auto font-light leading-relaxed">
                            HomeOwner Guardian helps you track construction, catch defects early, and protect your investment with AI.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link href="/guardian" className="px-8 py-4 bg-teal-500 hover:bg-teal-400 text-slate-900 rounded-xl font-bold transition-all hover:scale-105 shadow-[0_0_20px_rgba(20,184,166,0.3)] flex items-center justify-center gap-2">
                                Start Free Trial
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                            </Link>
                            <Link href="/guardian/login" className="px-8 py-4 bg-white/10 border border-white/20 hover:bg-white/20 text-white rounded-xl font-semibold transition-all backdrop-blur-sm">
                                Log In to Guardian
                            </Link>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
