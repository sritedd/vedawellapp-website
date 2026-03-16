import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BLOG_POSTS } from "@/data/blog/posts";

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
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

            {/* Header bar */}
            <div className="border-b border-gray-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
                <div className="max-w-3xl mx-auto px-6 py-4">
                    <Link href="/blog" className="inline-flex items-center gap-1 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium transition-colors">
                        <span aria-hidden="true">←</span> All Articles
                    </Link>
                </div>
            </div>

            <article className="max-w-3xl mx-auto px-6 py-10">
                {/* Meta */}
                <div className="flex flex-wrap items-center gap-3 text-sm mb-5">
                    <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-semibold">
                        {post.category}
                    </span>
                    <time className="text-gray-500 dark:text-gray-400">
                        {new Date(post.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                    </time>
                    <span className="text-gray-300 dark:text-gray-600">|</span>
                    <span className="text-gray-500 dark:text-gray-400">{post.readTime}</span>
                </div>

                {/* Title */}
                <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-3 leading-tight">
                    {post.title}
                </h1>

                {/* Description as subtitle */}
                <p className="text-lg text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
                    {post.description}
                </p>

                {/* Divider */}
                <div className="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-slate-700 to-transparent mb-10" />

                {/* Content */}
                <div
                    className="blog-content max-w-none"
                    dangerouslySetInnerHTML={{ __html: post.content }}
                />

                {/* Related Tools */}
                {post.relatedTools.length > 0 && (
                    <div className="mt-12 p-6 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Try These Free Tools</h3>
                        <div className="flex flex-wrap gap-2">
                            {post.relatedTools.map((tool) => (
                                <Link
                                    key={tool}
                                    href={`/tools/${tool}`}
                                    className="px-4 py-2 bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 rounded-lg shadow-sm hover:shadow-md transition-shadow font-medium text-sm border border-indigo-100 dark:border-slate-700"
                                >
                                    {tool.split("-").map(w => w[0].toUpperCase() + w.slice(1)).join(" ")} →
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* Prev/Next Navigation */}
                <div className="mt-12 grid sm:grid-cols-2 gap-4">
                    {prevPost ? (
                        <Link href={`/blog/${prevPost.slug}`} className="group p-5 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors">
                            <span className="text-xs text-gray-400 dark:text-gray-500 uppercase font-medium">Previous</span>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
                                ← {prevPost.title}
                            </p>
                        </Link>
                    ) : <div />}
                    {nextPost && (
                        <Link href={`/blog/${nextPost.slug}`} className="group p-5 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors text-right">
                            <span className="text-xs text-gray-400 dark:text-gray-500 uppercase font-medium">Next</span>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
                                {nextPost.title} →
                            </p>
                        </Link>
                    )}
                </div>

                {/* CTA */}
                <div className="mt-12 bg-gradient-to-br from-teal-600 to-teal-800 rounded-2xl p-8 text-center text-white">
                    <h3 className="text-xl font-bold mb-2">Building a Home in Australia?</h3>
                    <p className="text-teal-100 mb-5 max-w-lg mx-auto">
                        HomeOwner Guardian helps you track construction, catch defects early, and protect your investment.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Link href="/guardian" className="px-5 py-2.5 bg-white text-teal-700 rounded-lg font-bold hover:bg-teal-50 transition-colors text-sm">
                            Start Free Trial →
                        </Link>
                        <Link href="/tools" className="px-5 py-2.5 bg-teal-700/50 text-white rounded-lg font-semibold border border-teal-500 hover:bg-teal-700 transition-colors text-sm">
                            90+ Free Tools
                        </Link>
                    </div>
                </div>
            </article>
        </div>
    );
}
