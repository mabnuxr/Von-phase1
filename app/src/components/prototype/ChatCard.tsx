/**
 * ChatCard — inline card component for the chat message stream.
 * Variants: approval | summary | diff | status
 */

import { CheckIcon, XIcon, WarningCircleIcon, CheckCircleIcon } from "@phosphor-icons/react";

// ─── Shared types ─────────────────────────────────────────────────────────────

export type RoleBadgeType = "Admin" | "Member";

export interface PersonItem {
  name: string;
  email: string;
  role: RoleBadgeType;
  status?: string;
}

export interface SummaryLine {
  text: string;
  tone: "success" | "warning" | "neutral";
}

export interface DiffItem {
  name: string;
  email: string;
  changeType: "added" | "removed" | "changed";
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function Initials({ name }: { name: string }) {
  const parts = name.trim().split(" ");
  const letters = parts.length >= 2
    ? parts[0][0] + parts[parts.length - 1][0]
    : name.slice(0, 2);
  return (
    <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
      <span className="text-[11px] font-semibold text-gray-600 uppercase">
        {letters}
      </span>
    </div>
  );
}

function RoleBadge({ role }: { role: RoleBadgeType }) {
  if (role === "Admin") {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-gray-900 text-white">
        Admin
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-white border border-gray-300 text-gray-600">
      Member
    </span>
  );
}

// ─── Card shell ───────────────────────────────────────────────────────────────

function CardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-xs max-w-sm w-full">
      {children}
    </div>
  );
}

// ─── Approval variant ─────────────────────────────────────────────────────────

export interface ApprovalCardProps {
  variant: "approval";
  title: string;
  items: PersonItem[];
  onApprove: () => void;
  onDiscard: () => void;
}

function ApprovalCard({ title, items, onApprove, onDiscard }: Omit<ApprovalCardProps, "variant">) {
  return (
    <CardShell>
      {/* Needs approval indicator */}
      <div className="flex items-center gap-1.5 mb-3">
        <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
        <span className="text-xs font-medium text-amber-700">Needs approval</span>
      </div>

      {/* Title */}
      <p className="text-sm font-semibold text-gray-900 mb-3">{title}</p>

      {/* Items */}
      <div className="space-y-2 mb-4">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2.5">
            <Initials name={item.name} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-900 truncate">{item.name}</p>
              <p className="text-xs text-gray-500 truncate">{item.email}</p>
            </div>
            <RoleBadge role={item.role} />
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-3 border-t border-gray-100">
        <button
          onClick={onApprove}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
        >
          <CheckIcon size={13} weight="bold" />
          Approve
        </button>
        <button
          onClick={onDiscard}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
        >
          <XIcon size={13} weight="bold" />
          Discard
        </button>
      </div>
    </CardShell>
  );
}

// ─── Summary variant ──────────────────────────────────────────────────────────

export interface SummaryCardProps {
  variant: "summary";
  title: string;
  lines: SummaryLine[];
}

const TONE_DOT: Record<SummaryLine["tone"], string> = {
  success: "bg-green-500",
  warning: "bg-amber-400",
  neutral: "bg-gray-300",
};

const TONE_TEXT: Record<SummaryLine["tone"], string> = {
  success: "text-gray-700",
  warning: "text-amber-700",
  neutral: "text-gray-500",
};

function SummaryCard({ title, lines }: Omit<SummaryCardProps, "variant">) {
  return (
    <CardShell>
      <p className="text-sm font-semibold text-gray-900 mb-3">{title}</p>
      <div className="space-y-2">
        {lines.map((line, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${TONE_DOT[line.tone]}`} />
            <span className={`text-xs ${TONE_TEXT[line.tone]}`}>{line.text}</span>
          </div>
        ))}
      </div>
    </CardShell>
  );
}

// ─── Diff variant ─────────────────────────────────────────────────────────────

export interface DiffCardProps {
  variant: "diff";
  title: string;
  items: DiffItem[];
}

const CHANGE_STYLES: Record<DiffItem["changeType"], { border: string; label: string; labelColor: string }> = {
  added:   { border: "border-l-2 border-l-green-400 pl-3",  label: "Added",   labelColor: "text-green-600" },
  removed: { border: "border-l-2 border-l-red-400 pl-3",    label: "Removed", labelColor: "text-red-600"   },
  changed: { border: "border-l-2 border-l-amber-400 pl-3",  label: "Changed", labelColor: "text-amber-600" },
};

function DiffCard({ title, items }: Omit<DiffCardProps, "variant">) {
  return (
    <CardShell>
      <p className="text-sm font-semibold text-gray-900 mb-3">{title}</p>
      <div className="space-y-2">
        {items.map((item, i) => {
          const style = CHANGE_STYLES[item.changeType];
          return (
            <div key={i} className={`${style.border} py-1`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-900">{item.name}</p>
                  <p className="text-xs text-gray-500">{item.email}</p>
                </div>
                <span className={`text-[11px] font-medium ${style.labelColor}`}>
                  {style.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </CardShell>
  );
}

// ─── Status variant ───────────────────────────────────────────────────────────

export interface StatusCardProps {
  variant: "status";
  message: string;
  tone: "success" | "error";
}

function StatusCard({ message, tone }: Omit<StatusCardProps, "variant">) {
  const isSuccess = tone === "success";
  return (
    <CardShell>
      <div className="flex items-center gap-2.5">
        {isSuccess ? (
          <CheckCircleIcon size={18} weight="fill" className="text-green-500 flex-shrink-0" />
        ) : (
          <WarningCircleIcon size={18} weight="fill" className="text-red-500 flex-shrink-0" />
        )}
        <span className={`text-sm font-medium ${isSuccess ? "text-gray-900" : "text-red-700"}`}>
          {message}
        </span>
      </div>
    </CardShell>
  );
}

// ─── Bulk summary variant ─────────────────────────────────────────────────────

export interface BulkSummaryCardProps {
  variant: "bulk-summary";
  stats: Array<{ text: string; dot: "green" | "amber" }>;
  flagged: Array<{ email: string; reason: string }>;
}

function BulkSummaryCard({ stats, flagged }: Omit<BulkSummaryCardProps, "variant">) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-xs max-w-sm w-full overflow-hidden">
      <div className="p-4 space-y-2">
        {stats.map((s, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${s.dot === "green" ? "bg-green-500" : "bg-amber-400"}`} />
            <span className="text-xs text-gray-700">{s.text}</span>
          </div>
        ))}
      </div>
      {flagged.length > 0 && (
        <div className="border-t border-amber-100 bg-amber-50/60 px-4 py-3 space-y-2">
          {flagged.map((f, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 bg-amber-400" />
              <span className="text-xs text-gray-600 leading-relaxed">
                <span className="font-medium text-gray-700">{f.email}</span>
                {" — "}{f.reason}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Union export ─────────────────────────────────────────────────────────────

export type ChatCardProps =
  | ApprovalCardProps
  | SummaryCardProps
  | DiffCardProps
  | StatusCardProps
  | BulkSummaryCardProps;

export function ChatCard(props: ChatCardProps) {
  switch (props.variant) {
    case "approval":
      return <ApprovalCard title={props.title} items={props.items} onApprove={props.onApprove} onDiscard={props.onDiscard} />;
    case "summary":
      return <SummaryCard title={props.title} lines={props.lines} />;
    case "diff":
      return <DiffCard title={props.title} items={props.items} />;
    case "status":
      return <StatusCard message={props.message} tone={props.tone} />;
    case "bulk-summary":
      return <BulkSummaryCard stats={props.stats} flagged={props.flagged} />;
  }
}
