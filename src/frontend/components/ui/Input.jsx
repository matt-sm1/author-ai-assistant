"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";

import { cn } from "@/frontend/lib/utils";

const Input = React.forwardRef(
  ({ className, type = "text", showPasswordToggle = false, ...props }, ref) => {
    const [isPasswordVisible, setIsPasswordVisible] = React.useState(false);

    const isPassword = type === "password";
    const canTogglePassword = isPassword && showPasswordToggle;

    const inputType = canTogglePassword
      ? isPasswordVisible
        ? "text"
        : "password"
      : type;

    return (
      <div className="relative w-full">
        <input
          ref={ref}
          type={inputType}
          className={cn(
            "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            canTogglePassword && "pr-10",
            className,
          )}
          {...props}
        />

        {canTogglePassword && (
          <button
            type="button"
            onClick={() => setIsPasswordVisible((visible) => !visible)}
            aria-label={isPasswordVisible ? "Hide password" : "Show password"}
            aria-pressed={isPasswordVisible}
            className="cursor-pointer absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground"
          >
            {isPasswordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";

export { Input };
