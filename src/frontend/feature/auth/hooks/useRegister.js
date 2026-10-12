
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { useRegisterMutation } from "@/frontend/feature/auth/api/auth.api";

export function useRegister() {
  const router = useRouter();
  const [registerMutation, { isLoading }] = useRegisterMutation();

  const [error, setError] = useState("");

  async function register({ name, email, password }) {
    if (isLoading) return false;

    setError("");

    try {
      await registerMutation({ name, email, password }).unwrap();

      toast.success("Account created successfully!");

      router.replace("/");
      router.refresh();

      return true;
    } catch (err) {
      const message =
        err?.data?.message ||
        err?.message ||
        "Registration failed. Please try again.";

      setError(message);
      return false;
    }
  }

  return {
    register,
    loading: isLoading,
    error,
  };
}
