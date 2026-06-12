import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UsersIcon, SparkleIcon, UsersFourIcon, DotsThreeIcon, MagnifyingGlassIcon } from "@phosphor-icons/react";
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
            Edit via chat
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setOpen(false); }}
            className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-gray-50 cursor-pointer"
          >
            Delete team
          </button>
        </div>
      )}
    </div>
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
  const [search, setSearch] = useState("");

  const visible = teamsMock.filter((t) =>
    search === "" || t.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      {/* Search bar */}
      <div className="mb-4">
        <div className="relative w-64">
          <MagnifyingGlassIcon size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search teams"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-7 pr-3 py-1.5 text-xs text-gray-700 bg-white border border-gray-200 rounded-lg hover:border-gray-300 focus:outline-none focus:border-gray-400 transition-colors w-full placeholder:text-gray-400"
          />
        </div>
      </div>
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {["Team", "Members", "Admins", "Updated"].map((col) => (
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
            {visible.map((team) => (
              <tr
                key={team.id}
                onClick={() => setSelectedTeam(team)}
                className="group hover:bg-gray-50/60 transition-colors cursor-pointer"
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
                <td className="px-6 py-3.5">
                  <AdminList admins={team.admins} />
                </td>
                <td className="px-6 py-3.5 whitespace-nowrap text-sm text-gray-400">
                  {team.updatedAt}
                </td>
                <td className="pr-3 py-3.5 whitespace-nowrap w-10">
                  <RowMenu />
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
  const navigate = useNavigate();
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
          <div className="bg-gray-50 rounded-2xl border border-gray-100 w-full">
            <SettingsEmptyState
              icon={<UsersIcon size={20} className="text-gray-400" weight="regular" />}
              heading="No teams yet"
              subtext="Teams are created through Von — connect Salesforce or describe your org structure in chat"
              actions={
                <button
                  className={settingsPrimaryBtn}
                  onClick={() => navigate("/prototype/prototype-create-team-v2.1")}
                >
                  Create a team in chat
                </button>
              }
            />
          </div>
        )}
      </SettingsPageLayout>
    </SettingsLayout>
  );
}
