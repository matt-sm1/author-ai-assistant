import { baseApi } from "@/frontend/store/api/baseApi";

export const authorsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAuthors: builder.query({
      query: ({
        page = 1,
        limit = 10,
        search = "",
        sortBy = "created_at",
        sortOrder = "desc",
        activeOnly = false,
      } = {}) => ({
        url: "/authors",
        params: {
          page,
          limit,
          search,
          sortBy,
          sortOrder,
          activeOnly,
        },
      }),

      transformResponse: (response) => ({
        authors: response.data,
        pagination: response.pagination,
      }),

      providesTags: (result) => [
        { type: "Authors", id: "LIST" },
        ...(result?.authors ?? []).map(({ id }) => ({
          type: "Authors",
          id,
        })),
      ],
    }),

    getAuthorById: builder.query({
      query: (id) => `/authors/${id}`,
      transformResponse: (response) => response.data,
      providesTags: (result, error, id) => [
        { type: "Authors", id },
      ],
    }),

    createAuthor: builder.mutation({
      query: (data) => ({
        url: "/authors",
        method: "POST",
        body: data,
      }),
      invalidatesTags: [{ type: "Authors", id: "LIST" }],
    }),

    updateAuthor: builder.mutation({
      query: ({ id, data }) => ({
        url: `/authors/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Authors", id },
        { type: "Authors", id: "LIST" },
        "Posts",
      ],
    }),

    deleteAuthor: builder.mutation({
      query: (id) => ({
        url: `/authors/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Authors", id },
        { type: "Authors", id: "LIST" },
        "Posts",
      ],
    }),
  }),
});

export const {
  useGetAuthorsQuery,
  useGetAuthorByIdQuery,
  useCreateAuthorMutation,
  useUpdateAuthorMutation,
  useDeleteAuthorMutation,
} = authorsApi;