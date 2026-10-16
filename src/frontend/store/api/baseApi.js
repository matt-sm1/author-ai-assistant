import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const rawBaseQuery = fetchBaseQuery({
  baseUrl: `${basePath}/api`,
  credentials: "include",
});

async function baseQueryWithAuth(args, api, extraOptions) {
  const result = await rawBaseQuery(args, api, extraOptions);

  if (result.error?.status === 401) {
    const url = typeof args === "string" ? args : args?.url;
    const isAuthEndpoint =
      typeof url === "string" &&
      (url.startsWith("/auth/login") || url.startsWith("/auth/register"));

    if (!isAuthEndpoint && typeof window !== "undefined") {
      const path = window.location.pathname;
      if (path.includes("/admin")) {
        window.location.assign(`${basePath}/admin/login`);
      }
    }
  }

  return result;
}

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithAuth,
  keepUnusedDataFor: 300,
  refetchOnFocus: false,
  refetchOnMountOrArgChange: 60,
  refetchOnReconnect: true,
  tagTypes: [
    "Categories",
    "Tags",
    "Media",
    "Posts",
    "Auth",
    "Authors",
    "Stats",
  ],
  endpoints: () => ({}),
});

/** Prefer field-level API validation details when present. */
export function getApiErrorMessage(err, fallback = "Something went wrong") {
  const details = err?.data?.details;
  if (details && typeof details === "object") {
    const first = Object.values(details).find(Boolean);
    if (typeof first === "string") return first;
  }
  return err?.data?.message || err?.message || fallback;
}
