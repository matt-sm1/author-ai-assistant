import Link from "next/link";
import { ArrowLeft, CalendarDays, Tag } from "lucide-react";

import { fmtDate } from "@/frontend/lib/format";
import PostContentRenderer from "@/frontend/feature/post/components/PostContentRenderer";
import PostFeaturedImage from "@/frontend/feature/post/components/PostFeaturedImage";

export default function BlogArticle({ post }) {
  const tags = Array.isArray(post.tags) ? post.tags : [];

  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
      >
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        Back to articles
      </Link>

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <PostFeaturedImage src={post.featured_image} title={post.title} />

        <div className="space-y-6 px-5 py-8 sm:px-10 sm:py-12">
          <header className="space-y-4">
            {post.category_name && (
              <span className="inline-flex rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-800">
                {post.category_name}
              </span>
            )}

            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              {post.title || "Untitled post"}
            </h1>

            {post.excerpt && (
              <p className="text-lg leading-relaxed text-slate-600">
                {post.excerpt}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-slate-100 pb-5 text-sm text-slate-500">
              {post.author?.name && <span>By {post.author.name}</span>}
              {post.published_at && (
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays aria-hidden="true" className="h-4 w-4" />
                  {fmtDate(post.published_at)}
                </span>
              )}
            </div>
          </header>

          <PostContentRenderer content={post.content} />

          {tags.length > 0 && (
            <footer className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-5">
              <Tag
                aria-hidden="true"
                className="mr-1 h-4 w-4 text-slate-400"
              />
              {tags.map((tag) => (
                <span
                  key={tag.id || tag.slug}
                  className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600"
                >
                  {tag.name}
                </span>
              ))}
            </footer>
          )}
        </div>
      </div>
    </article>
  );
}
