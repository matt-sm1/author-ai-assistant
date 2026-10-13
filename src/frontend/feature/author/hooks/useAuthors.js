"use client";

import { useGetAuthorsQuery } from "@/frontend/feature/author/api/authors.api";

export default function useAuthors({
  page = 1,
  limit = 10,
  search = "",
  sortBy = "created_at",
  sortOrder = "desc",
  activeOnly = false,
} = {}) {
  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useGetAuthorsQuery({
    page,
    limit,
    search,
    sortBy,
    sortOrder,
    activeOnly,
  });

  return {
    authors: data?.authors ?? [],
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