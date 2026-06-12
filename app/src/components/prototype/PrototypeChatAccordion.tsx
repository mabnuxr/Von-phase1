import { useState } from "react";
import { CaretRightIcon } from "@phosphor-icons/react";
import { PROTOTYPE_V1_ITEMS, PROTOTYPE_V2_ITEMS, PROTOTYPE_V3_ITEMS } from "./prototypeItems";

interface PrototypeChatAccordionProps {
  selectedItemId?: string;
  onItemClick: (id: string) => void;
}

interface AccordionSectionProps {
  label: string;
  items: Array<{ id: string; label: string }>;
  selectedItemId?: string;
  onItemClick: (id: string) => void;
}

function AccordionSection({ label, items, selectedItemId, onItemClick }: AccordionSectionProps) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      {/* Toggle row */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-1 px-2 py-1.5 rounded-xl text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
      >
        <CaretRightIcon
          size={11}
          weight="bold"
          className={`flex-shrink-0 transition-transform duration-150 ${open ? "rotate-90" : ""}`}
        />
        <span>{label}</span>
      </button>

      {/* Items */}
      {open && (
        <div className="pl-2">
          {items.map((item) => {
            const isSelected = item.id === selectedItemId;
            return (
              <button
                key={item.id}
                onClick={() => onItemClick(item.id)}
                className={`w-full flex items-center gap-2.5 px-2 h-8 rounded-xl text-sm cursor-pointer transition-colors truncate text-left ${
                  isSelected
                    ? "bg-gray-100 text-gray-900 font-medium"
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function PrototypeChatAccordion({ selectedItemId, onItemClick }: PrototypeChatAccordionProps) {
  return (
    <div className="mb-1">
      <AccordionSection
        label="Chat v1"
        items={PROTOTYPE_V1_ITEMS}
        selectedItemId={selectedItemId}
        onItemClick={onItemClick}
      />
      <AccordionSection
        label="Chat v2"
        items={PROTOTYPE_V2_ITEMS}
        selectedItemId={selectedItemId}
        onItemClick={onItemClick}
      />
      <AccordionSection
        label="Chat v3"
        items={PROTOTYPE_V3_ITEMS}
        selectedItemId={selectedItemId}
        onItemClick={onItemClick}
      />
    </div>
  );
}
