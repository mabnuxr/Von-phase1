import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import useAiFieldsStore from "../store/vonAiFieldsStore";
import {
  useActivateField,
  useDisableField,
  useAiFieldConversations,
} from "../hooks/useVonAiFields";
import type { AiField } from "../types/vonAiFields";
import { formatTimeAgo } from "../utils/formatTimeAgo";
import { DotsThreeIcon, CaretRightIcon, PlusIcon } from "@phosphor-icons/react";

interface VonAiFieldRowProps {
  field: AiField;
  onRowClick: (fieldId: string) => void;
}

export function VonAiFieldRow({ field, onRowClick }: VonAiFieldRowProps) {
  const navigate = useNavigate();
  const { setDeletingFieldId } = useAiFieldsStore();
  const activateMutation = useActivateField();
  const disableMutation = useDisableField();
  const [menuOpen, setMenuOpen] = useState(false);
  const [subMenuOpen, setSubMenuOpen] = useState(false);
  const { data: convoData } = useAiFieldConversations(
    menuOpen ? field.fieldId : null,
  );
  const conversations = convoData?.data ?? [];
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
    activateMutation.mutate(field.fieldId);
  };

  const handleDisable = () => {
    disableMutation.mutate(field.fieldId);
  };

  const isMutating = activateMutation.isPending || disableMutation.isPending;

  const isLive = field.status === "live";
  const isDraft = field.status === "draft";

  const handleToggle = () => {
    if (isMutating) return;
    if (isLive) handleDisable();
    else handleActivate();
  };

  const lastRun = field.lastRunAt ? formatTimeAgo(field.lastRunAt) : "\u2014";

  return (
    <tr
      className="hover:bg-gray-50/80 transition-colors cursor-pointer border-b border-gray-100 last:border-b-0"
      onClick={() => onRowClick(field.fieldId)}
    >
      {/* AI Field */}
      <td className="px-4 py-4">
        <p className="text-sm font-medium text-gray-900 m-0 leading-snug max-w-[200px]">
          {field.displayName ?? field.name}
        </p>
      </td>

      {/* Created by */}
      <td className="px-4 py-4">
        <span className="text-sm text-gray-900">
          {field.createdByName ?? (field.createdBy || "\u2014")}
        </span>
      </td>

      {/* Last Run */}
      <td className="px-4 py-4">
        <span className="text-xs text-gray-500 whitespace-nowrap">
          {isDraft ? "\u2014" : lastRun}
        </span>
      </td>

      {/* Status */}
      <td className="px-4 py-4">
        <span
          className={`inline-flex items-center gap-1.5 text-xs font-medium ${isLive ? "text-gray-900" : "text-gray-400"}`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${isLive ? "bg-green-500" : "bg-gray-300"}`}
          />
          {isLive ? "Live" : isDraft ? "Draft" : "Disabled"}
        </span>
      </td>

      {/* Action: toggle centered */}
      <td
        className="px-4 py-4 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        {!isDraft && (
          <button
            onClick={handleToggle}
            disabled={isMutating}
            className={`relative inline-block w-[34px] h-[19px] rounded-full transition-colors shrink-0 cursor-pointer disabled:opacity-50 ${isLive ? "bg-green-600" : "bg-gray-300"}`}
            title={isLive ? "Disable" : "Enable"}
          >
            <span
              className={`absolute top-[2px] left-[2px] w-[15px] h-[15px] rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,.18),0_1px_1px_rgba(0,0,0,.06)] transition-transform ${isLive ? "translate-x-[15px]" : "translate-x-0"}`}
            />
          </button>
        )}
      </td>

      {/* Kebab menu */}
      <td className="px-2 py-4" onClick={(e) => e.stopPropagation()}>
        <div ref={menuRef}>
          <button
            ref={btnRef}
            onClick={() => (menuOpen ? setMenuOpen(false) : openMenu())}
            className="w-7 h-7 inline-flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 cursor-pointer transition-colors"
          >
            <DotsThreeIcon size={20} weight="bold" />
          </button>

          {menuOpen && menuPos && (
            <div
              className="fixed w-[180px] bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-1"
              style={{ top: menuPos.top, left: menuPos.left }}
            >
              {/* Edit in chat — with submenu */}
              <div
                className="relative"
                onMouseEnter={() => setSubMenuOpen(true)}
                onMouseLeave={() => setSubMenuOpen(false)}
              >
                <button className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md cursor-pointer">
                  Edit in chat
                  <CaretRightIcon size={12} className="text-gray-400" />
                </button>

                {subMenuOpen && (
                  <div className="absolute top-0 right-full mr-1 w-[280px] bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-1">
                    <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-gray-400">
                      Recent conversations
                    </div>
                    {conversations.length > 0 ? (
                      conversations.slice(0, 5).map((c) => (
                        <button
                          key={c.conversationId}
                          onClick={() => {
                            navigate(
                              `/chat/${c.conversationId}?aiFieldId=${field.fieldId}`,
                            );
                            setMenuOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md cursor-pointer truncate"
                        >
                          {c.title}
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-xs text-gray-400">
                        No conversations yet
                      </div>
                    )}
                    <div className="h-px bg-gray-100 my-1" />
                    <button
                      onClick={() => {
                        navigate(`/chat?aiFieldId=${field.fieldId}`);
                        setMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md cursor-pointer"
                    >
                      <PlusIcon size={12} />
                      New chat about this field
                    </button>
                  </div>
                )}
              </div>

              <div className="h-px bg-gray-100 my-1" />
              <button
                onClick={() => {
                  setDeletingFieldId(field.fieldId);
                  setMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md cursor-pointer"
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
