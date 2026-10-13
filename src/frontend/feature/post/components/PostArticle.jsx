import Link from "next/link";
import { ArrowLeft, CalendarDays, Tag } from "lucide-react";

import { Button } from "@/frontend/components/ui/Button";
import { fmtDate } from "@/frontend/lib/format";
import PostContentRenderer from "@/frontend/feature/post/components/PostContentRenderer";
import PostFeaturedImage from "@/frontend/feature/post/components/PostFeaturedImage";

export default function PostArticle({ post }) {
  return (
    <article className="mx-auto w-full max-w-5xl space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Button asChild variant="ghost" className="rounded-xl">
          <Link href="/admin/post">
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            Back to posts
          </Link>
        </Button>
        <span className="text-sm text-muted-foreground">Post preview</span>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <PostFeaturedImage src={post.featured_image} title={post.title} />

        <div className="mx-auto  space-y-6 px-5 py-8 sm:px-10 sm:py-12">
          <header className="space-y-4">
            {post.category_name && (
              <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                {post.category_name}
              </span>
            )}

            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              {post.title || "Untitled post"}
            </h1>

            {post.excerpt && (
              <p className="text-lg leading-relaxed text-muted-foreground">
                {post.excerpt}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b pb-5 text-sm text-muted-foreground">
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

          {post.tags.length > 0 && (
            <footer className="flex flex-wrap items-center gap-2 border-t pt-5">
              <Tag
                aria-hidden="true"
                className="mr-1 h-4 w-4 text-muted-foreground"
              />
              {post.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground"
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
