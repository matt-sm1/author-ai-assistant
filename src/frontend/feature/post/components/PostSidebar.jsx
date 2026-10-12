
"use client";

import { Image as ImageIcon, X } from "lucide-react";

import useCategories from "@/frontend/feature/category/hooks/useCategories";
import useTags from "@/frontend/feature/tag/hooks/useTags";

import PostSection from "./PostSection";
import { Button } from "@/frontend/components/ui/Button";
import { Input } from "@/frontend/components/ui/Input";
import { Label } from "@/frontend/components/ui/Label";
import { Textarea } from "@/frontend/components/ui/Textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/frontend/components/ui/Select";
import SelectableList from "@/frontend/components/ui/SelectableList";

function SelectField({
  id,
  label,
  placeholder,
  options,
  value,
  onChange,
  disabled = false,
}) {
  return (
    <div>
      <Label htmlFor={id} className="text-xs text-muted-foreground">
        {label}
      </Label>

      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger id={id} className="mt-1 w-full rounded-lg">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>

        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export default function PostSidebar({
  post = {},
  onOpenMediaPicker,
  onFeaturedImageRemove,
  onCategoryChange,
  onTagsChange,
  onFieldChange,
}) {
  const selectedTags = post.tags ?? [];

  const { categories, isLoading, error } = useCategories({
    page: 1,
    limit: 100,
  });

  const {
    tags,
    isLoading: isTagsLoading,
    error: tagsError,
  } = useTags({
    page: 1,
    limit: 100,
  });

  const addTag = (tag) => {
    if (selectedTags.some((item) => String(item.id) === String(tag.id))) {
      return;
    }

    onTagsChange?.([...selectedTags, tag]);
  };

  const removeTag = (tagId) => {
    onTagsChange?.(
      selectedTags.filter((tag) => String(tag.id) !== String(tagId)),
    );
  };

  const metaDescription = post.metaDescription ?? "";
  const excerpt = post.excerpt ?? "";

  return (
    <aside className="space-y-4">
      <PostSection title="Publish">
        <div className="grid grid-cols-2 gap-3">
          <SelectField
            id="post-status"
            label="Status"
            placeholder="Choose status"
            value={post.status ?? "draft"}
            onChange={(value) => onFieldChange?.("status", value)}
            options={[
              { value: "draft", label: "Draft" },
              { value: "published", label: "Published" },
              { value: "scheduled", label: "Scheduled" },
              { value: "archived", label: "Archived" },
            ]}
          />

          <SelectField
            id="post-visibility"
            label="Visibility"
            placeholder="Choose visibility"
            value={post.visibility ?? "public"}
            onChange={(value) => onFieldChange?.("visibility", value)}
            options={[
              { value: "public", label: "Public" },
              { value: "private", label: "Private" },
            ]}
          />
        </div>

        <div>
          <Label htmlFor="publish-date" className="text-xs text-muted-foreground">
            {post.status === "scheduled" ? "Schedule date and time" : "Publish date and time"}
          </Label>

          <Input
            id="publish-date"
            type="datetime-local"
            value={post.publishDate ?? ""}
            onChange={(event) =>
              onFieldChange?.("publishDate", event.target.value)
            }
            className="mt-1 rounded-lg"
            aria-describedby="publish-date-help"
          />

          <p
            id="publish-date-help"
            className="mt-1 text-xs text-muted-foreground"
          >
            Scheduled posts require a future date and time.
          </p>
        </div>
      </PostSection>

      <PostSection title="Featured Media">
        <div className="space-y-2">
          {post.image ? (
            <div className="overflow-hidden rounded-xl border">
              {post.imageType === "video" ? (
                <video
                  src={post.image}
                  poster={post.imageThumbnail || undefined}
                  controls
                  preload="metadata"
                  aria-label="Selected featured video"
                  className="aspect-video w-full object-contain"
                >
                  Your browser does not support the video element.
                </video>
              ) : (
                <img
                  src={post.image}
                  alt="Selected featured image"
                  className="aspect-video w-full object-cover"
                />
              )}
            </div>
          ) : (
            <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed text-sm text-muted-foreground">
              <ImageIcon aria-hidden="true" className="h-6 w-6" />
              Select Featured Media
            </div>
          )}

          <Button
            type="button"
            variant="outline"
            className="w-full rounded-lg"
            onClick={onOpenMediaPicker}
          >
            {post.image ? "Change Media" : "Select Media"}
          </Button>

          {post.image && (
            <Button
              type="button"
              variant="ghost"
              className="w-full rounded-lg"
              onClick={onFeaturedImageRemove}
            >
              Remove Media
            </Button>
          )}
        </div>
      </PostSection>

      <PostSection title="Category">
        <SelectableList
          items={categories}
          selectedItems={post.category ? [{ id: post.category }] : []}
          onSelect={(category) => onCategoryChange?.(category.id)}
          isLoading={isLoading}
          error={error}
          emptyMessage="No categories available."
        />
      </PostSection>

      <PostSection title="Tags">
        <div className="flex flex-wrap gap-1.5">
          {selectedTags.map((tag) => (
            <span
              key={tag.id}
              className="inline-flex items-center gap-1 rounded-lg bg-accent px-2 py-1 text-xs font-medium text-accent-foreground"
            >
              {tag.name}

              <button
                type="button"
                aria-label={`Remove ${tag.name}`}
                onClick={() => removeTag(tag.id)}
                className="cursor-pointer rounded-sm hover:text-destructive"
              >
                <X aria-hidden="true" className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>

        <SelectableList
          items={tags.filter(
            (tag) =>
              !selectedTags.some(
                (selected) => String(selected.id) === String(tag.id),
              ),
          )}
          selectedItems={selectedTags}
          onSelect={addTag}
          isLoading={isTagsLoading}
          error={tagsError}
          emptyMessage="No more tags available."
        />
      </PostSection>

      <PostSection title="Excerpt">
        <Label htmlFor="post-excerpt" className="sr-only">
          Post excerpt
        </Label>

        <Textarea
          id="post-excerpt"
          value={excerpt}
          onChange={(event) => onFieldChange?.("excerpt", event.target.value)}
          placeholder="A short summary of your post..."
          rows={3}
          maxLength={2000}
          className="rounded-lg"
        />

        <div className="text-right text-[11px] text-muted-foreground">
          {excerpt.length}/2000
        </div>
      </PostSection>

      <PostSection title="SEO">
        <div>
          <Label htmlFor="seo-title" className="text-xs text-muted-foreground">
            SEO title
          </Label>

          <Input
            id="seo-title"
            value={post.seoTitle ?? ""}
            onChange={(event) => onFieldChange?.("seoTitle", event.target.value)}
            className="mt-1 rounded-lg"
            placeholder="SEO title"
          />
        </div>

        <div>
          <Label
            htmlFor="meta-description"
            className="text-xs text-muted-foreground"
          >
            Meta description
          </Label>

          <Textarea
            id="meta-description"
            value={metaDescription}
            onChange={(event) =>
              onFieldChange?.("metaDescription", event.target.value)
            }
            rows={2}
            maxLength={160}
            className="mt-1 rounded-lg"
            placeholder="Add a meta description"
          />

          <div className="mt-1 text-right text-[11px] text-muted-foreground">
            {metaDescription.length}/160
          </div>
        </div>

        <div>
          <Label htmlFor="post-slug" className="text-xs text-muted-foreground">
            URL slug
          </Label>

          <Input
            id="post-slug"
            value={post.slug ?? ""}
            readOnly
            className="mt-1 rounded-lg bg-muted"
            placeholder="Generated from title"
          />

          <p className="mt-1 text-xs text-muted-foreground">
            Automatically generated from the post title.
          </p>
        </div>
      </PostSection>

    
    </aside>
  );
}
