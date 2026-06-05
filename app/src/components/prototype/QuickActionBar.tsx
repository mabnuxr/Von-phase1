/**
 * QuickActionBar — replaces the chat input with a row of action pills.
 * When isVisible=false renders a disabled input bar placeholder instead.
 */

export interface QuickAction {
  label: string;
  variant: "primary" | "secondary" | "danger";
  onClick: () => void;
}

export interface QuickActionBarProps {
  actions: QuickAction[];
  isVisible: boolean;
  helperText?: string;
}

const PILL_STYLES: Record<QuickAction["variant"], string> = {
  primary:   "bg-gray-900 text-white border border-gray-900 hover:bg-gray-800",
  secondary: "bg-white text-gray-800 border border-gray-300 hover:bg-gray-50",
  danger:    "bg-white text-red-600 border border-red-300 hover:bg-red-50",
};

export function QuickActionBar({ actions, isVisible, helperText }: QuickActionBarProps) {
  if (!isVisible) {
    return (
      <div className="bg-white antialiased font-sf px-2">
        <div className="max-w-4xl mx-auto w-full">
          {/* Disabled input bar */}
          <div className="rounded-[17px] p-px bg-gray-200">
            <div className="flex flex-col bg-gray-50 rounded-[15px]">
              <div className="px-4 py-3">
                <span className="text-sm text-gray-400">Tell Von what to configure...</span>
              </div>
              <div className="flex items-center justify-between px-3 pb-2.5 pt-1">
                {/* Placeholder for attachment button */}
                <div className="w-7 h-7 rounded-full bg-gray-200" />
                {/* Placeholder for send button */}
                <div className="w-7 h-7 rounded-full bg-gray-200" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white antialiased font-sf px-2">
      <div className="max-w-4xl mx-auto w-full flex flex-col items-center gap-2 pb-3">
        {/* Helper text */}
        {helperText && (
          <p className="text-xs text-gray-400 text-center px-4">{helperText}</p>
        )}

        {/* Action pills */}
        <div className="flex items-center gap-2 flex-wrap justify-center">
          {actions.map((action, i) => (
            <button
              key={i}
              onClick={action.onClick}
              className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer ${PILL_STYLES[action.variant]}`}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
