import { baseApi } from "@/frontend/store/api/baseApi";

export const statsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardStats: builder.query({
      query: () => "/stats",
      transformResponse: (response) => response.data,
      providesTags: ["Stats"],
    }),
  }),
});

export const { useGetDashboardStatsQuery } = statsApi;
