"use client";

import { Editor } from "@tinymce/tinymce-react";

export default function PostContentEditor({ value = "", onChange }) {
  return (
    <Editor
      apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
      value={value}
      onEditorChange={(content) => onChange?.(content)}
      init={{
        height: 500,
        menubar: "file edit view insert format tools table",
        plugins: [
          "advlist",
          "autolink",
          "lists",
          "link",
          "image",
          "charmap",
          "preview",
          "searchreplace",
          "visualblocks",
          "code",
          "fullscreen",
          "insertdatetime",
          "media",
          "table",
          "wordcount",
        ],
        toolbar:
          "undo redo | blocks | bold italic underline | " +
          "alignleft aligncenter alignright | " +
          "bullist numlist | link image media table | " +
          "removeformat code",
        content_style:
          "body { font-family: Arial, sans-serif; font-size: 16px; line-height: 1.7; }",
      }}
    />
  );
}
