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
    const post = BLOG_POSTS.find((p) => p.slug === slug);
    if (!post) notFound();

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
        <div className="min-h-screen bg-white">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

            <article className="max-w-3xl mx-auto px-6 py-12">
                <Link href="/blog" className="text-indigo-600 hover:underline text-sm mb-6 inline-block">← Back to Blog</Link>

                <div className="flex items-center gap-3 text-sm text-gray-500 mb-4">
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium">{post.category}</span>
                    <time>{new Date(post.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</time>
                    <span>·</span>
                    <span>{post.readTime}</span>
                </div>

                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6 leading-tight">{post.title}</h1>

                <div
                    className="prose prose-lg prose-gray max-w-none
                        prose-headings:text-gray-900 prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
                        prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-2
                        prose-a:text-indigo-600 prose-a:no-underline hover:prose-a:underline
                        prose-table:text-sm prose-th:bg-gray-50 prose-th:p-2 prose-td:p-2 prose-td:border prose-th:border
                        prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-code:text-indigo-600 prose-code:bg-gray-100 prose-code:px-1 prose-code:rounded"
                    dangerouslySetInnerHTML={{ __html: post.content }}
                />

                {/* Related Tools */}
                {post.relatedTools.length > 0 && (
                    <div className="mt-12 p-6 bg-indigo-50 rounded-2xl">
                        <h3 className="text-lg font-bold text-gray-900 mb-3">Try These Free Tools</h3>
                        <div className="flex flex-wrap gap-2">
                            {post.relatedTools.map((tool) => (
                                <Link
                                    key={tool}
                                    href={`/tools/${tool}`}
                                    className="px-4 py-2 bg-white text-indigo-700 rounded-lg shadow-sm hover:shadow-md transition-shadow font-medium text-sm"
                                >
                                    {tool.split("-").map(w => w[0].toUpperCase() + w.slice(1)).join(" ")} →
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* CTA */}
                <div className="mt-10 p-6 bg-gray-50 rounded-2xl text-center">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">90+ Free Browser Tools</h3>
                    <p className="text-gray-600 mb-4">All tools run locally in your browser. No downloads, no signups, complete privacy.</p>
                    <Link href="/tools" className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-500 transition-colors">
                        Browse All Tools →
                    </Link>
                </div>
            </article>
        </div>
    );
}
