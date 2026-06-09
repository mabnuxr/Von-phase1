import { X } from "@phosphor-icons/react";

export interface QuickAction {
  label: string;
  icon?: React.ReactNode;
  variant: "primary" | "secondary" | "danger";
  onClick: () => void;
}

export interface AskUserInputProps {
  title: string;
  items?: Array<{ label: string; sublabel?: string }>;
  actions: QuickAction[];
  isVisible: boolean;
}

const BTN: Record<QuickAction["variant"], string> = {
  primary:   "bg-gray-900 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer",
  secondary: "border border-gray-200 text-gray-700 text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer",
  danger:    "border border-red-200 text-red-600 text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer",
};

function getInitials(name: string): string {
  const parts = name.trim().split(" ");
  return (parts.length >= 2 ? parts[0][0] + parts[parts.length - 1][0] : name.slice(0, 2))
    .toUpperCase();
}

function DisabledInput() {
  return (
    <div className="rounded-[17px] p-px bg-gray-200">
      <div className="flex flex-col bg-gray-50 rounded-[15px]">
        <div className="px-4 py-3">
          <span className="text-sm text-gray-400">Tell Von what to configure...</span>
        </div>
        <div className="flex items-center justify-between px-3 pb-2.5 pt-1">
          <div className="w-7 h-7 rounded-full bg-gray-200" />
          <div className="w-7 h-7 rounded-full bg-gray-200" />
        </div>
      </div>
    </div>
  );
}

export function AskUserInput({ title, items, actions, isVisible }: AskUserInputProps) {
  if (!isVisible) {
    return (
      <div className="px-2">
        <div className="max-w-4xl mx-auto w-full">
          <DisabledInput />
        </div>
      </div>
    );
  }

  const cancelAction = actions.find((a) => a.variant === "secondary");

  return (
    <div className="px-4">
      <div className="max-w-4xl mx-auto w-full flex flex-col gap-2">
        {/* Confirmation card */}
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e5e7eb',
            borderLeft: '1px solid #e5e7eb',
            borderRadius: '16px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)',
            padding: '16px 20px',
          }}
        >
          {/* Title row with X close button */}
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-900">{title}</p>
            {cancelAction && (
              <button
                onClick={cancelAction.onClick}
                className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Items */}
          {items && items.length > 0 && (
            <div className="py-2">
              {items.map((item, i) => (
                <div key={i}>
                  {i > 0 && <div className="h-px bg-gray-100" />}
                  <div className="py-2 flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 text-[11px] font-semibold text-gray-600">
                      {getInitials(item.label)}
                    </div>
                    <div>
                      <p className="text-sm text-gray-800">{item.label}</p>
                      {item.sublabel && (
                        <p className="text-xs text-gray-400 mt-0.5">{item.sublabel}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Divider between items and actions */}
          <div className="h-px bg-gray-200 -mx-5" />

          {/* Actions */}
          <div className="pt-3 flex justify-end gap-2">
            {actions.map((action, i) => (
              <button key={i} onClick={action.onClick} className={`${BTN[action.variant]} inline-flex items-center gap-1.5`}>
                {action.label}
                {action.icon}
              </button>
            ))}
          </div>
        </div>

        {/* Input bar — active */}
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
