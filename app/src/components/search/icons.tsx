import {
  ChatCircleDots,
  ChartBar,
  File as FileIcon,
  MagnifyingGlass,
  Plus,
  ShareNetwork,
  SquaresFour,
  Clock,
  X,
} from "@phosphor-icons/react";
import type { SearchResultType } from "../../types/search";

export {
  ChatCircleDots,
  ChartBar,
  FileIcon,
  MagnifyingGlass,
  Plus,
  ShareNetwork,
  SquaresFour,
  Clock,
  X,
};

export function ResultTypeIcon({
  type,
  className,
}: {
  type: SearchResultType;
  className?: string;
}) {
  const props = { size: 16, weight: "regular" as const, className };
  switch (type) {
    case "chat":
      return <ChatCircleDots {...props} />;
    case "dashboard":
      return <SquaresFour {...props} />;
    case "widget":
      return <ChartBar {...props} />;
    case "artifact":
      return <FileIcon {...props} />;
  }
}
