/**
 * TeamDetailPanel — standalone right panel for team creation / inspection.
 * Completely independent of RightPanel.
 */

import { useState } from "react";
import {
  XIcon,
  UsersFourIcon,
  SparkleIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CaretDownIcon,
  CaretRightIcon,
  LockSimpleIcon,
  StarIcon,
  CheckIcon,
} from "@phosphor-icons/react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FilterCondition {
  field: string;
  operator: string;
  value: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  sfRole?: string;
  isTeamAdmin: boolean;
  joinSource: "Salesforce sync" | "Manual" | "AI-created";
}

export interface TeamDetailData {
  name: string;
  description: string;
  filterConditions: FilterCondition[];
  members: TeamMember[];
  suggestedAdmin: string;
  provenance: string;
}

export interface TeamDetailPanelProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "review" | "inspect";
  team: TeamDetailData;
  /** Render as an inline column instead of a fixed overlay panel */
  inline?: boolean;
  /** Show the X close button even in inline mode (for persistent side-by-side panes) */
  persistentClose?: boolean;
  /** Override the status badge label/color — used by prototype scenarios */
  statusOverride?: "draft" | "active";
  /** Start the filter block expanded */
  defaultFilterExpanded?: boolean;
  /** Called when "Commit & next" is clicked */
  onCommit?: () => void;
}

// ─── Avatar color hash ────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  "bg-violet-100 text-violet-700",
  "bg-blue-100 text-blue-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-cyan-100 text-cyan-700",
  "bg-orange-100 text-orange-700",
  "bg-indigo-100 text-indigo-700",
];

function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function initials(name: string): string {
  const parts = name.trim().split(" ");
  return (parts.length >= 2 ? parts[0][0] + parts[parts.length - 1][0] : name.slice(0, 2))
    .toUpperCase();
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TabBar({ active, onChange }: { active: "overview" | "activity"; onChange: (t: "overview" | "activity") => void }) {
  return (
    <div className="flex border-b border-gray-100 px-5">
      {(["overview", "activity"] as const).map((tab) => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={`relative pb-2.5 pt-1 mr-6 text-sm font-medium capitalize transition-colors cursor-pointer ${
            active === tab ? "text-gray-900" : "text-gray-400 hover:text-gray-600"
          }`}
        >
          {tab.charAt(0).toUpperCase() + tab.slice(1)}
          {active === tab && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 rounded-full" />
          )}
        </button>
      ))}
    </div>
  );
}

function SectionLabel({ label, count }: { label: string; count?: number }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">
        {label}
      </span>
      {count !== undefined && (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-500">
          {count}
        </span>
      )}
    </div>
  );
}

