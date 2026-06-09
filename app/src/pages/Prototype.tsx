import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { SparkleIcon, FlaskIcon, UsersFourIcon, XIcon } from "@phosphor-icons/react";
import { SendHorizontal } from "lucide-react";
import vonLogomark from "../assets/von-logomark.svg";
import { AskUserInput } from "../components/prototype/QuickActionBar";
import { ChatCard } from "../components/prototype/ChatCard";
import { StatusTag } from "../components/prototype/StatusTag";
import { TeamDetailPanel, type TeamDetailData } from "../components/prototype/TeamDetailPanel";
import { ReviewInvitesPanel } from "../components/prototype/ReviewInvitesPanel";
import { SCENARIOS, getScenario, type ScenarioMessage } from "../components/prototype/scenarios";
import { WORKSPACE_MEMBERS, TEAMS, SALESFORCE_ONLY_USERS } from "../mocks/prototypeData";

// ─── Von / User avatars ───────────────────────────────────────────────────────

function VonAvatar() {
  return (
    <img src={vonLogomark} alt="Von" className="w-7 h-7 flex-shrink-0" />
  );
}

function UserAvatar() {
  return (
    <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
      <span className="text-[11px] font-semibold text-violet-700">MA</span>
    </div>
  );
}

// ─── Team card (clickable, appears inline in chat) ────────────────────────────

function TeamCard({ name, memberCount, status, isOpen, onClick, hideButton }: {
  name: string;
  memberCount: number;
  status: string;
  isOpen: boolean;
  onClick: () => void;
  hideButton?: boolean;
}) {
  return (
    <div
      onClick={hideButton ? undefined : onClick}
      className={`flex items-center gap-3 w-full max-w-sm text-left border rounded-xl px-4 py-3 transition-all ${hideButton ? "cursor-default border-gray-200" : "hover:bg-gray-50 hover:border-gray-300 cursor-pointer border-gray-200"}`}
    >
      <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
        <UsersFourIcon size={17} className="text-violet-600" weight="fill" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-gray-900">{name}</p>
          <StatusTag status={status} />
        </div>
        <p className="text-xs text-gray-400 mt-0.5">{memberCount} members</p>
      </div>
      {!hideButton && (
        <button
          onClick={(e) => { e.stopPropagation(); onClick(); }}
          className="px-2.5 py-1 text-xs font-medium rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 flex-shrink-0"
        >
          {isOpen ? "Hide" : "Show"}
        </button>
      )}
    </div>
  );
}

// ─── Message bubbles ──────────────────────────────────────────────────────────

function AssistantBubble({ message, onTeamCardClick, isPanelOpen }: {
  message: ScenarioMessage;
  onTeamCardClick?: () => void;
  isPanelOpen?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <VonAvatar />
      <div className="flex-1 min-w-0 space-y-3">
        <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
          {renderText(message.text)}
        </div>
        {message.card && (
          <InlineCard card={message.card} onTeamCardClick={onTeamCardClick} isPanelOpen={isPanelOpen} />
        )}
      </div>
    </div>
  );
}

function UserBubble({ message }: { message: ScenarioMessage }) {
  return (
    <div className="flex items-start gap-3 flex-row-reverse">
      <UserAvatar />
      <div className="max-w-[75%] bg-gray-100 rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm text-gray-800 leading-relaxed">
        {message.text}
      </div>
    </div>
  );
}

// ─── Inline card renderer ─────────────────────────────────────────────────────

