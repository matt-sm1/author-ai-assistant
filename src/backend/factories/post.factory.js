import { PostRepository } from "@/backend/repositories/post.repository";
import { TagRepository } from "@/backend/repositories/tag.repository";
import { AuthorRepository } from "@/backend/repositories/author.repository";
import { MediaRepository } from "@/backend/repositories/media.repository";
import { PostService } from "@/backend/services/post.service";

export function createPostService() {
  return new PostService(
    new PostRepository(),
    new TagRepository(),
    new AuthorRepository(),
    new MediaRepository()
  );
}
