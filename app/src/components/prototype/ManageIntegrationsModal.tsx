/**
 * ManageIntegrationsModal — browse + filter all integrations.
 * Clicking the Salesforce card drills into IntegrationDetail inline.
 */

import { useState } from "react";
import { XIcon, MagnifyingGlassIcon } from "@phosphor-icons/react";
import { IntegrationDetail } from "./IntegrationDetail";
import salesforceLogo from "../../assets/salesforce.svg";
import gongLogo from "../../assets/gong.svg";
import slackLogo from "../../assets/slack.svg";

// ─── Data ──────────────────────────────────────────────────────────────────────

interface IntegrationCard {
  id: string;
  name: string;
  description: string;
  category: string;
  enabled?: boolean;
  logo?: string;
  logoColor?: string;
  logoInitial?: string;
}

const CARDS: IntegrationCard[] = [
  {
    id: "salesforce",
    name: "Salesforce",
    description: "Pull CRM data into Von and write back updates from chat.",
    category: "CRM",
    enabled: true,
    logo: salesforceLogo,
  },
  {
    id: "google-calendar",
    name: "Google Calendar",
    description: "See upcoming meetings and attendees directly in Von.",
    category: "Calendar",
    enabled: true,
    logoColor: "bg-blue-100 text-blue-600",
    logoInitial: "G",
  },
  {
    id: "gong",
    name: "Gong",
    description: "Bring call recordings and insights into your workflows.",
    category: "Calls & Engagement",
    enabled: true,
    logo: gongLogo,
  },
  {
    id: "granola",
    name: "Granola",
    description: "Sync AI meeting notes directly into Von context.",
    category: "Note Takers",
    logoColor: "bg-green-100 text-green-700",
    logoInitial: "G",
  },
  {
    id: "google-drive",
    name: "Google Drive",
    description: "Search and reference files from your Drive in chat.",
    category: "Knowledge Base",
    logoColor: "bg-yellow-100 text-yellow-700",
    logoInitial: "D",
  },
  {
    id: "outreach",
    name: "Outreach",
    description: "Query sequences and prospect engagement data.",
    category: "Calls & Engagement",
    logoColor: "bg-violet-100 text-violet-700",
    logoInitial: "O",
  },
  {
    id: "salesloft",
    name: "Salesloft",
    description: "Surface cadence and engagement insights in Von.",
    category: "Calls & Engagement",
    logoColor: "bg-teal-100 text-teal-700",
    logoInitial: "S",
  },
  {
    id: "bigquery",
    name: "BigQuery",
    description: "Run natural language queries against your data warehouse.",
    category: "Data Warehouse",
    logoColor: "bg-blue-100 text-blue-700",
    logoInitial: "B",
  },
  {
    id: "pylon",
    name: "Pylon",
    description: "Pull customer support tickets and context into Von.",
    category: "Customer Support",
    logoColor: "bg-orange-100 text-orange-700",
    logoInitial: "P",
  },
  {
    id: "slack",
    name: "Slack",
    description: "Search messages and send Von updates to Slack channels.",
    category: "Communication",
    logo: slackLogo,
  },
  {
    id: "hubspot",
    name: "HubSpot",
    description: "Sync contacts and deals from HubSpot into Von.",
    category: "CRM",
    logoColor: "bg-orange-100 text-orange-600",
    logoInitial: "H",
  },
  {
    id: "calendly",
    name: "Calendly",
    description: "Check scheduling links and meeting status in Von.",
    category: "Calendar",
    logoColor: "bg-cyan-100 text-cyan-700",
    logoInitial: "C",
  },
];

const CATEGORIES = [
  "All",
  "Calendar",
  "Calls & Engagement",
  "Note Takers",
  "Knowledge Base",
  "Data Warehouse",
  "Customer Support",
  "Communication",
  "Operations",
  "Sales Intelligence",
  "CRM",
  "Product Analytics",
  "Engineering",
  "Partner Ecosystem",
  "Marketing Analytics",
  "Customer Feedback",
  "Call Recorder",
];

