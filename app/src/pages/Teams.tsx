import { useState } from "react";
import { UsersIcon, SparkleIcon, UsersFourIcon } from "@phosphor-icons/react";
import { useAuthCheck } from "../hooks/useAuthCheck";
import { SettingsLayout } from "../components/SettingsLayout";
import {
  SettingsPageLayout,
  SettingsEmptyState,
  settingsPrimaryBtn,
} from "../components/settings/SettingsPageLayout";
import { teamsMock, type TeamRow } from "../mocks/teamsMock";
import {
  TeamDetailPanel,
  type TeamDetailData,
} from "../components/prototype/TeamDetailPanel";

// ─── Source badge ─────────────────────────────────────────────────────────────

function SourceBadge({ source }: { source: TeamRow["source"] }) {
  const map = {
    "Salesforce sync": "bg-blue-50 text-blue-600 border-blue-200",
    "AI-created": "bg-violet-50 text-violet-600 border-violet-200",
    Manual: "bg-gray-100 text-gray-600 border-gray-200",
  } as const;
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium border ${map[source]}`}>
      {source}
    </span>
  );
}

// ─── Admin list ───────────────────────────────────────────────────────────────

function AdminList({ admins }: { admins: string[] }) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {admins.map((name) => (
        <span key={name} className="text-sm text-gray-600 whitespace-nowrap">
          {name}
        </span>
      ))}
    </div>
  );
}

// ─── Mock TeamDetailData from TeamRow ─────────────────────────────────────────

function toTeamDetailData(team: TeamRow): TeamDetailData {
  return {
    name: team.name,
    description: team.description,
    filterConditions:
      team.source === "Salesforce sync"
        ? [
            { field: "Role", operator: "is", value: "AE" },
            { field: "Is Active", operator: "equals", value: "True" },
          ]
        : [],
    members: team.admins.map((name, i) => ({
      id: String(i),
      name,
      email: `${name.toLowerCase().replace(/\s/g, ".")}@acme.com`,
      isTeamAdmin: true,
      joinSource: "Manual" as const,
    })),
    suggestedAdmin: team.admins[0] ?? "",
    provenance:
      team.source === "Salesforce sync"
        ? "Synced from Salesforce"
        : team.source === "AI-created"
          ? "Created by Von"
          : "Created manually",
  };
}

// ─── Populated table ──────────────────────────────────────────────────────────

function PopulatedTable() {
  const [selectedTeam, setSelectedTeam] = useState<TeamRow | null>(null);

  return (
    <>
      <p className="text-xs text-gray-400 -mt-2 mb-6">
        {teamsMock.length} teams · {teamsMock.reduce((s, t) => s + t.memberCount, 0)} total members
      </p>
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {["Team", "Members", "Source", "Admins", "Updated"].map((col) => (
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
            {teamsMock.map((team) => (
              <tr
                key={team.id}
                onClick={() => setSelectedTeam(team)}
                className="hover:bg-gray-50/60 transition-colors cursor-pointer"
              >
                <td className="px-6 py-3.5 whitespace-nowrap">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
                      <UsersFourIcon size={14} className="text-violet-600" weight="fill" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{team.name}</p>
                      <p className="text-xs text-gray-400 max-w-[220px] truncate">{team.description}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-3.5 whitespace-nowrap text-sm text-gray-600">
                  {team.memberCount}
                </td>
                <td className="px-6 py-3.5 whitespace-nowrap">
                  <SourceBadge source={team.source} />
                </td>
                <td className="px-6 py-3.5">
                  <AdminList admins={team.admins} />
                </td>
                <td className="px-6 py-3.5 whitespace-nowrap text-sm text-gray-400">
                  {team.updatedAt}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* TeamDetailPanel — inspect mode */}
      {selectedTeam && (
        <TeamDetailPanel
          isOpen={!!selectedTeam}
          onClose={() => setSelectedTeam(null)}
          mode="inspect"
          team={toTeamDetailData(selectedTeam)}
        />
      )}
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Teams() {
  useAuthCheck();
  const [isPopulated, setIsPopulated] = useState(false);

  return (
    <SettingsLayout activeId="teams">
      <SettingsPageLayout
        title="Teams"
        subtitle="Workspace groupings of users — the core primitive for memory, sharing and scoping"
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
            <button className={settingsPrimaryBtn}>
              <SparkleIcon size={14} weight="fill" />
              New team in chat
            </button>
          </div>
        }
        footer={
          <>
            <SparkleIcon size={12} className="text-gray-400 flex-shrink-0" weight="fill" />
            Visible to Admins and Team Admins. Authoring is chat-only — this list is read-only.
          </>
        }
      >
        {isPopulated ? (
          <PopulatedTable />
        ) : (
          <SettingsEmptyState
            icon={<UsersIcon size={20} className="text-gray-400" weight="regular" />}
            heading="No teams yet"
            subtext="Teams are created through Von — connect Salesforce or describe your org structure in chat"
            actions={
              <button className={settingsPrimaryBtn}>
                Create a team in chat
              </button>
            }
          />
        )}
      </SettingsPageLayout>
    </SettingsLayout>
  );
}
