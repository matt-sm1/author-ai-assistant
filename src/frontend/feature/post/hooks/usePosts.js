"use client";

import { useDeferredValue } from "react";
import { useGetPostsQuery } from "../api/posts.api";

export default function usePosts({ page = 1, limit = 20, search = "", ...filters } = {}) {
  const deferredSearch = useDeferredValue(search);

  const { posts, pagination, isLoading, isFetching, error, refetch } =
    useGetPostsQuery(
      {
        page,
        limit,
        search: deferredSearch,
        ...filters,
      },
      {
        selectFromResult: (result) => ({
          posts: result.currentData?.posts ?? result.data?.posts ?? [],
          pagination:
            result.currentData?.pagination ??
            result.data?.pagination ?? {
              page,
              limit,
              total: 0,
              totalPages: 0,
            },
          isLoading: result.isLoading,
          isFetching: result.isFetching,
          error: result.error,
          refetch: result.refetch,
        }),
      },
    );

  return {
    posts,
    pagination,
    isLoading,
    isFetching,
    error: error?.data?.message ?? error?.message ?? null,
    refetch,
  };
}
