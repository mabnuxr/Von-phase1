import { useState, useEffect, useRef } from "react";
import useVonAiFieldsStore from "../store/vonAiFieldsStore";
import {
  useIqColumns,
  useCreateIqColumn,
  useUpdateIqColumn,
  useDryRun,
  useExecutionStatus,
  useExecutionResults,
  useOpportunitySearch,
} from "../hooks/useVonAiFields";
import { Banner, SingleSelect } from "@vonlabs/design-components";
import {
  PlayIcon,
  FileTextIcon,
  ClockIcon,
  ArrowLeftIcon,
  XIcon,
  MagnifyingGlassIcon,
} from "@phosphor-icons/react";
import type {
  CreateIqColumnRequest,
  UpdateIqColumnRequest,
  IqColumnType,
  IqColumnScope,
  OpportunityRecord,
} from "../types/vonAiFields";

const NAME_REGEX = /^[a-zA-Z][a-zA-Z0-9_]*$/;

const COLUMN_TYPE_OPTIONS = [
  { value: "string", label: "String — Free text" },
  { value: "numeric", label: "Numeric — Decimal number" },
  { value: "integer", label: "Integer — Whole number" },
  { value: "boolean", label: "Boolean — Yes/No" },
  { value: "array", label: "Array — List of items" },
  { value: "object", label: "Object — Structured data" },
];

const SCOPE_OPTIONS = [
  { value: "opportunity", label: "Opportunity" },
  { value: "account", label: "Account (coming soon)", disabled: true },
];

// (removed SAMPLE_SIZE_OPTIONS — replaced by opportunity search)

