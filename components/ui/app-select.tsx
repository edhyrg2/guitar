"use client";

import * as React from "react";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type AppSelectOption = {
  value: string;
  label: React.ReactNode;
  disabled?: boolean;
};

type AppSelectProps = {
  value: string;
  onValueChange: (value: string) => void;
  options: AppSelectOption[];
  placeholder?: string;
  emptyLabel?: React.ReactNode;
  disabled?: boolean;
  className?: string;
  contentClassName?: string;
};

const EMPTY_VALUE = "__app-select-empty__";

function AppSelect({
  value,
  onValueChange,
  options,
  placeholder,
  emptyLabel,
  disabled,
  className,
  contentClassName,
}: AppSelectProps) {
  const normalizedValue = value === "" ? undefined : value;

  return (
    <Select
      value={normalizedValue}
      onValueChange={(nextValue) =>
        onValueChange(nextValue === EMPTY_VALUE ? "" : nextValue)
      }
      disabled={disabled}
    >
      <SelectTrigger className={cn("w-full justify-between", className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className={contentClassName}>
        <SelectGroup>
          {emptyLabel ? (
            <SelectItem value={EMPTY_VALUE}>{emptyLabel}</SelectItem>
          ) : null}
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

export { AppSelect };
