/**
 * PrototypeComponents — visual review page for all prototype components.
 * Route: /prototype/components
 * Not part of the final prototype nav — review only.
 */

import { useState } from "react";
import { ChatCard } from "../components/prototype/ChatCard";
import { RightPanel } from "../components/prototype/RightPanel";
import { QuickActionBar } from "../components/prototype/QuickActionBar";
import { TeamDetailPanel, type TeamDetailData } from "../components/prototype/TeamDetailPanel";

// ─── Mock data ────────────────────────────────────────────────────────────────

const TEAM_MOCK: TeamDetailData = {
  name: "Sales Team",
  description: "Account executives and sales leadership responsible for new business revenue. Synced from Salesforce hierarchy.",
  filterConditions: [
    { field: "Role", operator: "is", value: "AE" },
    { field: "Is Active", operator: "equals", value: "True" },
  ],
  members: [
    { id: "1", name: "Brady Henry",    email: "brady.henry@acme.com",    isTeamAdmin: true,  joinSource: "Salesforce sync" },
    { id: "2", name: "Sarah Chen",     email: "sarah.chen@acme.com",     isTeamAdmin: false, joinSource: "Salesforce sync" },
    { id: "3", name: "Marcus Williams",email: "marcus.w@acme.com",       isTeamAdmin: false, joinSource: "Salesforce sync" },
    { id: "4", name: "Priya Nair",     email: "priya.nair@acme.com",     isTeamAdmin: false, joinSource: "Manual"          },
    { id: "5", name: "James O'Brien",  email: "james.ob@acme.com",       isTeamAdmin: false, joinSource: "Salesforce sync" },
    { id: "6", name: "Alicia Romero",  email: "alicia.r@acme.com",       isTeamAdmin: false, joinSource: "AI-created"      },
    { id: "7", name: "Tyler Brooks",   email: "tyler.b@acme.com",        isTeamAdmin: false, joinSource: "Salesforce sync" },
    { id: "8", name: "Natalie Park",   email: "natalie.p@acme.com",      isTeamAdmin: false, joinSource: "Salesforce sync" },
    { id: "9", name: "Derek Santos",   email: "derek.s@acme.com",        isTeamAdmin: false, joinSource: "Manual"          },
    { id: "10", name: "Wei Zhang",     email: "wei.zhang@acme.com",      isTeamAdmin: false, joinSource: "AI-created"      },
  ],
  suggestedAdmin: "Brady Henry",
  provenance: "From Salesforce hierarchy",
};

const APPROVAL_ITEMS = [
  { name: "Sarah Chen", email: "sarah.chen@acme.com", role: "Admin" as const },
  { name: "Marcus Williams", email: "marcus.williams@acme.com", role: "Member" as const },
  { name: "Priya Nair", email: "priya.nair@acme.com", role: "Member" as const },
];

const SUMMARY_LINES = [
  { text: "52 users parsed from CSV", tone: "success" as const },
  { text: "3 users already exist — will be skipped", tone: "warning" as const },
  { text: "49 users ready to provision", tone: "success" as const },
  { text: "1 row had a missing email field", tone: "warning" as const },
];

const DIFF_ITEMS = [
  { name: "Tyler Brooks", email: "tyler.brooks@acme.com", changeType: "added" as const },
  { name: "Alicia Romero", email: "alicia.romero@acme.com", changeType: "changed" as const },
  { name: "Old User", email: "old.user@acme.com", changeType: "removed" as const },
];

// ─── Helper layout ────────────────────────────────────────────────────────────

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">{label}</p>
      {children}
    </div>
  );
}

