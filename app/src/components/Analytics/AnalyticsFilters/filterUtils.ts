export function formatDisplayValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "";
  if (Array.isArray(value)) return (value as string[]).join(", ");
  if (typeof value === "object" && value !== null) {
    const obj = value as Record<string, unknown>;
    if ("start" in obj || "end" in obj) {
      const { start, end } = obj as { start?: string; end?: string };
      if (start && end) return `${start} – ${end}`;
      return start ?? end ?? "";
    }
    if ("min" in obj || "max" in obj) {
      const { min, max } = obj as { min?: number; max?: number };
      if (min != null && max != null) return `${min} – ${max}`;
      return String(min ?? max ?? "");
    }
  }
  return String(value);
}
