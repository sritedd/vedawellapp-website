import type { Metadata } from "next";
import Link from "next/link";
import { BLOG_POSTS } from "@/data/blog/posts";
import BreadcrumbJsonLd from "@/components/seo/BreadcrumbJsonLd";
import FallbackImage from "@/components/ui/FallbackImage";

export const metadata: Metadata = {
    title: "HomeOwner Guardian Blog — Building Tips & Defect Guides",
    description:
        "Expert guides on Australian home construction, builder dispute resolution, and protecting your new build with HomeOwner Guardian.",
    keywords: "home building tips, construction defects, homeowner guardian, building inspection guide, new home construction",
    openGraph: {
        title: "HomeOwner Guardian Blog — Building Tips & Defect Guides",
        description: "Expert guides on Australian home construction, builder dispute resolution, and protecting your new build with HomeOwner Guardian.",
        url: "https://vedawellapp.com/blog",
    },
    alternates: { canonical: "https://vedawellapp.com/blog" },
};

const CATEGORY_COLORS: Record<string, { bg: string; text: string; darkBg: string; darkText: string }> = {
    "HomeOwner Guardian": { bg: "bg-teal-50", text: "text-teal-700", darkBg: "dark:bg-teal-900/30", darkText: "dark:text-teal-300" },
    "Construction": { bg: "bg-amber-50", text: "text-amber-700", darkBg: "dark:bg-amber-900/30", darkText: "dark:text-amber-300" },
    "Productivity": { bg: "bg-indigo-50", text: "text-indigo-700", darkBg: "dark:bg-indigo-900/30", darkText: "dark:text-indigo-300" },
    "SEO": { bg: "bg-green-50", text: "text-green-700", darkBg: "dark:bg-green-900/30", darkText: "dark:text-green-300" },
    "Development": { bg: "bg-purple-50", text: "text-purple-700", darkBg: "dark:bg-purple-900/30", darkText: "dark:text-purple-300" },
    "Security": { bg: "bg-red-50", text: "text-red-700", darkBg: "dark:bg-red-900/30", darkText: "dark:text-red-300" },
    "Design": { bg: "bg-pink-50", text: "text-pink-700", darkBg: "dark:bg-pink-900/30", darkText: "dark:text-pink-300" },
};

function getCategoryStyle(category: string) {
    return CATEGORY_COLORS[category] || { bg: "bg-gray-50", text: "text-gray-700", darkBg: "dark:bg-gray-800", darkText: "dark:text-gray-300" };
}

