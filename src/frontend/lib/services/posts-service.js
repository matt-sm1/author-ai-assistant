import { samplePosts } from "@/frontend/data/post.js"

// ---- DEMO MODE ----
// Abhi data memory mein hai. Page refresh par reset ho jata hai.
let posts = [...samplePosts];

const delay = (ms = 200) => new Promise((r) => setTimeout(r, ms));

export async function getPosts() {
  await delay();
  // Baad mein:
  // const res = await fetch("/api/posts");
  // if (!res.ok) throw new Error("Failed to load posts");
  // return res.json();
  return [...posts];
}

export async function deletePost(id) {
  await delay();
  // Baad mein:
  // const res = await fetch(`/api/posts/${id}`, { method: "DELETE" });
  // if (!res.ok) throw new Error("Failed to delete post");
  posts = posts.filter((p) => p.id !== id);
  return { ok: true };
}