function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="flex-1 h-px bg-gray-200" />
      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</span>
      <div className="flex-1 h-px bg-gray-200" />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PrototypeComponents() {
  const [panelOpen, setPanelOpen] = useState(false);
  const [qaVisible, setQaVisible] = useState(true);
  const [teamPanelMode, setTeamPanelMode] = useState<"review" | "inspect" | null>(null);

  return (
    <div className="h-full overflow-y-auto bg-gray-50 font-sf antialiased">
      <div className="max-w-2xl mx-auto px-6 py-10 space-y-10">

        {/* Page header */}
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Prototype Components</h1>
          <p className="text-sm text-gray-500 mt-1">Visual review of all reusable prototype components.</p>
        </div>

        {/* ── ChatCard ─────────────────────────────────────────────────── */}
        <Divider label="ChatCard" />

        <Section label="Variant: approval">
          <ChatCard
            variant="approval"
            title="Provision 3 users"
            items={APPROVAL_ITEMS}
            onApprove={() => alert("Approved")}
            onDiscard={() => alert("Discarded")}
          />
        </Section>

        <Section label="Variant: summary">
          <ChatCard
            variant="summary"
            title="Parsed 52 users"
            lines={SUMMARY_LINES}
          />
        </Section>

        <Section label="Variant: diff">
          <ChatCard
            variant="diff"
            title="3 changes detected"
            items={DIFF_ITEMS}
          />
        </Section>

        <Section label="Variant: status — success">
          <ChatCard
            variant="status"
            message="3 users provisioned successfully"
            tone="success"
          />
        </Section>

        <Section label="Variant: status — error">
          <ChatCard
            variant="status"
            message="Failed to provision users — check permissions"
            tone="error"
          />
        </Section>

        {/* ── RightPanel ───────────────────────────────────────────────── */}
        <Divider label="RightPanel" />

        <Section label="Panel with badge + footer (click to open)">
          <button
            onClick={() => setPanelOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-gray-900 rounded-xl hover:bg-gray-800 transition-colors cursor-pointer"
          >
            Open RightPanel
          </button>
        </Section>

        <RightPanel
          isOpen={panelOpen}
          onClose={() => setPanelOpen(false)}
          title="Review 52 users"
          badge={{ text: "Needs approval", color: "amber" }}
          footer={
            <div className="flex gap-2">
              <button
                onClick={() => setPanelOpen(false)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-gray-900 rounded-xl hover:bg-gray-800 transition-colors cursor-pointer"
              >
                Approve all
              </button>
              <button
                onClick={() => setPanelOpen(false)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Discard
              </button>
            </div>
          }
        >
          <div className="px-5 py-4 space-y-3">
            {APPROVAL_ITEMS.map((p, i) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-100">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-semibold text-gray-600">
                    {p.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                  <p className="text-xs text-gray-500 truncate">{p.email}</p>
                </div>
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium ${
                  p.role === "Admin" ? "bg-gray-900 text-white" : "bg-white border border-gray-300 text-gray-600"
                }`}>
                  {p.role}
                </span>
              </div>
            ))}
          </div>
        </RightPanel>

        {/* ── QuickActionBar ───────────────────────────────────────────── */}
        <Divider label="QuickActionBar" />

        <Section label="isVisible = true (action pills)">
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden py-3">
            <QuickActionBar
              isVisible={true}
              helperText="Review opens the full list in a panel — nothing is provisioned yet"
              actions={[
                { label: "Review & approve", variant: "primary", onClick: () => {} },
                { label: "Edit in chat", variant: "secondary", onClick: () => {} },
                { label: "Discard all", variant: "danger", onClick: () => {} },
              ]}
            />
          </div>
        </Section>

        <Section label="isVisible = false (disabled input)">
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden py-3">
            <QuickActionBar
              isVisible={false}
              actions={[]}
            />
          </div>
        </Section>

        <Section label="Toggle between states">
          <div className="space-y-2">
            <button
              onClick={() => setQaVisible((v) => !v)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Toggle (currently: {qaVisible ? "pills" : "disabled input"})
            </button>
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden py-3">
              <QuickActionBar
                isVisible={qaVisible}
                helperText={qaVisible ? "Choose an action to continue" : undefined}
                actions={[
                  { label: "Confirm changes", variant: "primary", onClick: () => {} },
                  { label: "Go back", variant: "secondary", onClick: () => {} },
                ]}
              />
            </div>
          </div>
        </Section>

        {/* ── TeamDetailPanel ──────────────────────────────────────────── */}
        <Divider label="TeamDetailPanel" />

        <Section label="Open panel in each mode">
          <div className="flex gap-3">
            <button
              onClick={() => setTeamPanelMode("review")}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-gray-900 rounded-xl hover:bg-gray-800 transition-colors cursor-pointer"
            >
              Open in Review mode
            </button>
            <button
              onClick={() => setTeamPanelMode("inspect")}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Open in Inspect mode
            </button>
          </div>
        </Section>

        <TeamDetailPanel
          isOpen={teamPanelMode !== null}
          onClose={() => setTeamPanelMode(null)}
          mode={teamPanelMode ?? "review"}
          team={TEAM_MOCK}
        />

        <div className="pb-16" />
      </div>
    </div>
  );
}
