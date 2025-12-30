import React from "react";

export interface ChipProps {
  /**
   * Chip variant determining color scheme
   */
  variant: "workspace" | "personal" | "connected";

  /**
   * Size of the chip
   * @default 'small'
   */
  size?: "small" | "medium";
}

/**
 * Chip component for displaying integration status badges
 *
 * @example
 * ```tsx
 * <Chip variant="workspace" />
 * <Chip variant="personal" size="medium" />
 * <Chip variant="connected" />
 * ```
 */
export const Chip: React.FC<ChipProps> = ({ variant, size = "small" }) => {
  const getVariantStyles = () => {
    switch (variant) {
      case "workspace":
        return "bg-purple-100 text-purple-700";
      case "personal":
        return "bg-blue-100 text-blue-700";
      case "connected":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case "small":
        return "px-2 py-0.5 text-xs";
      case "medium":
        return "px-3 py-1 text-sm";
      default:
        return "px-2 py-0.5 text-xs";
    }
  };

  const getLabel = () => {
    switch (variant) {
      case "workspace":
        return "Workspace";
      case "personal":
        return "Personal";
      case "connected":
        return "Connected";
      default:
        return "";
    }
  };

  return (
    <span
      className={`
        inline-flex items-center rounded-full font-medium
        ${getVariantStyles()}
        ${getSizeStyles()}
      `}
    >
      {getLabel()}
    </span>
  );
};

export default Chip;
