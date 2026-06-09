import { useState } from "react";
import { useParams } from "react-router-dom";
import { SparkleIcon, FlaskIcon, UsersFourIcon } from "@phosphor-icons/react";
import { ChatCard } from "../components/prototype/ChatCard";
import { QuickActionBar } from "../components/prototype/QuickActionBar";
import { TeamDetailPanel, type TeamDetailData } from "../components/prototype/TeamDetailPanel";
import { SCENARIOS, getScenario, type ScenarioMessage } from "../components/prototype/scenarios";
import { WORKSPACE_MEMBERS, TEAMS } from "../mocks/prototypeData";

// ─── Von / User avatars ───────────────────────────────────────────────────────

function VonAvatar() {
  return (
    <div className="w-7 h-7 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0">
      <SparkleIcon size={14} className="text-white" weight="fill" />
    </div>
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

function TeamCard({ name, memberCount, status, isOpen, onClick }: {
  name: string;
  memberCount: number;
  status: string;
  isOpen: boolean;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3 w-full max-w-sm text-left border border-gray-200 rounded-xl px-4 py-3 hover:bg-gray-50 hover:border-gray-300 transition-all cursor-pointer"
    >
      <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
        <UsersFourIcon size={17} className="text-violet-600" weight="fill" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900">{name}</p>
        <p className="text-xs text-gray-400 mt-0.5">{memberCount} members · {status}</p>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        className="px-2.5 py-1 text-xs font-medium rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 flex-shrink-0"
      >
        {isOpen ? "Hide" : "Show"}
      </button>
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
  if (card.variant === "team" && card.teamName) {
    return (
      <TeamCard
        name={card.teamName}
        memberCount={card.teamMemberCount ?? 0}
        status={card.teamStatus ?? "Active"}
        isOpen={isPanelOpen ?? false}
        onClick={onTeamCardClick ?? (() => {})}
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

function ChatPane({ scenario, className = "", onTeamCardClick, isPanelOpen, bottomSlot }: {
  scenario: NonNullable<ReturnType<typeof getScenario>>;
  className?: string;
  onTeamCardClick?: () => void;
  isPanelOpen?: boolean;
  bottomSlot?: React.ReactNode;
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

  return (
    <div className="flex-1 h-full bg-white rounded-lg border border-gray-200 shadow-xs overflow-hidden flex flex-row">
      <ChatPane scenario={scenario} className="flex-1 min-w-0 border-r border-gray-100" isPanelOpen={true} />
      <TeamDetailPanel
        inline
        isOpen
        onClose={() => {}}
        mode="review"
        team={ENTERPRISE_SALES_TEAM}
        statusOverride={panelStatus}
        defaultFilterExpanded
        onCommit={() => setPanelStatus("active")}
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

// ─── Add-users-to-group layout (chat + QuickActionBar confirmation) ───────────

function AddUsersToGroupLayout({ scenario }: { scenario: NonNullable<ReturnType<typeof getScenario>> }) {
  const t1 = WORKSPACE_MEMBERS.find((u) => u.id === "u6")!;
  const t2 = WORKSPACE_MEMBERS.find((u) => u.id === "u7")!;

  return (
    <div className="flex-1 h-full bg-white rounded-lg border border-gray-200 shadow-xs overflow-hidden flex flex-col">
      <ChatPane
        scenario={scenario}
        className="flex-1"
        bottomSlot={
          <QuickActionBar
            isVisible={true}
            title="Add to Enterprise Sales?"
            items={[
              { label: t1.name, sublabel: t1.email },
              { label: t2.name, sublabel: t2.email },
            ]}
            actions={[
              { label: "Add to team", variant: "primary", onClick: () => {} },
              { label: "Cancel", variant: "secondary", onClick: () => {} },
            ]}
          />
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

  if (scenario.id === "create-group") {
    return <CreateGroupLayout scenario={scenario} />;
  }

  if (scenario.id === "inspect-group") {
    return <InspectGroupLayout scenario={scenario} />;
  }

  if (scenario.id === "add-users-to-group") {
    return <AddUsersToGroupLayout scenario={scenario} />;
  }

  // All other scenarios: single-column chat
  return (
    <div className="flex-1 h-full bg-white rounded-lg border border-gray-200 shadow-xs overflow-hidden flex flex-col">
      <ChatPane scenario={scenario} className="flex-1" />
    </div>
  );
}
