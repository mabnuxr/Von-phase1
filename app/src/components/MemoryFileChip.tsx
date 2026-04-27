import { useState } from "react";
import { motion } from "framer-motion";
import {
  XIcon,
  FileIcon,
  FileTextIcon,
  FileXlsIcon,
  FileCsvIcon,
  FilePdfIcon,
  FilePptIcon,
  FileDocIcon,
  FileImageIcon,
  FileCodeIcon,
} from "@phosphor-icons/react";
import type { FileAttachment, FileCategory } from "@vonlabs/design-components";

interface MemoryFileChipProps {
  attachment: FileAttachment;
  onRemove?: (id: string) => void;
  onClick?: () => void;
  removable?: boolean;
}

/**
 * Compact, fully-rounded file chip for memory attachments. Sized to match
 * the Attach file button (h-8) so chips and the button read as a single
 * visual family. Smooth width animation on hover (driven by framer-motion's
 * `layout` prop) keeps the X button reveal from jumping the layout.
 */
function getFileIcon(category: FileCategory, extension: string) {
  switch (category) {
    case "image":
      return FileImageIcon;
    case "spreadsheet":
      if (extension === "CSV") return FileCsvIcon;
      return FileXlsIcon;
    case "document":
      if (extension === "PDF") return FilePdfIcon;
      if (extension === "DOC" || extension === "DOCX") return FileDocIcon;
      return FileTextIcon;
    case "presentation":
      return FilePptIcon;
    case "text":
      if (extension === "JSON" || extension === "MD") return FileCodeIcon;
      return FileTextIcon;
    default:
      return FileIcon;
  }
}

function getIconColor(category: FileCategory, extension: string): string {
  switch (category) {
    case "document":
      if (extension === "PDF") return "text-red-500";
      if (extension === "DOC" || extension === "DOCX") return "text-blue-500";
      return "text-gray-500";
    case "spreadsheet":
      return "text-green-600";
    case "presentation":
      return "text-orange-500";
    case "image":
      return "text-purple-500";
    case "text":
      return "text-slate-500";
    default:
      return "text-gray-500";
  }
}

export function MemoryFileChip({
  attachment,
  onRemove,
  onClick,
  removable = true,
}: MemoryFileChipProps) {
  const [isHovered, setIsHovered] = useState(false);
  const Icon = getFileIcon(attachment.category, attachment.extension);
  const iconColor = getIconColor(attachment.category, attachment.extension);

  return (
    <motion.div
      layout
      transition={{ type: "spring", stiffness: 400, damping: 32, mass: 0.6 }}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`inline-flex items-center gap-1.5 h-8 max-w-[200px] px-2.5 rounded-full border border-gray-200/60 bg-white text-xs text-gray-800 cursor-pointer flex-shrink-0 ${
        isHovered ? "bg-gray-50" : ""
      }`}
      title={attachment.name}
    >
      <Icon
        size={14}
        weight="regular"
        className={`flex-shrink-0 ${iconColor}`}
      />
      <span className="truncate min-w-0">{attachment.name}</span>
      {removable && isHovered && (
        <motion.button
          layout
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.12 }}
          onClick={(e) => {
            e.stopPropagation();
            onRemove?.(attachment.id);
          }}
          className="flex-shrink-0 w-4 h-4 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors cursor-pointer"
          aria-label={`Remove ${attachment.name}`}
        >
          <XIcon size={10} weight="bold" className="text-gray-700" />
        </motion.button>
      )}
    </motion.div>
  );
}

export default MemoryFileChip;
