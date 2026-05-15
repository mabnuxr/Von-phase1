import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X as XIcon,
  Database as DatabaseIcon,
  Phone as PhoneIcon,
  EnvelopeSimple as EnvelopeSimpleIcon,
} from "@phosphor-icons/react";
import { INTEGRATION_METADATA } from "../../constants/integrationMetadata";

// Local fork of `@vonlabs/design-components`'s `DataSources` pill-and-drawer.
// Identical visual behavior (pill trigger → slide-in panel) but adds support
// for call-recorder provider logos: when a source string contains the name
// of a known call recorder (e.g. "Gong calls", "fathom calls"), the matching
// provider's logo replaces the generic phone icon, and the label is
// prefixed with the provider name (e.g. "Gong Calls", "Fathom Calls").

// Call-recorder integrations we recognize. Engagement-only IDs (gongengage,
// outreachengage, salesloft_engagement) are intentionally excluded.
const CALL_RECORDER_IDS = [
  "gong",
  "fathom",
  "zoom",
  "chorus",
  "claricopilot",
  "attention",
  "jiminny",
  "outreach_kaia",
  "salesloft_recorder",
] as const;

function matchCallProvider(
  source: string,
): { name: string; logoPath: string } | null {
  const normalized = source.toLowerCase().replace(/[^a-z0-9]/g, "");
  // Longest-first so multi-token IDs (e.g. "outreach_kaia") beat shorter ones.
  const sorted = [...CALL_RECORDER_IDS].sort((a, b) => b.length - a.length);
  for (const id of sorted) {
    const normId = id.replace(/[^a-z0-9]/g, "");
    if (normId.length >= 3 && normalized.includes(normId)) {
      const meta = INTEGRATION_METADATA[id];
      if (meta) return { name: meta.name, logoPath: meta.logoPath };
    }
  }
  return null;
}

type ResolvedKind = "provider" | "calls" | "emails" | "crm" | "other";

interface ResolvedSource {
  key: string;
  label: string;
  kind: ResolvedKind;
  logoPath?: string;
  providerName?: string;
}

// When both the CRM (Salesforce) and Emails sources are present, fold them
// into a single row labelled "Salesforce and Emails" with the Salesforce
// icon — emails typically come from the same CRM source, so listing them
// twice is noise. If only one of the two is present, it's left as-is.
function mergeCrmAndEmails(rows: ResolvedSource[]): ResolvedSource[] {
  const hasCrm = rows.some((r) => r.kind === "crm");
  const hasEmails = rows.some((r) => r.kind === "emails");
  if (!hasCrm || !hasEmails) return rows;
  return rows
    .filter((r) => r.kind !== "emails")
    .map((r) =>
      r.kind === "crm" ? { ...r, label: "Salesforce and Emails" } : r,
    );
}

function resolveSource(source: string): ResolvedSource {
  const provider = matchCallProvider(source);
  if (provider) {
    return {
      key: source,
      label: `${provider.name} Calls`,
      kind: "provider",
      logoPath: provider.logoPath,
      providerName: provider.name,
    };
  }
  const lower = source.toLowerCase();
  if (lower.includes("call"))
    return { key: source, label: "Calls", kind: "calls" };
  if (lower.includes("email"))
    return { key: source, label: "Emails", kind: "emails" };
  if (lower.includes("crm"))
    return { key: source, label: "Salesforce", kind: "crm" };
  return {
    key: source,
    label: source.charAt(0).toUpperCase() + source.slice(1),
    kind: "other",
  };
}

// Inline Salesforce SVG — keeps the CRM chip looking identical to the
// design-system version, which uses the same mark.
function SalesforceLogo({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 273 191"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        d="m113 21.3c8.78-9.14 21-14.8 34.5-14.8 18 0 33.6 10 42 24.9a58 58 0 0 1 23.7-5.05c32.4 0 58.7 26.5 58.7 59.2s-26.3 59.2-58.7 59.2c-3.96 0-7.82-0.398-11.6-1.15-7.35 13.1-21.4 22-37.4 22a42.7 42.7 0 0 1-18.8-4.32c-7.45 17.5-24.8 29.8-45 29.8-21.1 0-39-13.3-45.9-32a45.1 45.1 0 0 1-9.34 0.972c-25.1 0-45.4-20.6-45.4-45.9 0-17 9.14-31.8 22.7-39.8a52.6 52.6 0 0 1-4.35-21c0-29.2 23.7-52.8 52.9-52.8 17.1 0 32.4 8.15 42 20.8"
        fill="#00A1E0"
      />
    </svg>
  );
}

function SourceIcon({
  resolved,
  size = 14,
}: {
  resolved: ResolvedSource;
  size?: number;
}) {
  if (resolved.kind === "provider" && resolved.logoPath) {
    return (
      <img
        src={resolved.logoPath}
        alt=""
        className="object-contain"
        style={{ width: size, height: size }}
      />
    );
  }
  if (resolved.kind === "calls") {
    return <PhoneIcon size={size} weight="fill" className="text-gray-500" />;
  }
  if (resolved.kind === "emails") {
    return (
      <EnvelopeSimpleIcon size={size} weight="fill" className="text-gray-500" />
    );
  }
  if (resolved.kind === "crm") {
    return <SalesforceLogo size={size} />;
  }
  return (
    <div className="w-4 h-4 rounded bg-gray-200 flex items-center justify-center">
      <DatabaseIcon size={10} className="text-gray-500" />
    </div>
  );
}

interface AiFieldSourcesDrawerProps {
  sources: string[];
}

export function AiFieldSourcesDrawer({ sources }: AiFieldSourcesDrawerProps) {
  const [open, setOpen] = useState(false);

  if (!sources || sources.length === 0) return null;

  const resolved = mergeCrmAndEmails(sources.map(resolveSource));

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        title="View data sources"
        className="inline-flex items-center gap-1.5 h-[34px] px-2.5 bg-white text-gray-700 text-xs font-medium rounded-xl border border-gray-200/70 hover:bg-gray-50 transition-colors cursor-pointer"
      >
        <div className="flex items-center">
          {resolved.slice(0, 3).map((r) => (
            <div
              key={r.key}
              className="w-4 h-4 flex items-center justify-center shrink-0"
            >
              <SourceIcon resolved={r} size={14} />
            </div>
          ))}
        </div>
        <span>
          {resolved.length > 3 && `${resolved.length} `}
          {resolved.length === 1 ? "Source" : "Sources"}
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div
              className="absolute inset-0 z-20"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", duration: 0.25, bounce: 0.05 }}
              className="absolute right-0 top-0 bottom-0 z-30 w-[240px] bg-white border-l border-gray-100 shadow-lg flex flex-col"
            >
              <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-900">
                  Data Sources
                </span>
                <button
                  onClick={() => setOpen(false)}
                  className="w-5 h-5 flex items-center justify-center rounded text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                  aria-label="Close data sources"
                >
                  <XIcon size={11} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-2">
                {resolved.map((r) => (
                  <div key={r.key} className="mb-2.5 last:mb-0">
                    <div className="flex items-center gap-2 px-3 py-1">
                      <SourceIcon resolved={r} size={14} />
                      <span className="text-sm font-medium text-gray-900">
                        {r.label}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
