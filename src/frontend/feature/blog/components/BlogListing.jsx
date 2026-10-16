import ArticleCard from "@/frontend/feature/blog/components/ArticleCard";
import BlogSectionInfo from "@/frontend/feature/blog/components/BlogSectionInfo";
import { fmtArticleDate } from "@/frontend/lib/format";

export default function BlogListing({ posts = [] }) {
  return (
    <section id="articles" className="section">
      <div className="container">
        <BlogSectionInfo
          badge="Articles"
          heading="Latest Insights for Modern Authors"
          headingClassName="max-w-[900px]"
          description="Explore practical ideas on AI, reader engagement, book marketing, and smarter ways to turn more visitors into loyal readers."
        />

        {posts.length === 0 ? (
          <p className="mt-10 text-center font-sans text-[16px] text-copy sm:mt-12">
            No published articles yet. Check back soon.
          </p>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-4 sm:mt-12 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <ArticleCard
                key={post.id || post.slug}
                title={post.title}
                date={fmtArticleDate(post.published_at)}
                image={post.featured_image}
                imageAlt={post.title}
                href={post.slug ? `/${post.slug}` : undefined}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
