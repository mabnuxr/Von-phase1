import { useState, useEffect, useRef } from "react";
import {
  XIcon,
  MagnifyingGlassIcon,
  CaretDownIcon,
  UsersFourIcon,
  LockSimpleIcon,
  GlobeSimpleIcon,
  LinkSimpleIcon,
  CheckIcon,
} from "@phosphor-icons/react";
import { WORKSPACE_MEMBERS, TEAMS } from "../../mocks/prototypeData";

// ─── Types ────────────────────────────────────────────────────────────────────

type DemoState = "user" | "team" | "team-reporting";
type AccessRole = "Owner" | "Editor" | "Viewer";
type GeneralAccess = "invited" | "workspace";

interface AccessEntry {
  id: string;
  type: "person" | "team" | "reporting";
  name: string;
  subtitle: string;
  role: AccessRole;
  isOwner?: boolean;
  teamAccessNote?: string;
  // Avatar
  avatarBg: string;
  avatarFg: string;
  avatarInitials: string;
  useTeamIcon?: boolean;
  teamIconColor?: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const AVATAR: Record<string, { bg: string; fg: string }> = {
  u1: { bg: "bg-amber-100",   fg: "text-amber-700" },
  u2: { bg: "bg-violet-100",  fg: "text-violet-700" },
  u3: { bg: "bg-blue-100",    fg: "text-blue-700" },
  u4: { bg: "bg-emerald-100", fg: "text-emerald-700" },
  u5: { bg: "bg-teal-100",    fg: "text-teal-700" },
  u6: { bg: "bg-rose-100",    fg: "text-rose-700" },
  u7: { bg: "bg-orange-100",  fg: "text-orange-700" },
  u8: { bg: "bg-indigo-100",  fg: "text-indigo-700" },
};

function initials(name: string) {
  const parts = name.trim().split(" ");
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

const SAM = WORKSPACE_MEMBERS.find((m) => m.id === "u1")!;
const ELENA = WORKSPACE_MEMBERS.find((m) => m.id === "u2")!;

const ES = TEAMS.enterpriseSales;
const CS = TEAMS.customerSuccess;

function personEntry(
  uid: string,
  role: AccessRole,
  extra?: Partial<AccessEntry>,
): AccessEntry {
  const m = WORKSPACE_MEMBERS.find((u) => u.id === uid)!;
  const av = AVATAR[uid];
  return {
    id: uid,
    type: "person",
    name: m.name,
    subtitle: m.sfRole,
    role,
    avatarBg: av.bg,
    avatarFg: av.fg,
    avatarInitials: initials(m.name),
    ...extra,
  };
}

const BASE_ENTRIES: Record<DemoState, AccessEntry[]> = {
  user: [
    personEntry("u1", "Owner", { isOwner: true }),
    personEntry("u2", "Editor"),
  ],
  team: [
    personEntry("u1", "Owner", { isOwner: true }),
    {
      id: "team-es",
      type: "team",
      name: ES.name,
      subtitle: "All current and future members",
      role: "Editor",
      avatarBg: "bg-violet-100",
      avatarFg: "text-violet-600",
      avatarInitials: "",
      useTeamIcon: true,
      teamIconColor: "text-violet-600",
    },
    personEntry("u2", "Editor", {
      teamAccessNote: `Also has access via ${ES.name} · Editor applies`,
    }),
  ],
  "team-reporting": [
    personEntry("u1", "Owner", { isOwner: true }),
    {
      id: "team-es",
      type: "team",
      name: ES.name,
      subtitle: "All current and future members",
      role: "Editor",
      avatarBg: "bg-violet-100",
      avatarFg: "text-violet-600",
      avatarInitials: "",
      useTeamIcon: true,
      teamIconColor: "text-violet-600",
    },
    {
      id: "reporting-sam",
      type: "reporting",
      name: `${SAM.name}'s team`,
      subtitle: "5 reports",
      role: "Viewer",
      avatarBg: "bg-amber-100",
      avatarFg: "text-amber-600",
      avatarInitials: "",
      useTeamIcon: true,
      teamIconColor: "text-amber-600",
    },
    {
      id: "team-cs",
      type: "team",
      name: CS.name,
      subtitle: "All current and future members",
      role: "Viewer",
      avatarBg: "bg-teal-100",
      avatarFg: "text-teal-600",
      avatarInitials: "",
      useTeamIcon: true,
      teamIconColor: "text-teal-600",
    },
  ],
};

// Search options ──────────────────────────────────────────────────────────────

interface SearchOption {
  id: string;
  section: "people" | "teams" | "managers";
  label: string;
  sublabel: string;
  avatarBg: string;
  avatarFg: string;
  avatarInitials: string;
  useTeamIcon?: boolean;
}

const SEARCH_OPTIONS: SearchOption[] = [
  ...WORKSPACE_MEMBERS.map((m) => ({
    id: m.id,
    section: "people" as const,
    label: m.name,
    sublabel: m.sfRole,
    avatarBg: AVATAR[m.id].bg,
    avatarFg: AVATAR[m.id].fg,
    avatarInitials: initials(m.name),
  })),
  {
    id: "team-es",
    section: "teams" as const,
    label: ES.name,
    sublabel: `${ES.memberCount} members`,
    avatarBg: "bg-violet-100",
    avatarFg: "text-violet-600",
    avatarInitials: "",
    useTeamIcon: true,
  },
  {
    id: "team-cs",
    section: "teams" as const,
    label: CS.name,
    sublabel: `${CS.memberCount} members`,
    avatarBg: "bg-teal-100",
    avatarFg: "text-teal-600",
    avatarInitials: "",
    useTeamIcon: true,
  },
  {
    id: "team-sdr",
    section: "teams" as const,
    label: TEAMS.sdrTeam.name,
    sublabel: `${TEAMS.sdrTeam.memberCount} member`,
    avatarBg: "bg-orange-100",
    avatarFg: "text-orange-600",
    avatarInitials: "",
    useTeamIcon: true,
  },
  {
    id: "reporting-sam",
    section: "managers" as const,
    label: `${SAM.name}'s team`,
    sublabel: "5 reports",
    avatarBg: "bg-amber-100",
    avatarFg: "text-amber-600",
    avatarInitials: "",
    useTeamIcon: true,
  },
  {
    id: "reporting-elena",
    section: "managers" as const,
    label: `${ELENA.name}'s team`,
    sublabel: "3 reports",
    avatarBg: "bg-violet-100",
    avatarFg: "text-violet-600",
    avatarInitials: "",
    useTeamIcon: true,
  },
];

const SECTION_LABELS: Record<string, string> = {
  people: "PEOPLE",
  teams: "TEAMS",
  managers: "MANAGER'S TEAM",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function Avatar({
  bg,
  fg,
  initials: inits,
  useTeamIcon,
  size = "md",
}: {
  bg: string;
  fg: string;
  initials: string;
  useTeamIcon?: boolean;
  size?: "sm" | "md";
}) {
  const sizeClass = size === "sm" ? "w-7 h-7" : "w-8 h-8";
  const textClass = size === "sm" ? "text-[11px]" : "text-xs";
  const iconSize = size === "sm" ? 13 : 14;
  return (
    <div
      className={`${sizeClass} rounded-full ${bg} flex items-center justify-center flex-shrink-0`}
    >
      {useTeamIcon ? (
        <UsersFourIcon size={iconSize} className={fg} weight="fill" />
      ) : (
        <span className={`${textClass} font-semibold ${fg}`}>{inits}</span>
      )}
    </div>
  );
}

function RoleDropdown({
  role,
  onSelect,
}: {
  role: AccessRole;
  onSelect: (r: "Editor" | "Viewer" | "remove") => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-gray-200 text-xs text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
      >
        {role}
        <CaretDownIcon size={10} className="text-gray-400" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 w-36 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          {(["Editor", "Viewer"] as const).map((r) => (
            <button
              key={r}
              onClick={() => { onSelect(r); setOpen(false); }}
              className="w-full flex items-center justify-between px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              {r}
              {r === role && <CheckIcon size={11} className="text-gray-900" weight="bold" />}
            </button>
          ))}
          <div className="border-t border-gray-100" />
          <button
            onClick={() => { onSelect("remove"); setOpen(false); }}
            className="w-full text-left px-3 py-2 text-xs text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
          >
            Remove
          </button>
        </div>
      )}
    </div>
  );
}

function AccessRow({
  entry,
  onRoleChange,
  onRemove,
}: {
  entry: AccessEntry;
  onRoleChange: (id: string, role: "Editor" | "Viewer") => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <Avatar
        bg={entry.avatarBg}
        fg={entry.avatarFg}
        initials={entry.avatarInitials}
        useTeamIcon={entry.useTeamIcon}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 leading-tight">{entry.name}</p>
        <p className="text-xs text-gray-400 leading-tight mt-0.5">{entry.subtitle}</p>
        {entry.teamAccessNote && (
          <p className="text-xs text-gray-400 mt-1 leading-snug">
            {entry.teamAccessNote}
          </p>
        )}
      </div>
      {entry.isOwner ? (
        <span className="text-xs text-gray-400 self-center pr-1">Owner</span>
      ) : (
        <div className="flex items-center gap-1.5 self-start pt-0.5">
          <RoleDropdown
            role={entry.role}
            onSelect={(r) => {
              if (r === "remove") onRemove(entry.id);
              else onRoleChange(entry.id, r);
            }}
          />
          <button
            onClick={() => onRemove(entry.id)}
            className="p-1 rounded text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <XIcon size={13} />
          </button>
        </div>
      )}
    </div>
  );
}

function SearchDropdown({
  query,
  excludeIds,
  onSelect,
}: {
  query: string;
  excludeIds: Set<string>;
  onSelect: (opt: SearchOption) => void;
}) {
  const q = query.toLowerCase();
  const filtered = SEARCH_OPTIONS.filter(
    (o) => !excludeIds.has(o.id) && (q === "" || o.label.toLowerCase().includes(q)),
  );

  const sections = (["people", "teams", "managers"] as const).map((s) => ({
    id: s,
    label: SECTION_LABELS[s],
    items: filtered.filter((o) => o.section === s),
  })).filter((s) => s.items.length > 0);

  if (sections.length === 0) {
    return (
      <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white border border-gray-200 rounded-xl shadow-lg p-4 text-sm text-gray-400 text-center">
        No results
      </div>
    );
  }

  return (
    <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden max-h-72 overflow-y-auto">
      {sections.map((section) => (
        <div key={section.id}>
          <p className="px-3 pt-3 pb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
            {section.label}
          </p>
          {section.items.map((opt) => (
            <button
              key={opt.id}
              onClick={() => onSelect(opt)}
              className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 transition-colors cursor-pointer text-left"
            >
              <Avatar
                bg={opt.avatarBg}
                fg={opt.avatarFg}
                initials={opt.avatarInitials}
                useTeamIcon={opt.useTeamIcon}
                size="sm"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 truncate">{opt.label}</p>
                <p className="text-xs text-gray-400 truncate">{opt.sublabel}</p>
              </div>
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

function GeneralAccessSection({
  access,
  dropdownOpen,
  onToggle,
  onChange,
}: {
  access: GeneralAccess;
  dropdownOpen: boolean;
  onToggle: () => void;
  onChange: (v: GeneralAccess) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!dropdownOpen) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onToggle();
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [dropdownOpen, onToggle]);

  const isInvited = access === "invited";
  const description = isInvited
    ? "Only people explicitly invited can access this."
    : "Anyone at Meridian Technologies with the link can view this.";

  return (
    <div className="pt-4">
      <div ref={ref} className="relative inline-block">
        <button
          onClick={onToggle}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors cursor-pointer"
        >
          {isInvited ? (
            <LockSimpleIcon size={15} className="text-gray-500" />
          ) : (
            <GlobeSimpleIcon size={15} className="text-gray-500" />
          )}
          <span className="text-sm text-gray-800">
            {isInvited ? "Only people invited" : "Anyone in the workspace"}
          </span>
          <CaretDownIcon size={12} className="text-gray-400" />
        </button>

        {dropdownOpen && (
          <div className="absolute bottom-full left-0 mb-1 z-50 w-64 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
            {(
              [
                { id: "invited" as const, icon: <LockSimpleIcon size={14} className="text-gray-500" />, label: "Only people invited" },
                { id: "workspace" as const, icon: <GlobeSimpleIcon size={14} className="text-gray-500" />, label: "Anyone in the workspace" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                onClick={() => { onChange(opt.id); onToggle(); }}
                className="w-full flex items-center justify-between gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center gap-2.5">
                  {opt.icon}
                  <span className="text-sm text-gray-800">{opt.label}</span>
                </div>
                {opt.id === access && (
                  <CheckIcon size={13} className="text-gray-900" weight="bold" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <p className="mt-2 text-xs text-gray-400 leading-relaxed">{description}</p>
    </div>
  );
}

// ─── Demo state switcher (subtle) ─────────────────────────────────────────────

const DEMO_LABELS: Record<DemoState, string> = {
  user: "User",
  team: "Team",
  "team-reporting": "Team + line",
};

function DemoStateSwitcher({
  current,
  onChange,
}: {
  current: DemoState;
  onChange: (s: DemoState) => void;
}) {
  return (
    <div className="flex items-center gap-1 opacity-40 hover:opacity-70 transition-opacity">
      {(Object.keys(DEMO_LABELS) as DemoState[]).map((s) => (
        <button
          key={s}
          onClick={() => onChange(s)}
          className={`px-1.5 py-0.5 rounded text-[10px] transition-colors cursor-pointer ${
            s === current
              ? "bg-gray-200 text-gray-700 font-medium"
              : "text-gray-400 hover:text-gray-600"
          }`}
        >
          {DEMO_LABELS[s]}
        </button>
      ))}
    </div>
  );
}

// ─── Main modal ───────────────────────────────────────────────────────────────

interface ShareModalProps {
  dashboardName: string;
  onClose: () => void;
}

export function ShareModal({ dashboardName, onClose }: ShareModalProps) {
  const [demoState, setDemoState] = useState<DemoState>("user");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [roleOverrides, setRoleOverrides] = useState<Record<string, AccessRole>>({});
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());
  const [addedEntries, setAddedEntries] = useState<AccessEntry[]>([]);
  const [generalAccess, setGeneralAccess] = useState<GeneralAccess>("invited");
  const [generalAccessOpen, setGeneralAccessOpen] = useState(false);

  // Reset per-state overrides when demo state changes
  useEffect(() => {
    setRoleOverrides({});
    setRemovedIds(new Set());
    setAddedEntries([]);
    setGeneralAccessOpen(demoState === "team-reporting");
  }, [demoState]);

  const searchRef = useRef<HTMLDivElement>(null);

  // Close search dropdown on outside click
  useEffect(() => {
    if (!searchOpen) return;
    function handler(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [searchOpen]);

  // Build display entries
  const baseEntries = BASE_ENTRIES[demoState];
  const displayEntries: AccessEntry[] = [
    ...baseEntries.filter((e) => !removedIds.has(e.id)),
    ...addedEntries.filter((e) => !removedIds.has(e.id)),
  ].map((e) => (roleOverrides[e.id] ? { ...e, role: roleOverrides[e.id] } : e));

  const existingIds = new Set(displayEntries.map((e) => e.id));

  function handleRoleChange(id: string, role: "Editor" | "Viewer") {
    setRoleOverrides((prev) => ({ ...prev, [id]: role }));
  }

  function handleRemove(id: string) {
    setRemovedIds((prev) => new Set([...prev, id]));
  }

  function handleSearchSelect(opt: SearchOption) {
    const entry: AccessEntry = {
      id: opt.id,
      type: opt.section === "people" ? "person" : opt.section === "teams" ? "team" : "reporting",
      name: opt.label,
      subtitle: opt.section === "people" ? opt.sublabel : "All current and future members",
      role: "Viewer",
      avatarBg: opt.avatarBg,
      avatarFg: opt.avatarFg,
      avatarInitials: opt.avatarInitials,
      useTeamIcon: opt.useTeamIcon,
    };
    setAddedEntries((prev) => [...prev, entry]);
    setSearchQuery("");
    setSearchOpen(false);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.35)" }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-[520px] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900 truncate pr-3">
            Share &ldquo;{dashboardName}&rdquo;
          </h2>
          <div className="flex items-center gap-3 flex-shrink-0">
            <DemoStateSwitcher current={demoState} onChange={setDemoState} />
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <XIcon size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Search */}
          <div ref={searchRef} className="relative">
            <div
              className="flex items-center gap-2.5 px-3 py-2.5 border border-gray-200 rounded-xl bg-white cursor-text hover:border-gray-300 transition-colors"
              onClick={() => setSearchOpen(true)}
            >
              <MagnifyingGlassIcon size={15} className="text-gray-400 flex-shrink-0" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchOpen(true)}
                placeholder="Add people, teams, or manager's team..."
                className="flex-1 text-sm text-gray-800 placeholder-gray-400 bg-transparent outline-none min-w-0"
              />
            </div>
            {searchOpen && (
              <SearchDropdown
                query={searchQuery}
                excludeIds={existingIds}
                onSelect={handleSearchSelect}
              />
            )}
          </div>

          {/* People with access */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">
              People with access
            </p>
            <div className="divide-y divide-gray-50">
              {displayEntries.map((entry) => (
                <AccessRow
                  key={entry.id}
                  entry={entry}
                  onRoleChange={handleRoleChange}
                  onRemove={handleRemove}
                />
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100" />

          {/* General access */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
              General access
            </p>
            <GeneralAccessSection
              access={generalAccess}
              dropdownOpen={generalAccessOpen}
              onToggle={() => setGeneralAccessOpen((v) => !v)}
              onChange={setGeneralAccess}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 bg-gray-50/50">
          <button className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer">
            <LinkSimpleIcon size={14} className="text-gray-500" />
            Copy link
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
