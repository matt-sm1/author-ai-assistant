import { baseApi } from "@/frontend/store/api/baseApi";

export const postsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPosts: builder.query({
      query: ({ page = 1, limit = 20, ...filters } = {}) => ({
        url: "/posts",
        params: { page, limit, ...filters },
      }),
      transformResponse: (response) => ({
        posts: response.data,
        pagination: response.pagination,
      }),
      providesTags: (result) => [
        { type: "Posts", id: "LIST" },
        ...(result?.posts ?? []).map(({ id }) => ({ type: "Posts", id })),
      ],
    }),

    getPostById: builder.query({
      query: (id) => `/posts/${id}`,
      transformResponse: (response) => response.data,
      providesTags: (_result, _error, id) => [{ type: "Posts", id }],
    }),

    createPost: builder.mutation({
      query: (data) => ({ url: "/posts", method: "POST", body: data }),
      invalidatesTags: [
        { type: "Posts", id: "LIST" },
        { type: "Categories", id: "LIST" },
        { type: "Tags", id: "LIST" },
      ],
    }),

    updatePost: builder.mutation({
      query: ({ id, data }) => ({
        url: `/posts/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Posts", id },
        { type: "Posts", id: "LIST" },
        { type: "Categories", id: "LIST" },
        { type: "Tags", id: "LIST" },
      ],
    }),

    deletePost: builder.mutation({
      query: (id) => ({ url: `/posts/${id}`, method: "DELETE" }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Posts", id },
        { type: "Posts", id: "LIST" },
        { type: "Categories", id: "LIST" },
        { type: "Tags", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetPostsQuery,
  useGetPostByIdQuery,
  useCreatePostMutation,
  useUpdatePostMutation,
  useDeletePostMutation,
} = postsApi;