export function VonAiFieldDetailPane() {
  const { paneMode, editingColumnId, closePane, resultsExecutionId } =
    useVonAiFieldsStore();

  const { data: columnsData } = useIqColumns();
  const createMutation = useCreateIqColumn();
  const updateMutation = useUpdateIqColumn();
  const dryRunMutation = useDryRun();

  // Playground polling
  const [playgroundExecutionId, setPlaygroundExecutionId] = useState<
    string | null
  >(null);
  const { data: playgroundExecution } = useExecutionStatus(
    playgroundExecutionId,
  );
  const { data: playgroundResults } = useExecutionResults(
    playgroundExecution?.status === "completed" ? playgroundExecutionId : null,
  );

  // Also support the old results mode
  const { data: resultsData, isLoading: isLoadingResults } =
    useExecutionResults(paneMode === "results" ? resultsExecutionId : null);

  const editingColumn = editingColumnId
    ? columnsData?.columns.find((c) => c.column_id === editingColumnId)
    : null;

  // Form state
  const [name, setName] = useState("");
  const [prompt, setPrompt] = useState("");
  const [columnType, setColumnType] = useState<IqColumnType>("string");
  const [scope, setScope] = useState<IqColumnScope>("opportunity");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [dryRunColumnName, setDryRunColumnName] = useState<string | null>(null);

  // Opportunity search & selection
  const [oppSearch, setOppSearch] = useState("");
  const [oppDropdownOpen, setOppDropdownOpen] = useState(false);
  const [selectedOpps, setSelectedOpps] = useState<OpportunityRecord[]>([]);
  const oppDropdownRef = useRef<HTMLDivElement>(null);
  const { data: oppResults, isLoading: isSearchingOpps } = useOpportunitySearch(
    oppSearch,
    oppDropdownOpen,
  );

  // Close dropdown on outside click
  useEffect(() => {
    if (!oppDropdownOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (
        oppDropdownRef.current &&
        !oppDropdownRef.current.contains(e.target as Node)
      ) {
        setOppDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [oppDropdownOpen]);

  // Initialize form when editing
  useEffect(() => {
    if (paneMode === "edit" && editingColumn) {
      setName(editingColumn.name);
      setPrompt(editingColumn.prompt);
      setColumnType(editingColumn.column_type as IqColumnType);
      setScope(editingColumn.scope as IqColumnScope);
    } else if (paneMode === "create") {
      setName("");
      setPrompt("");
      setColumnType("string");
      setScope("opportunity");
    }
    setValidationErrors([]);
    setPlaygroundExecutionId(null);
    setDryRunColumnName(null);
    setSelectedOpps([]);
    setOppSearch("");
  }, [paneMode, editingColumn]);

  const handleClose = () => {
    closePane();
    setValidationErrors([]);
    setPlaygroundExecutionId(null);
    setDryRunColumnName(null);
  };

  const handleSave = async () => {
    const errors: string[] = [];
    if (!name.trim()) {
      errors.push("Name is required");
    } else if (!NAME_REGEX.test(name)) {
      errors.push(
        "Name must be letters, digits, and underscores only, starting with a letter",
      );
    } else if (name.length > 100) {
      errors.push("Name must be 100 characters or less");
    }
    if (!prompt.trim()) {
      errors.push("Prompt is required");
    }

    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      if (paneMode === "create") {
        const req: CreateIqColumnRequest = {
          name,
          prompt,
          column_type: columnType,
          scope,
        };
        await createMutation.mutateAsync(req);
      } else if (paneMode === "edit" && editingColumnId) {
        const req: UpdateIqColumnRequest = {
          name,
          prompt,
          column_type: columnType,
          scope,
        };
        await updateMutation.mutateAsync({
          columnId: editingColumnId,
          data: req,
        });
      }
      handleClose();
    } catch {
      // Error handled by mutation onError
    }
  };

  const handleRunSample = async () => {
    if (!name.trim() || !prompt.trim() || selectedOpps.length === 0) return;
    setDryRunColumnName(name);
    try {
      const result = await dryRunMutation.mutateAsync({
        opportunity_ids: selectedOpps.map((o) => o.id),
        column: {
          name,
          prompt,
          column_type: columnType,
          scope,
        },
      });
      setPlaygroundExecutionId(result.execution_id);
    } catch {
      // handled by mutation
    }
  };

  const toggleOpp = (opp: OpportunityRecord) => {
    setSelectedOpps((prev) =>
      prev.some((o) => o.id === opp.id)
        ? prev.filter((o) => o.id !== opp.id)
        : [...prev, opp],
    );
  };

  const removeOpp = (id: string) => {
    setSelectedOpps((prev) => prev.filter((o) => o.id !== id));
  };

  const isPanelOpen = paneMode !== null;
  const isSaving = createMutation.isPending || updateMutation.isPending;
  const isRunning =
    dryRunMutation.isPending || playgroundExecution?.status === "running";

  const headerBreadcrumb =
    paneMode === "create"
      ? "Von AI Field · New Question"
      : paneMode === "edit"
        ? `Von AI Field · Edit Question`
        : "Dry Run Results";

  const headerTitle =
    paneMode === "edit" && editingColumn
      ? editingColumn.name
      : paneMode === "create"
        ? "New Question"
        : "Results";

  // Extract per-column results — single-column dry run returns only this column's data
  const colName = dryRunColumnName || name || editingColumn?.name;
  const currentColumnResults = playgroundResults?.results?.map((record) => ({
    record_id: record.record_id,
    record_name: record.record_name,
    value: colName ? record[colName] : undefined,
    reasoning: colName ? record[`${colName}_reasoning`] : undefined,
  }));

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/20 transition-opacity duration-300 z-40 ${
          isPanelOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={handleClose}
      />

      {/* Side Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-[560px] p-2 z-50 transform transition-transform duration-300 ease-in-out ${
          isPanelOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="h-full flex flex-col bg-white rounded-xl border border-gray-200 shadow-xs">
          {/* Header */}
          <div className="px-5 py-3 border-b border-gray-200 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={handleClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer shrink-0"
                >
                  <ArrowLeftIcon size={18} />
                </button>
                <div className="min-w-0">
                  <p className="text-xs text-gray-500 m-0">
                    {headerBreadcrumb}
                  </p>
                  <h2 className="text-lg font-semibold text-gray-900 m-0 truncate">
                    {headerTitle}
                  </h2>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                {(paneMode === "create" || paneMode === "edit") && (
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isSaving ? "Saving..." : "Save changes"}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto settings-scrollbar px-6 py-5">
            {validationErrors.length > 0 && (
              <div className="mb-4">
                <Banner
                  variant="error"
                  message={
                    validationErrors.length === 1
                      ? validationErrors[0]
                      : `Please fix the following errors:\n${validationErrors.map((e) => `• ${e}`).join("\n")}`
                  }
                  onClose={() => setValidationErrors([])}
                  dismissible={true}
                />
              </div>
            )}

            {(paneMode === "create" || paneMode === "edit") && (
              <div className="space-y-6">
                {/* Question name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1">
                    Question name
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    Appears in Von chat and exports
                  </p>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-von-purple focus:border-transparent bg-white transition-all duration-200"
                    placeholder="deal_health_score"
                  />
                </div>

                {/* Prompt */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1">
                    Prompt
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    Ask a specific question. Von pulls context from SFDC, Gong,
                    and connected sources. Each output includes reasoning
                    showing how the answer was derived.
                  </p>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={6}
                    className="w-full px-3 py-2.5 text-sm text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-von-purple focus:border-transparent bg-white transition-all duration-200 resize-none font-mono"
                    placeholder="Evaluate this opportunity against MEDDIC criteria. Flag any of: missing economic buyer, unclear decision criteria, no identified pain, or champion disengagement in last 14 days."
                  />
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-xs text-gray-400">
                      {prompt.length} chars
                    </span>
                  </div>
                </div>

                {/* Type */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1">
                    Output type
                  </label>
                  <SingleSelect
                    value={columnType}
                    onChange={(value: string) =>
                      setColumnType(value as IqColumnType)
                    }
                    options={COLUMN_TYPE_OPTIONS}
                    fullWidth
                  />
                </div>

                {/* Scope */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1">
                    Scope
                  </label>
                  <SingleSelect
                    value={scope}
                    onChange={(value: string) =>
                      setScope(value as IqColumnScope)
                    }
                    options={SCOPE_OPTIONS}
                    fullWidth
                  />
                </div>

                {/* Info note */}
                <div className="flex items-start gap-2 text-xs text-gray-500">
                  <ClockIcon size={14} className="shrink-0 mt-0.5" />
                  <span>
                    Prompt edits apply going forward only. Existing fields
                    retain prior output until each record is re-processed on the
                    next scheduled poll.
                  </span>
                </div>

                {/* ─── Playground ──────────────────────────────── */}
                <div className="p-5 bg-gray-50 border border-gray-200 rounded-xl space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 m-0">
                      Playground
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Test the prompt against real records before activating.
                    </p>
                  </div>

                  {/* Selected opportunities chips */}
                  {selectedOpps.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedOpps.map((opp) => (
                        <span
                          key={opp.id}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-white border border-gray-200 text-gray-700"
                        >
                          {opp.name}
                          <button
                            onClick={() => removeOpp(opp.id)}
                            className="text-gray-400 hover:text-gray-600 cursor-pointer"
                          >
                            <XIcon size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Opportunity search + Run button */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 relative" ref={oppDropdownRef}>
                      <div className="relative">
                        <MagnifyingGlassIcon
                          size={14}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        />
                        <input
                          type="text"
                          value={oppSearch}
                          onChange={(e) => {
                            setOppSearch(e.target.value);
                            setOppDropdownOpen(true);
                          }}
                          onFocus={() => setOppDropdownOpen(true)}
                          placeholder="Search opportunities to sample..."
                          className="w-full pl-9 pr-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-von-purple focus:border-transparent bg-white transition-all duration-200"
                        />
                      </div>

                      {/* Dropdown results */}
                      {oppDropdownOpen && (
                        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto">
                          {isSearchingOpps ? (
                            <div className="px-4 py-3 text-sm text-gray-500">
                              Searching...
                            </div>
                          ) : oppResults?.opportunities &&
                            oppResults.opportunities.length > 0 ? (
                            oppResults.opportunities.map((opp) => {
                              const isSelected = selectedOpps.some(
                                (o) => o.id === opp.id,
                              );
                              return (
                                <button
                                  key={opp.id}
                                  onClick={() => {
                                    toggleOpp(opp);
                                    setOppSearch("");
                                  }}
                                  className={`w-full text-left px-4 py-2.5 text-sm cursor-pointer transition-colors ${
                                    isSelected
                                      ? "bg-gray-50 text-gray-400"
                                      : "text-gray-700 hover:bg-gray-50"
                                  }`}
                                >
                                  <div className="font-medium">{opp.name}</div>
                                  <div className="text-xs text-gray-400 mt-0.5">
                                    {opp.stagename} · $
                                    {(opp.amount ?? 0).toLocaleString()} ·{" "}
                                    {opp.closedate}
                                  </div>
                                </button>
                              );
                            })
                          ) : (
                            <div className="px-4 py-3 text-sm text-gray-500">
                              No opportunities found
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={handleRunSample}
                      disabled={
                        isRunning ||
                        !prompt.trim() ||
                        !name.trim() ||
                        selectedOpps.length === 0
                      }
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                    >
                      <PlayIcon size={14} weight="fill" />
                      {isRunning ? "Running..." : "Run sample"}
                    </button>
                  </div>

                  <p className="text-xs text-gray-400 m-0">
                    Tip: select 2–3 different opportunities to confirm your
                    prompt works across deal types.
                  </p>

                  {/* Results area */}
                  <div className="border border-dashed border-gray-300 rounded-lg bg-white min-h-[140px]">
                    {isRunning ? (
                      <div className="flex flex-col items-center justify-center py-8 text-sm text-gray-500">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400 mb-3" />
                        <span>Running sample...</span>
                        <span className="text-xs text-gray-400 mt-1">
                          This can take a few minutes depending on the number of
                          records.
                        </span>
                      </div>
                    ) : playgroundExecution?.status === "failed" ? (
                      <div className="p-4">
                        <Banner
                          variant="error"
                          message={
                            playgroundExecution.error_message ||
                            "Sample run failed."
                          }
                          dismissible={false}
                        />
                      </div>
                    ) : currentColumnResults &&
                      currentColumnResults.length > 0 ? (
                      <div className="divide-y divide-gray-100">
                        {currentColumnResults.map((record) => (
                          <div key={record.record_id} className="p-4 space-y-2">
                            <span className="text-sm font-medium text-gray-900">
                              {record.record_name}
                            </span>
                            <div className="text-sm text-gray-800">
                              {record.value != null
                                ? JSON.stringify(record.value)
                                : "—"}
                            </div>
                            {record.reasoning != null && (
                              <p className="text-xs text-gray-500 m-0 pl-3 border-l-2 border-gray-200">
                                {String(record.reasoning)}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                        <FileTextIcon size={28} className="mb-2" />
                        <span className="text-sm font-medium text-gray-500">
                          No samples yet
                        </span>
                        <span className="text-xs text-gray-400 mt-0.5">
                          Pick a record above and run to see the output and
                          reasoning.
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Legacy results mode (from old panel dry run) */}
            {paneMode === "results" && (
              <div>
                {isLoadingResults ? (
                  <div className="text-sm text-gray-500 text-center py-8">
                    Loading results...
                  </div>
                ) : resultsData && resultsData.results.length > 0 ? (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      {resultsData.record_count} records,{" "}
                      {resultsData.columns.length} fields
                    </p>
                    {resultsData.results.map((record) => (
                      <div
                        key={record.record_id}
                        className="p-4 rounded-xl border border-gray-200 bg-gray-50 space-y-3"
                      >
                        <h4 className="text-sm font-semibold text-gray-900 m-0">
                          {record.record_name}
                        </h4>
                        <p className="text-xs text-gray-500 m-0">
                          {record.record_id}
                        </p>
                        {resultsData.columns.map((col) => (
                          <div key={col} className="space-y-1">
                            <div className="flex items-baseline gap-2">
                              <span className="text-xs font-medium text-gray-700">
                                {col}:
                              </span>
                              <span className="text-sm text-gray-900">
                                {JSON.stringify(record[col])}
                              </span>
                            </div>
                            {record[`${col}_reasoning`] != null && (
                              <p className="text-xs text-gray-500 m-0 pl-2 border-l-2 border-gray-200">
                                {String(record[`${col}_reasoning`])}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 text-center py-8">
                    No results available yet.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