function InlineCard({ card, onTeamCardClick, isPanelOpen }: {
  card: NonNullable<ScenarioMessage["card"]>;
  onTeamCardClick?: () => void;
  isPanelOpen?: boolean;
}) {
  const title = card.title ?? "";
  if (card.variant === "approval" && card.approvalItems) {
    return (
      <ChatCard
        variant="approval"
        title={title}
        items={card.approvalItems}
        onApprove={() => {}}
        onDiscard={() => {}}
      />
    );
  }
  if (card.variant === "summary" && card.summaryLines) {
    return <ChatCard variant="summary" title={title} lines={card.summaryLines} />;
  }
  if (card.variant === "diff" && card.diffItems) {
    return <ChatCard variant="diff" title={title} items={card.diffItems} />;
  }
  if (card.variant === "status") {
    return (
      <ChatCard
        variant="status"
        message={card.statusMessage ?? "Done"}
        tone={card.statusTone ?? "success"}
      />
    );
  }
  if (card.variant === "bulk-summary" && card.bulkStats) {
    return (
      <ChatCard
        variant="bulk-summary"
        stats={card.bulkStats}
        flagged={card.bulkFlagged ?? []}
      />
    );
  }
  if (card.variant === "ask-input" && card.askQuestion) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm px-4 py-3.5 flex items-center justify-between gap-4">
        <p className="text-sm text-gray-800">{card.askQuestion}</p>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button className="px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg cursor-default">
            {card.askPrimary ?? "Confirm"}
          </button>
          <button className="px-3 py-1.5 border border-gray-200 text-gray-600 text-xs font-medium rounded-lg cursor-default">
            {card.askSecondary ?? "Cancel"}
          </button>
        </div>
      </div>
    );
  }
  if (card.variant === "team" && card.teamName) {
    return (
      <TeamCard
        name={card.teamName}
        memberCount={card.teamMemberCount ?? 0}
        status={card.teamStatus ?? "Active"}
        isOpen={isPanelOpen ?? false}
        onClick={onTeamCardClick ?? (() => {})}
        hideButton={!onTeamCardClick}
      />
    );
  }
  return null;
}

// ─── Bold/newline markdown renderer ──────────────────────────────────────────

function renderText(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part.split("\n").map((line, j, arr) => (
      <span key={`${i}-${j}`}>
        {line}
        {j < arr.length - 1 && <br />}
      </span>
    ));
  });
}

// ─── Chat pane ────────────────────────────────────────────────────────────────

function ChatPane({ scenario, className = "", onTeamCardClick, isPanelOpen, bottomSlot, extraContent }: {
  scenario: NonNullable<ReturnType<typeof getScenario>>;
  className?: string;
  onTeamCardClick?: () => void;
  isPanelOpen?: boolean;
  bottomSlot?: React.ReactNode;
  extraContent?: React.ReactNode;
}) {
  return (
    <div className={`flex flex-col overflow-hidden ${className}`}>
      {/* Header — no badge */}
      <div className="flex items-center px-6 py-3.5 border-b border-gray-100 flex-shrink-0">
        <div>
          <p className="text-sm font-semibold text-gray-900">{scenario.label}</p>
          <p className="text-xs text-gray-400 mt-0.5 capitalize">{scenario.group} flow</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {scenario.messages.map((msg, i) =>
          msg.role === "assistant" ? (
            <AssistantBubble key={i} message={msg} onTeamCardClick={onTeamCardClick} isPanelOpen={isPanelOpen} />
          ) : (
            <UserBubble key={i} message={msg} />
          ),
        )}
        {extraContent}
      </div>

      {/* Fake input or custom bottom slot */}
      {bottomSlot ?? (
        <div className="flex-shrink-0 px-5 py-4 border-t border-gray-100">
          <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
            <span className="flex-1 text-sm text-gray-400">Message Von…</span>
            <SparkleIcon size={16} className="text-gray-300" weight="fill" />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Shared team data (derived from prototypeData) ────────────────────────────

const es = TEAMS.enterpriseSales;
const esAdminMember = WORKSPACE_MEMBERS.find((u) => u.id === es.teamAdmin)!;

function buildEsTeamData(provenance: string): TeamDetailData {
  return {
    name: es.name,
    description: es.description,
    filterConditions: es.filterConditions,
    members: es.members.map((id) => {
      const u = WORKSPACE_MEMBERS.find((m) => m.id === id)!;
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        sfRole: u.sfRole,
        isTeamAdmin: u.id === es.teamAdmin,
        joinSource: "Salesforce sync" as const,
      };
    }),
    suggestedAdmin: esAdminMember.name,
    provenance,
  };
}

const ENTERPRISE_SALES_TEAM = buildEsTeamData("Synced from Salesforce");
const ENTERPRISE_SALES_INSPECT_TEAM = buildEsTeamData("Created by Von · Updated Jun 2, 2026");

// ─── Create-group layout (persistent split panel) ─────────────────────────────

function CreateGroupLayout({ scenario }: { scenario: NonNullable<ReturnType<typeof getScenario>> }) {
  const [panelStatus, setPanelStatus] = useState<"draft" | "active">("draft");
  const [panelMode, setPanelMode] = useState<"review" | "inspect">("review");
  const [messages, setMessages] = useState(scenario.messages);

  const handleCommit = () => {
    setPanelStatus("active");
    setPanelMode("inspect");
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant" as const,
        text: `${es.name} created — Role is AE, Is Active equals True — ${es.memberCount} members added.`,
      },
    ]);
  };

  const handleTeamCardClick = () => {
    setPanelMode((v) => (v === "inspect" ? "review" : "inspect"));
  };

  return (
    <div className="flex-1 h-full bg-white rounded-lg border border-gray-200 shadow-xs overflow-hidden flex flex-row">
      <ChatPane
        scenario={{ ...scenario, messages }}
        className="flex-1 min-w-0 border-r border-gray-100"
        isPanelOpen={panelMode === "inspect"}
        onTeamCardClick={panelStatus === "active" ? handleTeamCardClick : undefined}
      />
      <TeamDetailPanel
        inline
        isOpen
        onClose={() => {}}
        mode={panelMode}
        team={panelMode === "inspect" ? ENTERPRISE_SALES_INSPECT_TEAM : ENTERPRISE_SALES_TEAM}
        statusOverride={panelStatus}
        defaultFilterExpanded
        onCommit={handleCommit}
        inspectCtaLabel="Edit with Von"
      />
    </div>
  );
}

