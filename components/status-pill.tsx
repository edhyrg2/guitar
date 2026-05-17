type StatusPillProps = {
  label: string;
  tone?: "primary" | "muted";
};

export function StatusPill({
  label,
  tone = "muted",
}: StatusPillProps) {
  const classes =
    tone === "primary"
      ? "bg-primary text-primary-foreground"
      : "bg-muted text-muted-foreground";

  return (
    <span
      className={`inline-flex h-6 items-center rounded-md px-2 text-xs font-medium ${classes}`}
    >
      {label}
    </span>
  );
}
