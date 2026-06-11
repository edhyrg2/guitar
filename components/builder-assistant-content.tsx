"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  CheckmarkCircle02Icon,
  Copy01Icon,
  ElectricPlugsIcon,
  MagicWand01Icon,
  Search01Icon,
  Settings02Icon,
  SparklesIcon,
  Wrench01Icon,
} from "@hugeicons/core-free-icons";

import { AppSelect } from "@/components/ui/app-select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { ModRow } from "@/lib/mod-types";
import type { PickupConfigurationRow } from "@/lib/pickup-configuration-types";
import type { SwitchTypeRow } from "@/lib/switch-type-types";

type BuilderAssistantContentProps = {
  pickupConfigurations: PickupConfigurationRow[];
  switchTypes: SwitchTypeRow[];
  mods: ModRow[];
};

type ExperienceLevel = "beginner" | "intermediate" | "advanced";
type ToneGoal = "classic" | "versatile" | "high-output" | "vintage" | "experimental";

type WizardState = {
  pickupConfigurationId: string;
  switchTypeId: string;
  volumeCount: number;
  toneCount: number;
  selectedModIds: string[];
  experience: ExperienceLevel;
  toneGoal: ToneGoal;
  notes: string;
};

const steps = [
  { label: "Pickup", icon: ElectricPlugsIcon },
  { label: "Switch", icon: ElectricPlugsIcon },
  { label: "Controls", icon: Settings02Icon },
  { label: "Mods", icon: Wrench01Icon },
  { label: "Recommendation", icon: SparklesIcon },
] as const;

const toneGoals: { value: ToneGoal; label: string; description: string }[] = [
  { value: "classic", label: "Classic", description: "Standard wiring that is easy to understand and beginner-friendly." },
  { value: "versatile", label: "Versatile", description: "More pickup combinations for covering a wide range of genres." },
  { value: "high-output", label: "High Output", description: "Best for rock, lead tones, and powerful humbucker setups." },
  { value: "vintage", label: "Vintage", description: "Old-school single-coil character with a more organic response." },
  { value: "experimental", label: "Experimental", description: "Creative mods such as phase, series, and parallel switching." },
];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
}

function matchesQuery(text: string, query: string) {
  const q = query.trim().toLowerCase();
  return !q || text.toLowerCase().includes(q);
}

function inferDifficulty(state: WizardState, mods: ModRow[], switchType?: SwitchTypeRow) {
  const selectedMods = mods.filter((mod) => state.selectedModIds.includes(mod.id));
  let score = 1 + selectedMods.length;
  if (state.volumeCount + state.toneCount > 3) score += 1;
  if ((switchType?.positionCount ?? 0) >= 5) score += 1;
  if (selectedMods.some((mod) => mod.requiresSpecialSwitch || mod.difficultyLevel?.toLowerCase().includes("advanced"))) score += 2;

  if (score <= 2) return { label: "Beginner", score, tone: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900/60" };
  if (score <= 4) return { label: "Intermediate", score, tone: "text-amber-600", bg: "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900/60" };
  return { label: "Advanced", score, tone: "text-red-600", bg: "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-900/60" };
}

function buildRecommendations(state: WizardState, pickup?: PickupConfigurationRow, switchType?: SwitchTypeRow, selectedMods: ModRow[] = []) {
  const items = [
    pickup ? `${pickup.code} pickup layout: ${pickup.name}` : "Choose a pickup configuration first.",
    switchType ? `${switchType.name} with ${switchType.positionCount} positions` : "Choose a suitable switch type.",
    `${state.volumeCount} volume + ${state.toneCount} tone control`,
  ];

  items.push(selectedMods.length ? `Mods: ${selectedMods.map((mod) => mod.name).join(", ")}` : "No extra mods — simpler wiring and easier maintenance.");

  if (state.toneGoal === "versatile") items.push("Prioritize parallel pickup combinations and coil-split options when using humbuckers.");
  if (state.toneGoal === "high-output") items.push("Use full humbucker paths, shielded wire, and avoid switching that reduces output.");
  if (state.toneGoal === "vintage") items.push("Keep pot/cap values natural and use simple wiring for classic response.");
  if (state.toneGoal === "experimental") items.push("Add phase/series/parallel options only when the wiring complexity is acceptable.");

  return items;
}

function buildAiPrompt(state: WizardState, pickup?: PickupConfigurationRow, switchType?: SwitchTypeRow, selectedMods: ModRow[] = []) {
  return [
    "Create a guitar wiring diagram plan with the following specs:",
    `- Pickup configuration: ${pickup ? `${pickup.code} / ${pickup.name}` : "not selected"}`,
    `- Switch type: ${switchType ? `${switchType.name} (${switchType.positionCount} positions, ${switchType.poleCount} poles, ${switchType.lugCount} lugs)` : "not selected"}`,
    `- Controls: ${state.volumeCount} volume, ${state.toneCount} tone`,
    `- Tone goal: ${state.toneGoal}`,
    `- User skill level: ${state.experience}`,
    `- Mods: ${selectedMods.length ? selectedMods.map((mod) => mod.name).join(", ") : "none"}`,
    state.notes ? `- Extra notes: ${state.notes}` : null,
    "Return component list, connection plan, switch positions, warnings, and a beginner-safe build order.",
  ].filter(Boolean).join("\n");
}

function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <div className="relative">
      <HugeiconsIcon icon={Search01Icon} className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" strokeWidth={2} />
      <Input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="h-11 rounded-2xl pl-9" />
    </div>
  );
}

