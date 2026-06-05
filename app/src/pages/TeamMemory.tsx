/**
 * Team Memory — /settings/memory/team
 * Matches the chrome of Org Memory / User Memory exactly.
 * All data from prototypeData.ts. Four demo states toggled in top-right.
 */

import { useState } from "react";
import {
  UsersFourIcon,
  CaretDownIcon,
  PencilSimpleIcon,
  BrainIcon,
  LockSimpleIcon,
  PaperclipIcon,
  SparkleIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import { useAuthCheck } from "../hooks/useAuthCheck";
import { SettingsLayout } from "../components/SettingsLayout";
import { TEAMS } from "../mocks/prototypeData";

// ─── Mock data ────────────────────────────────────────────────────────────────

type TeamKey = keyof typeof TEAMS;

const TEAM_LIST: Array<{ key: TeamKey; updatedLabel: string }> = [
  { key: "enterpriseSales", updatedLabel: "Updated Jun 2, 2026" },
  { key: "customerSuccess",  updatedLabel: "Updated May 28, 2026" },
  { key: "sdrTeam",          updatedLabel: "Updated Apr 14, 2026" },
];

interface MemoryEntry {
  id: string;
  title: string;
  context: string;
  content: string;
}

const ENTRIES: MemoryEntry[] = [
  {
    id: "m1",
    title: "Discounting rules",
    context: "Use when a rep asks about discount approval on a Sales deal.",
    content:
      "Discount approvals over 20% route to Elena Vasquez. Anything over 35% needs VP sign-off. Standard list price holds below 10%.",
  },
  {
    id: "m2",
    title: "MEDDPICC fields",
    context: "Use when qualifying an enterprise opportunity.",
    content:
      "All enterprise deals require M, E, D, and Champion filled before Stage 3. Missing fields block forecast inclusion.",
  },
  {
    id: "m3",
    title: "Deal desk routing",
    context: "Use when a deal requires non-standard terms or pricing.",
    content:
      "Deals over $100k ARR or with custom MSA terms go through deal desk. SLA is 2 business days. Tag #deal-desk in Slack with the opportunity link.",
  },
];

// ─── Demo state type ──────────────────────────────────────────────────────────

type DemoState = "pick" | "populated" | "empty" | "viewonly";

const DEMO_STATES: Array<{ id: DemoState; label: string }> = [
  { id: "pick",      label: "Pick a team" },
  { id: "populated", label: "Populated" },
  { id: "empty",     label: "Empty" },
  { id: "viewonly",  label: "View only" },
];

// ─── Toggle (matches People / Teams pattern) ──────────────────────────────────

function DemoToggleCycle({
  current,
  options,
  onChange,
}: {
  current: DemoState;
  options: typeof DEMO_STATES;
  onChange: (s: DemoState) => void;
}) {
  const idx = options.findIndex((o) => o.id === current);
  const next = options[(idx + 1) % options.length];
  return (
    <button
      onClick={() => onChange(next.id)}
      className="inline-flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer"
    >
      <span className="font-medium text-gray-700">{options[idx].label}</span>
      <span className="text-gray-300">→</span>
      <span>{next.label}</span>
    </button>
  );
}

// ─── Team switcher dropdown ───────────────────────────────────────────────────

function TeamSwitcher({
  selectedKey,
  onSelect,
}: {
  selectedKey: TeamKey;
  onSelect: (k: TeamKey) => void;
}) {
  const [open, setOpen] = useState(false);
  const team = TEAMS[selectedKey];
  const updatedLabel = TEAM_LIST.find((t) => t.key === selectedKey)?.updatedLabel ?? "";

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex flex-col gap-0.5 px-3 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors cursor-pointer text-left w-64"
      >
        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Team</span>
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-gray-900">{team.name}</span>
          <CaretDownIcon size={13} className="text-gray-400 flex-shrink-0" />
        </div>
        <span className="text-xs text-gray-400">{updatedLabel}</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full mt-1 left-0 z-20 w-64 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
            {TEAM_LIST.map(({ key, updatedLabel: upd }) => {
              const t = TEAMS[key];
              const isActive = key === selectedKey;
              return (
                <button
                  key={key}
                  onClick={() => { onSelect(key); setOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors cursor-pointer ${isActive ? "bg-gray-50" : "hover:bg-gray-50"}`}
                >
                  <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
                    <UsersFourIcon size={13} className="text-violet-600" weight="fill" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{t.name}</p>
                    <p className="text-xs text-gray-400">{upd}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ─── "Pick a team" state ──────────────────────────────────────────────────────

function PickTeamState({ onPick }: { onPick: (k: TeamKey) => void }) {
  return (
    <div className="flex flex-col items-center pt-12 px-6">
      <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center mb-4">
        <UsersFourIcon size={20} className="text-violet-600" weight="fill" />
      </div>
      <p className="text-base font-semibold text-gray-900 mb-1">Choose a team</p>
      <p className="text-sm text-gray-400 text-center mb-8 max-w-xs">
        You belong to multiple teams — choose whose memory to open.
      </p>
      <div className="w-full max-w-sm space-y-2">
        {TEAM_LIST.map(({ key, updatedLabel }) => {
          const t = TEAMS[key];
          return (
            <button
              key={key}
              onClick={() => onPick(key)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors cursor-pointer text-left group"
            >
              <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
                <UsersFourIcon size={15} className="text-violet-600" weight="fill" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{t.name}</p>
                <p className="text-xs text-gray-400">{updatedLabel}</p>
              </div>
              <CaretDownIcon size={13} className="text-gray-300 -rotate-90 group-hover:text-gray-500 transition-colors" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Entry list (left column) ─────────────────────────────────────────────────

function EntryList({
  entries,
  selectedId,
  onSelect,
  onNew,
  viewOnly,
}: {
  entries: MemoryEntry[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  viewOnly: boolean;
}) {
  return (
    <div className="flex flex-col h-full w-full">
      {/* New button */}
      <div className="px-2 py-2 border-b border-gray-100">
        <button
          onClick={onNew}
          disabled={viewOnly}
          className="w-full py-2 flex items-center justify-center gap-2 rounded-xl bg-gray-900 text-white text-sm transition-all duration-200 cursor-pointer hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          + New Team Memory
        </button>
      </div>

      {/* List */}
      <div className="flex-1 min-h-0 overflow-y-auto settings-scrollbar">
        <div className="pl-1 py-1 pr-2 flex flex-col gap-0.5">
          {entries.length === 0 ? (
            <div className="px-3 py-8 text-sm text-gray-400 text-center">
              No team memories yet
            </div>
          ) : (
            entries.map((entry) => {
              const isSelected = entry.id === selectedId;
              return (
                <div
                  key={entry.id}
                  onClick={() => onSelect(entry.id)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-xl cursor-pointer transition-colors duration-150 border ${
                    isSelected
                      ? "bg-white border-gray-200/60"
                      : "bg-transparent border-transparent hover:bg-white hover:border-gray-200/40"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="flex-1 min-w-0 text-sm text-gray-900 truncate">{entry.title}</span>
                    {viewOnly && (
                      <LockSimpleIcon size={11} className="text-gray-300 flex-shrink-0" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Entry detail (right column) ─────────────────────────────────────────────

function EntryDetail({
  entry,
  canEdit,
}: {
  entry: MemoryEntry;
  canEdit: boolean;
}) {
  const teamName = TEAMS.enterpriseSales.name;

  return (
    <div className="flex flex-col h-full w-full min-w-0 relative">
      {/* Edit in chat — top right, only for admins */}
      {canEdit && (
        <div className="absolute top-3 right-3 z-10">
          <button className="h-8 inline-flex items-center gap-1.5 px-2.5 rounded-xl bg-white border border-gray-200/80 shadow-xs text-sm text-gray-900 hover:bg-gray-50 transition-colors cursor-pointer">
            <PencilSimpleIcon size={14} weight="regular" />
            Edit in chat
          </button>
        </div>
      )}

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto settings-scrollbar p-6">
        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-900 pr-32 mb-6">{entry.title}</h3>

        {/* View-only banner */}
        {!canEdit && (
          <div className="flex items-start gap-2.5 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl mb-6 text-sm text-amber-800">
            <WarningCircleIcon size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <span>
              Editing needs the Team Admin role for {teamName}, or the workspace Admin tier.
            </span>
          </div>
        )}

        {/* Context */}
        <div className="space-y-1.5 mb-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
            When should the agent use this?
          </p>
          <p className="text-sm text-gray-600 leading-relaxed">{entry.context}</p>
        </div>

        {/* Attachments */}
        <div className="space-y-1.5 mb-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
            Attachments
          </p>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <PaperclipIcon size={14} />
            No files attached
          </div>
        </div>

        {/* Memory content */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
            Memory Content
          </p>
          <div className="bg-gray-50/60 rounded-xl p-4">
            <ul className="space-y-1.5">
              {entry.content.split(". ").filter(Boolean).map((line, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="w-1 h-1 rounded-full bg-gray-400 flex-shrink-0 mt-[7px]" />
                  {line.endsWith(".") ? line : `${line}.`}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Empty team memory state (right area) ────────────────────────────────────

function EmptyDetailState({ teamName }: { teamName: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-8 text-center">
      <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-4">
        <BrainIcon size={22} className="text-gray-400" weight="regular" />
      </div>
      <p className="text-base font-semibold text-gray-900 mb-1.5">No team memory yet</p>
      <p className="text-sm text-gray-400 max-w-xs leading-relaxed mb-5">
        Team Admins add the first memory for {teamName} — tell Von what the team should always know.
      </p>
      <button className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors cursor-pointer">
        <SparkleIcon size={14} weight="fill" />
        Add memory in chat
      </button>
    </div>
  );
}

// ─── No-entry selected placeholder ───────────────────────────────────────────

function NoEntrySelected() {
  return (
    <div className="flex items-center justify-center h-full text-sm text-gray-400">
      Select a memory entry to view details
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function TeamMemory() {
  useAuthCheck();

  const [demoState, setDemoState] = useState<DemoState>("populated");
  const [selectedTeamKey, setSelectedTeamKey] = useState<TeamKey>("enterpriseSales");
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>("m1");

  const selectedTeam = TEAMS[selectedTeamKey];
  const canEdit = demoState === "populated";
  const entries: MemoryEntry[] = demoState === "empty" ? [] : ENTRIES;
  const selectedEntry = entries.find((e) => e.id === selectedEntryId) ?? null;

  return (
    <SettingsLayout activeId="memory-team">
      <div className="flex flex-col h-full p-2">
        {/* Page header — matches OrgContextTabV2 exactly */}
        <div className="px-4 pt-4 pb-6 border-b border-gray-100 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Team Memory</h2>
            <p className="text-sm text-gray-600">
              Context shared within a specific team — visible only to its members
            </p>
          </div>
          {/* Demo state toggle */}
          <DemoToggleCycle
            current={demoState}
            options={DEMO_STATES}
            onChange={setDemoState}
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto settings-scrollbar px-6">
          <div className="pt-6 pb-12 w-full max-w-4xl mx-auto">

            {/* State: pick a team */}
            {demoState === "pick" && (
              <PickTeamState
                onPick={(k) => {
                  setSelectedTeamKey(k);
                  setDemoState("populated");
                }}
              />
            )}

            {/* States: populated / empty / viewonly */}
            {demoState !== "pick" && (
              <div className="space-y-4">
                {/* Team switcher */}
                <TeamSwitcher
                  selectedKey={selectedTeamKey}
                  onSelect={(k) => {
                    setSelectedTeamKey(k);
                    setSelectedEntryId(entries[0]?.id ?? null);
                  }}
                />

                {/* Two-column memory card — matches org memory card structure */}
                <div className="w-full bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden">
                  <div className="flex w-full h-[calc(100vh-280px)]">
                    {/* Left — entry list */}
                    <div className="w-60 h-full border-r border-gray-100/80 bg-gradient-to-b from-slate-50/50 to-gray-50/30 flex-shrink-0 flex flex-col">
                      <EntryList
                        entries={entries}
                        selectedId={selectedEntryId}
                        onSelect={setSelectedEntryId}
                        onNew={() => {}}
                        viewOnly={demoState === "viewonly"}
                      />
                    </div>

                    {/* Right — detail */}
                    <div className="flex-1 w-0 flex flex-col min-w-0 bg-white/50">
                      {demoState === "empty" ? (
                        <EmptyDetailState teamName={selectedTeam.name} />
                      ) : selectedEntry ? (
                        <EntryDetail entry={selectedEntry} canEdit={canEdit} />
                      ) : (
                        <NoEntrySelected />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </SettingsLayout>
  );
}
