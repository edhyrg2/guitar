import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

export function GuitarIcon({
  className,
  ...props
}: ComponentProps<"svg">) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("size-4", className)}
      aria-hidden="true"
      {...props}
    >
      <path d="M16.9 3.2L20.8 7.1" />
      <path d="M18.2 1.9L22.1 5.8" />
      <path d="M15.8 4.3L19.7 8.2" />
      <path d="M14.5 5.6L18.4 9.5" />
      <path d="M15.5 8.5L12.8 11.2" />
      <path d="M11.2 12.8L8.9 15.1" />
      <path d="M9.6 10.4C10.6 9.4 10.7 7.8 9.8 6.9C8.8 5.9 7.2 6 6.2 7L4.8 8.4C3.9 9.3 3.9 10.8 4.8 11.7L5.6 12.5C4.8 13.5 4.9 14.9 5.8 15.8L8.2 18.2C9.1 19.1 10.5 19.2 11.5 18.4L12.3 19.2C13.2 20.1 14.7 20.1 15.6 19.2L17 17.8C18 16.8 18.1 15.2 17.1 14.2C16.2 13.3 14.6 13.4 13.6 14.4" />
      <path d="M7.3 11.6L12.4 16.7" />
    </svg>
  );
}