function FilterBlock({ conditions, initialExpanded = false }: { conditions: FilterCondition[]; initialExpanded?: boolean }) {
  const [expanded, setExpanded] = useState(initialExpanded);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Header row */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-2.5 px-3.5 py-3 hover:bg-gray-50 transition-colors cursor-pointer text-left"
      >
        {expanded
          ? <CaretDownIcon size={13} className="text-gray-400 flex-shrink-0" />
          : <CaretRightIcon size={13} className="text-gray-400 flex-shrink-0" />
        }
        <FunnelIcon size={14} className="text-gray-500 flex-shrink-0" />
        <span className="flex-1 text-sm text-gray-700 font-medium">
          Member identification filter
        </span>
        <span className="text-[11px] font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
          {conditions.length} condition{conditions.length !== 1 ? "s" : ""}
        </span>
        <span className="flex items-center gap-1 text-[11px] text-gray-400 ml-2">
          <LockSimpleIcon size={11} />
          read-only
        </span>
      </button>

      {/* Expanded conditions */}
      {expanded && (
        <div className="px-4 pb-4 pt-2 border-t border-gray-100 space-y-2">
          {conditions.map((c, i) => (
            <div key={i}>
              {i > 0 && (
                <div className="flex items-center gap-2 my-2">
                  <div className="flex-1 h-px bg-gray-100" />
                  <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">AND</span>
                  <div className="flex-1 h-px bg-gray-100" />
                </div>
              )}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-violet-50 text-violet-700 border border-violet-200">
                  {c.field}
                </span>
                <span className="text-xs text-gray-500">{c.operator}</span>
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                  {c.value}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MemberRow({ member, onRemove }: { member: TeamMember; onRemove?: () => void }) {
  const color = avatarColor(member.name);

  return (
    <div className="flex items-center gap-2.5 py-2 px-1">
      {/* Avatar */}
      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-semibold ${color}`}>
        {initials(member.name)}
      </div>

      {/* Two-line text block */}
      <div className="flex-1 min-w-0">
        {/* Line 1: name */}
        <div className="flex items-center">
          <span className="text-sm font-medium text-gray-900 truncate">{member.name}</span>
        </div>
        {/* Line 2: email */}
        <p className="text-xs text-gray-400 truncate mt-0.5">{member.email}</p>
      </div>

      {/* Team Admin badge */}
      {member.isTeamAdmin && (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-600 border border-blue-200 flex-shrink-0">
          <StarIcon size={10} weight="fill" />
          Team Admin
        </span>
      )}

      {/* Remove button — review mode only, far right */}
      {onRemove && (
        <button
          onClick={onRemove}
          className="w-6 h-6 flex items-center justify-center rounded text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer flex-shrink-0"
        >
          <XIcon size={12} weight="bold" />
        </button>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function TeamDetailPanel({ isOpen, onClose, mode, team, inline, persistentClose, statusOverride, defaultFilterExpanded, onCommit }: TeamDetailPanelProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "activity">("overview");
  const [memberSearch, setMemberSearch] = useState("");
  const [members, setMembers] = useState<TeamMember[]>(team.members);

  const filteredMembers = memberSearch.trim()
    ? members.filter(
        (m) =>
          m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
          m.email.toLowerCase().includes(memberSearch.toLowerCase()),
      )
    : members;

  const isReview = mode === "review";

  // Resolve status badge from override or mode
  const statusDot =
    statusOverride === "draft"   ? "bg-amber-400" :
    statusOverride === "active"  ? "bg-green-500" :
    isReview                     ? "bg-blue-500"  : "bg-green-500";
  const statusText =
    statusOverride === "draft"   ? "Draft" :
    statusOverride === "active"  ? "Active" :
    isReview                     ? "In Review" : "Active";
  const statusColor =
    statusOverride === "draft"   ? "text-amber-600" :
    statusOverride === "active"  ? "text-green-600" :
    isReview                     ? "text-blue-600"  : "text-green-600";

  const panelContent = (
    <>
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {/* Team icon */}
            <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
              <UsersFourIcon size={18} className="text-violet-600" weight="fill" />
            </div>
            {/* Name + status */}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{team.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusDot}`} />
                <span className={`text-xs font-medium ${statusColor}`}>{statusText}</span>
              </div>
            </div>
          </div>
          {(!inline || persistentClose) && (
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors cursor-pointer flex-shrink-0 ml-2"
            >
              <XIcon size={15} weight="bold" />
            </button>
          )}
        </div>

        {/* ── Tabs ───────────────────────────────────────────────────────── */}
        <TabBar active={activeTab} onChange={setActiveTab} />

        {/* ── Scrollable body ─────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {activeTab === "overview" ? (
            <div className="px-5 py-4 space-y-5">

              {/* Description */}
              <div>
                <SectionLabel label="Description" />
                <p className="text-sm text-gray-600 leading-relaxed">{team.description}</p>
              </div>

              {/* Member identification filter */}
              <div>
                <SectionLabel label="Member identification filter" />
                <FilterBlock conditions={team.filterConditions} initialExpanded={defaultFilterExpanded} />
              </div>

              {/* Members */}
              <div>
                <SectionLabel label="Members" count={filteredMembers.length} />

                {/* Search */}
                <div className="relative mb-3">
                  <MagnifyingGlassIcon
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                  <input
                    type="text"
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    placeholder="Search members..."
                    className="w-full pl-8 pr-3 py-2 text-sm text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-300 transition-all bg-white placeholder-gray-400"
                  />
                </div>

                {/* Member list — scrollable after 6 */}
                <div className="space-y-0.5 max-h-[272px] overflow-y-auto">
                  {filteredMembers.map((m) => (
                    <MemberRow
                      key={m.id}
                      member={m}
                      onRemove={isReview ? () => setMembers((prev) => prev.filter((x) => x.id !== m.id)) : undefined}
                    />
                  ))}
                  {filteredMembers.length === 0 && (
                    <p className="text-sm text-gray-400 py-3 text-center">No members match your search</p>
                  )}
                </div>

              </div>

              {/* Provenance footer */}
              <p className="text-[11px] text-gray-400 flex items-center gap-1.5">
                <span className="text-gray-300">✦</span>
                {team.provenance}
              </p>
            </div>
          ) : (
            <div className="px-5 py-8 flex flex-col items-center justify-center text-center">
              <p className="text-sm text-gray-400">No activity recorded yet.</p>
            </div>
          )}
        </div>

        {/* ── Sticky footer ───────────────────────────────────────────────── */}
        <div className="flex-shrink-0 border-t border-gray-200 px-5 py-3.5">
          {isReview ? (
            <div className="flex items-center gap-2">
              {/* Edit via chat */}
              <button className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                <SparkleIcon size={13} weight="fill" className="text-violet-500" />
                Edit via chat
              </button>
              {/* Spacer */}
              <div className="flex-1" />
              {/* Cancel */}
              <button
                onClick={onClose}
                className="px-3.5 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              {/* Commit & next */}
              <button
                onClick={onCommit}
                className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
              >
                <CheckIcon size={13} weight="bold" />
                Create team
              </button>
            </div>
          ) : (
            <div className="flex items-center">
              <button className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                <SparkleIcon size={13} weight="fill" className="text-violet-500" />
                Edit via chat
              </button>
            </div>
          )}
        </div>
    </>
  );

  // ── Inline rendering (static column, no overlay) ──────────────────────────

  if (inline) {
    return (
      <div className="w-[560px] flex-shrink-0 h-full bg-white border-l border-gray-200 flex flex-col overflow-hidden">
        {panelContent}
      </div>
    );
  }

  // ── Overlay rendering (slide-in panel with backdrop) ─────────────────────

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/25 transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />
      {/* Panel */}
      <div
        className={`fixed top-0 right-0 bottom-0 z-50 w-[560px] bg-white shadow-xl border-l border-gray-200 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {panelContent}
      </div>
    </>
  );
}
