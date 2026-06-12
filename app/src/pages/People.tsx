import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UsersIcon, DotsThreeIcon, MagnifyingGlassIcon, CaretDownIcon, XIcon, UsersFourIcon, SparkleIcon } from "@phosphor-icons/react";
import { useAuthCheck } from "../hooks/useAuthCheck";
import { SettingsLayout } from "../components/SettingsLayout";
import {
  SettingsPageLayout,
  SettingsEmptyState,
  settingsPrimaryBtn,
  settingsSecondaryBtn,
} from "../components/settings/SettingsPageLayout";
import { peopleMock } from "../mocks/peopleMock";
import { teamsMock } from "../mocks/teamsMock";
import type { Person } from "../types/people";

// ─── Role badge ───────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: Person["role"] }) {
  if (role === "Admin") {
    return (
      <span className="inline-flex items-center bg-gray-900 text-white text-xs font-medium px-2 py-0.5 rounded-md">
        Admin
      </span>
    );
  }
  if (role === "View Only") {
    return (
      <span className="inline-flex items-center bg-gray-100 text-gray-400 text-xs font-medium px-2 py-0.5 rounded-md border border-gray-200">
        View Only
      </span>
    );
  }
  return (
    <span className="inline-flex items-center bg-white text-gray-600 text-xs font-medium px-2 py-0.5 rounded-md border border-gray-300">
      Member
    </span>
  );
}

// ─── Row three-dot menu ───────────────────────────────────────────────────────

function RowMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [open]);

  return (
    <div ref={ref} className="relative flex justify-end">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className="p-1 rounded hover:bg-gray-100 transition-colors cursor-pointer text-gray-500"
      >
        <DotsThreeIcon size={16} weight="bold" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 w-40">
          <button
            onClick={(e) => { e.stopPropagation(); setOpen(false); }}
            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
          >
            View details
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setOpen(false); }}
            className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-gray-50 cursor-pointer"
          >
            Remove member
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Initials avatar ──────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  "bg-violet-100 text-violet-700",
  "bg-blue-100 text-blue-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-cyan-100 text-cyan-700",
];

function avatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

function initials(name: string) {
  const parts = name.trim().split(" ");
  return (parts.length >= 2 ? parts[0][0] + parts[parts.length - 1][0] : name.slice(0, 2)).toUpperCase();
}