// ─── Logo helper ──────────────────────────────────────────────────────────────

function CardLogo({ card }: { card: IntegrationCard }) {
  if (card.logo) {
    return (
      <div className="w-10 h-10 rounded-xl border border-gray-100 overflow-hidden flex-shrink-0 bg-white flex items-center justify-center">
        <img src={card.logo} alt={card.name} className="w-7 h-7 object-contain" />
      </div>
    );
  }
  return (
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold ${card.logoColor}`}>
      {card.logoInitial}
    </div>
  );
}

// ─── Integration card ─────────────────────────────────────────────────────────

function IntCard({ card, onClick }: { card: IntegrationCard; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col gap-3 p-4 rounded-xl border border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm transition-all text-left cursor-pointer"
    >
      <div className="flex items-start justify-between gap-2">
        <CardLogo card={card} />
        {card.enabled && (
          <span className="text-[10px] font-semibold text-green-700 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded-md flex-shrink-0">
            Enabled
          </span>
        )}
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-900">{card.name}</p>
        <p className="text-[11px] text-gray-400 mt-0.5">Built by Von</p>
        <p className="text-xs text-gray-500 mt-1.5 leading-relaxed line-clamp-2">{card.description}</p>
      </div>
    </button>
  );
}

// ─── Main modal ───────────────────────────────────────────────────────────────

interface ManageIntegrationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ManageIntegrationsModal({ isOpen, onClose }: ManageIntegrationsModalProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [detailId, setDetailId] = useState<string | null>(null);

  if (!isOpen) return null;

  const filtered = CARDS.filter((c) => {
    const matchesCategory = selectedCategory === "All" || c.category === selectedCategory;
    const matchesSearch =
      search === "" ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Modal box */}
      <div className="bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden w-[900px] max-w-[95vw] h-[640px] max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-base font-semibold text-gray-900">Manage Integrations</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer text-gray-500"
          >
            <XIcon size={16} weight="bold" />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 min-h-0">

          {/* Left sidebar */}
          <div className="w-48 flex-shrink-0 border-r border-gray-100 overflow-y-auto py-3">
            {CATEGORIES.map((cat) => {
              const count = cat === "All" ? CARDS.length : CARDS.filter((c) => c.category === cat).length;
              if (count === 0 && cat !== "All") {
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`w-full text-left px-4 py-1.5 text-xs transition-colors cursor-pointer ${
                      selectedCategory === cat
                        ? "text-gray-900 font-semibold bg-gray-50"
                        : "text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    {cat}
                  </button>
                );
              }
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`w-full text-left px-4 py-1.5 text-xs transition-colors cursor-pointer flex items-center justify-between ${
                    selectedCategory === cat
                      ? "text-gray-900 font-semibold bg-gray-50"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <span>{cat}</span>
                  {count > 0 && (
                    <span className={`text-[10px] ${selectedCategory === cat ? "text-gray-500" : "text-gray-400"}`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Right panel */}
          {detailId === "salesforce" ? (
            <div className="flex-1 min-w-0 overflow-y-auto">
              <IntegrationDetail onBack={() => setDetailId(null)} />
            </div>
          ) : (
            <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
              {/* Search */}
              <div className="px-5 pt-4 pb-3 flex-shrink-0">
                <div className="relative">
                  <MagnifyingGlassIcon size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search integrations..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 transition-colors placeholder:text-gray-400"
                  />
                </div>
              </div>

              {/* Grid */}
              <div className="flex-1 overflow-y-auto px-5 pb-5">
                {filtered.length === 0 ? (
                  <p className="text-sm text-gray-400 mt-8 text-center">No integrations found.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {filtered.map((card) => (
                      <IntCard
                        key={card.id}
                        card={card}
                        onClick={() => {
                          if (card.id === "salesforce") setDetailId("salesforce");
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
