
import { baseApi } from "@/frontend/store/api/baseApi";

export const tagsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // GET TAGS WITH SEARCH + PAGINATION
    getTags: builder.query({
      query: ({ page = 1, limit = 10, search = "" } = {}) => ({
        url: "/tags",
        params: { page, limit, search },
      }),

      transformResponse: (response) => ({
        tags: response.data,
        pagination: response.pagination,
      }),

      providesTags: (result) => [
        { type: "Tags", id: "LIST" },
        ...(result?.tags ?? []).map(({ id }) => ({
          type: "Tags",
          id,
        })),
      ],
    }),

    // GET TAG BY ID
    getTagById: builder.query({
      query: (id) => `/tags/${id}`,

      transformResponse: (response) => response.data,

      providesTags: (result, error, id) => [
        { type: "Tags", id },
      ],
    }),

    // CREATE TAG
    createTag: builder.mutation({
      query: (data) => ({
        url: "/tags",
        method: "POST",
        body: data,
      }),

      invalidatesTags: [{ type: "Tags", id: "LIST" }],
    }),

    // UPDATE TAG
    updateTag: builder.mutation({
      query: ({ id, data }) => ({
        url: `/tags/${id}`,
        method: "PUT",
        body: data,
      }),

      invalidatesTags: (result, error, { id }) => [
        { type: "Tags", id },
        { type: "Tags", id: "LIST" },
      ],
    }),

    // DELETE TAG
    deleteTag: builder.mutation({
      query: (id) => ({
        url: `/tags/${id}`,
        method: "DELETE",
      }),

      invalidatesTags: (result, error, id) => [
        { type: "Tags", id },
        { type: "Tags", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetTagsQuery,
  useGetTagByIdQuery,
  useCreateTagMutation,
  useUpdateTagMutation,
  useDeleteTagMutation,
} = tagsApi;
