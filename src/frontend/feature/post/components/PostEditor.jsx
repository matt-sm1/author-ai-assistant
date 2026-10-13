"use client";

import { useState, useEffect } from "react";
import { useGetPostByIdQuery } from "@/frontend/feature/post/api/posts.api";
import Link from "next/link";
import { ArrowLeft, Eye } from "lucide-react";
import { toast } from "sonner";
import { useRouter, useParams } from "next/navigation";
import {
  karachiDateTimeToISO,
  toLocalDateTime,
} from "@/frontend/lib/format";
import { Button } from "@/frontend/components/ui/Button";
import { Input } from "@/frontend/components/ui/Input";
import { Panel, StatusBadge } from "@/frontend/components/shared/ui-bits";
import MediaPicker from "@/frontend/components/ui/MediaPicker";
import PostSidebar from "@/frontend/feature/post/components/PostSidebar";
import PostContentEditor from "@/frontend/feature/post/components/PostContentEditor";
import { slugify } from "@/frontend/lib/format";
import { postSchema } from "@/frontend/feature/post/schema/post.schema";
import usePostMutations from "@/frontend/feature/post/hooks/usePostmutations";

function getErrorMessage(error, fallback) {
  return error?.data?.message ?? error?.message ?? fallback;
}

function getFeaturedMediaType(url) {
  return /\/video\/upload\/|\.(?:mp4|m4v|mov|ogv|ogg|webm|m3u8)(?:[?#]|$)/i.test(url ?? "")
    ? "video"
    : "image";
}


export default function PostEditor({ postId: providedPostId }) {
  console.log("POST EDITOR RENDERED", providedPostId);

  const params = useParams();
  const postId = providedPostId ?? params?.id;
  const isEditMode = Boolean(postId);
  console.log(
    "PostEditor params:",
    params,
    "postId:",
    postId,
    "isEditMode:",
    isEditMode,
  );

  const router = useRouter();

  const {
    data: existingPost,
    isLoading: isPostLoading,
    isError: isPostError,
    error: postError,
  } = useGetPostByIdQuery(postId, {
    skip: !isEditMode,
  });

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    status: "draft",
    publishDate: "",
    featuredImage: "",
    featuredMediaId: null,
    featuredImageType: "image",
    featuredImageThumbnail: "",
    category: "",
    authorId: "",
    tags: [],
    excerpt: "",
    slug: "",
    seoTitle: "",
    metaDescription: "",
  });

  useEffect(() => {
    if (!existingPost || !isEditMode) return;

    setFormData({
      title: existingPost.title ?? "",
      content: existingPost.content ?? "",
      status: existingPost.status ?? "draft",
      publishDate: toLocalDateTime(existingPost.published_at),
      featuredImage: existingPost.featured_image ?? "",
      featuredMediaId: existingPost.featured_media_id ?? null,
      featuredImageType: getFeaturedMediaType(existingPost.featured_image),
      featuredImageThumbnail: "",
      category: existingPost.category_id ?? "",
      authorId: existingPost.author_id ?? "",
      tags: existingPost.tags ?? [],
      excerpt: existingPost.excerpt ?? "",
      slug: existingPost.slug ?? "",
      seoTitle: existingPost.seo_title ?? "",
      metaDescription: existingPost.meta_description ?? "",
    });
  }, [existingPost, isEditMode]);

  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const { createPost, updatePost, isCreating, isUpdating } = usePostMutations();

  const isSaving = isCreating || isUpdating;

  const updateField = (field, value) => {
    setFormData((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleTitleChange = (value) => {
    setFormData((previous) => ({
      ...previous,
      title: value,
      slug: slugify(value),
    }));
  };

  const handleSubmitPost = async (requestedStatus = formData.status) => {
    if (isSaving) return;
    try {
      let publishedAt = null;

      if (requestedStatus === "scheduled") {
        publishedAt = karachiDateTimeToISO(formData.publishDate);
      } else if (requestedStatus === "published") {
        if (
          isEditMode &&
          existingPost?.status === "published" &&
          existingPost?.published_at
        ) {
          publishedAt = existingPost.published_at;
        } else {
          publishedAt = new Date().toISOString();
        }
      }

      const payload = {
        title: formData.title,
        content: formData.content || null,
        excerpt: formData.excerpt || null,
        featuredImage: formData.featuredImage || null,
        featuredMediaId: formData.featuredMediaId || null,
        status: requestedStatus,
        publishedAt,
        categoryId: formData.category || null,
        authorId: formData.authorId,
        tags: formData.tags.map((tag) => tag.name),
        seoTitle: formData.seoTitle || null,
        metaDescription: formData.metaDescription || null,
      };

      const validatedData = await postSchema.validate(payload, {
        abortEarly: false,
        stripUnknown: true,
      });

      // Convert only after Yup confirms the date is valid.
      const dataToSubmit = {
        ...validatedData,
        publishedAt: validatedData.publishedAt
          ? validatedData.publishedAt.toISOString()
          : null,
      };

      if (isEditMode) {
        await updatePost(postId, dataToSubmit);
      } else {
        await createPost(dataToSubmit);
      }

      const successMessages = {
        draft: "Draft saved successfully.",
        published: "Post published successfully.",
        scheduled: "Post scheduled successfully.",
      };

      toast.success(
        isEditMode
          ? "Post updated successfully."
          : (successMessages[requestedStatus] ?? "Post saved successfully."),
      );

      router.push("/admin/post");
    } catch (error) {
      if (error?.name === "ValidationError") {
        const messages = [
          ...new Set(
            (error.inner?.length ? error.inner : [error]).map(
              (item) => item.message,
            ),
          ),
        ];

        toast.error(messages[0] || "Please check the post details.");
        return;
      }

      toast.error(getErrorMessage(error, "Unable to save the post."));
    }
  };

  if (isEditMode && isPostLoading) {
    return (
      <div className="p-6 text-sm text-muted-foreground">Loading post...</div>
    );
  }

  if (isEditMode && isPostError) {
    return (
      <div className="space-y-3 p-6">
        <p>Unable to load this post.</p>
        <Button onClick={() => router.push("/admin/post")}>
          Back to Posts
        </Button>
      </div>
    );
  }
  return (
    <div className="mx-auto w-full max-w-screen-2xl">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon" className="rounded-xl">
            <Link href="/admin/post" aria-label="Back to posts">
              <ArrowLeft aria-hidden="true" className="h-5 w-5" />
            </Link>
          </Button>

          <div>
            <h1 className="text-xl font-bold">
              {isEditMode ? "Edit Post" : "New Post"}
            </h1>
            <div className="mt-1">
              <StatusBadge status={formData.status} />
            </div>
          </div>
        </div>

        <div className="hidden gap-2 sm:flex">
          <Button type="button" variant="ghost" className="rounded-xl" disabled>
            <Eye aria-hidden="true" className="h-4 w-4" />
            Preview
          </Button>

          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            onClick={() => handleSubmitPost()}
            disabled={isSaving || isPostLoading}
          >
            {isSaving
              ? isEditMode
                ? "Updating..."
                : "Saving..."
              : isEditMode
                ? "Save Changes"
                : "Save Post"}
          </Button>

          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            onClick={() => handleSubmitPost("scheduled")}
            disabled={isSaving || isPostLoading}
          >
            {isEditMode ? "Update Schedule" : "Schedule"}
          </Button>

          <Button
            type="button"
            className="rounded-xl"
            onClick={() => handleSubmitPost("published")}
            disabled={isSaving || isPostLoading}
          >
            {isSaving
              ? isEditMode
                ? "Updating..."
                : "Saving..."
              : isEditMode
                ? "Update & Publish"
                : "Publish"}
          </Button>
        </div>
      </header>

      <div className="grid gap-6 pb-24 lg:grid-cols-[minmax(0,1fr)_340px] lg:pb-0">
        <main className="min-w-0">
          <Panel className="overflow-hidden">
            <label className="sr-only" htmlFor="post-title">
              Post title
            </label>

            <Input
              id="post-title"
              value={formData.title}
              onChange={(event) => handleTitleChange(event.target.value)}
              placeholder="Enter your post title..."
              className="h-auto rounded-none border-0 bg-transparent px-6 pb-3 pt-6 text-xl font-bold shadow-none focus-visible:ring-0 sm:px-10 sm:pt-8 sm:text-3xl lg:text-4xl"
            />

            <div className="border-t px-4 py-4 sm:px-6">
              <PostContentEditor
                value={formData.content}
                onChange={(value) => updateField("content", value)}
              />
            </div>
          </Panel>
        </main>

        <PostSidebar
          post={{
            ...formData,
            author: existingPost?.author,
            image: formData.featuredImage,
            imageType: formData.featuredImageType,
            imageThumbnail: formData.featuredImageThumbnail,
          }}
          onCategoryChange={(value) => updateField("category", value)}
          onAuthorChange={(value) => updateField("authorId", value)}
          onTagsChange={(value) => updateField("tags", value)}
          onFieldChange={updateField}
          onOpenMediaPicker={() => setMediaPickerOpen(true)}
          onFeaturedImageRemove={() => {
            setFormData((previous) => ({
              ...previous,
              featuredImage: "",
              featuredImageType: "image",
              featuredImageThumbnail: "",
            }));
          }}
        />
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 flex gap-2 border-t bg-background/95 p-3 backdrop-blur sm:hidden">
        <Button
          type="button"
          variant="outline"
          className="flex-1 rounded-xl"
          onClick={() => handleSubmitPost()}
          disabled={isSaving || isPostLoading}
        >
          {isSaving
            ? isEditMode
              ? "Updating..."
              : "Saving..."
            : isEditMode
              ? "Save Changes"
              : "Save Post"}
        </Button>

        <Button
          type="button"
          variant="outline"
          className="flex-1 rounded-xl"
          onClick={() => handleSubmitPost("scheduled")}
          disabled={isSaving || isPostLoading}
        >
          {isEditMode ? "Update Schedule" : "Schedule"}
        </Button>

        <Button
          type="button"
          className="flex-1 rounded-xl"
          onClick={() => handleSubmitPost("published")}
          disabled={isSaving || isPostLoading}
        >
          {isSaving
            ? isEditMode
              ? "Updating..."
              : "Saving..."
            : isEditMode
              ? "Update & Publish"
              : "Publish"}
        </Button>
      </div>

      <MediaPicker
        open={mediaPickerOpen}
        onOpenChange={setMediaPickerOpen}
        onSelect={({ id, url, resourceType, thumbnailUrl }) => {
          setFormData((previous) => ({
            ...previous,
            featuredMediaId: id,
            featuredImage: url,
            featuredImageType: resourceType,
            featuredImageThumbnail: thumbnailUrl,
          }));
        }}
      />
    </div>
  );
}
