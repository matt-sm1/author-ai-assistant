
import * as yup from "yup";

const nullableText = (max) =>
  yup.string().trim().max(max).nullable().default(null);

export const postSchema = yup.object({
  title: yup
    .string()
    .trim()
    .required("Title is required.")
    .min(1, "Title cannot be empty.")
    .max(255, "Title cannot exceed 255 characters."),

  content: nullableText(1000000).when("status", {
    is: (status) => ["published", "scheduled"].includes(status),
    then: (schema) =>
      schema
        .required("Content is required to publish a post.")
        .test(
          "non-empty-content",
          "Content cannot be empty.",
          (value) => {
            const text = (value ?? "")
              .replace(/<[^>]*>/g, "")
              .replace(/&nbsp;/g, " ")
              .trim();

            return text.length > 0;
          },
        ),
  }),

  excerpt: nullableText(2000),
  featuredImage: nullableText(2048),

  status: yup
    .string()
    .oneOf(
      ["draft", "published", "scheduled", "archived"],
      "Invalid post status.",
    )
    .default("draft")
    .required("Post status is required."),

  visibility: yup
    .string()
    .oneOf(["public", "private"], "Invalid visibility.")
    .default("public")
    .required("Visibility is required."),

  publishedAt: yup
    .date()
    .nullable()
    .default(null)
    .when("status", {
      is: "scheduled",
      then: (schema) =>
        schema
          .required("Publish date is required for scheduled posts.")
          .typeError("Please select a valid publish date.")
          .test(
            "future-date",
            "Scheduled publish date must be in the future.",
            (value) =>
              value instanceof Date &&
              !Number.isNaN(value.getTime()) &&
              value.getTime() > Date.now(),
          ),
      otherwise: (schema) => schema.nullable().default(null),
    }),

  categoryId: yup
    .string()
    .uuid("Select a valid category.")
    .nullable()
    .default(null),

  tags: yup
    .array()
    .of(
      yup
        .string()
        .trim()
        .required("Tag cannot be empty.")
        .min(1, "Tag cannot be empty.")
        .max(100, "Tag cannot exceed 100 characters."),
    )
    .max(30, "You can select a maximum of 30 tags.")
    .default([]),

  seoTitle: nullableText(255),
  metaDescription: nullableText(160),
});