// ─── Inspect-group layout (persistent split, opens on team card click) ────────

function InspectGroupLayout({ scenario }: { scenario: NonNullable<ReturnType<typeof getScenario>> }) {
  const [panelOpen, setPanelOpen] = useState(false);

  return (
    <div className="flex-1 h-full bg-white rounded-lg border border-gray-200 shadow-xs overflow-hidden flex flex-row">
      {/* Chat — fills remaining width */}
      <ChatPane
        scenario={scenario}
        className="flex-1 min-w-0"
        onTeamCardClick={() => setPanelOpen((v) => !v)}
        isPanelOpen={panelOpen}
      />

      {/* Persistent panel — 480px fixed (set by TeamDetailPanel itself) */}
      {panelOpen && (
        <TeamDetailPanel
          inline
          persistentClose
          isOpen
          onClose={() => setPanelOpen(false)}
          mode="inspect"
          team={ENTERPRISE_SALES_INSPECT_TEAM}
        />
      )}
    </div>
  );
}

// ─── Add-users-to-group layout (chat + AskUserInput confirmation) ────────────

function AddUsersToGroupLayout({ scenario }: { scenario: NonNullable<ReturnType<typeof getScenario>> }) {
  const [confirmed, setConfirmed] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);

  const t1 = WORKSPACE_MEMBERS.find((u) => u.id === "u6")!;
  const t2 = WORKSPACE_MEMBERS.find((u) => u.id === "u7")!;
  const addedCount = es.memberCount + 2;

  const displayScenario = confirmed
    ? {
        ...scenario,
        messages: [
          ...scenario.messages,
          {
            role: "assistant" as const,
            text: `Done. ${t1.name} and ${t2.name} are now members of **${es.name}**. The team now has ${addedCount} members.`,
            card: {
              variant: "team" as const,
              teamName: es.name,
              teamMemberCount: addedCount,
              teamStatus: "Active",
            },
          },
        ],
      }
    : scenario;

  const confirmedTeamData: import("../components/prototype/TeamDetailPanel").TeamDetailData = {
    name: es.name,
    description: es.description,
    filterConditions: es.filterConditions,
    members: [...es.members, "u6", "u7"].map((id) => {
      const u = WORKSPACE_MEMBERS.find((m) => m.id === id)!;
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        sfRole: u.sfRole,
        isTeamAdmin: u.id === es.teamAdmin,
        joinSource: (es.members.includes(id) ? "Salesforce sync" : "AI-created") as "Salesforce sync" | "AI-created",
      };
    }),
    suggestedAdmin: esAdminMember.name,
    provenance: "Created by Von · Updated Jun 2, 2026",
  };

  return (
    <div className="flex-1 h-full bg-white rounded-lg border border-gray-200 shadow-xs overflow-hidden flex flex-row">
      <ChatPane
        scenario={displayScenario}
        className="flex-1 min-w-0"
        onTeamCardClick={confirmed ? () => setPanelOpen((v) => !v) : undefined}
        isPanelOpen={panelOpen}
        bottomSlot={
          !confirmed ? (
            <AskUserInput
              isVisible={true}
              title={`Add to ${es.name}?`}
              items={[
                { label: t1.name, sublabel: t1.email },
                { label: t2.name, sublabel: t2.email },
              ]}
              actions={[
                { label: "Add to team", variant: "primary", onClick: () => setConfirmed(true) },
                { label: "Cancel", variant: "secondary", onClick: () => {} },
              ]}
            />
          ) : undefined
        }
      />
      {confirmed && panelOpen && (
        <TeamDetailPanel
          inline
          persistentClose
          isOpen
          onClose={() => setPanelOpen(false)}
          mode="inspect"
          team={confirmedTeamData}
        />
      )}
    </div>
  );
}