function Avatar({ name }: { name: string }) {
  return (
    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold flex-shrink-0 ${avatarColor(name)}`}>
      {initials(name)}
    </div>
  );
}

// ─── Team pills helper ────────────────────────────────────────────────────────

function personTeams(name: string): string[] {
  return teamsMock.filter((t) => t.admins.includes(name)).map((t) => t.name);
}

// ─── User inspect panel (480px right overlay, v2 panel style) ─────────────────

function PanelSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2">{label}</p>
      {children}
    </div>
  );
}

function PersonInspectPanel({ person, onClose }: { person: Person; onClose: () => void }) {
  const navigate = useNavigate();
  const teams = personTeams(person.name);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <>
      {/* Backdrop — click outside to close */}
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} />

      {/* Panel */}
      <div className="fixed top-0 right-0 bottom-0 z-50 w-[480px] bg-white border-l border-gray-200 shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-4 pb-3 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold ${avatarColor(person.name)}`}>
              {initials(person.name)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{person.name}</p>
              <p className="text-xs text-gray-400 truncate mt-0.5">{person.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors cursor-pointer flex-shrink-0 ml-2"
          >
            <XIcon size={15} weight="bold" />
          </button>
        </div>

        <div className="h-px bg-gray-100 flex-shrink-0" />

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          <PanelSection label="Role">
            <RoleBadge role={person.role} />
          </PanelSection>

          <PanelSection label="Teams">
            {teams.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2">
                {teams.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-gray-50 border border-gray-200/70 text-gray-700"
                  >
                    <UsersFourIcon size={12} className="text-gray-400" weight="fill" />
                    {t}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No teams</p>
            )}
          </PanelSection>

          <PanelSection label="Joined">
            <p className="text-sm text-gray-700">
              {person.status === "Invite sent" ? "Pending acceptance" : person.joined}
            </p>
          </PanelSection>

          <PanelSection label="Added by">
            <p className="text-sm text-gray-700">{person.addedBy}</p>
          </PanelSection>

          <PanelSection label="Source">
            <p className="text-sm text-gray-700">{person.source}</p>
          </PanelSection>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 border-t border-gray-200 px-5 py-3.5">
          <button
            onClick={() => navigate("/chat/new")}
            className="w-full flex items-center justify-center gap-1.5 px-3.5 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <SparkleIcon size={14} weight="fill" className="text-violet-500" />
            Edit with Von
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Populated table ──────────────────────────────────────────────────────────

function PopulatedTable() {
  const [tab, setTab] = useState<"Active" | "Pending">("Active");
  const [roleFilter, setRoleFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Person | null>(null);

  const activeCount = peopleMock.filter((p) => p.status === "Active").length;
  const pendingCount = peopleMock.filter((p) => p.status === "Invite sent").length;
  const visible = peopleMock.filter((p) =>
    tab === "Active" ? p.status === "Active" : p.status === "Invite sent"
  ).filter((p) =>
    roleFilter === "All" || p.role === roleFilter
  ).filter((p) =>
    search === "" || p.name.toLowerCase().includes(search.toLowerCase()) || p.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      {/* Controls row: pill tabs left, filters right */}
      <div className="flex items-center justify-between mb-4">
        {/* Pill tab switcher */}
        <div className="flex items-center bg-gray-100 rounded-lg p-0.5 gap-0.5">
          {(["Active", "Pending"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                tab === t
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t} <span className={tab === t ? "text-gray-400" : "text-gray-400"}>({t === "Active" ? activeCount : pendingCount})</span>
            </button>
          ))}
        </div>

        {/* Right: role filter + search */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="appearance-none pl-2.5 pr-7 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors cursor-pointer focus:outline-none"
            >
              <option value="All">Role: All</option>
              <option value="Admin">Admin</option>
              <option value="Member">Member</option>
              <option value="View Only">View Only</option>
            </select>
            <CaretDownIcon size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          <div className="relative">
            <MagnifyingGlassIcon size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-7 pr-3 py-1.5 text-xs text-gray-700 bg-white border border-gray-200 rounded-lg hover:border-gray-300 focus:outline-none focus:border-gray-400 transition-colors w-44 placeholder:text-gray-400"
            />
          </div>
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {["Name", "Role", "Teams", "Reports to", "Joined"].map((col) => (
                <th
                  key={col}
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide"
                >
                  {col}
                </th>
              ))}
              <th scope="col" className="w-10" />
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {visible.map((person) => {
              const teams = personTeams(person.name);
              return (
                <tr
                  key={person.id}
                  onClick={() => setSelected(person)}
                  className="group hover:bg-gray-50/60 transition-colors cursor-pointer"
                >
                  <td className="px-6 py-3.5 whitespace-nowrap">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={person.name} />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{person.name}</p>
                        <p className="text-xs text-gray-400">{person.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3.5 whitespace-nowrap">
                    <RoleBadge role={person.role} />
                  </td>
                  <td className="px-6 py-3.5">
                    {teams.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {teams.map((t) => (
                          <span key={t} className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-md">
                            {t}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-300 text-sm">—</span>
                    )}
                  </td>
                  <td className="px-6 py-3.5 whitespace-nowrap text-sm text-gray-500">
                    {person.reportsTo ?? <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-6 py-3.5 whitespace-nowrap text-sm text-gray-400">
                    {person.joined}
                  </td>
                  <td className="pr-3 py-3.5 whitespace-nowrap w-10">
                    <RowMenu />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* User inspect panel */}
      {selected && (
        <PersonInspectPanel person={selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function People() {
  useAuthCheck();
  const navigate = useNavigate();
  const [isPopulated, setIsPopulated] = useState(false);

  return (
    <SettingsLayout activeId="people">
      <SettingsPageLayout
        title="People"
        subtitle="Everyone in your workspace"
        headerRight={
          <div className="flex items-center gap-3">
            {/* Sample data toggle */}
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-xs text-gray-500">Sample data</span>
              <button
                role="switch"
                aria-checked={isPopulated}
                onClick={() => setIsPopulated((v) => !v)}
                className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors cursor-pointer focus:outline-none ${isPopulated ? "bg-gray-900" : "bg-gray-200"}`}
              >
                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${isPopulated ? "translate-x-[18px]" : "translate-x-[3px]"}`} />
              </button>
            </label>
            <button className={settingsPrimaryBtn}>Add people</button>
          </div>
        }
      >
        {isPopulated ? (
          <PopulatedTable />
        ) : (
          <div className="bg-gray-50 rounded-2xl border border-gray-100 w-full">
            <SettingsEmptyState
              icon={<UsersIcon size={20} className="text-gray-400" weight="regular" />}
              heading="No members yet"
              subtext="Add people by email or upload a CSV to get started"
              actions={
                <>
                  <button
                    className={settingsPrimaryBtn}
                    onClick={() => navigate("/prototype/prototype-individual-provisioning")}
                  >
                    Invite by email
                  </button>
                  <button
                    className={settingsSecondaryBtn}
                    onClick={() => navigate("/prototype/prototype-bulk-provisioning-v2.1")}
                  >
                    Upload CSV
                  </button>
                </>
              }
            />
          </div>
        )}
      </SettingsPageLayout>
    </SettingsLayout>
  );
}
