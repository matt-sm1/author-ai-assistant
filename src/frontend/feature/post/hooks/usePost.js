import { useGetPostByIdQuery } from "../api/posts.api";

export default function usePost(id) {
  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useGetPostByIdQuery(id, {
    skip: !id,
  });

  return {
    post: data ?? null,
    isLoading,
    isFetching,
    error: error?.data?.message ?? error?.message ?? null,
    refetch,
  };
}