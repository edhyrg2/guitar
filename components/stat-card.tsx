import { HugeiconsIcon } from "@hugeicons/react";
import type { IconSvgElement } from "@hugeicons/react";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type StatCardProps = {
  title: string;
  value: string;
  change: string;
  detail: string;
  icon: IconSvgElement;
};

export function StatCard({
  title,
  value,
  change,
  detail,
  icon,
}: StatCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{title}</CardDescription>
        <CardAction>
          <div className="flex size-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <HugeiconsIcon icon={icon} strokeWidth={2} />
          </div>
        </CardAction>
        <CardTitle className="text-2xl">{value}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-medium">{change}</span>
          <span className="truncate text-xs text-muted-foreground">{detail}</span>
        </div>
      </CardContent>
    </Card>
  );
}