export default function BlogPage() {
    const featured = BLOG_POSTS[0];
    const rest = BLOG_POSTS.slice(1);
    const categories = Array.from(new Set(BLOG_POSTS.map((p) => p.category)));

    return (
        <>
        <BreadcrumbJsonLd items={[{ name: "Home", href: "/" }, { name: "Blog", href: "/blog" }]} />
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 selection:bg-indigo-500/30">
            {/* Hero Section */}
            <header className="relative overflow-hidden bg-slate-950 dark:bg-slate-900 text-white pt-24 pb-20 lg:pt-32 lg:pb-28">
                {/* Decorative background gradients */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-1/2 -left-1/4 w-[1000px] h-[1000px] bg-indigo-600/20 rounded-full blur-[120px] mix-blend-screen" />
                    <div className="absolute -bottom-1/2 -right-1/4 w-[800px] h-[800px] bg-teal-500/20 rounded-full blur-[100px] mix-blend-screen" />
                    <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[80px]" />
                </div>

                <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 backdrop-blur-md mb-8">
                        <span className="flex h-2 w-2 rounded-full bg-teal-400"></span>
                        <span className="text-sm font-bold text-teal-400 tracking-wide uppercase">HomeOwner Guardian Blog</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-[1.1]">
                        Build Smarter. <br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-teal-400 to-indigo-400">
                            Protect Your Investment.
                        </span>
                    </h1>
                    <p className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto leading-relaxed font-light mb-12">
                        Expert construction insights, defect guides, and insider tips to help Australian homeowners navigate their building journey safely.
                    </p>
                    
                    {/* Category Filter Pills (Visual only for now) */}
                    <div className="flex flex-wrap justify-center gap-2">
                        <span className="px-4 py-2 bg-white text-slate-900 rounded-full text-sm font-semibold shadow-sm cursor-pointer hover:scale-105 transition-transform">
                            All Topics
                        </span>
                        {categories.map((cat) => (
                            <span key={cat} className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-sm font-medium text-slate-300 cursor-pointer backdrop-blur-sm transition-all hover:scale-105">
                                {cat}
                            </span>
                        ))}
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 py-16 lg:py-24 space-y-24">
                {/* HomeOwner Guardian Highlight */}
                <section className="relative overflow-hidden bg-gradient-to-r from-teal-500 to-indigo-600 rounded-3xl shadow-xl border border-teal-400">
                    <div className="relative z-10 px-6 py-10 sm:py-12 max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="text-left md:max-w-xl">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 border border-white/30 text-white text-xs font-bold uppercase tracking-wider mb-4">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                Prime Product Focus
                            </div>
                            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4 tracking-tight leading-tight">
                                Protect Your Home Build with Guardian AI
                            </h2>
                            <p className="text-teal-50 text-lg leading-relaxed">
                                Don't leave your biggest asset to chance. Track construction, get instant AI stage advice, and catch dodgy builder tactics early.
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 shrink-0 w-full md:w-auto">
                            <Link href="/guardian" className="px-8 py-4 bg-white text-teal-700 rounded-xl font-extrabold text-center hover:scale-105 hover:bg-slate-50 transition-all shadow-md">
                                Start Free Trial
                            </Link>
                            <Link href="/guardian/login" className="px-8 py-4 bg-teal-700/50 text-white border border-teal-400 rounded-xl font-bold text-center hover:bg-teal-600 transition-all">
                                Log In
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Featured Post */}
                <section>
                    <div className="flex items-center gap-3 mb-8">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Featured Insight</h2>
                        <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1"></div>
                    </div>
                    
                    <Link href={`/blog/${featured.slug}`} className="group block outline-none">
                        <article className="relative bg-white dark:bg-slate-900 rounded-3xl p-8 lg:p-10 shadow-sm border border-slate-200 dark:border-slate-800 hover:shadow-2xl hover:border-indigo-500/30 transition-all duration-500 overflow-hidden transform group-hover:-translate-y-1 flex flex-col md:flex-row gap-8 lg:gap-12 items-center">
                            {/* Image side */}
                            <div className="w-full md:w-1/2 overflow-hidden rounded-2xl shrink-0 shadow-lg relative z-20 bg-slate-100 dark:bg-slate-800">
                                <FallbackImage src={featured.image} alt={featured.title} className="w-full h-full md:h-[350px] object-cover transform group-hover:scale-105 transition-transform duration-700" />
                            </div>
                            
                            {/* Accent Glow */}
                            <div className="absolute top-0 right-0 p-32 bg-indigo-500/10 dark:bg-indigo-500/5 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none z-0"></div>
                            
                            <div className="relative z-10 w-full md:w-1/2">
                                <div className="flex items-center gap-4 mb-6 relative">
                                    {(() => {
                                        const style = getCategoryStyle(featured.category);
                                        return <span className={`px-4 py-1.5 ${style.bg} ${style.text} ${style.darkBg} ${style.darkText} rounded-full text-xs font-bold uppercase tracking-wider`}>{featured.category}</span>;
                                    })()}
                                    <time className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                        {new Date(featured.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                                    </time>
                                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5 hidden sm:flex">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        {featured.readTime}
                                    </span>
                                </div>
                                <h3 className="text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-indigo-600 group-hover:to-teal-500 dark:group-hover:from-indigo-400 dark:group-hover:to-teal-300 transition-all duration-300 mb-6 leading-[1.15]">
                                    {featured.title}
                                </h3>
                                <p className="text-xl text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl mb-8">
                                    {featured.description}
                                </p>
                                <div className="inline-flex items-center gap-2 font-semibold text-indigo-600 dark:text-indigo-400 group-hover:gap-3 transition-all bg-indigo-50 dark:bg-indigo-500/10 px-6 py-3 rounded-full">
                                    Read Article
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                                </div>
                            </div>
                        </article>
                    </Link>
                </section>

                {/* All Posts Grid */}
                <section>
                    <div className="flex items-center gap-3 mb-8">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Latest Articles</h2>
                        <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1"></div>
                    </div>
                    
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {rest.map((post) => {
                            const style = getCategoryStyle(post.category);
                            return (
                                <Link key={post.slug} href={`/blog/${post.slug}`} className="group h-full outline-none">
                                    <article className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 hover:shadow-xl hover:border-indigo-500/30 transition-all duration-300 transform group-hover:-translate-y-1 relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-teal-400 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-out z-10"></div>
                                        
                                        <div className="w-full h-52 overflow-hidden bg-slate-100 dark:bg-slate-800">
                                            <FallbackImage src={post.image} alt={post.title} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" loading="lazy" />
                                        </div>
                                        
                                        <div className="p-6 lg:p-8 flex-1 flex flex-col relative z-20">
                                            <div className="flex items-center justify-between mb-5">
                                            <span className={`px-3 py-1 ${style.bg} ${style.text} ${style.darkBg} ${style.darkText} rounded-full text-xs font-bold uppercase tracking-wider`}>
                                                {post.category}
                                            </span>
                                            <span className="text-xs font-medium text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                {post.readTime}
                                            </span>
                                        </div>
                                        
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors mb-3 leading-snug">
                                            {post.title}
                                        </h3>
                                        
                                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed flex-1 mb-6 text-sm">
                                            {post.description}
                                        </p>
                                        
                                        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800/50 mt-auto">
                                            <time className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                {new Date(post.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                            </time>
                                            <div className="text-indigo-600 dark:text-indigo-400 text-sm font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
                                                Read <span aria-hidden="true">&rarr;</span>
                                            </div>
                                        </div>
                                        </div>
                                    </article>
                                </Link>
                            );
                        })}
                    </div>
                </section>

                {/* End of content */}
            </main>
        </div>
        </>
    );
}
