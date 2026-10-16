
"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { toast } from "sonner";

import {
  useGetCurrentUserQuery,
  useLogoutMutation,
} from "@/frontend/feature/auth/api/auth.api";

export default function AdminProfile({ onNavigate }) {
  const router = useRouter();

  const {
    data: currentUser,
    isLoading,
    isError,
  } = useGetCurrentUserQuery();

  const [logoutMutation, { isLoading: isLoggingOut }] =
    useLogoutMutation();

  // Support common API response structures.
  const user =
    currentUser?.user ??
    currentUser?.data?.user ??
    currentUser?.data ??
    currentUser;

  const name = user?.name || user?.full_name || "";
  const email = user?.email || "";

  async function handleLogout() {
    if (isLoggingOut) return;

    try {
      await logoutMutation().unwrap();

      toast.success("Logged out successfully.");

      onNavigate?.();
      router.replace("/admin/login");
      router.refresh();
    } catch (err) {
      toast.error(
        err?.data?.message || "Logout failed. Please try again."
      );
    }
  }

  return (
    <div className="space-y-0.5 border-t p-3">
      <div className="rounded-xl p-2">
        <div className="truncate text-sm font-semibold">
          {isLoading
            ? "Loading profile..."
            : isError
              ? "Unable to load profile"
              : name || "User"}
        </div>

        {!isLoading && !isError && email && (
          <div className="truncate text-xs text-muted-foreground">
            {email}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={handleLogout}
        disabled={isLoggingOut}
        className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-sidebar-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
      >
        <LogOut className="h-[18px] w-[18px] text-muted-foreground" />
        {isLoggingOut ? "Logging out..." : "Logout"}
      </button>
    </div>
  );
}
