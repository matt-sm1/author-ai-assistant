import { useGetTagsQuery } from "../api/tags.api";

export default function useTags({
  page = 1,
  limit = 10,
  search = "",
} = {}) {
  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useGetTagsQuery({
    page,
    limit,
    search,
  });

  return {
    tags: data?.tags ?? [],
    pagination: data?.pagination ?? {
      page,
      limit,
      total: 0,
      totalPages: 0,
    },
    isLoading,
    isFetching,
    error: error?.data?.message ?? error?.message ?? null,
    refetch,
  };
}