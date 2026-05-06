import { useState } from "react";
import { SidePane } from "@vonlabs/design-components";
import {
  SparkleIcon,
  DownloadSimpleIcon,
  CopyIcon,
  CheckIcon,
} from "@phosphor-icons/react";
import { OrgContextEditor } from "./OrgContextEditor";

export interface BulkImportPaneProps {
  isOpen: boolean;
  onClose: () => void;
  /** Fires when the user submits — parent kicks off the import-mode agent
   *  with the pasted text. User memory is text-only. The pane closes
   *  immediately on submit; the "Von is updating your memory" state
   *  renders on the user-memory main window instead. */
  onSubmit?: (input: string) => void;
}

/** Canned prompt the user can copy into Claude/ChatGPT/Gemini to extract
 *  their stored memories, then paste back into step 2 below. */
const EXPORT_PROMPT = `I'm setting up a new AI workspace and want to carry over what you've learned about how I work. Put together an export based on the rules below.

Focus on the *how* — communication style, preferences, workflows, vocabulary. Skip the *who* — anything personal, biographical, or sensitive, even if it's in your memory.

Include:
- Explicit instructions I've given you (rules, corrections, format/tone preferences) — keep my exact wording where you can
- Patterns you've noticed in how I communicate (tone, length, punctuation quirks) — your own description is fine; mark these [inferred]
- How I like things explained (TL;DR-first, examples-heavy, technical depth, etc.)
- Decision-making style and frameworks I rely on
- Tools and recurring workflows
- Industry terms, acronyms, and company-specific vocabulary I use, so the new workspace doesn't over-explain familiar concepts

Exclude:
Personal life, family, relationships, health, hobbies, age, location, political or religious views, career history, biographical details, identity attributes, or anything sensitive — even if you remember it.

Notes:
- If a category is empty, write "(none)". If you have no memory of me at all, say so.
- Keep each preference as its own line rather than merging similar ones.
- If two items contradict each other, include both and flag with [?].
- Add [?] to anything you're unsure about.

Format:
- One code block, bullet points.
- Each line: [YYYY-MM-DD] - Entry. Use [unknown] if you don't know the date — don't guess.
- Group by category in this order: Explicit rules, Communication patterns, Explanation preferences, Decision frameworks, Tools & workflows, Vocabulary.

After the code block, note:
1. Whether this is everything, or you hit a length limit and there's more.
2. Any categories where you had nothing.`;

/**
 * Side drawer for importing user memory. Two-step flow:
 *   1. Copy the export prompt into another AI provider to extract memories
 *   2. Paste the result back here
 *
 * Pure UI shell — submission is delegated to the parent which kicks off the
 * import-mode Deep Agent run. User memory is text-only; this pane
 * intentionally has no file-attachment UI.
 */
