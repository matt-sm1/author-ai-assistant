import Link from "next/link";
import { ArrowLeft, CalendarDays, Tag } from "lucide-react";

import { fmtArticleDate } from "@/frontend/lib/format";
import PostContentRenderer from "@/frontend/feature/post/components/PostContentRenderer";
import PostFeaturedImage from "@/frontend/feature/post/components/PostFeaturedImage";

export default function BlogArticle({ post }) {
  const tags = Array.isArray(post.tags) ? post.tags : [];

  return (
    <section className="section">
      <div className="container">
        <article className="mx-auto w-full max-w-3xl">
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-[var(--theme-copy)] transition-colors hover:text-[var(--theme-heading)]"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            Back to articles
          </Link>

          <div className="overflow-hidden rounded-xl bg-white p-1.5 shadow-[var(--shadow-card-sm)]">
            <div className="overflow-hidden rounded-lg">
              <PostFeaturedImage src={post.featured_image} title={post.title} />
            </div>

            <div className="space-y-6 px-5 py-8 sm:px-10 sm:py-12">
              <header className="space-y-4">
                {post.category_name && (
                  <span className="inline-flex rounded-full bg-[var(--theme-purple-wash,#f6e6ff)] px-3 py-1 text-xs font-semibold text-[var(--theme-accent)]">
                    {post.category_name}
                  </span>
                )}

                <h1 className="font-display text-3xl font-bold tracking-tight text-heading sm:text-4xl">
                  {post.title || "Untitled post"}
                </h1>

                {post.excerpt && (
                  <p className="text-lg leading-relaxed text-copy">
                    {post.excerpt}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-[var(--line)] pb-5 text-sm text-copy">
                  {post.author?.name && <span>By {post.author.name}</span>}
                  {post.published_at && (
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays aria-hidden="true" className="h-4 w-4" />
                      {fmtArticleDate(post.published_at)}
                    </span>
                  )}
                </div>
              </header>

              <PostContentRenderer content={post.content} />

              {tags.length > 0 && (
                <footer className="flex flex-wrap items-center gap-2 border-t border-[var(--line)] pt-5">
                  <Tag
                    aria-hidden="true"
                    className="mr-1 h-4 w-4 text-copy"
                  />
                  {tags.map((tag) => (
                    <span
                      key={tag.id || tag.slug}
                      className="rounded-full bg-[var(--theme-surface-muted)] px-3 py-1 text-xs font-medium text-copy"
                    >
                      {tag.name}
                    </span>
                  ))}
                </footer>
              )}
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
