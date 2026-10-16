import { baseApi } from "@/frontend/store/api/baseApi";

// ============================================
// MEDIA API
// ============================================

export const mediaApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
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

    getMediaById: builder.query({
      query: (id) => `/media/${id}`,

      transformResponse: (response) => response.data,

      providesTags: (result, error, id) => [{ type: "Media", id }],
    }),

    /** Legacy multipart upload (Hostinger path prefers direct upload + finalize) */
    uploadMedia: builder.mutation({
      query: (formData) => ({
        url: "/media",
        method: "POST",
        body: formData,
      }),

      invalidatesTags: [{ type: "Media", id: "LIST" }],
    }),

    createUploadSession: builder.mutation({
      query: (body) => ({
        url: "/media/upload-session",
        method: "POST",
        body,
      }),
      transformResponse: (response) => response.data,
    }),

    finalizeUpload: builder.mutation({
      query: (body) => ({
        url: "/media/finalize",
        method: "POST",
        body,
      }),
      transformResponse: (response) => response.data,
      invalidatesTags: [{ type: "Media", id: "LIST" }],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data: media } = await queryFulfilled;
          if (!media?.id) return;

          // Instant grid paint for the default library query (page 1).
          dispatch(
            mediaApi.util.updateQueryData(
              "getMedia",
              { page: 1, limit: 20, search: "", resourceType: "" },
              (draft) => {
                if (!draft?.media) return;
                draft.media = [
                  media,
                  ...draft.media.filter((item) => item.id !== media.id),
                ];
                if (draft.pagination) {
                  draft.pagination.total = (draft.pagination.total ?? 0) + 1;
                }
              },
            ),
          );
        } catch {
          /* finalize failed — list refetch via tags still applies */
        }
      },
    }),

    abortUpload: builder.mutation({
      query: (body) => ({
        url: "/media/abort",
        method: "POST",
        body,
      }),
    }),

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

    deleteMedia: builder.mutation({
      query: (id) => ({
        url: `/media/${id}`,
        method: "DELETE",
      }),

      invalidatesTags: (result, error, id) => [
        { type: "Media", id },
        { type: "Media", id: "LIST" },
        { type: "Authors", id: "LIST" },
        { type: "Posts", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetMediaQuery,
  useGetMediaByIdQuery,
  useUploadMediaMutation,
  useCreateUploadSessionMutation,
  useFinalizeUploadMutation,
  useAbortUploadMutation,
  useUpdateMediaMutation,
  useDeleteMediaMutation,
} = mediaApi;
