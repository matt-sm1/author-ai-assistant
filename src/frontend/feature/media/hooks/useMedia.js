"use client";

import { useDeferredValue } from "react";
import { useGetMediaQuery } from "../api/media.api";

// ============================================
// MEDIA LISTING HOOK
// ============================================

export default function useMedia({
  page = 1,
  limit = 10,
  search = "",
  resourceType = "",
} = {}) {
  const deferredSearch = useDeferredValue(search);

  const { media, pagination, isLoading, isFetching, error, refetch } =
    useGetMediaQuery(
      {
        page,
        limit,
        search: deferredSearch,
        resourceType,
      },
      {
        selectFromResult: (result) => ({
          media: result.currentData?.media ?? result.data?.media ?? [],
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
    media,
    pagination,
    isLoading,
    isFetching,
    error: error?.data?.message ?? error?.message ?? null,
    refetch,
  };
}
