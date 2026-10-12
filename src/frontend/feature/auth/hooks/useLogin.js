
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  useLoginMutation,
  useLazyGetCurrentUserQuery,
} from "@/frontend/feature/auth/api/auth.api";

export function useLogin() {
  const router = useRouter();

  const [loginMutation, { isLoading: isLoggingIn }] =
    useLoginMutation();

  const [getCurrentUser, { isFetching: isVerifying }] =
    useLazyGetCurrentUserQuery();

  const [error, setError] = useState("");

  const loading = isLoggingIn || isVerifying;

  async function login({ email, password }) {
    if (loading) return false;

    setError("");

    try {
      // 1. Authenticate; backend should set the HttpOnly cookie.
      await loginMutation({ email, password }).unwrap();

      // 2. Immediately verify the authenticated user through /me.
      await getCurrentUser().unwrap();

      // 3. Continue only if both requests succeed.
      toast.success("Welcome back!");

      router.replace("/admin");
      router.refresh();

      return true;
    } catch (err) {
      const message =
        err?.data?.message ||
        err?.message ||
        "Login failed. Please try again.";

      setError(message);
      return false;
    }
  }

  return {
    login,
    loading,
    error,
  };
}
