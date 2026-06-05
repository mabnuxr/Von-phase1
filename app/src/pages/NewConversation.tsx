/**
 * NewConversation - Empty chat page for starting a new conversation.
 *
 * The conversation is NOT created upfront. Instead, it is created when the
 * user sends their first message:
 *   1. Create conversation (with mode if agent/bot selected)
 *   2. Pre-populate React Query cache with the created conversation metadata
 *   3. Send the message via useSendMessage (adds optimistic messages to chatStore)
 *   4. Refetch sidebar
 *   5. Navigate to /chat/:id with { newlyCreated: true } so Conversation.tsx
 *      skips the loading skeleton (chatStore already has the optimistic messages)
 *
 * This avoids orphaned conversations that have no user messages.
 */

import {
  useCallback,
  useMemo,
  useState,
  useEffect,
  useRef,
  Profiler,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Chat } from "@vonlabs/design-components";
import type { MentionItem } from "@vonlabs/design-components";
import { MentionItemType } from "@vonlabs/design-components";

import { useSearchParams } from "react-router-dom";
import { useAppShell } from "../hooks/useAppShell";
import { useVoiceTranscription } from "../hooks/useVoiceTranscription";
import { usePushToTalkHotkey } from "../hooks/usePushToTalkHotkey";
import { VoiceWaveformBar } from "../components/Voice/VoiceWaveformBar";
import { report } from "../lib/analytics/tracker";
import { useFeatureFlag } from "../hooks/useFeatureFlag";
import { usePermissions } from "../contexts/permissionsContextValue";
import { useAiFields, useAiField } from "../hooks/useVonAiFields";
import { useSalesforceConnection } from "../hooks/useSalesforceConnection";
import { useCreateAndSendMessage } from "../hooks/useCreateAndSendMessage";
import { useChatDraft, useRestoreUnsentInput } from "../hooks/useChatDraft";
import { useCommandsPanel } from "../hooks/useCommandsPanel";
import { useTenantMembers } from "../hooks/useTenantMembers";
import { useDashboardList } from "../hooks/useDashboardList";
import { SubscriptionInactiveBanner } from "../components/SubscriptionInactiveBanner";
import { config } from "../config";
import { reportRenderTiming } from "../lib/datadog";

const ViewOnlyBanner = () => (
  <div className="w-full">
    <div className="p-2 mt-2 flex flex-row bg-amber-50 border border-amber-200 rounded-xl">
      <p className="pl-2 text-sm text-amber-800">
        You have view-only access. You can read chats shared with you, but can't
        start new conversations. Ask an admin to upgrade your role.
      </p>
    </div>
  </div>
);

