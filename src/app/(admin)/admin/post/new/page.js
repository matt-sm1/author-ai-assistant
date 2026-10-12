import PostEditor from "@/frontend/feature/post/components/PostEditor";

export const metadata = { title: "New post — Blog CMS" };

export default function NewPostPage() {
  return (
    <PostEditor
      categories={[]}
      tags={[]}
      authors={[]}
      siteUrl={process.env.NEXT_PUBLIC_SITE_URL || ""}
      images={[]}
    />
  );
}