export function BulkImportPane({
  isOpen,
  onClose,
  onSubmit,
}: BulkImportPaneProps) {
  const [input, setInput] = useState("");
  const [contentKey, setContentKey] = useState(0);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const resetForm = () => {
    setInput("");
    setContentKey((v) => v + 1);
  };

  const handleSubmit = () => {
    // Hand off to the parent, clear the editor, and close immediately.
    // The processing state ("Von is updating your memory") renders on
    // the user-memory main window, not in this side pane — so closing
    // here gets the pane out of the user's way.
    onSubmit?.(input);
    resetForm();
    onClose();
  };

  const handleCancel = () => {
    resetForm();
    onClose();
  };

  // Copy the export prompt + flash a "Copied" affordance for ~1.5s.
  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(EXPORT_PROMPT);
      setCopiedPrompt(true);
      window.setTimeout(() => setCopiedPrompt(false), 1500);
    } catch {
      // Clipboard API can fail in insecure contexts — silent fallback,
      // the prompt is still visible for manual copy.
    }
  };

  const title = (
    <div className="flex flex-col gap-0.5 min-w-0">
      <div className="flex items-center gap-2">
        <DownloadSimpleIcon
          size={16}
          weight="regular"
          className="text-gray-700 flex-shrink-0"
        />
        <span className="text-sm font-medium text-gray-900">Import memory</span>
      </div>
      <span className="text-xs text-gray-600">
        Paste an export from another AI below, or describe what to add
      </span>
    </div>
  );

  const hasContent = input.trim().length > 0;

  // Pane closes on submit — the processing state ("Von is updating your
  // memory") is rendered by the parent on the user-memory main window,
  // not here.
  const footer = (
    <div className="flex items-center justify-end gap-2">
      <button
        type="button"
        onClick={handleCancel}
        className="px-2.5 py-1.5 text-sm text-gray-800 border border-gray-200/80 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!hasContent}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-white bg-gray-900 rounded-xl hover:bg-gray-800 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <SparkleIcon size={12} weight="fill" />
        Update
      </button>
    </div>
  );

  return (
    <SidePane
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      width="560px"
      minWidth={440}
      maxWidth="720px"
      storageKey="bulk-import-pane-width"
      footer={footer}
      resizable
    >
      {/* Vertical timeline of numbered steps. Each row is
          [circle + connector line] | [title + content]. The connector
          line on step 1 fills the row height to bridge to step 2's
          circle, mirroring the home-page onboarding pattern. */}
      <div className="flex flex-col h-full min-h-0 pt-2">
        {/* Step 1: copy the export prompt into another AI. */}
        <div className="flex gap-3 flex-shrink-0">
          <div className="flex flex-col items-center flex-shrink-0">
            <span className="inline-flex items-center justify-center h-5 w-5 rounded-full border border-gray-200 text-[10px] font-semibold text-gray-700 bg-white">
              1
            </span>
            <div className="w-px flex-1 bg-gray-200 my-1" />
          </div>
          <div className="flex-1 min-w-0 flex flex-col gap-2 pb-6">
            <span className="text-sm text-gray-900">
              Copy this prompt into a new chat with your other AI provider
            </span>
            <div className="relative rounded-xl border border-gray-200/80 bg-gray-50/70 p-3 pr-20 max-h-[160px] overflow-hidden">
              <p className="text-xs text-gray-800 whitespace-pre-wrap leading-relaxed">
                {EXPORT_PROMPT}
              </p>
              <button
                type="button"
                onClick={handleCopyPrompt}
                className="absolute top-2 right-2 inline-flex items-center gap-1 h-7 px-2 rounded-lg border border-gray-200/80 bg-white text-xs text-gray-800 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                {copiedPrompt ? (
                  <>
                    <CheckIcon size={12} weight="bold" />
                    Copied
                  </>
                ) : (
                  <>
                    <CopyIcon size={12} weight="regular" />
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Step 2: paste the result back into Von. The connector line
            continues below the circle to extend past the last step,
            matching the onboarding timeline pattern. Editor fills
            remaining height (flex-1 min-h-0 chain). */}
        <div className="flex gap-3 flex-1 min-h-0">
          <div className="flex flex-col items-center flex-shrink-0">
            <span className="inline-flex items-center justify-center h-5 w-5 rounded-full border border-gray-200 text-[10px] font-semibold text-gray-700 bg-white">
              2
            </span>
            <div className="w-px flex-1 bg-gray-200 my-1" />
          </div>
          <div className="flex-1 min-w-0 flex flex-col gap-2 min-h-0">
            <span className="text-sm text-gray-900">
              Paste results below to add to your memory
            </span>
            <div className="flex-1 min-h-[180px] overflow-auto border border-gray-200/80 rounded-xl">
              <OrgContextEditor
                content={input}
                onChange={setInput}
                isEditing={true}
                placeholder="Paste memory export from another AI, an onboarding doc, a playbook, or describe what to learn..."
                contentKey={`bulk-import-${contentKey}`}
              />
            </div>
          </div>
        </div>
      </div>
    </SidePane>
  );
}

export default BulkImportPane;
