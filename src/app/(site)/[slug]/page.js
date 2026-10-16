import { notFound } from "next/navigation";
import BlogArticle from "@/frontend/feature/blog/components/BlogArticle";
import { createPostService } from "@/backend/factories/post.factory";
import { toPublicPost } from "@/backend/lib/to-public-post";
import { mapDbPostToArticle } from "@/frontend/feature/post/lib/map-post-article";
import {
  getPublicSiteUrl,
  publicPostUrl,
} from "@/frontend/feature/blog/lib/site-urls";
import { isReservedSlug } from "@/shared/slug";

export const dynamic = "force-dynamic";

async function loadPublished(slug) {
  if (!slug || isReservedSlug(slug)) return null;

  try {
    return await createPostService().getPublishedPostBySlug(slug);
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = await loadPublished(slug);

  if (!post) {
    return { title: "Article not found | AuthorBot" };
  }

  const title = post.seo_title || post.title || "Article";
  const description =
    post.meta_description || post.excerpt || "AuthorBot article";
  const canonical = publicPostUrl(post.slug);
  const siteUrl = getPublicSiteUrl();

  return {
    title: `${title} | AuthorBot`,
    description,
    alternates: siteUrl ? { canonical } : undefined,
    openGraph: {
      title,
      description,
      type: "article",
      url: siteUrl ? canonical : undefined,
      images: post.featured_image ? [post.featured_image] : undefined,
    },
  };
}

export default async function PublicPostPage({ params }) {
  const { slug } = await params;
  const post = await loadPublished(slug);

  if (!post) {
    notFound();
  }

  const article = mapDbPostToArticle(toPublicPost(post));
  return <BlogArticle post={article} />;
}
