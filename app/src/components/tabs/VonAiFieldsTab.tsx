import { useNavigate } from "react-router-dom";
import { PlusIcon } from "@phosphor-icons/react";
import { VonAiFieldsPanel } from "../VonAiFieldsPanel";

interface VonAiFieldsTabProps {
  onRowClick: (fieldId: string) => void;
}

export function VonAiFieldsTab({ onRowClick }: VonAiFieldsTabProps) {
  const navigate = useNavigate();

  // Sends the user to a fresh chat with a starter prompt for creating an AI
  // field. The first sentence has a `___` blank for the field topic; the
  // second sentence pins the scope so the assistant knows the field runs
  // against the open-opps-this-quarter record set.
  //
  // Mirrors the SharedConversation → NewConversation router-state pattern.
  const handleCreate = () => {
    navigate("/chat/new", {
      state: {
        initialInput:
          "Create an AI field for ___. Run it on all open opportunities created in this quarter.",
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
    </div>
  );
}
