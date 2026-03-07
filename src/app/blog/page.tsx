import type { Metadata } from "next";
import Link from "next/link";
import { BLOG_POSTS } from "@/data/blog/posts";

export const metadata: Metadata = {
    title: "VedaWell Blog — Free Tools, Productivity Tips & Developer Guides",
    description:
        "Tips, guides, and tutorials on free online tools, productivity, developer workflows, SEO, and security. By the team behind 90+ free browser tools.",
    keywords: "free tools blog, productivity tips, developer guides, SEO tips, online tools tutorials",
    openGraph: {
        title: "VedaWell Blog — Free Tools, Productivity Tips & Developer Guides",
        description: "Tips, guides, and tutorials on free online tools, productivity, and developer workflows.",
        url: "https://vedawellapp.com/blog",
    },
    alternates: { canonical: "https://vedawellapp.com/blog" },
};

export default function BlogPage() {
    return (
        <div className="min-h-screen bg-white">
            <main className="max-w-4xl mx-auto px-6 py-12">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">VedaWell Blog</h1>
                <p className="text-lg text-gray-600 mb-10">
                    Guides, tutorials, and tips to get the most from free online tools.
                </p>

                <div className="space-y-8">
                    {BLOG_POSTS.map((post) => (
                        <article key={post.slug} className="border-b border-gray-100 pb-8">
                            <Link href={`/blog/${post.slug}`} className="group">
                                <div className="flex items-center gap-3 text-sm text-gray-500 mb-2">
                                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium">
                                        {post.category}
                                    </span>
                                    <time>{new Date(post.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</time>
                                    <span>·</span>
                                    <span>{post.readTime}</span>
                                </div>
                                <h2 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors mb-2">
                                    {post.title}
                                </h2>
                                <p className="text-gray-600 leading-relaxed">{post.description}</p>
                            </Link>
                            {post.relatedTools.length > 0 && (
                                <div className="flex gap-2 mt-3 flex-wrap">
                                    {post.relatedTools.slice(0, 3).map((tool) => (
                                        <Link
                                            key={tool}
                                            href={`/tools/${tool}`}
                                            className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-indigo-100 hover:text-indigo-700 transition-colors"
                                        >
                                            {tool.replace(/-/g, " ")}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </article>
                    ))}
                </div>
            </main>
        </div>
    );
}
