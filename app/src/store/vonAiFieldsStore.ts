import { create } from "zustand";

type IqFieldPaneMode = "create" | "edit" | "results" | null;

interface VonAiFieldsState {
  // Pane state
  paneMode: IqFieldPaneMode;
  editingColumnId: string | null;
  setPaneMode: (mode: IqFieldPaneMode, columnId?: string | null) => void;
  closePane: () => void;

  // Search & filter
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;

  // Active dry run tracking
  pollingExecutionId: string | null;
  setPollingExecutionId: (id: string | null) => void;

  // Completed execution results
  resultsExecutionId: string | null;
  setResultsExecutionId: (id: string | null) => void;

  // Delete confirmation
  deletingColumnId: string | null;
  setDeletingColumnId: (id: string | null) => void;

  // Schedule editing
  isEditingSchedule: boolean;
  setIsEditingSchedule: (editing: boolean) => void;
}

const useVonAiFieldsStore = create<VonAiFieldsState>((set) => ({
  paneMode: null,
  editingColumnId: null,
  setPaneMode: (mode, columnId = null) =>
    set({ paneMode: mode, editingColumnId: columnId }),
  closePane: () =>
    set({
      paneMode: null,
      editingColumnId: null,
      resultsExecutionId: null,
      pollingExecutionId: null,
    }),

  searchTerm: "",
  setSearchTerm: (term) => set({ searchTerm: term }),
  statusFilter: "all",
  setStatusFilter: (status) => set({ statusFilter: status }),

  pollingExecutionId: null,
  setPollingExecutionId: (id) => set({ pollingExecutionId: id }),

  resultsExecutionId: null,
  setResultsExecutionId: (id) => set({ resultsExecutionId: id }),

  deletingColumnId: null,
  setDeletingColumnId: (id) => set({ deletingColumnId: id }),

  isEditingSchedule: false,
  setIsEditingSchedule: (editing) => set({ isEditingSchedule: editing }),
}));

export default useVonAiFieldsStore;
