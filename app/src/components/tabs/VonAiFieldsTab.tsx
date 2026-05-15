import { useNavigate } from "react-router-dom";
import { PlusIcon } from "@phosphor-icons/react";
import { VonAiFieldsPanel } from "../VonAiFieldsPanel";

interface VonAiFieldsTabProps {
  onRowClick: (fieldId: string) => void;
}

export function VonAiFieldsTab({ onRowClick }: VonAiFieldsTabProps) {
  const navigate = useNavigate();

  // Sends the user to a fresh chat with a structured template the user
  // fills in. The two numbered prompts cover what the field should
  // compute and which records it should run on — matching how the AI
  // Field creation flow asks for those two pieces of information.
  //
  // Mirrors the SharedConversation → NewConversation router-state pattern.
  const handleCreate = () => {
    navigate("/chat/new", {
      state: {
        initialInput: [
          "Create an AI Field with the following details",
          "1. Information to compute (what Von should compute for each opp):",
          "2. Run criteria (which opps should this run on):",
        ].join("\n"),
      },
    });
  };

  return (
    <div className="flex flex-col h-full p-2">
      {/* Heading - Fixed */}
      <div className="">
        <div className="px-4 pt-4 pb-6 border-b border-gray-200">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Custom AI Fields
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Define questions that run automatically against matching
                records. Outputs become context Von uses in chat, filters, and
                exports.
              </p>
            </div>
            <button
              onClick={handleCreate}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors cursor-pointer shrink-0"
            >
              <PlusIcon size={14} weight="bold" />
              Create AI field
            </button>
          </div>
        </div>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 justify-center overflow-y-auto settings-scrollbar px-6">
        <div className="pt-6 pb-12 w-full max-w-4xl mx-auto">
          <VonAiFieldsPanel onRowClick={onRowClick} />
        </div>
      </div>

      {/* Footer note - pinned at the bottom, outside the scroll area */}
      <div className="border-t border-gray-200 px-6 py-3 shrink-0">
        <p className="text-xs text-gray-400 m-0 max-w-4xl mx-auto">
          AI Fields aren&apos;t shown as fields on records. Von uses them across
          chat and dashboards, and you can export by record with filters and
          time period.
        </p>
      </div>
    </div>
  );
}
