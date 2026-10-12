import { useGetPostsQuery } from "../api/posts.api";

export default function usePosts({ page = 1, limit = 20, ...filters } = {}) {
  const { data, isLoading, isFetching, error, refetch } = useGetPostsQuery({
    page,
    limit,
    ...filters,
  });

  return {
    posts: data?.posts ?? [],
    pagination: data?.pagination ?? { page, limit, total: 0, totalPages: 0 },
    isLoading,
    isFetching,
    error: error?.data?.message ?? error?.message ?? null,
    refetch,
  };
}
