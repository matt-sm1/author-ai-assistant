
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
 const {
  currentData,
  isLoading,
  isFetching,
  error,
  refetch,
} = useGetMediaQuery({
  page,
  limit,
  search,
  resourceType,
});

return {
  media: currentData?.media ?? [],
  pagination: currentData?.pagination ?? {
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
