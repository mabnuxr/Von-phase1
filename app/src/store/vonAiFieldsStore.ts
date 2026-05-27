import { create } from "zustand";
import type { AiFieldDraft, PlaygroundResultEvent } from "../types/vonAiFields";
import { draftKey } from "../lib/aiFieldDraft";

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

  // Draft AI fields (from AI_FIELD_READY events, before creation), keyed by
  // draftKey(). A single turn can emit several drafts and they survive route
  // changes, so they live as a map rather than one overwritten slot.
  draftAiFields: Record<string, AiFieldDraft>;
  upsertDraftAiField: (draft: AiFieldDraft) => void;
  setDraftAiFields: (drafts: AiFieldDraft[]) => void;
  removeDraftAiField: (key: string) => void;
  clearDraftAiFields: () => void;

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

  // ─── Draft AI fields ───────────────────────────────────────
  draftAiFields: {},

  // Re-emitting the field that's currently open in the panel invalidates its
  // playground run (the prompt/columns/sources it was computed against just
  // changed). Drafts for other fields leave the playground untouched.
  upsertDraftAiField: (draft) =>
    set((state) => {
      const key = draftKey(draft);
      const next = { ...state.draftAiFields, [key]: draft };
      return state.chatPanelFieldId === key
        ? {
            draftAiFields: next,
            playgroundOpps: [],
            playgroundExecutionId: null,
          }
        : { draftAiFields: next };
    }),

  // Bulk reconstruction from persisted events (page refresh / re-entry).
  setDraftAiFields: (drafts) =>
    set((state) => {
      const map = { ...state.draftAiFields };
      for (const d of drafts) map[draftKey(d)] = d;
      return { draftAiFields: map };
    }),

  removeDraftAiField: (key) =>
    set((state) => {
      const next = { ...state.draftAiFields };
      delete next[key];
      return { draftAiFields: next };
    }),

  clearDraftAiFields: () =>
    set({ draftAiFields: {}, playgroundOpps: [], playgroundExecutionId: null }),

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
