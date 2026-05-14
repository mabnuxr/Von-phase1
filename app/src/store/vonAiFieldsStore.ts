import { create } from "zustand";
import type { AiFieldDraft, PlaygroundResultEvent } from "../types/vonAiFields";

// ─── Playground Opportunity ──────────────────────────────────
export interface PlaygroundOpp {
  opportunityId: string;
  name: string;
  amount: number | null;
  stage: string;
  owner: string;
  status: "ready" | "running" | "done" | "error";
  result?: PlaygroundResultEvent;
}

// ─── Store Shape ─────────────────────────────────────────────
interface AiFieldsState {
  // Search & filter
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;

  // Delete confirmation
  deletingFieldId: string | null;
  setDeletingFieldId: (id: string | null) => void;

  // Draft AI field (from AI_FIELD_READY event, before creation)
  draftAiField: AiFieldDraft | null;
  setDraftAiField: (draft: AiFieldDraft | null) => void;

  // Chat panel
  chatPanelFieldId: string | null;
  openChatPanel: (fieldId: string) => void;
  closeChatPanel: () => void;

  // Playground
  playgroundOpps: PlaygroundOpp[];
  playgroundExecutionId: string | null;
  addPlaygroundOpp: (opp: Omit<PlaygroundOpp, "status">) => void;
  removePlaygroundOpp: (opportunityId: string) => void;
  clearPlaygroundOpps: () => void;
  setPlaygroundOppStatus: (
    opportunityId: string,
    status: PlaygroundOpp["status"],
    result?: PlaygroundResultEvent,
  ) => void;
  setPlaygroundExecutionId: (id: string | null) => void;

  // Activate tracking
  activatingFieldId: string | null;
  setActivatingFieldId: (id: string | null) => void;

  // Run history
  runHistoryFieldId: string | null;
  openRunHistory: (fieldId: string) => void;
  closeRunHistory: () => void;
}

const MAX_PLAYGROUND_OPPS = 5;

const useAiFieldsStore = create<AiFieldsState>((set) => ({
  // ─── Search & filter ──────────────────────────────────────
  searchTerm: "",
  setSearchTerm: (term) => set({ searchTerm: term }),
  statusFilter: "all",
  setStatusFilter: (status) => set({ statusFilter: status }),

  // ─── Delete confirmation ──────────────────────────────────
  deletingFieldId: null,
  setDeletingFieldId: (id) => set({ deletingFieldId: id }),

  // ─── Draft AI field ────────────────────────────────────────
  draftAiField: null,
  // A new draft invalidates any prior playground execution — results were
  // computed against the previous prompt/columns/sources and would be stale.
  setDraftAiField: (draft) =>
    set({
      draftAiField: draft,
      playgroundOpps: [],
      playgroundExecutionId: null,
    }),

  // ─── Chat panel ───────────────────────────────────────────
  chatPanelFieldId: null,
  openChatPanel: (fieldId) =>
    set((state) =>
      state.chatPanelFieldId === fieldId
        ? state
        : {
            chatPanelFieldId: fieldId,
            playgroundOpps: [],
            playgroundExecutionId: null,
          },
    ),
  closeChatPanel: () =>
    set({
      chatPanelFieldId: null,
      playgroundOpps: [],
      playgroundExecutionId: null,
    }),

  // ─── Playground ───────────────────────────────────────────
  playgroundOpps: [],
  playgroundExecutionId: null,

  addPlaygroundOpp: (opp) =>
    set((state) => {
      if (state.playgroundOpps.length >= MAX_PLAYGROUND_OPPS) return state;
      if (
        state.playgroundOpps.some((o) => o.opportunityId === opp.opportunityId)
      )
        return state;
      return {
        playgroundOpps: [...state.playgroundOpps, { ...opp, status: "ready" }],
      };
    }),

  removePlaygroundOpp: (opportunityId) =>
    set((state) => ({
      playgroundOpps: state.playgroundOpps.filter(
        (o) => o.opportunityId !== opportunityId,
      ),
    })),

  clearPlaygroundOpps: () =>
    set({ playgroundOpps: [], playgroundExecutionId: null }),

  setPlaygroundOppStatus: (opportunityId, status, result) =>
    set((state) => ({
      playgroundOpps: state.playgroundOpps.map((o) =>
        o.opportunityId === opportunityId ? { ...o, status, result } : o,
      ),
    })),

  setPlaygroundExecutionId: (id) => set({ playgroundExecutionId: id }),

  // ─── Activate tracking ────────────────────────────────────
  activatingFieldId: null,
  setActivatingFieldId: (id) => set({ activatingFieldId: id }),

  // ─── Run history ──────────────────────────────────────────
  runHistoryFieldId: null,
  openRunHistory: (fieldId) => set({ runHistoryFieldId: fieldId }),
  closeRunHistory: () => set({ runHistoryFieldId: null }),
}));

export default useAiFieldsStore;

/** @deprecated Use `useAiFieldsStore` (default export) instead. */
export const useVonAiFieldsStore = useAiFieldsStore;
