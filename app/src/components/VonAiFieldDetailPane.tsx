import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import useAiFieldsStore from "../store/vonAiFieldsStore";
import { AIFieldFilterBlock } from "./ai-fields/AIFieldFilterBlock";
import { useAiField, useAiFieldConversations } from "../hooks/useVonAiFields";
import { useUserPusherChannel } from "../hooks/useUserPusherChannel";
import { useAiFieldEvents } from "../hooks/useAiFieldEvents";
import { useUser } from "../hooks/useUser";
import { AIFieldPlayground } from "./ai-fields/AIFieldPlayground";
import { DataSources } from "@vonlabs/design-components";
import type { DataSource, DataSourceIcon } from "@vonlabs/design-components";
import {
  ArrowLeftIcon,
  ClockIcon,
  ChatCircleDotsIcon,
  CaretDownIcon,
  PlusIcon,
} from "@phosphor-icons/react";

const SOURCE_CONFIG: Record<string, { name: string; icon: DataSourceIcon }> = {
  crm: { name: "CRM", icon: "salesforce" },
  calls: { name: "Calls", icon: "calls" },
  emails: { name: "Emails", icon: "emails" },
};

function mapSourcesToDataSources(sources: string[]): DataSource[] {
  return sources.map((s) => {
    const config = SOURCE_CONFIG[s.toLowerCase()];
    return {
      id: s,
      name: config?.name ?? s.charAt(0).toUpperCase() + s.slice(1),
      icon: config?.icon ?? "database",
      objects: [],
    };
  });
}

interface VonAiFieldDetailPageProps {
  fieldId: string;
  onBack: () => void;
}

export function VonAiFieldDetailPane({
  fieldId,
  onBack,
}: VonAiFieldDetailPageProps) {
  const navigate = useNavigate();
  const { openRunHistory, clearPlaygroundOpps } = useAiFieldsStore();
  const [chatPickerOpen, setChatPickerOpen] = useState(false);
  const chatPickerRef = useRef<HTMLDivElement>(null);

  // Clear playground state when opening a field detail
  useEffect(() => {
    clearPlaygroundOpps();
  }, [fieldId, clearPlaygroundOpps]);

  // Close chat picker on outside click
  useEffect(() => {
    if (!chatPickerOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (
        chatPickerRef.current &&
        !chatPickerRef.current.contains(e.target as Node)
      ) {
        setChatPickerOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [chatPickerOpen]);

  const { user } = useUser();
  const { data: convoData } = useAiFieldConversations(fieldId);
  const conversations = convoData?.data ?? [];

  const { data: field, isLoading } = useAiField(fieldId);

  // Use user channel for real-time playground/activate events
  const { channel } = useUserPusherChannel({
    tenantId: user?.tenantId,
    userId: user?.id,
  });
  useAiFieldEvents(channel);

  const statusBadge = () => {
    if (!field) return null;
    switch (field.status) {
      case "live":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-green-700 border border-green-200">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            Live
          </span>
        );
      case "disabled":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-gray-600 border border-gray-200">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
            Disabled
          </span>
        );
      case "draft":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Draft
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full p-2">
      {/* Header */}
      <div className="px-4 pt-4 pb-4 border-b border-gray-200 shrink-0">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors cursor-pointer mb-4"
        >
          <ArrowLeftIcon size={14} />
          Back to AI Fields
        </button>

        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-semibold text-gray-900 m-0">
              {isLoading
                ? "Loading..."
                : (field?.displayName ?? field?.name ?? "Field Detail")}
            </h2>
            {!isLoading && field && (
              <div className="flex items-center gap-3 mt-3 flex-wrap">
                {statusBadge()}
                {field.sources.length > 0 && (
                  <DataSources
                    sources={mapSourcesToDataSources(field.sources)}
                  />
                )}
                {field.createdAt && (
                  <span className="text-xs text-gray-400">
                    Created{" "}
                    {new Date(field.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => openRunHistory(fieldId)}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              title="Run History"
            >
              <ClockIcon size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto settings-scrollbar px-6 py-5">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-sm text-gray-500">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400 mb-3" />
            Loading field...
          </div>
        ) : field ? (
          <div className="space-y-6 max-w-4xl mx-auto">
            {/* Prompt + output types (read-only) */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1">
                Prompt
              </label>
              <div className="w-full px-3 py-2.5 text-sm text-gray-700 border border-gray-200 rounded-lg bg-gray-50 whitespace-pre-wrap font-mono min-h-[80px]">
                {field.description || "\u2014"}
              </div>
              {field.columnsToGenerate.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap mt-2">
                  {field.columnsToGenerate.map((col) => (
                    <span
                      key={col.name}
                      className="inline-flex items-center px-2 py-0.5 text-xs font-medium text-gray-500 bg-gray-100 rounded"
                    >
                      {col.type}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Filter (read-only, if present) */}
            {field.displayFilter && field.displayFilter.length > 0 && (
              <AIFieldFilterBlock conditions={field.displayFilter} />
            )}

            {/* Playground */}
            <div className="p-5 bg-gray-50 border border-gray-200 rounded-xl">
              <AIFieldPlayground
                columnsToGenerate={field.columnsToGenerate}
                sources={field.sources}
                opportunityFilter={field.opportunityFilter}
              />
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-500 text-center py-16">
            Field not found.
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-gray-200 shrink-0 flex items-center justify-between">
        <button
          onClick={onBack}
          className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <div className="relative" ref={chatPickerRef}>
          <button
            onClick={() => setChatPickerOpen(!chatPickerOpen)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
          >
            <ChatCircleDotsIcon size={14} />
            Edit in chat
            <CaretDownIcon size={12} />
          </button>

          {chatPickerOpen && (
            <div className="absolute bottom-full mb-2 right-0 w-[300px] bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-1">
              <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-gray-400">
                Recent conversations
              </div>
              {conversations.length > 0 ? (
                conversations.slice(0, 5).map((c) => (
                  <button
                    key={c.conversationId}
                    onClick={() => {
                      navigate(
                        `/chat/${c.conversationId}?aiFieldId=${fieldId}`,
                      );
                      setChatPickerOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md cursor-pointer truncate"
                  >
                    {c.title || "Untitled conversation"}
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-xs text-gray-400">
                  No conversations yet
                </div>
              )}
              <div className="h-px bg-gray-100 my-1" />
              <button
                onClick={() => {
                  navigate(`/chat?aiFieldId=${fieldId}`);
                  setChatPickerOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md cursor-pointer"
              >
                <PlusIcon size={12} />
                New chat about this field
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
