import { Plus } from "./icons";

interface Props {
  query: string;
  promoted: boolean;
  onClick: () => void;
}

function Kbd({
  inverted,
  children,
}: {
  inverted: boolean;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center px-1.5 min-h-[18px] text-[10.5px] font-mono rounded ${
        inverted
          ? "text-white bg-white/10 border border-white/20"
          : "text-gray-600 bg-white border border-gray-200"
      }`}
    >
      {children}
    </span>
  );
}

export function SearchFallbackRow({ query, promoted, onClick }: Props) {
  if (promoted) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center gap-2.5 px-4 py-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors text-left"
      >
        <Plus size={16} weight="bold" />
        <span className="flex-1 truncate">
          No matches — start a new chat with{" "}
          <span className="font-semibold">&ldquo;{query}&rdquo;</span>
        </span>
        <Kbd inverted>⌘</Kbd>
        <Kbd inverted>↵</Kbd>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2.5 px-4 py-2.5 border-t border-gray-100 text-sm text-gray-600 hover:bg-gray-50 transition-colors text-left"
    >
      <Plus size={16} className="text-gray-500" />
      <span className="flex-1 truncate">
        Start new chat:{" "}
        <span className="font-medium text-gray-900">&ldquo;{query}&rdquo;</span>
      </span>
      <Kbd inverted={false}>⌘</Kbd>
      <Kbd inverted={false}>↵</Kbd>
    </button>
  );
}
