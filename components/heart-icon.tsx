import * as React from "react";

import { cn } from "@/lib/utils";

type HeartIconProps = {
  className?: string;
  filled?: boolean;
};

export function HeartIcon({ className, filled = false }: HeartIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={cn("size-4", className)}
    >
      <path
        d="M12 21c-.3 0-.6-.1-.8-.3C8.7 18.5 4 14.6 4 9.7 4 7.1 6.1 5 8.7 5c1.5 0 2.9.7 3.8 1.9C13.4 5.7 14.8 5 16.3 5 18.9 5 21 7.1 21 9.7c0 4.9-4.7 8.8-7.2 11-.2.2-.5.3-.8.3Z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
