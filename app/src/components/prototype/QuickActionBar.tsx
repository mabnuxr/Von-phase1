export interface QuickAction {
  label: string;
  variant: "primary" | "secondary" | "danger";
  onClick: () => void;
}

export interface QuickActionBarProps {
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

export function QuickActionBar({ title, items, actions, isVisible }: QuickActionBarProps) {
  if (!isVisible) {
    return (
      <div className="bg-white px-2">
        <div className="max-w-4xl mx-auto w-full">
          <DisabledInput />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white px-4">
      <div className="max-w-4xl mx-auto w-full">
        {/* Confirmation card */}
        <div className="bg-white border border-gray-200 border-b-0 rounded-t-2xl shadow-md">
          {/* Title */}
          <p className="text-sm font-semibold text-gray-900 px-4 pt-4">{title}</p>

          {/* Items */}
          {items && items.length > 0 && (
            <div className="px-4 py-2">
              {items.map((item, i) => (
                <div key={i}>
                  {i > 0 && <div className="h-px bg-gray-100" />}
                  <div className="py-2">
                    <p className="text-sm text-gray-800">{item.label}</p>
                    {item.sublabel && (
                      <p className="text-xs text-gray-400 mt-0.5">{item.sublabel}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="px-4 pb-4 pt-3 flex justify-end gap-2">
            {actions.map((action, i) => (
              <button key={i} onClick={action.onClick} className={BTN[action.variant]}>
                {action.label}
              </button>
            ))}
          </div>
        </div>

        {/* Attached input bar */}
        <div className="border-x border-b border-gray-200 rounded-b-2xl bg-gray-50 flex items-center justify-between px-4 py-2.5">
          <span className="text-sm text-gray-400">Tell Von what to configure...</span>
          <div className="w-6 h-6 rounded-full bg-gray-200 flex-shrink-0" />
        </div>
      </div>
    </div>
  );
}
