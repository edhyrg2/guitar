import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowDown01Icon,
  Bookmark02Icon,
  Cancel01Icon,
  DashboardSquare01Icon,
  Download01Icon,
  Edit02Icon,
  FavouriteIcon,
  Share08Icon,
  Tick02Icon,
  UserAccountIcon,
} from "@hugeicons/core-free-icons";

import { TopNavbar } from "@/components/top-navbar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

const setupFields = [
  { label: "Brand", value: "Fender" },
  { label: "Model", value: "American Standard Stratocaster" },
  { label: "Year", value: "2014" },
  { label: "Pickup Configuration", value: "SSS" },
  { label: "Diagram", value: "5-Way Blade Switch" },
];

const diagramOptions = [
  {
    title: "Standard Wiring",
    detail: "5-Way Blade / 2 Tone",
    active: true,
  },
  {
    title: "Noiseless Modern",
    detail: "5-Way Blade / Treble Bleed",
  },
  {
    title: "Studio Blend Mod",
    detail: "Bridge Blend / Push Pull",
  },
  {
    title: "Neck Tone Focus",
    detail: "1 Tone / Vintage Cap",
  },
];

const tabs = ["Diagram", "Components", "Switch Positions", "Notes", "Source"];

const switchPositions = [
  { number: "1", title: "Bridge", tone: "Bright attack" },
  { number: "2", title: "Bridge + Middle", tone: "Quack" },
  { number: "3", title: "Middle", tone: "Balanced" },
  { number: "4", title: "Middle + Neck", tone: "Glassy" },
  { number: "5", title: "Neck", tone: "Warm lead" },
];

const componentList = [
  ["Switch", "5-Way Blade"],
  ["Volume Pot", "250K Audio"],
  ["Tone Pot 1", "250K Audio"],
  ["Tone Pot 2", "250K Audio"],
  ["Capacitor 1", "0.047uF"],
  ["Capacitor 2", "0.047uF"],
  ["Output Jack", "Mono"],
  ["Wire", "Cloth Pushback"],
];

const wireLegend = [
  "Hot",
  "Ground",
  "North Start",
  "North Finish",
  "South Start",
  "South Finish",
  "Shield",
];

function SetupField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[0.65rem] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
        {label}
      </span>
      <button
        type="button"
        className="flex h-11 items-center justify-between rounded-xl border border-border/70 bg-background px-3 text-sm shadow-sm transition-colors hover:bg-muted/40"
      >
        <span className="truncate">{value}</span>
        <HugeiconsIcon
          icon={ArrowDown01Icon}
          strokeWidth={2}
          className="text-muted-foreground"
        />
      </button>
    </div>
  );
}

function WireRow({
  className,
  label,
  style,
}: {
  className?: string;
  label?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div className={cn("absolute", className)} style={style}>
      {label ? (
        <span className="mb-1 block text-[0.65rem] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
          {label}
        </span>
      ) : null}
      <div className="h-1 rounded-full bg-foreground/80 shadow-[0_0_0_1px_rgba(255,255,255,0.12)]" />
    </div>
  );
}

