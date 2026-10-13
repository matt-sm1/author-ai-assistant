import { PostRepository } from "@/backend/repositories/post.repository";
import { TagRepository } from "@/backend/repositories/tag.repository";
import { AuthorRepository } from "@/backend/repositories/author.repository";
import { PostService } from "@/backend/services/post.service";

// ============================================
// POST SERVICE FACTORY
// ============================================

export function createPostService() {
  const postRepository = new PostRepository();
  const tagRepository = new TagRepository();
  const authorRepository = new AuthorRepository();

  return new PostService(postRepository, tagRepository, authorRepository);
}