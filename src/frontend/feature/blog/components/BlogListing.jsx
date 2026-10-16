import BlogPostCard from "@/frontend/feature/blog/components/BlogPostCard";

export default function BlogListing({ posts = [] }) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <header className="mx-auto mb-12 max-w-2xl text-center">
        <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-sky-700">
          Articles
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Latest Insights for Modern Authors
        </h1>
        <p className="mt-4 text-base leading-relaxed text-slate-600">
          Explore practical ideas on AI, reader engagement, book marketing, and
          smarter ways to turn more visitors into loyal readers.
        </p>
      </header>

      {posts.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center text-slate-500">
          No published articles yet. Check back soon.
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <BlogPostCard key={post.id || post.slug} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