export function BuilderAssistantContent({ pickupConfigurations, switchTypes, mods }: BuilderAssistantContentProps) {
  const router = useRouter();
  const activeSwitches = React.useMemo(() => switchTypes.filter((item) => item.isActive), [switchTypes]);
  const activeMods = React.useMemo(() => mods.filter((item) => item.isActive), [mods]);

  const [step, setStep] = React.useState(0);
  const [copied, setCopied] = React.useState(false);
  const [isCreatingDraft, setIsCreatingDraft] = React.useState(false);
  const [draftError, setDraftError] = React.useState<string | null>(null);
  const [pickupQuery, setPickupQuery] = React.useState("");
  const [switchQuery, setSwitchQuery] = React.useState("");
  const [modQuery, setModQuery] = React.useState("");
  const [state, setState] = React.useState<WizardState>({
    pickupConfigurationId: pickupConfigurations[0]?.id ?? "",
    switchTypeId: activeSwitches[0]?.id ?? switchTypes[0]?.id ?? "",
    volumeCount: 1,
    toneCount: 1,
    selectedModIds: [],
    experience: "beginner",
    toneGoal: "classic",
    notes: "",
  });

  const selectedPickup = pickupConfigurations.find((item) => item.id === state.pickupConfigurationId);
  const selectedSwitch = switchTypes.find((item) => item.id === state.switchTypeId);
  const selectedMods = activeMods.filter((item) => state.selectedModIds.includes(item.id));
  const difficulty = inferDifficulty(state, activeMods, selectedSwitch);
  const recommendations = buildRecommendations(state, selectedPickup, selectedSwitch, selectedMods);
  const aiPrompt = buildAiPrompt(state, selectedPickup, selectedSwitch, selectedMods);

  const filteredPickups = React.useMemo(
    () => pickupConfigurations.filter((item) => matchesQuery(`${item.code} ${item.name} ${item.description ?? ""}`, pickupQuery)),
    [pickupConfigurations, pickupQuery]
  );
  const filteredSwitches = React.useMemo(
    () => activeSwitches.filter((item) => matchesQuery(`${item.name} ${item.slug ?? ""} ${item.switchCategory ?? ""} ${item.description ?? ""} ${item.positionCount} positions ${item.poleCount} poles ${item.lugCount} lugs`, switchQuery)),
    [activeSwitches, switchQuery]
  );
  const filteredMods = React.useMemo(
    () => activeMods.filter((item) => matchesQuery(`${item.name} ${item.slug ?? ""} ${item.description ?? ""} ${item.difficultyLevel ?? ""} ${item.requiresPushPull ? "push-pull" : ""} ${item.requiresMiniToggle ? "mini toggle" : ""} ${item.requiresSpecialSwitch ? "special switch" : ""}`, modQuery)),
    [activeMods, modQuery]
  );

  function updateState(patch: Partial<WizardState>) {
    setState((current) => ({ ...current, ...patch }));
  }

  function toggleMod(modId: string) {
    setState((current) => ({
      ...current,
      selectedModIds: current.selectedModIds.includes(modId) ? current.selectedModIds.filter((id) => id !== modId) : [...current.selectedModIds, modId],
    }));
  }

  async function copyPrompt() {
    await navigator.clipboard.writeText(aiPrompt);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  async function createBuilderDraft() {
    setIsCreatingDraft(true);
    setDraftError(null);

    try {
      const response = await fetch("/api/builder-assistant/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(state),
      });
      const payload = (await response.json()) as { redirectUrl?: string; error?: string };

      if (response.status === 401) {
        router.push("/login?callbackUrl=/builder-assistant");
        return;
      }

      if (!response.ok || !payload.redirectUrl) {
        throw new Error(payload.error ?? "Failed to create a builder draft.");
      }

      router.push(payload.redirectUrl);
    } catch (error) {
      setDraftError(error instanceof Error ? error.message : "Failed to create a builder draft.");
    } finally {
      setIsCreatingDraft(false);
    }
  }

  return (
    <main className="flex-1 space-y-6 p-4 sm:p-6">
      <section className="relative overflow-hidden rounded-[2rem] border bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,.22),transparent_34%),linear-gradient(135deg,#111827,#0f172a_45%,#18181b)] p-6 text-white shadow-xl sm:p-8">
        <div className="absolute inset-0 opacity-15 [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:54px_54px]" />
        <div className="relative grid gap-6 lg:grid-cols-[1.1fr_.9fr] lg:items-end">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-white/80 backdrop-blur">
              <HugeiconsIcon icon={MagicWand01Icon} className="size-4" strokeWidth={2} /> Guided Wiring Planner
            </div>
            <h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-5xl">Builder Assistant</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/70 sm:text-base">
              A guided workflow for choosing pickups, switches, controls, and mods before opening the Wiring Builder or AI Import.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 rounded-3xl border border-white/10 bg-white/10 p-3 backdrop-blur">
            <div className="rounded-2xl bg-white/10 p-4 text-center"><p className="text-2xl font-semibold">{pickupConfigurations.length}</p><p className="text-xs text-white/60">Pickup layouts</p></div>
            <div className="rounded-2xl bg-white/10 p-4 text-center"><p className="text-2xl font-semibold">{activeSwitches.length}</p><p className="text-xs text-white/60">Active switches</p></div>
            <div className="rounded-2xl bg-white/10 p-4 text-center"><p className="text-2xl font-semibold">{activeMods.length}</p><p className="text-xs text-white/60">Mods</p></div>
          </div>
        </div>
      </section>

      <Card className="rounded-3xl">
        <CardContent className="p-3 sm:p-4">
          <div className="grid gap-2 sm:grid-cols-5">
            {steps.map((item, index) => (
              <button
                key={item.label}
                type="button"
                onClick={() => setStep(index)}
                className={cn("flex items-center gap-3 rounded-2xl border p-3 text-left text-sm transition hover:bg-accent", step === index ? "border-primary bg-primary text-primary-foreground shadow-sm" : "bg-card", index < step && step !== index ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-300" : null)}
              >
                <span className="flex size-8 items-center justify-center rounded-xl bg-background/80 text-foreground shadow-sm"><HugeiconsIcon icon={item.icon} className="size-4" strokeWidth={2} /></span>
                <span className="font-medium">{index + 1}. {item.label}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle>{steps[step].label}</CardTitle>
            <CardDescription>Fill in this step, then continue to the next stage.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {step === 0 ? (
              <div className="space-y-4">
                <SearchBox value={pickupQuery} onChange={setPickupQuery} placeholder="Search pickup layouts: SSS, HH, Strat, Tele..." />
                <div className="grid gap-3 md:grid-cols-2">
                  {filteredPickups.map((item) => (
                    <button key={item.id} type="button" onClick={() => updateState({ pickupConfigurationId: item.id })} className={cn("rounded-2xl border p-4 text-left transition hover:border-primary/50 hover:bg-primary/5", state.pickupConfigurationId === item.id && "border-primary bg-primary/10 ring-2 ring-primary/15")}>
                      <div className="flex items-center justify-between gap-3"><div><p className="text-lg font-semibold">{item.code}</p><p className="text-sm text-muted-foreground">{item.name}</p></div>{state.pickupConfigurationId === item.id ? <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-5 text-primary" strokeWidth={2} /> : null}</div>
                      <p className="mt-3 text-sm text-muted-foreground">{item.description ?? `${item.pickupCount} pickup configuration`}</p>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs">{item.hasNeck ? <span className="rounded-full bg-muted px-2 py-1">Neck</span> : null}{item.hasMiddle ? <span className="rounded-full bg-muted px-2 py-1">Middle</span> : null}{item.hasBridge ? <span className="rounded-full bg-muted px-2 py-1">Bridge</span> : null}</div>
                    </button>
                  ))}
                </div>
                {!filteredPickups.length ? <p className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">No pickup layouts match your search.</p> : null}
              </div>
            ) : null}

            {step === 1 ? (
              <div className="space-y-4">
                <SearchBox value={switchQuery} onChange={setSwitchQuery} placeholder="Search switches: 5-way, toggle, blade, DPDT..." />
                <div className="grid gap-3 md:grid-cols-2">
                  {filteredSwitches.map((item) => (
                    <button key={item.id} type="button" onClick={() => updateState({ switchTypeId: item.id })} className={cn("rounded-2xl border p-4 text-left transition hover:border-primary/50 hover:bg-primary/5", state.switchTypeId === item.id && "border-primary bg-primary/10 ring-2 ring-primary/15")}>
                      <div className="flex items-center justify-between gap-3"><p className="font-semibold">{item.name}</p>{state.switchTypeId === item.id ? <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-5 text-primary" strokeWidth={2} /> : null}</div>
                      <p className="mt-2 text-sm text-muted-foreground">{item.description ?? "Switch option"}</p>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-muted px-2 py-1">{item.positionCount} positions</span><span className="rounded-full bg-muted px-2 py-1">{item.poleCount} poles</span><span className="rounded-full bg-muted px-2 py-1">{item.lugCount} lugs</span></div>
                    </button>
                  ))}
                </div>
                {!filteredSwitches.length ? <p className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">No switch types match your search.</p> : null}
              </div>
            ) : null}

            {step === 2 ? (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 rounded-2xl border p-4"><label className="text-sm font-medium">Volume controls</label><Input type="number" min={0} max={4} value={state.volumeCount} onChange={(event) => updateState({ volumeCount: clamp(Number(event.target.value), 0, 4) })} /><p className="text-xs text-muted-foreground">Usually 1 for Strat/Tele setups, 2 for Les Paul/HH wiring.</p></div>
                <div className="space-y-2 rounded-2xl border p-4"><label className="text-sm font-medium">Tone controls</label><Input type="number" min={0} max={4} value={state.toneCount} onChange={(event) => updateState({ toneCount: clamp(Number(event.target.value), 0, 4) })} /><p className="text-xs text-muted-foreground">More tone controls add flexibility but increase wiring density.</p></div>
                <div className="space-y-2 rounded-2xl border p-4"><label className="text-sm font-medium">Skill level</label><AppSelect value={state.experience} onValueChange={(value) => updateState({ experience: value as ExperienceLevel })} options={[{ label: "Beginner", value: "beginner" }, { label: "Intermediate", value: "intermediate" }, { label: "Advanced", value: "advanced" }]} /></div>
                <div className="space-y-2 rounded-2xl border p-4"><label className="text-sm font-medium">Tone goal</label><AppSelect value={state.toneGoal} onValueChange={(value) => updateState({ toneGoal: value as ToneGoal })} options={toneGoals.map((goal) => ({ label: goal.label, value: goal.value }))} /><p className="text-xs text-muted-foreground">{toneGoals.find((goal) => goal.value === state.toneGoal)?.description}</p></div>
              </div>
            ) : null}

            {step === 3 ? (
              <div className="space-y-4">
                <SearchBox value={modQuery} onChange={setModQuery} placeholder="Search mods: coil split, series, phase, push-pull..." />
                <div className="grid gap-3 md:grid-cols-2">
                  {filteredMods.map((item) => (
                    <button key={item.id} type="button" onClick={() => toggleMod(item.id)} className={cn("rounded-2xl border p-4 text-left transition hover:border-primary/50 hover:bg-primary/5", state.selectedModIds.includes(item.id) && "border-primary bg-primary/10 ring-2 ring-primary/15")}>
                      <div className="flex items-center justify-between gap-3"><p className="font-semibold">{item.name}</p>{state.selectedModIds.includes(item.id) ? <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-5 text-primary" strokeWidth={2} /> : null}</div>
                      <p className="mt-2 text-sm text-muted-foreground">{item.description ?? "Optional wiring mod"}</p>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs">{item.difficultyLevel ? <span className="rounded-full bg-muted px-2 py-1">{item.difficultyLevel}</span> : null}{item.requiresPushPull ? <span className="rounded-full bg-muted px-2 py-1">Push-pull</span> : null}{item.requiresMiniToggle ? <span className="rounded-full bg-muted px-2 py-1">Mini toggle</span> : null}{item.requiresSpecialSwitch ? <span className="rounded-full bg-muted px-2 py-1">Special switch</span> : null}</div>
                    </button>
                  ))}
                </div>
                {!filteredMods.length ? <p className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">No mods match your search.</p> : null}
                <div className="space-y-2 rounded-2xl border p-4"><label className="text-sm font-medium">Additional notes</label><textarea value={state.notes} onChange={(event) => updateState({ notes: event.target.value })} placeholder="Example: warmer neck tone, high-output bridge, live-performance friendly switching..." className="min-h-24 w-full rounded-xl border border-input bg-input/20 px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 dark:bg-input/30" /></div>
              </div>
            ) : null}

            {step === 4 ? (
              <div className="space-y-5">
                <div className={cn("rounded-2xl border p-4", difficulty.bg)}><p className="text-sm text-muted-foreground">Estimated complexity</p><p className={cn("text-3xl font-semibold", difficulty.tone)}>{difficulty.label}</p><p className="mt-1 text-sm text-muted-foreground">Score {difficulty.score}. Use this as a rough difficulty guide before building or sending it to a guitar tech.</p></div>
                <div className="rounded-2xl border p-4"><p className="font-semibold">Wiring recommendation</p><ul className="mt-3 space-y-2 text-sm text-muted-foreground">{recommendations.map((item) => <li key={item} className="flex gap-2"><span className="mt-1 size-1.5 rounded-full bg-primary" /> <span>{item}</span></li>)}</ul></div>
                <div className="rounded-2xl border p-4"><div className="flex items-center justify-between gap-3"><p className="font-semibold">Prompt for AI Import</p><Button type="button" size="sm" variant="outline" onClick={copyPrompt}><HugeiconsIcon icon={Copy01Icon} className="size-4" strokeWidth={2} /> {copied ? "Copied" : "Copy"}</Button></div><pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap rounded-xl bg-muted p-4 text-xs text-muted-foreground">{aiPrompt}</pre></div>
              </div>
            ) : null}

            {draftError ? <p className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">{draftError}</p> : null}

            <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
              <Button type="button" variant="outline" disabled={step === 0} onClick={() => setStep((current) => Math.max(0, current - 1))}><HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" strokeWidth={2} /> Back</Button>
              <div className="flex flex-col gap-2 sm:flex-row">
                {step === 4 ? (
                  <>
                    <Button asChild variant="outline"><Link href="/ai/diagram-import">Open AI Import</Link></Button>
                    <Button type="button" onClick={createBuilderDraft} disabled={isCreatingDraft}>
                      {isCreatingDraft ? "Creating Draft..." : "Generate Builder Draft"}
                    </Button>
                  </>
                ) : (
                  <Button type="button" onClick={() => setStep((current) => Math.min(steps.length - 1, current + 1))}>Next <HugeiconsIcon icon={ArrowRight01Icon} className="size-4" strokeWidth={2} /></Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <aside className="space-y-4">
          <Card className="sticky top-4 rounded-3xl">
            <CardHeader><CardTitle className="text-lg">Live Summary</CardTitle><CardDescription>Your setup summary updates automatically while you complete the wizard.</CardDescription></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="rounded-2xl border p-3"><p className="text-muted-foreground">Pickup</p><p className="font-semibold">{selectedPickup ? `${selectedPickup.code} — ${selectedPickup.name}` : "Not selected"}</p></div>
              <div className="rounded-2xl border p-3"><p className="text-muted-foreground">Switch</p><p className="font-semibold">{selectedSwitch?.name ?? "Not selected"}</p></div>
              <div className="rounded-2xl border p-3"><p className="text-muted-foreground">Controls</p><p className="font-semibold">{state.volumeCount} Volume / {state.toneCount} Tone</p></div>
              <div className="rounded-2xl border p-3"><p className="text-muted-foreground">Mods</p><p className="font-semibold">{selectedMods.length ? selectedMods.map((mod) => mod.name).join(", ") : "None"}</p></div>
              <div className={cn("rounded-2xl border p-3", difficulty.bg)}><p className="text-muted-foreground">Complexity</p><p className={cn("font-semibold", difficulty.tone)}>{difficulty.label}</p></div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </main>
  );
}
