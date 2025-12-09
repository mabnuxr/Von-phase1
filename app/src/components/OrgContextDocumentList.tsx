import { FileTextIcon } from "@phosphor-icons/react";
import type { OrgContextDocument } from "../store/preferencesStore";

interface OrgContextDocumentListProps {
  documents: OrgContextDocument[];
  selectedDocumentId: string;
  onSelectDocument: (id: string) => void;
}

export function OrgContextDocumentList({
  documents,
  selectedDocumentId,
  onSelectDocument,
}: OrgContextDocumentListProps) {
  return (
    <div className="flex flex-col h-full">
      {/* List of documents */}
      <div className="flex-1 overflow-y-auto settings-scrollbar">
        <div className="py-2">
          {documents.map((doc) => {
            const isSelected = doc.id === selectedDocumentId;

            return (
              <button
                key={doc.id}
                onClick={() => onSelectDocument(doc.id)}
                className={`
                  w-full text-left px-3 py-2.5 cursor-pointer
                  transition-all duration-150
                  ${
                    isSelected
                      ? "bg-indigo-50 border-l-2 border-indigo-500"
                      : "bg-transparent border-l-2 border-transparent hover:bg-gray-50"
                  }
                `}
              >
                <div className="flex items-start gap-2.5">
                  <FileTextIcon
                    size={18}
                    weight={isSelected ? "fill" : "regular"}
                    className={`flex-shrink-0 mt-0.5 ${
                      isSelected ? "text-indigo-600" : "text-gray-400"
                    }`}
                  />
                  <span
                    className={`text-sm leading-snug ${
                      isSelected
                        ? "text-indigo-900 font-medium"
                        : "text-gray-700"
                    }`}
                  >
                    {doc.title}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default OrgContextDocumentList;
