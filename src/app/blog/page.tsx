import type { Metadata } from "next";
import Link from "next/link";
import { BLOG_POSTS } from "@/data/blog/posts";

export const metadata: Metadata = {
    title: "VedaWell Blog — Free Tools, Home Building Tips & Guardian Guides",
    description:
        "Tips, guides, and tutorials on free online tools, Australian home construction, building defect protection, and HomeOwner Guardian app features.",
    keywords: "free tools blog, home building tips, construction defects, homeowner guardian, building inspection guide",
    openGraph: {
        title: "VedaWell Blog — Free Tools, Home Building Tips & Guardian Guides",
        description: "Tips, guides, and tutorials on free online tools, Australian home construction, and building defect protection.",
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

    // Get unique categories
    const categories = Array.from(new Set(BLOG_POSTS.map((p) => p.category)));

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950">
            {/* Hero */}
            <header className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 text-white">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
                    <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-300 rounded-full blur-3xl" />
                </div>
                <div className="relative max-w-5xl mx-auto px-6 py-16 sm:py-20">
                    <p className="text-indigo-200 font-medium mb-2 tracking-wide uppercase text-sm">VedaWell Blog</p>
                    <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 leading-tight">
                        Tools, Tips & Building Guides
                    </h1>
                    <p className="text-lg text-indigo-100 max-w-2xl leading-relaxed">
                        Expert guides on free online tools, Australian home construction, building defect protection, and getting the most from HomeOwner Guardian.
                    </p>
                    {/* Category pills */}
                    <div className="flex flex-wrap gap-2 mt-8">
                        {categories.map((cat) => (
                            <span key={cat} className="px-3 py-1.5 bg-white/15 backdrop-blur-sm rounded-full text-sm font-medium text-white border border-white/20">
                                {cat}
                            </span>
                        ))}
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 py-12">
                {/* Featured Post */}
                <section className="mb-16">
                    <h2 className="text-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-6">Featured</h2>
                    <Link href={`/blog/${featured.slug}`} className="group block">
                        <article className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 dark:border-slate-700 md:flex">
                            {/* Color accent bar */}
                            <div className="md:w-2 bg-gradient-to-b from-indigo-500 to-purple-600 shrink-0" />
                            <div className="p-8 flex-1">
                                <div className="flex items-center gap-3 mb-4">
                                    {(() => {
                                        const style = getCategoryStyle(featured.category);
                                        return <span className={`px-3 py-1 ${style.bg} ${style.text} ${style.darkBg} ${style.darkText} rounded-full text-xs font-semibold`}>{featured.category}</span>;
                                    })()}
                                    <time className="text-sm text-gray-500 dark:text-gray-400">
                                        {new Date(featured.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                                    </time>
                                    <span className="text-sm text-gray-400 dark:text-gray-500">{featured.readTime}</span>
                                </div>
                                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors mb-3 leading-snug">
                                    {featured.title}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed mb-4 line-clamp-3">
                                    {featured.description}
                                </p>
                                <span className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-semibold group-hover:gap-2 transition-all">
                                    Read article <span aria-hidden="true">→</span>
                                </span>
                            </div>
                        </article>
                    </Link>
                </section>

                {/* All Posts Grid */}
                <section>
                    <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-6">All Articles</h2>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {rest.map((post) => {
                            const style = getCategoryStyle(post.category);
                            return (
                                <Link key={post.slug} href={`/blog/${post.slug}`} className="group block">
                                    <article className="h-full bg-white dark:bg-slate-800 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 dark:border-slate-700 overflow-hidden flex flex-col">
                                        {/* Top color strip */}
                                        <div className="h-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <div className="p-6 flex-1 flex flex-col">
                                            <div className="flex items-center gap-2 mb-3">
                                                <span className={`px-2.5 py-0.5 ${style.bg} ${style.text} ${style.darkBg} ${style.darkText} rounded-full text-xs font-semibold`}>
                                                    {post.category}
                                                </span>
                                                <span className="text-xs text-gray-400 dark:text-gray-500">{post.readTime}</span>
                                            </div>
                                            <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors mb-2 leading-snug">
                                                {post.title}
                                            </h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed flex-1 line-clamp-3">
                                                {post.description}
                                            </p>
                                            <div className="mt-4 flex items-center justify-between">
                                                <time className="text-xs text-gray-400 dark:text-gray-500">
                                                    {new Date(post.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                                </time>
                                                <span className="text-indigo-600 dark:text-indigo-400 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                                    Read →
                                                </span>
                                            </div>
                                        </div>
                                    </article>
                                </Link>
                            );
                        })}
                    </div>
                </section>

                {/* Guardian CTA */}
                <section className="mt-16 bg-gradient-to-br from-teal-600 to-teal-800 rounded-2xl p-8 sm:p-12 text-white text-center">
                    <h2 className="text-2xl sm:text-3xl font-bold mb-3">Protecting Your Home Build?</h2>
                    <p className="text-teal-100 text-lg mb-6 max-w-2xl mx-auto">
                        HomeOwner Guardian tracks your construction, monitors inspections, and catches dodgy builder tactics before they cost you thousands.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Link href="/guardian" className="px-6 py-3 bg-white text-teal-700 rounded-lg font-bold hover:bg-teal-50 transition-colors">
                            Learn More →
                        </Link>
                        <Link href="/tools" className="px-6 py-3 bg-teal-700/50 text-white rounded-lg font-semibold border border-teal-500 hover:bg-teal-700 transition-colors">
                            90+ Free Tools
                        </Link>
                    </div>
                </section>
            </main>
        </div>
    );
}
