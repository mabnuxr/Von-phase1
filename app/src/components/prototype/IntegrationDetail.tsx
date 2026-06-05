/**
 * IntegrationDetail — full-page Salesforce integration detail view.
 * Opened from the Integrations list; onBack() returns to the list.
 * Rendered inside the existing Settings content pane — no new routes.
 */

import { useState } from "react";
import { ArrowLeftIcon, XIcon, PlusIcon, ArrowSquareOutIcon } from "@phosphor-icons/react";
import salesforceLogo from "../../assets/salesforce.svg";
import { TEAMS } from "../../mocks/prototypeData";

// ─── Types ────────────────────────────────────────────────────────────────────

type Scope = "workspace" | "personal" | "team";
type TeamConnection = "shared" | "individual";

// ─── Segmented toggle ─────────────────────────────────────────────────────────

function SegmentedToggle({
  options,
  value,
  onChange,
}: {
  options: Array<{ id: string; label: string }>;
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="inline-flex items-center rounded-xl border border-gray-200 bg-gray-50 p-0.5 gap-0.5">
      {options.map((opt) => (
        <button
          key={opt.id}
          onClick={() => onChange(opt.id)}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer ${
            value === opt.id
              ? "bg-white text-gray-900 shadow-xs border border-gray-200"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ─── Team chip ────────────────────────────────────────────────────────────────

function TeamChip({ name, onRemove }: { name: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-violet-50 border border-violet-200 text-xs font-medium text-violet-700">
      {name}
      <button
        onClick={onRemove}
        className="text-violet-400 hover:text-violet-600 transition-colors cursor-pointer"
      >
        <XIcon size={11} weight="bold" />
      </button>
    </span>
  );
}

// ─── Radio option ─────────────────────────────────────────────────────────────

function RadioOption({
  id,
  label,
  description,
  checked,
  onSelect,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onSelect: () => void;
}) {
  return (
    <label
      htmlFor={id}
      className="flex items-start gap-3 cursor-pointer group"
      onClick={onSelect}
    >
      <div className="mt-0.5 flex-shrink-0">
        <div
          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
            checked ? "border-gray-900 bg-gray-900" : "border-gray-300 group-hover:border-gray-400"
          }`}
        >
          {checked && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
        </div>
      </div>
      <div>
        <p className="text-sm font-medium text-gray-800">{label}</p>
        <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{description}</p>
      </div>
    </label>
  );
}

// ─── Demo state label (subtle, top-right) ─────────────────────────────────────

function DemoStateLabel({ label }: { label: string }) {
  return (
    <span className="text-[10px] text-gray-300 select-none pointer-events-none">
      {label}
    </span>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface IntegrationDetailProps {
  onBack: () => void;
}

export function IntegrationDetail({ onBack }: IntegrationDetailProps) {
  const [scope, setScope] = useState<Scope>("workspace");
  const [teamConnection, setTeamConnection] = useState<TeamConnection>("shared");
  const [scopedTeams, setScopedTeams] = useState([
    TEAMS.enterpriseSales.name,
    TEAMS.customerSuccess.name,
  ]);

  // Derived demo state label
  const demoLabel =
    scope === "workspace"
      ? "Workspace scope"
      : scope === "personal"
        ? "Personal scope"
        : teamConnection === "shared"
          ? "Team scope — Shared"
          : "Team scope — Personal";

  const scopeDescriptions: Record<Scope, string> = {
    workspace: "Admin connects once — everyone in the workspace can use it.",
    personal: "Each user connects their own account — access is per-user.",
    team: "Scoped to the teams you pick — hidden from everyone else.",
  };

  return (
    <div className="flex flex-col h-full min-h-0 overflow-y-auto">
      {/* Back link */}
      <div className="px-6 pt-5 pb-0 flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
        >
          <ArrowLeftIcon size={14} weight="bold" />
          Back
        </button>
        <DemoStateLabel label={demoLabel} />
      </div>

      {/* Content */}
      <div className="px-6 py-6 flex flex-col gap-7 max-w-2xl">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 border border-gray-100 shadow-xs">
              <img src={salesforceLogo} alt="Salesforce" className="w-full h-full object-contain p-1" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 leading-none">Salesforce</h1>
              <p className="text-sm text-gray-400 mt-1.5">CRM · Read &amp; Write · OAuth</p>
            </div>
          </div>
          <button className="flex-shrink-0 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors cursor-pointer">
            Enable
          </button>
        </div>

        {/* Description */}
        <div className="space-y-2.5">
          <p className="text-sm text-gray-700 leading-relaxed">
            Connect Salesforce to pull CRM data into Von. Ask about opportunities, accounts, and
            contacts — and write back updates directly from chat.
          </p>
          <p className="text-xs text-gray-400 leading-relaxed">
            Only use connectors from developers you trust. Von can&apos;t verify that third-party
            tools work as intended or won&apos;t change.
          </p>
        </div>

        {/* SET AS section */}
        <div className="space-y-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
            Set as
          </p>

          <SegmentedToggle
            options={[
              { id: "workspace", label: "Workspace" },
              { id: "personal", label: "Personal" },
              { id: "team", label: "Team" },
            ]}
            value={scope}
            onChange={(id) => setScope(id as Scope)}
          />

          <p className="text-sm text-gray-600 leading-relaxed">
            {scopeDescriptions[scope]}
          </p>

          {/* Team scope extra UI */}
          {scope === "team" && (
            <div className="space-y-4 pt-1">
              {/* Scoped teams box */}
              <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4 space-y-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                  Scoped to teams
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  {scopedTeams.map((name) => (
                    <TeamChip
                      key={name}
                      name={name}
                      onRemove={() =>
                        setScopedTeams((prev) => prev.filter((t) => t !== name))
                      }
                    />
                  ))}
                  <button className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
                    <PlusIcon size={12} weight="bold" />
                    Add team
                  </button>
                </div>
              </div>

              {/* Connection type radios */}
              <div className="space-y-4">
                <RadioOption
                  id="shared"
                  label="Shared connection"
                  description="One person connects on behalf of the team — all scoped members use it."
                  checked={teamConnection === "shared"}
                  onSelect={() => setTeamConnection("shared")}
                />
                <RadioOption
                  id="individual"
                  label="Each member connects own"
                  description="Every scoped user must connect their own account before use."
                  checked={teamConnection === "individual"}
                  onSelect={() => setTeamConnection("individual")}
                />
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-gray-100" />

        {/* Details section */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
            Details
          </p>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
                Integration type
              </p>
              <p className="text-sm text-gray-800">Read &amp; Write</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
                Authentication
              </p>
              <p className="text-sm text-gray-800">OAuth</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
                More info
              </p>
              <button className="inline-flex items-center gap-1.5 text-sm text-gray-700 hover:text-gray-900 transition-colors cursor-pointer">
                Documentation
                <ArrowSquareOutIcon size={13} className="text-gray-400" />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