const NewConversation = () => {
  const { user } = useAppShell();
  const { isViewOnly } = usePermissions();

  const location = useLocation();
  const navigate = useNavigate();

  // One-shot prefill: if we arrived here with a `prompt` in router state
  // (e.g. "Continue conversation" from a shared conversation), capture it
  // once on mount and clear the history state so a refresh doesn't re-seed.
  //
  // Layout (the chat input renders markdown live):
  //   *Ask a follow-up:*
  //   <blank line — user's question goes here>
  //   ---
  //   **Summary from the shared chat**
  //
  //   <summary body>
  const initialInputRef = useRef<string>(
    (() => {
      const state = location.state as {
        prompt?: string;
        initialInput?: string;
      } | null;
      // Raw prefilled input — used by callers (e.g. "Create AI field" button
      // on the Custom AI Fields settings tab) that want to seed the chat
      // textarea verbatim with no wrapping.
      if (state?.initialInput) return state.initialInput;
      // "Continue conversation" from a shared chat — wraps the summary in an
      // "Ask a follow-up:" preamble so the user has a clear place to type.
      const prompt = state?.prompt;
      if (!prompt) return "";
      return (
        `*Ask a follow-up:*\n\n` +
        `&nbsp;\n\n` +
        `---\n` +
        `**Summary from the shared chat**\n\n` +
        `&nbsp;\n\n` +
        prompt
      );
    })(),
  );
  useEffect(() => {
    const state = location.state as {
      prompt?: string;
      initialInput?: string;
    } | null;
    if (state?.prompt || state?.initialInput) {
      navigate(location.pathname, { replace: true, state: null });
    }
    // Run once on mount — subsequent location changes are unrelated.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Position the caret just after the italic "Ask a follow-up:" label so
  // the user starts typing their question there rather than at the tail
  // of the summary. Chat's input is either a TipTap/ProseMirror editor
  // (contenteditable div, default for agent-v2) or a plain textarea —
  // try both.
  useEffect(() => {
    const seed = initialInputRef.current;
    if (!seed.startsWith("*Ask a follow-up:*")) return;

    const tryPositionCursor = () => {
      // TipTap/ProseMirror path — find the contenteditable with our label
      // and move the native selection to the start of the block that
      // immediately follows the "Ask a follow-up:" paragraph (usually
      // the empty paragraph we seeded with &nbsp;, one line below the
      // label).
      const pmNodes = document.querySelectorAll<HTMLElement>(".ProseMirror");
      for (const pm of Array.from(pmNodes)) {
        if (pm.textContent?.startsWith("Ask a follow-up:")) {
          const firstP = pm.querySelector("p");
          const target = firstP?.nextElementSibling ?? firstP;
          if (!target) return false;
          // Drill to the innermost node so Range.setStart(..., 0) lands
          // on the first editable offset inside the block.
          let node: Node = target;
          while (node.firstChild) node = node.firstChild;
          const range = document.createRange();
          range.setStart(node, 0);
          range.collapse(true);
          const sel = window.getSelection();
          sel?.removeAllRanges();
          sel?.addRange(range);
          pm.focus();
          return true;
        }
      }

      // Textarea fallback — plain RichTextInput. Position at start of the
      // blank line below the label (same intent as the ProseMirror path).
      const textareas = document.querySelectorAll("textarea");
      const cursorPos = "*Ask a follow-up:*\n\n".length;
      for (const ta of Array.from(textareas)) {
        if (ta.value.startsWith("*Ask a follow-up:*")) {
          ta.focus();
          ta.setSelectionRange(cursorPos, cursorPos);
          return true;
        }
      }
      return false;
    };

    // Retry a few times — the editor may mount asynchronously.
    let attempts = 0;
    const timer = window.setInterval(() => {
      attempts += 1;
      if (tryPositionCursor() || attempts >= 10) {
        window.clearInterval(timer);
      }
    }, 100);
    return () => window.clearInterval(timer);
  }, []);
  const pageViewCaptured = useRef(false);
  useEffect(() => {
    if (!user || pageViewCaptured.current) return;
    report.chatPageViewed();
    pageViewCaptured.current = true;
  }, [user]);

  const { isTenantDisabled } = useFeatureFlag();

  const {
    isConnected: isSalesforceConnected,
    isAuthenticated: isSalesforceAuthenticated,
    isLoading: isSalesforceLoading,
  } = useSalesforceConnection();

  const isSalesforceReady = isSalesforceConnected && isSalesforceAuthenticated;
  const canSubmit = isSalesforceReady && !isTenantDisabled;

  const {
    handleSendMessage,
    transformedMessages,
    isCreating,
    fileAttachments,
    addFiles,
    removeFile,
    fileErrorMessage,
    dismissFileError,
    restoredInput,
  } = useCreateAndSendMessage({
    agentVersion: "v2",
    isAgentV2: true,
    title: "",
    navigateOnCreate: true,
  });

  // Composer value, persisted against the shared new-chat key so a draft
  // survives navigation / refresh and is restored on return; writing "" clears
  // it. This is the single controlled value voice transcription also writes to.
  const [inputValue, setInputValue, clearDraft] = useChatDraft(null);

  // A navigation prefill (e.g. "Create AI field") outranks a stale draft.
  useEffect(() => {
    if (initialInputRef.current) setInputValue(initialInputRef.current);
  }, [setInputValue]);

  // A failed send surfaces the unsent text via `restoredInput` — restore it.
  useRestoreUnsentInput(restoredInput, setInputValue);

  const handleSendAndClearDraft = useCallback<typeof handleSendMessage>(
    (...sendArgs) => {
      clearDraft();
      return handleSendMessage(...sendArgs);
    },
    [clearDraft, handleSendMessage],
  );

  // Voice (Deepgram + LLM cleanup). After recording stops, the hook runs the
  // cleanup pass and returns the polished combination of `existing` + raw
  // dictation; we write it to the input in one update.
  const inputPrefixRef = useRef("");
  // onPolished receives ONLY the polished new dictation. We append it
  // to whatever the user already had typed — that pre-existing text
  // never round-trips through the LLM and can't be reworded or dropped.
  // Fires for user ✓ AND internal stops (2-min cap, reconnect exhaustion).
  const voiceCleanupConfig = useMemo(
    () => ({
      onPolished: (polishedDictation: string) => {
        const prefix = inputPrefixRef.current;
        const sep = prefix && polishedDictation ? " " : "";
        setInputValue(prefix + sep + polishedDictation);
      },
    }),
    [setInputValue],
  );
  const voice = useVoiceTranscription({ cleanup: voiceCleanupConfig });
  const beginVoice = useCallback(() => {
    inputPrefixRef.current = inputValue;
    void voice.start();
  }, [inputValue, voice]);
  const endVoice = useCallback(() => {
    void voice.stop();
  }, [voice]);
  const handleVoiceToggle = useCallback(() => {
    if (voice.status === "listening" || voice.status === "connecting") {
      void endVoice();
    } else {
      beginVoice();
    }
  }, [beginVoice, endVoice, voice]);
  // Hold ⌥ Option to dictate; release ends it and keeps the text. No status
  // guards — the hook balances press/release and start/stop guard re-entry.
  usePushToTalkHotkey({
    onPress: beginVoice,
    onRelease: endVoice,
  });
  const {
    commands,
    isLoadingCommands,
    isSavingCommand,
    availableDashboards,
    handleSaveCommand,
    handleUploadFile,
    handleRequestFilePreviewUrl,
    handleDeleteCommand,
    handleToggleFavorite,
    handleSendTest,
  } = useCommandsPanel(user?.id);

  // @ Mention: lazily fetch dashboard list only after user types "@"
  const [mentionsActivated, setMentionsActivated] = useState(false);
  const handleMentionsActivated = useCallback(() => {
    setMentionsActivated(true);
  }, []);
  const { data: dashboardListData, isLoading: isLoadingDashboards } =
    useDashboardList(mentionsActivated);
  const { data: aiFieldsData, isLoading: isLoadingAiFields } = useAiFields(
    "live",
    1,
    50,
    mentionsActivated,
  );

  const mentionItems: MentionItem[] = useMemo(() => {
    const dashboards: MentionItem[] =
      dashboardListData?.data.map((d) => ({
        id: d.dashboard_id,
        name: d.dashboard_name,
        type: MentionItemType.Dashboard,
        version: d.dashboard_version,
      })) ?? [];

    const aiFields: MentionItem[] = aiFieldsData?.data
      ? aiFieldsData.data.map((f) => ({
          id: f.fieldId,
          name: f.displayName ?? f.name,
          type: MentionItemType.AiField,
          version: 0,
          aiFieldContext: { aiFieldId: f.fieldId },
        }))
      : [];

    return [...dashboards, ...aiFields];
  }, [dashboardListData, aiFieldsData]);

  const isLoadingMentions = isLoadingDashboards || isLoadingAiFields;

  // AI Field from URL param (settings "New chat about this field")
  const [searchParams, setSearchParams] = useSearchParams();
  const aiFieldIdFromUrl = searchParams.get("aiFieldId");
  const { data: aiFieldForPreload } = useAiField(aiFieldIdFromUrl);
  const [preloadDismissed, setPreloadDismissed] = useState(false);
  const [capturedPreloadMention, setCapturedPreloadMention] =
    useState<MentionItem | null>(null);

  // Capture the mention into state then clean the URL param
  useEffect(() => {
    if (aiFieldForPreload && aiFieldIdFromUrl) {
      setCapturedPreloadMention({
        id: aiFieldForPreload.fieldId,
        name: aiFieldForPreload.displayName ?? aiFieldForPreload.name,
        type: MentionItemType.AiField,
        version: 0,
        aiFieldContext: { aiFieldId: aiFieldForPreload.fieldId },
      });
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete("aiFieldId");
          return next;
        },
        { replace: true },
      );
    }
  }, [aiFieldForPreload, aiFieldIdFromUrl, setSearchParams]);

  const preloadedWidgetMentions = useMemo(() => {
    if (preloadDismissed || !capturedPreloadMention) return undefined;
    return [capturedPreloadMention];
  }, [capturedPreloadMention, preloadDismissed]);

  const handleWidgetMentionRemoved = useCallback(() => {
    setPreloadDismissed(true);
  }, []);

  const { data: tenantMembersData } = useTenantMembers(user?.tenantId);
  const tenantMembersForSchedule = (tenantMembersData ?? []).map((m) => ({
    id: m.id,
    email: m.email,
    firstName: m.firstName,
    lastName: m.lastName,
    role: m.role,
  }));
  const currentUserRecipient = user
    ? {
        id: user.id,
        email: user.email,
        firstName: user.firstName ?? user.name?.split(" ")[0] ?? "",
        lastName:
          user.lastName ?? user.name?.split(" ").slice(1).join(" ") ?? "",
      }
    : undefined;

  const [shouldShakeBanner, setShouldShakeBanner] = useState(false);
  const [shouldShakeSubscriptionBanner, setShouldShakeSubscriptionBanner] =
    useState(false);

  const handleDisabledInteraction = useCallback(() => {
    if (isTenantDisabled) {
      setShouldShakeSubscriptionBanner(true);
    } else {
      setShouldShakeBanner(true);
    }
  }, [isTenantDisabled]);

  const handleTemplateClick = useCallback(
    (template: { prompt: string; category: string }, position: number) => {
      report.chatSuggestedPromptClicked(
        template.prompt,
        template.category,
        position,
      );
    },
    [],
  );

  const handleTemplateArrowClick = useCallback(
    (_direction: string, activeCategory: string) => {
      report.chatSuggestedPromptArrowClicked(activeCategory);
    },
    [],
  );

  const banner = isViewOnly ? (
    <ViewOnlyBanner />
  ) : isTenantDisabled ? (
    <SubscriptionInactiveBanner
      isTenantDisabled={isTenantDisabled}
      shouldShakeBanner={shouldShakeSubscriptionBanner}
      onShakeComplete={() => setShouldShakeSubscriptionBanner(false)}
    />
  ) : null;

  return (
    <Profiler id="new-conversation" onRender={reportRenderTiming}>
      <Chat
        title="von AI"
        userId={user?.id}
        userName={user?.firstName || user?.name?.split(" ")[0]}
        userEmail={user?.email}
        apiBaseUrl={config.apiBaseUrl}
        conversationId=""
        messages={transformedMessages}
        onSendMessage={handleSendAndClearDraft}
        isLoading={false}
        inputValue={inputValue}
        onInputValueChange={setInputValue}
        onVoiceInput={handleVoiceToggle}
        isRecording={
          voice.status === "listening" || voice.status === "connecting"
        }
        voiceStatus={voice.uiStatus}
        voiceVisualizer={
          voice.uiStatus === "listening" ||
          voice.uiStatus === "connecting" ||
          voice.uiStatus === "reconnecting" ? (
            <VoiceWaveformBar
              freqBins={voice.freqBins}
              active={voice.status === "listening"}
            />
          ) : undefined
        }
        onVoiceCancel={() => {
          voice.cancel();
        }}
        onVoiceConfirm={() => {
          void endVoice();
        }}
        voiceError={voice.error}
        onDismissVoiceError={voice.dismissError}
        placeholder="Ask a question or start a task.."
        height="100%"
        width="100%"
        banner={banner}
        disableSubmit={isViewOnly || !canSubmit || isCreating}
        disableInput={isViewOnly}
        onExamplePromptDisabledClick={handleDisabledInteraction}
        onInputWhileDisabled={handleDisabledInteraction}
        thinkingProcessVersion="v2"
        useStandardInput={true}
        enableFileUpload={true}
        controlledAttachments={fileAttachments}
        onFilesSelected={addFiles}
        onRemoveAttachment={removeFile}
        fileErrorMessage={fileErrorMessage}
        onDismissFileError={dismissFileError}
        commands={commands}
        isLoadingCommands={isLoadingCommands}
        onSaveCommand={handleSaveCommand}
        onDeleteCommand={handleDeleteCommand}
        isSavingCommand={isSavingCommand}
        onToggleFavorite={handleToggleFavorite}
        onRequestFilePreviewUrl={handleRequestFilePreviewUrl}
        onUploadFile={handleUploadFile}
        availableDashboards={availableDashboards}
        tenantMembers={tenantMembersForSchedule}
        currentUser={currentUserRecipient}
        onSendTest={handleSendTest}
        enableMentions={true}
        mentionItems={mentionItems}
        isLoadingMentions={isLoadingMentions}
        onMentionsActivated={handleMentionsActivated}
        widgetMentions={preloadedWidgetMentions}
        onWidgetMentionRemoved={handleWidgetMentionRemoved}
        onTemplateCategoryClick={report.chatTemplateCategoryClicked}
        onTemplateClick={handleTemplateClick}
        onTemplateArrowClick={handleTemplateArrowClick}
      />
    </Profiler>
  );
};

export default NewConversation;
