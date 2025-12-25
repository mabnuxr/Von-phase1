import { memo, type JSX } from "react";
import { motion } from "framer-motion";

interface SegmentedControlProps<T extends string> {
  options: Array<{ value: T; label: string }>;
  value: T;
  onChange: (value: T) => void;
  size?: "sm" | "md";
}

function SegmentedControlInner<T extends string>({
  options,
  value,
  onChange,
  size = "md",
}: SegmentedControlProps<T>) {
  const sizeClasses =
    size === "sm" ? "text-xs px-3 py-1" : "text-sm px-4 py-1.5";

  return (
    <div className="mt-2 inline-flex p-0.5 bg-gray-100 rounded-full relative">
      {options.map((option) => {
        const isActive = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`
              ${sizeClasses}
              font-medium rounded-full cursor-pointer relative z-10
              transition-colors duration-200
              ${isActive ? "text-white" : "text-gray-600 hover:text-gray-900"}
            `}
          >
            {isActive && (
              <motion.span
                layoutId="segmented-control-active"
                className="absolute inset-0 bg-gray-900 rounded-full -z-10"
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 35,
                }}
              />
            )}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export const SegmentedControl = memo(SegmentedControlInner) as <
  T extends string,
>(
  props: SegmentedControlProps<T>,
) => JSX.Element;
