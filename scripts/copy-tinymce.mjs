import { cpSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "node_modules", "tinymce");
const dest = join(root, "public", "tinymce");

if (!existsSync(join(src, "tinymce.min.js"))) {
  console.error("tinymce not installed — run npm install first");
  process.exit(1);
}

mkdirSync(join(dest, "plugins"), { recursive: true });
cpSync(join(src, "tinymce.min.js"), join(dest, "tinymce.min.js"));

for (const dir of ["themes", "icons", "models", "skins"]) {
  cpSync(join(src, dir), join(dest, dir), { recursive: true });
}

const plugins = [
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
];

for (const plugin of plugins) {
  cpSync(join(src, "plugins", plugin), join(dest, "plugins", plugin), {
    recursive: true,
  });
}

console.log("Copied TinyMCE assets to public/tinymce");
