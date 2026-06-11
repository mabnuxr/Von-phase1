/**
 * VonComposerBar — the prototype's message composer, styled to match the real
 * Von chat input: "Reply.." placeholder, +/ buttons on the left, microphone +
 * send (up-arrow) on the right, rounded corners. Non-interactive (prototype).
 *
 * Single source of truth so every chat scenario — regular chats, the inline
 * confirmation cards, and the v2 card flows — shows the same input treatment:
 * a warm amber border with a subtle drop shadow.
 */

import { PlusIcon, MicrophoneIcon, ArrowUpIcon } from "@phosphor-icons/react";

const ICON_BTN =
  "w-7 h-7 rounded-full flex items-center justify-center transition-colors cursor-pointer";

export function VonComposerBar() {
  return (
    <div
      className="bg-white rounded-2xl border shadow-sm"
      style={{ borderColor: "#F5A623" }}
    >
      {/* Placeholder row */}
      <div className="px-4 pt-3 pb-1">
        <span className="text-sm text-gray-400">Reply..</span>
      </div>

      {/* Controls row */}
      <div className="flex items-center justify-between px-3 pb-2.5 pt-1">
        {/* Left: + and / */}
        <div className="flex items-center gap-1.5">
          <button className={`${ICON_BTN} border border-gray-200/80 text-gray-600 hover:bg-gray-50`}>
            <PlusIcon size={15} weight="bold" />
          </button>
          <button className={`${ICON_BTN} border border-gray-200/80 text-gray-500 hover:bg-gray-50`}>
            <span className="text-[13px] font-semibold leading-none">/</span>
          </button>
        </div>

        {/* Right: microphone and send */}
        <div className="flex items-center gap-1.5">
          <button className={`${ICON_BTN} border border-gray-200/80 text-gray-600 hover:bg-gray-50`}>
            <MicrophoneIcon size={15} weight="bold" />
          </button>
          <button className={`${ICON_BTN} bg-gray-900 text-white hover:bg-gray-800`}>
            <ArrowUpIcon size={15} weight="bold" />
          </button>
        </div>
      </div>
    </div>
  );
}
