"use client";

import { Editor } from "@tinymce/tinymce-react";

/**
 * Self-hosted TinyMCE — loaded only after PostContentEditor activates.
 */
export default function PostContentEditorTiny({ value = "", onChange }) {
  return (
    <Editor
      tinymceScriptSrc="/tinymce/tinymce.min.js"
      value={value}
      onEditorChange={(content) => onChange?.(content)}
      init={{
        base_url: "/tinymce",
        suffix: ".min",
        // TinyMCE 8 self-hosted requires an explicit GPL or commercial key.
        license_key: "gpl",
        height: 500,
        paste_data_images: true,
        paste_merge_formats: false,
        paste_remove_styles_if_webkit: false,
        paste_webkit_styles: "all",
        convert_urls: false,
        relative_urls: false,
        remove_script_host: false,
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
        images_upload_credentials: false,
        automatic_uploads: false,
      }}
    />
  );
}
