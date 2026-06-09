import { useState, useRef, useEffect } from "react";
import { UsersIcon, DotsThreeIcon } from "@phosphor-icons/react";
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
        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-100 transition-colors cursor-pointer text-gray-500"
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

// ─── Populated table ──────────────────────────────────────────────────────────

function PopulatedTable() {
  const [tab, setTab] = useState<"Active" | "Pending">("Active");

  const activeCount = peopleMock.filter((p) => p.status === "Active").length;
  const pendingCount = peopleMock.filter((p) => p.status === "Invite sent").length;
  const visible = peopleMock.filter((p) =>
    tab === "Active" ? p.status === "Active" : p.status === "Invite sent"
  );

  const tabClass = (t: typeof tab) =>
    t === tab
      ? "text-gray-900 font-medium border-b-2 border-gray-900 pb-2"
      : "text-gray-400 hover:text-gray-600 pb-2 cursor-pointer";

  return (
    <>
      <p className="text-xs text-gray-400 -mt-2 mb-4">
        {peopleMock.length} members · {activeCount} active · {pendingCount} pending
      </p>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-gray-200 mb-4">
        <button className={tabClass("Active")} onClick={() => setTab("Active")}>
          Active <span className="text-gray-400 font-normal">({activeCount})</span>
        </button>
        <button className={tabClass("Pending")} onClick={() => setTab("Pending")}>
          Pending <span className="text-gray-400 font-normal">({pendingCount})</span>
        </button>
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
                <tr key={person.id} className="group hover:bg-gray-50/60 transition-colors">
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
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function People() {
  useAuthCheck();
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
        footer="Authoring is chat-only for bulk operations — use chat to provision from Salesforce or add in bulk."
      >
        {isPopulated ? (
          <PopulatedTable />
        ) : (
          <SettingsEmptyState
            icon={<UsersIcon size={20} className="text-gray-400" weight="regular" />}
            heading="No members yet"
            subtext="Add people by email or upload a CSV to get started"
            actions={
              <>
                <button className={settingsPrimaryBtn}>Invite by email</button>
                <button className={settingsSecondaryBtn}>Upload CSV</button>
              </>
            }
          />
        )}
      </SettingsPageLayout>
    </SettingsLayout>
  );
}
