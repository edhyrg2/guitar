"use client";

import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { PaintBrush02Icon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import type { PublishType } from "@/lib/custom-component-publish-target-types";

type AssetEditorButtonProps = {
  ownerType: PublishType;
  ownerId: string;
};

export function AssetEditorButton({
  ownerType,
  ownerId,
}: AssetEditorButtonProps) {
  const href = `/custom-component?ownerType=${encodeURIComponent(
    ownerType
  )}&ownerId=${encodeURIComponent(ownerId)}`;

  return (
    <Button variant="secondary" size="sm" asChild>
      <Link href={href}>
        <HugeiconsIcon icon={PaintBrush02Icon} strokeWidth={2} data-icon="inline-start" />
        Edit Asset
      </Link>
    </Button>
  );
}
