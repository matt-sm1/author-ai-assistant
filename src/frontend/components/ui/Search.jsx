"use client";

import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";

export default function SearchInput({
  value = "",
  onChange,
  placeholder = "Search...",
  debounceMs = 400,
  disabled = false,
  className = "",
}) {
  const [inputValue, setInputValue] = useState(value);
  const [previousValue, setPreviousValue] = useState(value);

  // Sync external value without setState inside useEffect
  if (value !== previousValue) {
    setPreviousValue(value);
    setInputValue(value);
  }

  // Debounced search
  useEffect(() => {
    if (inputValue === value) return;

    const timer = setTimeout(() => {
      onChange?.(inputValue);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [inputValue, value, onChange, debounceMs]);

  function handleClear() {
    setInputValue("");
    onChange?.("");
  }

  return (
    <div
      className={`relative max-w-md flex-1 ${className}`}
      role="search"
    >
      <Search
        className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
      />

      <input
        type="search"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        disabled={disabled}
        className="h-10 w-full rounded-xl border bg-card pl-9 pr-9 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:opacity-50"
      />

      {inputValue && !disabled && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear search"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}