export function OverviewContent() {
  return (
    <div className="flex flex-1 flex-col">
      <TopNavbar
        searchPlaceholder="Search brand, model, pickup, setup..."
        items={[
          { label: "Overview", href: "/", icon: DashboardSquare01Icon, active: true },
          { label: "Users", href: "/users", icon: UserAccountIcon },
          { label: "Components" },
          { label: "Tools" },
        ]}
      />

      <div className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-6">
        <section className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)_280px]">
          <Card className="border border-border/70 bg-card/90 shadow-sm">
            <CardHeader>
              <CardTitle>Select Setup</CardTitle>
              <CardDescription>
                Start from a familiar factory wiring, then compare variants.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              {setupFields.map((field) => (
                <SetupField key={field.label} {...field} />
              ))}

              <div className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-muted/20 p-3">
                {diagramOptions.map((option) => (
                  <button
                    key={option.title}
                    type="button"
                    className={cn(
                      "flex items-center gap-3 rounded-xl border px-3 py-3 text-left transition-colors",
                      option.active
                        ? "border-primary/30 bg-primary/8 shadow-sm"
                        : "border-border/60 bg-background hover:bg-muted/40"
                    )}
                  >
                    <div className="flex size-14 items-center justify-center rounded-lg border border-border/60 bg-background">
                      <div className="grid size-9 grid-cols-2 gap-1">
                        <span className="rounded-full bg-muted" />
                        <span className="rounded-full bg-primary/30" />
                        <span className="rounded-full bg-foreground/20" />
                        <span className="rounded-full bg-muted-foreground/25" />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{option.title}</p>
                      <p className="text-xs text-muted-foreground">{option.detail}</p>
                    </div>
                  </button>
                ))}
              </div>

              <Button variant="outline" size="lg" className="w-full">
                View All Diagrams
              </Button>
            </CardContent>
          </Card>

          <Card className="border border-border/70 bg-card/95 shadow-sm">
            <CardHeader className="gap-4 border-b border-border/70 pb-4">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0">
                  <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                    <HugeiconsIcon icon={FavouriteIcon} strokeWidth={2} />
                    <span className="text-xs">Verified factory reference</span>
                  </div>
                  <CardTitle className="text-xl sm:text-2xl">
                    Fender American Standard Stratocaster (2014)
                  </CardTitle>
                  <CardDescription className="mt-2">
                    SSS / 5-Way Blade Switch / 2 Tone / Standard Wiring
                  </CardDescription>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="outline" size="lg">
                    <HugeiconsIcon
                      icon={Share08Icon}
                      strokeWidth={2}
                      data-icon="inline-start"
                    />
                    Share
                  </Button>
                  <Button variant="outline" size="lg">
                    <HugeiconsIcon
                      icon={Bookmark02Icon}
                      strokeWidth={2}
                      data-icon="inline-start"
                    />
                    Save
                  </Button>
                  <Button size="lg">
                    <HugeiconsIcon
                      icon={Edit02Icon}
                      strokeWidth={2}
                      data-icon="inline-start"
                    />
                    Edit Diagram
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {tabs.map((tab, index) => (
                  <Button
                    key={tab}
                    variant={index === 0 ? "secondary" : "ghost"}
                    size="sm"
                    className={cn(index === 0 ? "shadow-sm" : "")}
                  >
                    {tab}
                  </Button>
                ))}
                <div className="ml-auto flex items-center gap-2">
                  <Button variant="outline" size="icon-sm">
                    <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
                    <span className="sr-only">Zoom out</span>
                  </Button>
                  <div className="rounded-md border border-border/70 bg-background px-3 py-1.5 text-xs font-medium">
                    100%
                  </div>
                  <Button variant="outline" size="icon-sm">
                    <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} />
                    <span className="sr-only">Zoom fit</span>
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="flex flex-col gap-4">
              <div className="relative overflow-hidden rounded-[1.75rem] border border-border/70 bg-background p-4 sm:p-6">
                <div
                  className="absolute inset-0 opacity-70"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle at 1px 1px, color-mix(in srgb, var(--color-border) 65%, transparent) 1px, transparent 0)",
                    backgroundSize: "18px 18px",
                  }}
                />

                <div className="relative min-h-[520px]">
                  <div className="absolute top-8 left-6">
                    <span className="text-[0.65rem] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                      Neck Pickup
                    </span>
                    <div className="mt-3 h-14 w-44 rounded-full border border-border/70 bg-linear-to-b from-card to-muted/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]" />
                  </div>

                  <div className="absolute top-40 left-6">
                    <span className="text-[0.65rem] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                      Middle Pickup
                    </span>
                    <div className="mt-3 h-14 w-44 rounded-full border border-border/70 bg-linear-to-b from-card to-muted/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]" />
                  </div>

                  <div className="absolute top-72 left-6">
                    <span className="text-[0.65rem] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                      Bridge Pickup
                    </span>
                    <div className="mt-3 h-14 w-44 rounded-full border border-border/70 bg-linear-to-b from-foreground/85 to-foreground text-primary-foreground shadow-lg" />
                  </div>

                  <div className="absolute top-14 left-[35%]">
                    <span className="text-[0.65rem] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                      5-Way Blade Switch
                    </span>
                    <div className="mt-3 flex h-44 w-12 rounded-2xl border border-border/70 bg-linear-to-b from-amber-100/70 via-card to-muted/40 p-2 shadow-sm dark:from-amber-200/10">
                      <div className="flex w-full flex-col items-center justify-between">
                        {Array.from({ length: 5 }).map((_, index) => (
                          <span
                            key={index}
                            className="size-3 rounded-full bg-foreground/70"
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="absolute top-[5.5rem] right-[16%]">
                    <span className="text-[0.65rem] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                      Tone 1
                    </span>
                    <div className="mt-3 size-[6.5rem] rounded-full border border-border/70 bg-linear-to-b from-card to-muted/50 shadow-sm" />
                  </div>

                  <div className="absolute top-[52%] left-[48%]">
                    <span className="text-[0.65rem] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                      Volume
                    </span>
                    <div className="mt-3 size-[6.5rem] rounded-full border border-border/70 bg-linear-to-b from-card to-muted/50 shadow-sm" />
                  </div>

                  <div className="absolute right-[12%] bottom-24">
                    <span className="text-[0.65rem] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                      Tone 2
                    </span>
                    <div className="mt-3 size-[6.5rem] rounded-full border border-border/70 bg-linear-to-b from-card to-muted/50 shadow-sm" />
                  </div>

                  <div className="absolute bottom-8 left-[44%]">
                    <span className="text-[0.65rem] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                      Output Jack
                    </span>
                    <div className="mt-3 flex h-16 w-24 items-center justify-center rounded-full border border-border/70 bg-linear-to-r from-card to-muted/50 shadow-sm">
                      <div className="size-9 rounded-full border border-border/70 bg-background" />
                    </div>
                  </div>

                  <WireRow className="top-24 left-[18%] w-[18%]" />
                  <WireRow className="top-44 left-[18%] w-[24%]" />
                  <WireRow className="top-76 left-[18%] w-[28%]" />
                  <WireRow className="top-[22%] left-[39%] w-[18%] rotate-[18deg]" />
                  <WireRow className="top-[30%] left-[39%] w-[17%] rotate-[6deg]" />
                  <WireRow className="top-[39%] left-[39%] w-[16%] -rotate-[10deg]" />
                  <WireRow className="top-[29%] left-[44%] w-[28%]" />
                  <WireRow className="top-[40%] left-[44%] w-[20%] rounded-full" />
                  <WireRow className="top-[54%] left-[55%] w-[27%]" />
                  <WireRow className="right-[18%] bottom-[29%] w-[18%]" />
                  <WireRow className="bottom-[17%] left-[52%] w-[32%]" />
                  <WireRow className="bottom-[17%] left-[17%] w-[35%]" />
                </div>
              </div>

              <div className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-muted/20 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  {[
                    "Show Labels",
                    "Show Values",
                    "Show Grounds",
                    "Color Wires",
                    "Realistic Style",
                  ].map((item, index) => (
                    <div
                      key={item}
                      className={cn(
                        "rounded-full border px-3 py-1.5",
                        index < 4
                          ? "border-primary/25 bg-primary/10 text-foreground"
                          : "border-border/70 bg-background"
                      )}
                    >
                      {item}
                    </div>
                  ))}
                </div>

                <Button variant="outline" size="lg">
                  <HugeiconsIcon
                    icon={Download01Icon}
                    strokeWidth={2}
                    data-icon="inline-start"
                  />
                  Download
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-6">
            <Card className="border border-border/70 bg-card/90 shadow-sm">
              <CardHeader>
                <CardTitle>Switch Positions</CardTitle>
                <CardDescription>
                  Pickup combinations for the current 5-way selector.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {switchPositions.map((position, index) => (
                  <div
                    key={position.number}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border px-3 py-3",
                      index === 0
                        ? "border-primary/30 bg-primary/8"
                        : "border-border/60 bg-background"
                    )}
                  >
                    <div className="flex size-8 items-center justify-center rounded-lg bg-muted font-semibold">
                      {position.number}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{position.title}</p>
                      <p className="text-xs text-muted-foreground">{position.tone}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border border-border/70 bg-card/90 shadow-sm">
              <CardHeader>
                <CardTitle>Components List</CardTitle>
                <CardDescription>
                  Main parts used in this reference diagram.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {componentList.map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between gap-3 border-b border-border/50 pb-3 last:border-b-0 last:pb-0"
                  >
                    <span className="text-muted-foreground">{label}</span>
                    <span className="text-right font-medium">{value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border border-border/70 bg-card/90 shadow-sm">
              <CardHeader>
                <CardTitle>Diagram Info</CardTitle>
                <CardDescription>
                  Reference quality and update history.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Source</span>
                  <span className="text-right font-medium">Factory PDF</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Last Updated</span>
                  <span className="text-right font-medium">2026-05-17</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Verified</span>
                  <span className="text-right font-medium text-primary">Yes</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <Card className="border border-border/70 bg-card/90 shadow-sm">
            <CardHeader>
              <CardTitle>Fender Pickup Wire Colors</CardTitle>
              <CardDescription>
                Quick legend for the current overview drawing.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-4">
              {wireLegend.map((item, index) => (
                <div key={item} className="flex items-center gap-2">
                  <span
                    className={cn(
                      "size-3 rounded-full border border-border/60",
                      index === 0 && "bg-background",
                      index === 1 && "bg-foreground",
                      index === 2 && "bg-amber-400",
                      index === 3 && "bg-linear-to-r from-amber-400 to-background",
                      index === 4 && "bg-blue-500",
                      index === 5 && "bg-linear-to-r from-blue-500 to-background",
                      index === 6 && "bg-muted"
                    )}
                  />
                  <span className="text-sm">{item}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border border-border/70 bg-card/90 shadow-sm">
            <CardHeader>
              <CardTitle>Note</CardTitle>
              <CardDescription>
                Use this as a build reference, not as a final measurement.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Wire colors can vary across production years and replacement pickups.
              Always verify with a multimeter before soldering.
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