// ─── Bulk provisioning layout ─────────────────────────────────────────────────

function BulkProvisioningLayout({ scenario }: { scenario: NonNullable<ReturnType<typeof getScenario>> }) {
  const navigate = useNavigate();
  const [panelOpen, setPanelOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [sentCount, setSentCount] = useState(0);
  const FLAGGED = 3;

  const displayScenario = sent
    ? {
        ...scenario,
        messages: [
          ...scenario.messages,
          { role: "user" as const, text: `Send ${sentCount} invites.` },
          {
            role: "assistant" as const,
            text: `Done. ${sentCount} invitations sent.`,
            card: {
              variant: "status" as const,
              statusMessage: `${sentCount} invitations sent · Member role · ${FLAGGED} rows skipped`,
              statusTone: "success" as const,
            },
          },
        ],
      }
    : scenario;

  const objectCard = !sent ? (
    <div className="mt-2 ml-10">
      <button
        onClick={() => setPanelOpen(true)}
        className="flex items-center gap-3 w-full max-w-sm text-left border border-gray-200 rounded-xl px-4 py-3 hover:bg-gray-50 hover:border-gray-300 transition-all cursor-pointer"
      >
        <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
          <UsersFourIcon size={17} className="text-violet-600" weight="fill" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">49 users ready to provision</p>
          <p className="text-xs text-gray-400 mt-0.5">Member role · CSV import</p>
        </div>
        <span className="px-2.5 py-1 text-xs font-medium rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 flex-shrink-0 whitespace-nowrap">
          Review &amp; send
        </span>
      </button>
    </div>
  ) : (
    <div className="mt-2 ml-10">
      <button
        onClick={() => navigate("/settings/people")}
        className="text-xs font-medium text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors cursor-pointer"
      >
        Go to People page →
      </button>
    </div>
  );

  return (
    <div className="flex-1 h-full bg-white rounded-lg border border-gray-200 shadow-xs overflow-hidden flex flex-row">
      <ChatPane
        scenario={displayScenario}
        className="flex-1 min-w-0"
        extraContent={objectCard}
      />
      {panelOpen && !sent && (
        <ReviewInvitesPanel
          inline
          isOpen={panelOpen}
          onClose={() => setPanelOpen(false)}
          onSend={(count) => {
            setSentCount(count);
            setSent(true);
            setPanelOpen(false);
          }}
        />
      )}
    </div>
  );
}

// ─── Multiple provisioning layout ────────────────────────────────────────────

function MultipleProvisioningLayout({ scenario }: { scenario: NonNullable<ReturnType<typeof getScenario>> }) {
  const [confirmed, setConfirmed] = useState(false);

  const u1 = SALESFORCE_ONLY_USERS.find((u) => u.id === "sf2")!; // Marie Dalsgaard
  const u2 = SALESFORCE_ONLY_USERS.find((u) => u.id === "sf3")!; // Elise Allan
  const u3 = SALESFORCE_ONLY_USERS.find((u) => u.id === "sf4")!; // Victoria Reyes

  const displayScenario = confirmed
    ? {
        ...scenario,
        messages: [
          ...scenario.messages,
          { role: "user" as const, text: "Send invites." },
          {
            role: "assistant" as const,
            text: `Done. Invitations sent to **${u1.name}**, **${u2.name}**, and **${u3.name}**. They'll each receive an email to set up their accounts.`,
            card: {
              variant: "status" as const,
              statusMessage: `3 invitations sent · Member role`,
              statusTone: "success" as const,
            },
          },
        ],
      }
    : scenario;

  return (
    <div className="flex-1 h-full bg-white rounded-lg border border-gray-200 shadow-xs overflow-hidden flex flex-col">
      <ChatPane
        scenario={displayScenario}
        className="flex-1"
        bottomSlot={
          !confirmed ? (
            <AskUserInput
              isVisible={true}
              title="Send invites to 3 people as Member?"
              items={[
                { label: u1.name, sublabel: u1.email },
                { label: u2.name, sublabel: u2.email },
                { label: u3.name, sublabel: u3.email },
              ]}
              actions={[
                { label: "Send invites", variant: "primary", onClick: () => setConfirmed(true) },
                { label: "Cancel", variant: "secondary", onClick: () => {} },
              ]}
            />
          ) : undefined
        }
      />
    </div>
  );
}

// ─── Individual provisioning layout ──────────────────────────────────────────

function IndividualProvisioningLayout({ scenario }: { scenario: NonNullable<ReturnType<typeof getScenario>> }) {
  const [confirmed, setConfirmed] = useState(false);
  const newUser = SALESFORCE_ONLY_USERS.find((u) => u.id === "sf1")!;

  const displayScenario = confirmed
    ? {
        ...scenario,
        messages: [
          ...scenario.messages,
          { role: "user" as const, text: "Send invite." },
          {
            role: "assistant" as const,
            text: `Done. Invitation sent to **${newUser.email}**.`,
            card: {
              variant: "status" as const,
              statusMessage: `Invitation sent to ${newUser.name} · Member role`,
              statusTone: "success" as const,
            },
          },
        ],
      }
    : scenario;

  return (
    <div className="flex-1 h-full bg-white rounded-lg border border-gray-200 shadow-xs overflow-hidden flex flex-col">
      <ChatPane
        scenario={displayScenario}
        className="flex-1"
        bottomSlot={
          !confirmed ? (
            <AskUserInput
              isVisible={true}
              title={`Send invite to ${newUser.name} as Member?`}
              items={[{ label: newUser.name, sublabel: newUser.email }]}
              actions={[
                { label: "Send invite", icon: <SendHorizontal size={13} />, variant: "primary", onClick: () => setConfirmed(true) },
                { label: "Cancel", variant: "secondary", onClick: () => {} },
              ]}
            />
          ) : undefined
        }
      />
    </div>
  );
}

// ─── Promote-to-admin layout ──────────────────────────────────────────────────

function PromoteToAdminLayout({ scenario }: { scenario: NonNullable<ReturnType<typeof getScenario>> }) {
  const [confirmed, setConfirmed] = useState(false);
  const target = WORKSPACE_MEMBERS.find((u) => u.id === "u3")!; // Marcus Webb

  const displayScenario = confirmed
    ? {
        ...scenario,
        messages: [
          ...scenario.messages,
          { role: "user" as const, text: "Yes, promote them." },
          {
            role: "assistant" as const,
            text: `${target.name} is now an **Admin**. They can manage workspace settings, billing, and other members.`,
            card: {
              variant: "status" as const,
              statusMessage: `${target.name} promoted to Admin`,
              statusTone: "success" as const,
            },
          },
        ],
      }
    : scenario;

  return (
    <div className="flex-1 h-full bg-white rounded-lg border border-gray-200 shadow-xs overflow-hidden flex flex-col">
      <ChatPane
        scenario={displayScenario}
        className="flex-1"
        bottomSlot={
          !confirmed ? (
            <RoleChangeConfirmCard
              title="Promote to Admin?"
              initials="MW"
              name={target.name}
              email={target.email}
              fromRole="Member"
              fromRoleStyle="bg-white border border-gray-200 text-gray-600"
              toRole="Admin"
              toRoleStyle="bg-gray-900 text-white"
              context="Admins have full workspace access including billing, settings, and member management."
              onConfirm={() => setConfirmed(true)}
            />
          ) : undefined
        }
      />
    </div>
  );
}

// ─── Shared role-change confirm card shell ────────────────────────────────────

function RoleChangeConfirmCard({
  title,
  initials,
  name,
  email,
  teamName,
  fromRole,
  fromRoleStyle,
  toRole,
  toRoleStyle,
  context,
  onConfirm,
}: {
  title: string;
  initials: string;
  name: string;
  email: string;
  teamName?: string;
  fromRole: string;
  fromRoleStyle: string;
  toRole: string;
  toRoleStyle: string;
  context: string;
  onConfirm: () => void;
}) {
  return (
    <div className="px-4">
      <div className="max-w-4xl mx-auto w-full flex flex-col gap-2">
        <div
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "16px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)",
            padding: "16px 20px",
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-900">{title}</p>
            <button onClick={() => {}} className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
              <XIcon size={14} weight="bold" />
            </button>
          </div>

          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 text-[11px] font-semibold text-gray-600">
              {initials}
            </div>
            <div>
              <p className="text-sm text-gray-800">{name}</p>
              <p className="text-xs text-gray-400 mt-0.5">{email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-2.5">
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${fromRoleStyle}`}>
              {fromRole}
            </span>
            <span className="text-gray-400 text-xs">→</span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${toRoleStyle}`}>
              {toRole}
            </span>
            {teamName && (
              <span className="text-xs text-gray-400">· {teamName}</span>
            )}
          </div>

          <p className="text-xs text-gray-400 mb-4 leading-relaxed">{context}</p>

          <div className="h-px bg-gray-200 -mx-5 mb-3" />

          <div className="flex justify-end gap-2">
            <button onClick={() => {}} className="border border-gray-200 text-gray-700 text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
              Cancel
            </button>
            <button onClick={onConfirm} className="bg-gray-900 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer">
              Confirm
            </button>
          </div>
        </div>

        <div className="rounded-[17px] p-px bg-gray-200">
          <div className="flex flex-col bg-white rounded-[15px]">
            <div className="px-4 py-3">
              <span className="text-sm text-gray-500">Tell Von what to configure...</span>
            </div>
            <div className="flex items-center justify-between px-3 pb-2.5 pt-1">
              <div className="w-7 h-7 rounded-full bg-gray-200" />
              <div className="w-7 h-7 rounded-full bg-gray-200" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Make-team-admin layout ───────────────────────────────────────────────────

function MakeTeamAdminLayout({ scenario }: { scenario: NonNullable<ReturnType<typeof getScenario>> }) {
  const [confirmed, setConfirmed] = useState(false);
  const target = WORKSPACE_MEMBERS.find((u) => u.id === "u3")!; // Marcus Webb

  const displayScenario = confirmed
    ? {
        ...scenario,
        messages: [
          ...scenario.messages,
          { role: "user" as const, text: "Yes, do it." },
          {
            role: "assistant" as const,
            text: `${target.name} is now a Team Admin of **${es.name}**.`,
            card: {
              variant: "status" as const,
              statusMessage: `${target.name} promoted to Team Admin`,
              statusTone: "success" as const,
            },
          },
        ],
      }
    : scenario;

  return (
    <div className="flex-1 h-full bg-white rounded-lg border border-gray-200 shadow-xs overflow-hidden flex flex-col">
      <ChatPane
        scenario={displayScenario}
        className="flex-1"
        bottomSlot={
          !confirmed ? (
            <RoleChangeConfirmCard
              title={`Make Team Admin of ${es.name}?`}
              initials="MW"
              name={target.name}
              email={target.email}
              teamName={es.name}
              fromRole="Member"
              fromRoleStyle="bg-white border border-gray-200 text-gray-600"
              toRole="Team Admin"
              toRoleStyle="bg-gray-900 text-white"
              context="Team Admins can manage team membership and see team-scoped memory."
              onConfirm={() => setConfirmed(true)}
            />
          ) : undefined
        }
      />
    </div>
  );
}

// ─── Remove-team-admin layout ─────────────────────────────────────────────────

function RemoveTeamAdminLayout({ scenario }: { scenario: NonNullable<ReturnType<typeof getScenario>> }) {
  const [confirmed, setConfirmed] = useState(false);
  const target = WORKSPACE_MEMBERS.find((u) => u.id === "u2")!; // Elena Vasquez

  const displayScenario = confirmed
    ? {
        ...scenario,
        messages: [
          ...scenario.messages,
          { role: "user" as const, text: "Confirm." },
          {
            role: "assistant" as const,
            text: `Done. ${target.name} is now a regular member of **${es.name}**.`,
            card: {
              variant: "status" as const,
              statusMessage: `${target.name}'s Team Admin role removed`,
              statusTone: "success" as const,
            },
          },
        ],
      }
    : scenario;

  return (
    <div className="flex-1 h-full bg-white rounded-lg border border-gray-200 shadow-xs overflow-hidden flex flex-col">
      <ChatPane
        scenario={displayScenario}
        className="flex-1"
        bottomSlot={
          !confirmed ? (
            <RoleChangeConfirmCard
              title={`Remove Team Admin from ${es.name}?`}
              initials="EV"
              name={target.name}
              email={target.email}
              teamName={es.name}
              fromRole="Team Admin"
              fromRoleStyle="bg-gray-900 text-white"
              toRole="Member"
              toRoleStyle="bg-white border border-gray-200 text-gray-600"
              context={`They'll remain a member of ${es.name} but lose team admin privileges.`}
              onConfirm={() => setConfirmed(true)}
            />
          ) : undefined
        }
      />
    </div>
  );
}

// ─── Demote-to-member layout ──────────────────────────────────────────────────

function DemoteToMemberLayout({ scenario }: { scenario: NonNullable<ReturnType<typeof getScenario>> }) {
  const [confirmed, setConfirmed] = useState(false);
  const target = WORKSPACE_MEMBERS.find((u) => u.id === "u1")!; // Sam Whitfield

  const displayScenario = confirmed
    ? {
        ...scenario,
        messages: [
          ...scenario.messages,
          { role: "user" as const, text: "Yes, demote them." },
          {
            role: "assistant" as const,
            text: `${target.name} is now a **Member**. They no longer have admin privileges.`,
            card: {
              variant: "status" as const,
              statusMessage: `${target.name} demoted to Member`,
              statusTone: "success" as const,
            },
          },
        ],
      }
    : scenario;

  return (
    <div className="flex-1 h-full bg-white rounded-lg border border-gray-200 shadow-xs overflow-hidden flex flex-col">
      <ChatPane
        scenario={displayScenario}
        className="flex-1"
        bottomSlot={
          !confirmed ? (
            <RoleChangeConfirmCard
              title="Demote to Member?"
              initials="SW"
              name={target.name}
              email={target.email}
              fromRole="Admin"
              fromRoleStyle="bg-gray-900 text-white"
              toRole="Member"
              toRoleStyle="bg-white border border-gray-200 text-gray-600"
              context="They'll lose access to billing, workspace settings, and the ability to manage other members."
              onConfirm={() => setConfirmed(true)}
            />
          ) : undefined
        }
      />
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  const firstScenario = SCENARIOS[0];
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-8">
      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <FlaskIcon size={22} className="text-gray-400" weight="regular" />
      </div>
      <p className="text-base font-medium text-gray-800">Select a prototype flow</p>
      <p className="text-sm text-gray-400 mt-1.5 max-w-[320px]">
        Choose a scenario from the sidebar to see it play out here.
      </p>
      <p className="text-xs text-gray-400 mt-4">
        Start with &ldquo;{firstScenario.label}&rdquo; →
      </p>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Prototype() {
  const { scenarioId } = useParams<{ scenarioId: string }>();
  const bareId = scenarioId?.replace(/^prototype-/, "") ?? "";
  const scenario = getScenario(bareId);

  if (!scenario) {
    return (
      <div className="flex-1 h-full bg-white rounded-lg border border-gray-200 shadow-xs overflow-hidden">
        <EmptyState />
      </div>
    );
  }

  if (scenario.id === "create-group" || scenario.id === "create-group-guided") {
    return <CreateGroupLayout key={scenario.id} scenario={scenario} />;
  }

  if (scenario.id === "inspect-group") {
    return <InspectGroupLayout scenario={scenario} />;
  }

  if (scenario.id === "add-users-to-group") {
    return <AddUsersToGroupLayout scenario={scenario} />;
  }

  if (scenario.id === "multiple-provisioning") {
    return <MultipleProvisioningLayout scenario={scenario} />;
  }

  if (scenario.id === "bulk-provisioning") {
    return <BulkProvisioningLayout scenario={scenario} />;
  }

  if (scenario.id === "individual-provisioning") {
    return <IndividualProvisioningLayout scenario={scenario} />;
  }

  if (scenario.id === "promote-to-admin") {
    return <PromoteToAdminLayout scenario={scenario} />;
  }

  if (scenario.id === "demote-to-member") {
    return <DemoteToMemberLayout scenario={scenario} />;
  }

  if (scenario.id === "make-group-admin") {
    return <MakeTeamAdminLayout scenario={scenario} />;
  }

  if (scenario.id === "remove-group-admin") {
    return <RemoveTeamAdminLayout scenario={scenario} />;
  }

  // All other scenarios: single-column chat
  return (
    <div className="flex-1 h-full bg-white rounded-lg border border-gray-200 shadow-xs overflow-hidden flex flex-col">
      <ChatPane scenario={scenario} className="flex-1" />
    </div>
  );
}
