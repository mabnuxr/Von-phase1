import { useState, useRef, useEffect, useCallback } from "react";
import useVonAiFieldsStore from "../store/vonAiFieldsStore";
import { useUpdateIqColumn } from "../hooks/useVonAiFields";
import type { IqColumn } from "../types/vonAiFields";
import { DotsThreeIcon } from "@phosphor-icons/react";

function formatTimeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  if (Number.isNaN(then)) return "—";
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hr ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay === 1) return "1 day ago";
  return `${diffDay} days ago`;
}

interface VonAiFieldRowProps {
  column: IqColumn;
}

export function VonAiFieldRow({ column }: VonAiFieldRowProps) {
  const { setPaneMode, setDeletingColumnId } = useVonAiFieldsStore();
  const updateMutation = useUpdateIqColumn();
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(
    null,
  );
  const menuRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  const openMenu = useCallback(() => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const menuHeight = 160; // approximate
      const top =
        spaceBelow < menuHeight ? rect.top - menuHeight : rect.bottom + 4;
      const menuWidth = 160;
      const left = Math.max(
        8,
        Math.min(window.innerWidth - menuWidth - 8, rect.right - menuWidth),
      );
      setMenuPos({ top, left });
    }
    setMenuOpen(true);
  }, []);

  // Close menu on outside click or scroll
  useEffect(() => {
    if (!menuOpen) return;
    const close = () => setMenuOpen(false);
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        close();
      }
    };
    document.addEventListener("mousedown", handleClick);
    window.addEventListener("scroll", close, true);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      window.removeEventListener("scroll", close, true);
    };
  }, [menuOpen]);

  const handleActivate = () => {
    updateMutation.mutate({
      columnId: column.column_id,
      data: { status: "active" },
    });
  };

  const handlePause = () => {
    updateMutation.mutate({
      columnId: column.column_id,
      data: { status: "archived" },
    });
  };

  const handleMoveToDraft = () => {
    updateMutation.mutate({
      columnId: column.column_id,
      data: { status: "draft" },
    });
    setMenuOpen(false);
  };

  const statusCell = () => {
    if (column.status === "active") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-green-700 border border-green-200">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
          Active
        </span>
      );
    }
    if (column.status === "archived") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-gray-600 border border-gray-200">
          <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
          Paused
        </span>
      );
    }
    // Draft — show activate dropdown
    return (
      <button
        onClick={handleActivate}
        disabled={updateMutation.isPending}
        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-white bg-green-700 hover:bg-green-800 cursor-pointer disabled:opacity-50 transition-colors"
      >
        Activate ▾
      </button>
    );
  };

  const lastRun = column.updated_at ? formatTimeAgo(column.updated_at) : "—";

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      {/* Question */}
      <td className="px-6 py-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 m-0">
            {column.name}
          </p>
          <p className="text-xs text-gray-500 m-0 mt-0.5 truncate max-w-md font-mono">
            {column.prompt}
          </p>
        </div>
      </td>

      {/* Status */}
      <td className="px-4 py-4">{statusCell()}</td>

      {/* Matched */}
      <td className="px-4 py-4 text-right text-sm text-gray-700">—</td>

      {/* Completed */}
      <td className="px-4 py-4 text-right text-sm text-gray-700">—</td>

      {/* Last Run */}
      <td className="px-4 py-4 text-sm text-gray-500">
        {column.status === "draft" ? "—" : lastRun}
      </td>

      {/* Actions overflow */}
      <td className="px-4 py-4">
        <div ref={menuRef}>
          <button
            ref={btnRef}
            onClick={() => (menuOpen ? setMenuOpen(false) : openMenu())}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
          >
            <DotsThreeIcon size={20} weight="bold" />
          </button>

          {menuOpen && menuPos && (
            <div
              className="fixed w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1"
              style={{ top: menuPos.top, left: menuPos.left }}
            >
              <button
                onClick={() => {
                  setPaneMode("edit", column.column_id);
                  setMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                Edit
              </button>
              {column.status === "active" && (
                <button
                  onClick={() => {
                    handlePause();
                    setMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  Pause
                </button>
              )}
              {column.status === "archived" && (
                <button
                  onClick={() => {
                    handleActivate();
                    setMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  Activate
                </button>
              )}
              {column.status !== "draft" && (
                <button
                  onClick={handleMoveToDraft}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  Move to draft
                </button>
              )}
              <button
                onClick={() => {
                  setDeletingColumnId(column.column_id);
                  setMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}
