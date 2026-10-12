import { baseApi } from "@/frontend/store/api/baseApi";

export const categoriesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCategories: builder.query({
      query: ({ page = 1, limit = 10, search = "" } = {}) => ({
        url: "/categories",
        params: {
          page,
          limit,
          search,
        },
      }),

      transformResponse: (response) => ({
        categories: response.data,
        pagination: response.pagination,
      }),

      providesTags: (result) => [
        { type: "Categories", id: "LIST" },
        ...(result?.categories ?? []).map(({ id }) => ({
          type: "Categories",
          id,
        })),
      ],
    }),

    getCategoryById: builder.query({
      query: (id) => `/categories/${id}`,
      transformResponse: (response) => response.data,
      providesTags: (result, error, id) => [{ type: "Categories", id }],
    }),

    createCategory: builder.mutation({
      query: (data) => ({
        url: "/categories",
        method: "POST",
        body: data,
      }),
      invalidatesTags: [{ type: "Categories", id: "LIST" }],
    }),

    updateCategory: builder.mutation({
      query: ({ id, data }) => ({
        url: `/categories/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Categories", id },
        { type: "Categories", id: "LIST" },
      ],
    }),

    deleteCategory: builder.mutation({
      query: (id) => ({
        url: `/categories/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Categories", id },
        { type: "Categories", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetCategoriesQuery,
  useGetCategoryByIdQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} = categoriesApi;
