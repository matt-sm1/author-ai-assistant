import Link from "next/link";
import { fmtDate } from "@/frontend/lib/format";
import { toNestedHostingerMediaUrl } from "@/frontend/lib/hostinger-media-url";

export default function BlogPostCard({ post }) {
  const image =
    toNestedHostingerMediaUrl(post.featured_image ?? "") ||
    post.featured_image ||
    "";

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-shadow hover:shadow-md">
      <Link href={`/${post.slug}`} className="block overflow-hidden">
        <div className="aspect-[16/10] bg-slate-100">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image}
              alt=""
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-slate-400">
              AuthorBot
            </div>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-5">
        {post.category_name && (
          <span className="text-xs font-semibold uppercase tracking-wide text-sky-700">
            {post.category_name}
          </span>
        )}

        <h2 className="text-xl font-semibold tracking-tight text-slate-900">
          <Link href={`/${post.slug}`} className="hover:underline">
            {post.title}
          </Link>
        </h2>

        {post.excerpt && (
          <p className="line-clamp-3 text-sm leading-relaxed text-slate-600">
            {post.excerpt}
          </p>
        )}

        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-2 text-xs text-slate-500">
          {post.author?.name && <span>{post.author.name}</span>}
          {post.published_at && <time>{fmtDate(post.published_at)}</time>}
        </div>
      </div>
    </article>
  );
}
