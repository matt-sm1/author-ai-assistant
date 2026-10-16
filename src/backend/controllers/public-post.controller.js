import { handleError } from "@/backend/errors/error-handler";
import { createPostService } from "@/backend/factories/post.factory";
import { assertSafePagination } from "@/backend/lib/pagination";
import { jsonWithPublicCache } from "@/backend/lib/cache-headers";
import { toPublicPost } from "@/backend/lib/to-public-post";

export async function listPublishedPostsController(request) {
  try {
    const { searchParams } = new URL(request.url);
    const { page, limit } = assertSafePagination(
      Number(searchParams.get("page") ?? 1),
      Number(searchParams.get("limit") ?? 12),
      { maxLimit: 50 }
    );
    const search = String(searchParams.get("search") ?? "").trim();

    const { posts, pagination } = await createPostService().listPublishedPosts({
      page,
      limit,
      search,
    });

    return jsonWithPublicCache({
      success: true,
      data: posts.map(toPublicPost),
      pagination,
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function getPublishedPostBySlugController(_request, context) {
  try {
    const params = await context?.params;
    const slug = String(params?.slug ?? "").trim();

    const post = await createPostService().getPublishedPostBySlug(slug);

    return jsonWithPublicCache({
      success: true,
      data: toPublicPost(post),
    });
  } catch (error) {
    return handleError(error);
  }
}
