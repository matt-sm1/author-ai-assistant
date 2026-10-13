
import { baseApi } from "@/frontend/store/api/baseApi";

// ============================================
// MEDIA API
// ============================================

export const mediaApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ============================================
    // GET ALL MEDIA
    // ============================================

    getMedia: builder.query({
      query: ({
        page = 1,
        limit = 10,
        search = "",
        resourceType = "",
      } = {}) => ({
        url: "/media",
        params: {
          page,
          limit,
          search,
          resourceType,
        },
      }),

      transformResponse: (response) => ({
        media: response.data,
        pagination: response.pagination,
      }),

      providesTags: (result) => [
        { type: "Media", id: "LIST" },
        ...(result?.media ?? []).map(({ id }) => ({
          type: "Media",
          id,
        })),
      ],
    }),

    // ============================================
    // GET MEDIA BY ID
    // ============================================

    getMediaById: builder.query({
      query: (id) => `/media/${id}`,

      transformResponse: (response) => response.data,

      providesTags: (result, error, id) => [
        { type: "Media", id },
      ],
    }),

    // ============================================
    // UPLOAD MEDIA
    // ============================================

    uploadMedia: builder.mutation({
      query: (formData) => ({
        url: "/media",
        method: "POST",
        body: formData,
      }),

      invalidatesTags: [{ type: "Media", id: "LIST" }],
    }),

    // ============================================
    // UPDATE MEDIA METADATA
    // ============================================

    updateMedia: builder.mutation({
      query: ({ id, data }) => ({
        url: `/media/${id}`,
        method: "PATCH",
        body: data,
      }),

      invalidatesTags: (result, error, { id }) => [
        { type: "Media", id },
        { type: "Media", id: "LIST" },
      ],
    }),

    // ============================================
    // DELETE MEDIA
    // ============================================


    deleteMedia: builder.mutation({
      query: (id) => ({
        url: `/media/${id}`,
        method: "DELETE",
      }),

      invalidatesTags: (result, error, id) => [
        // Media gallery refresh
        { type: "Media", id },
        { type: "Media", id: "LIST" },

        // Author profile pictures refresh
        { type: "Authors", id: "LIST" },

        // Posts ke featured images refresh
        { type: "Posts", id: "LIST" },
      ],
    }),

  }),
});

// ============================================
// EXPORT HOOKS
// ============================================

export const {
  useGetMediaQuery,
  useGetMediaByIdQuery,
  useUploadMediaMutation,
  useUpdateMediaMutation,
  useDeleteMediaMutation,
} = mediaApi;
