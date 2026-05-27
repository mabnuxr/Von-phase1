import { CaretRight as CaretRightIcon } from "@phosphor-icons/react";
import { AiFieldIcon } from "../icons/AiFieldIcon";
import { useAiField } from "../../hooks/useVonAiFields";
import useAiFieldsStore from "../../store/vonAiFieldsStore";
import type { AiFieldStatus } from "../../types/vonAiFields";

interface AIFieldArtifactCardProps {
  fieldId: string;
  name: string;
}

const STATUS_LABEL: Record<AiFieldStatus, string> = {
  draft: "Draft",
  live: "Live",
  disabled: "Disabled",
};

export function AIFieldArtifactCard({
  fieldId,
  name,
}: AIFieldArtifactCardProps) {
  // A hit in the keyed draft store means this card is an uncreated draft —
  // skip the backend fetch (the field isn't persisted yet).
  const isDraft = useAiFieldsStore((s) => !!s.draftAiFields[fieldId]);
  const { data: field } = useAiField(isDraft ? null : fieldId);
  const { openChatPanel } = useAiFieldsStore();

  const status = field?.status ?? "draft";

  return (
    <div
      onClick={() => openChatPanel(fieldId)}
      className="border border-gray-200 rounded-2xl px-3 py-3 flex items-center gap-3 hover:border-gray-200 shadow-xs transition-colors cursor-pointer mt-2"
    >
      <div className="shrink-0 w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center">
        <AiFieldIcon size={20} className="text-gray-500" />
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-gray-900 truncate m-0">
          {name}
        </h4>
        <p className="text-xs text-gray-500 truncate mt-0.5 m-0">
          AI Field &middot; {STATUS_LABEL[status]}
        </p>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            openChatPanel(fieldId);
          }}
          className="w-8 h-8 rounded-lg border border-gray-100 text-gray-800 hover:bg-gray-50 transition-colors flex items-center justify-center cursor-pointer"
          title="Open AI Field"
        >
          <CaretRightIcon size={16} weight="regular" />
        </button>
      </div>
    </div>
  );
}
