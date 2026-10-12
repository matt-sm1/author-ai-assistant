
import { useGetCategoriesQuery } from "../api/categories.api";

export default function useCategories({
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
  } = useGetCategoriesQuery({
    page,
    limit,
    search,
  });

  return {
    categories: data?.categories ?? [],
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
