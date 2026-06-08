import { useState } from "react";
import { UsersIcon } from "@phosphor-icons/react";
import { useAuthCheck } from "../hooks/useAuthCheck";
import { SettingsLayout } from "../components/SettingsLayout";
import {
  SettingsPageLayout,
  SettingsEmptyState,
  settingsPrimaryBtn,
  settingsSecondaryBtn,
} from "../components/settings/SettingsPageLayout";
import { peopleMock } from "../mocks/peopleMock";
import type { Person } from "../types/people";

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: Person["status"] }) {
  if (status === "Active") {
    return (
      <span className="inline-flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
        <span className="text-sm text-gray-700">Active</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
      <span className="text-sm text-gray-400">Invite sent</span>
    </span>
  );
}

// ─── Role badge ───────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: Person["role"] }) {
  if (role === "Admin") {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-gray-900 text-white">
        Admin
      </span>
    );
  }
  if (role === "View Only") {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-gray-100 border border-gray-200 text-gray-400">
        View Only
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-white border border-gray-300 text-gray-600">
      Member
    </span>
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

// ─── Populated table ──────────────────────────────────────────────────────────

function PopulatedTable() {
  const activeCount = peopleMock.filter((p) => p.status === "Active").length;
  const pendingCount = peopleMock.filter((p) => p.status === "Invite sent").length;

  return (
    <>
      <p className="text-xs text-gray-400 -mt-2 mb-6">
        {peopleMock.length} members · {activeCount} active · {pendingCount} pending
      </p>
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {["Name", "Role", "Status", "Reports to", "Joined"].map((col) => (
                <th
                  key={col}
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {peopleMock.map((person) => (
              <tr key={person.id} className="hover:bg-gray-50/60 transition-colors">
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
                <td className="px-6 py-3.5 whitespace-nowrap">
                  <StatusBadge status={person.status} />
                </td>
                <td className="px-6 py-3.5 whitespace-nowrap text-sm text-gray-500">
                  {person.reportsTo ?? <span className="text-gray-300">—</span>}
                </td>
                <td className="px-6 py-3.5 whitespace-nowrap text-sm text-gray-400">
                  {person.joined}
                </td>
              </tr>
            ))}
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
