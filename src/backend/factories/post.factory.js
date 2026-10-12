import { PostRepository } from "@/backend/repositories/post.repository";
import { TagRepository } from "@/backend/repositories/tag.repository";
import { PostService } from "@/backend/services/post.service";

// ============================================
// POST SERVICE FACTORY
// ============================================

export function createPostService() {
  const postRepository = new PostRepository();
  const tagRepository = new TagRepository();

  return new PostService(postRepository, tagRepository);
}