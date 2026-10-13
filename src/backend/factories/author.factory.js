
import { AuthorRepository } from "@/backend/repositories/author.repository";

import { AuthorService } from "@/backend/services/author.service";

// ============================================
// AUTHOR SERVICE FACTORY
// ============================================

export function createAuthorService() {
  const authorRepository = new AuthorRepository();

  return new AuthorService(authorRepository);
}