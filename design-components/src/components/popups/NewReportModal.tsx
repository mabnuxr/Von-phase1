import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Table, Check, Sparkle } from '@phosphor-icons/react';
import { AddButton, PrimaryButton, GhostButton } from '../forms/buttons';
import { FilterRow } from '../forms/filter';

// ============================================================================
// Types
// ============================================================================

export interface DataSource {
  id: string;
  label: string;
  description?: string;
}

export interface RelatedObject {
  id: string;
  label: string;
  relationField: string;
}

export interface ColumnOption {
  id: string;
  label: string;
  sourceId: string;
  sourceLabel: string;
}

export interface ReportFilter {
  id: string;
  field: string;
  operator: string;
  value: string;
}

export interface NewReportConfig {
  primarySource: string;
  relatedObjects: string[];
  filters: ReportFilter[];
  columns: string[];
}

export interface NewReportModalProps {
  /**
   * Whether the modal is open
   */
  isOpen: boolean;

  /**
   * Available primary data sources
   */
  dataSources?: DataSource[];

  /**
   * Available related objects for joins (keyed by primary source id)
   */
  relatedObjectsBySource?: Record<string, RelatedObject[]>;

  /**
   * Available columns (keyed by source id)
   */
  columnsBySource?: Record<string, ColumnOption[]>;

  /**
   * Available filter fields
   */
  filterFields?: { value: string; label: string }[];

  /**
   * Callback when user confirms creation
   */
  onConfirm: (config: NewReportConfig) => void;

  /**
   * Callback when user cancels
   */
  onCancel: () => void;
}

// ============================================================================
// Default Data
// ============================================================================

const defaultDataSources: DataSource[] = [
  { id: 'opportunities', label: 'Opportunities' },
  { id: 'accounts', label: 'Accounts' },
  { id: 'leads', label: 'Leads' },
  { id: 'contacts', label: 'Contacts' },
  { id: 'cases', label: 'Cases' },
  { id: 'custom', label: 'Custom Object...' },
];

const defaultRelatedObjects: Record<string, RelatedObject[]> = {
  opportunities: [
    { id: 'account', label: 'Account', relationField: 'AccountId' },
    { id: 'contact', label: 'Contact', relationField: 'ContactId' },
    { id: 'gong_calls', label: 'Gong Calls', relationField: 'Opportunity lookup' },
    { id: 'von_iq', label: 'Von IQ Signals', relationField: 'Opportunity lookup' },
  ],
  accounts: [
    { id: 'opportunities', label: 'Opportunities', relationField: 'AccountId' },
    { id: 'contacts', label: 'Contacts', relationField: 'AccountId' },
    { id: 'cases', label: 'Cases', relationField: 'AccountId' },
  ],
  leads: [{ id: 'campaigns', label: 'Campaigns', relationField: 'CampaignId' }],
  contacts: [
    { id: 'account', label: 'Account', relationField: 'AccountId' },
    { id: 'opportunities', label: 'Opportunities', relationField: 'ContactId' },
  ],
  cases: [
    { id: 'account', label: 'Account', relationField: 'AccountId' },
    { id: 'contact', label: 'Contact', relationField: 'ContactId' },
  ],
};

const defaultColumnsBySource: Record<string, ColumnOption[]> = {
  opportunities: [
    { id: 'opp_name', label: 'Name', sourceId: 'opportunities', sourceLabel: 'Opportunities' },
    { id: 'opp_amount', label: 'Amount', sourceId: 'opportunities', sourceLabel: 'Opportunities' },
    { id: 'opp_stage', label: 'Stage', sourceId: 'opportunities', sourceLabel: 'Opportunities' },
    {
      id: 'opp_close_date',
      label: 'Close Date',
      sourceId: 'opportunities',
      sourceLabel: 'Opportunities',
    },
    {
      id: 'opp_probability',
      label: 'Probability',
      sourceId: 'opportunities',
      sourceLabel: 'Opportunities',
    },
    { id: 'opp_type', label: 'Type', sourceId: 'opportunities', sourceLabel: 'Opportunities' },
    {
      id: 'opp_lead_source',
      label: 'Lead Source',
      sourceId: 'opportunities',
      sourceLabel: 'Opportunities',
    },
  ],
  account: [
    { id: 'acc_name', label: 'Account Name', sourceId: 'account', sourceLabel: 'Account' },
    { id: 'acc_industry', label: 'Industry', sourceId: 'account', sourceLabel: 'Account' },
    { id: 'acc_revenue', label: 'Annual Revenue', sourceId: 'account', sourceLabel: 'Account' },
    { id: 'acc_employees', label: 'Employees', sourceId: 'account', sourceLabel: 'Account' },
  ],
  contact: [
    { id: 'con_name', label: 'Contact Name', sourceId: 'contact', sourceLabel: 'Contact' },
    { id: 'con_email', label: 'Email', sourceId: 'contact', sourceLabel: 'Contact' },
    { id: 'con_title', label: 'Title', sourceId: 'contact', sourceLabel: 'Contact' },
  ],
  gong_calls: [
    { id: 'gong_date', label: 'Call Date', sourceId: 'gong_calls', sourceLabel: 'Gong Calls' },
    { id: 'gong_duration', label: 'Duration', sourceId: 'gong_calls', sourceLabel: 'Gong Calls' },
    {
      id: 'gong_sentiment',
      label: 'Sentiment Score',
      sourceId: 'gong_calls',
      sourceLabel: 'Gong Calls',
    },
  ],
  von_iq: [
    { id: 'von_signal', label: 'Signal Type', sourceId: 'von_iq', sourceLabel: 'Von IQ Signals' },
    { id: 'von_score', label: 'Score', sourceId: 'von_iq', sourceLabel: 'Von IQ Signals' },
  ],
};

const defaultFilterFields = [
  { value: 'close_date', label: 'Close Date' },
  { value: 'stage', label: 'Stage' },
  { value: 'amount', label: 'Amount' },
  { value: 'probability', label: 'Probability' },
  { value: 'owner', label: 'Owner' },
  { value: 'account_name', label: 'Account Name' },
  { value: 'industry', label: 'Industry' },
];

// ============================================================================
// Step Components
// ============================================================================

type Step = 1 | 2 | 3;

const stepTitles: Record<Step, string> = {
  1: 'Select Primary Source',
  2: 'Apply Filters',
  3: 'Select Columns',
};

// Radio Option Component (compact)
interface RadioOptionProps {
  selected: boolean;
  label: string;
  onClick: () => void;
}

const RadioOption: React.FC<RadioOptionProps> = ({ selected, label, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`
      w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-colors cursor-pointer
      ${selected ? 'bg-gray-50 border border-gray-100' : 'bg-white border border-gray-100 hover:bg-gray-50'}
    `}
  >
    <div
      className={`
      w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center flex-shrink-0
      ${selected ? 'border-orange-600 bg-orange-600' : 'border-gray-300'}
    `}
    >
      {selected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
    </div>
    <span className={`text-[13px] ${selected ? 'text-gray-900 font-medium' : 'text-gray-900'}`}>
      {label}
    </span>
  </button>
);

// Checkbox Option Component (compact)
interface CheckboxOptionProps {
  checked: boolean;
  label: string;
  description?: string;
  onChange: (checked: boolean) => void;
}

const CheckboxOption: React.FC<CheckboxOptionProps> = ({
  checked,
  label,
  description,
  onChange,
}) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className={`
      w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-colors cursor-pointer
      ${checked ? 'bg-gray-50 border border-gray-100' : 'bg-white border border-gray-100 hover:bg-gray-50'}
    `}
  >
    <div
      className={`
      w-3.5 h-3.5 rounded flex items-center justify-center flex-shrink-0 transition-colors
      ${checked ? 'bg-orange-600 border-orange-600' : 'border-2 border-gray-100'}
    `}
    >
      {checked && <Check size={9} weight="bold" className="text-white" />}
    </div>
    <span
      className={`text-[13px] flex-1 ${checked ? 'text-gray-900 font-medium' : 'text-gray-900'}`}
    >
      {label}
    </span>
    {description && <span className="text-[11px] text-gray-500">{description}</span>}
  </button>
);

// Column Checkbox (compact)
interface ColumnCheckboxProps {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}

const ColumnCheckbox: React.FC<ColumnCheckboxProps> = ({ checked, label, onChange }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className={`
      flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition-colors cursor-pointer border
      ${checked ? 'bg-gray-100 border-gray-200 text-gray-900' : 'bg-gray-50 border-gray-100 text-gray-700 hover:bg-gray-100'}
    `}
  >
    <div
      className={`
      w-3 h-3 rounded flex items-center justify-center flex-shrink-0 transition-colors
      ${checked ? 'bg-orange-600' : 'border border-gray-200'}
    `}
    >
      {checked && <Check size={8} weight="bold" className="text-white" />}
    </div>
    <span className="text-[12px]">{label}</span>
  </button>
);

// ============================================================================
// Main Component
// ============================================================================

export const NewReportModal: React.FC<NewReportModalProps> = ({
  isOpen,
  dataSources,
  relatedObjectsBySource,
  columnsBySource,
  filterFields,
  onConfirm,
  onCancel,
}) => {
  // Use provided data or fall back to defaults
  const availableDataSources = dataSources || defaultDataSources;
  const availableRelatedObjects = relatedObjectsBySource || defaultRelatedObjects;
  const availableColumns = columnsBySource || defaultColumnsBySource;
  const availableFilterFields = filterFields || defaultFilterFields;

  // Wizard state
  const [currentStep, setCurrentStep] = useState<Step>(1);

  // Form state
  const [primarySource, setPrimarySource] = useState<string>('');
  const [selectedRelatedObjects, setSelectedRelatedObjects] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<ReportFilter[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<Set<string>>(new Set());

  const totalSteps = 3;

  // Navigation
  const canGoNext = () => {
    switch (currentStep) {
      case 1:
        return primarySource !== '';
      case 2:
        return true; // Filters are optional
      case 3:
        return selectedColumns.size > 0;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < 3 && canGoNext()) {
      setCurrentStep((currentStep + 1) as Step);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as Step);
    }
  };

  const handleConfirm = () => {
    onConfirm({
      primarySource,
      relatedObjects: Array.from(selectedRelatedObjects),
      filters,
      columns: Array.from(selectedColumns),
    });
    resetForm();
  };

  const handleCancel = () => {
    resetForm();
    onCancel();
  };

  const resetForm = () => {
    setCurrentStep(1);
    setPrimarySource('');
    setSelectedRelatedObjects(new Set());
    setFilters([]);
    setSelectedColumns(new Set());
  };

  // Filter handlers
  const handleAddFilter = () => {
    setFilters([...filters, { id: crypto.randomUUID(), field: '', operator: '', value: '' }]);
  };

  const handleUpdateFilter = (
    id: string,
    updates: Partial<{ field: string; operator: string; value: string }>
  ) => {
    setFilters(filters.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  };

  const handleRemoveFilter = (id: string) => {
    setFilters(filters.filter((f) => f.id !== id));
  };

  // Related objects toggle
  const toggleRelatedObject = (id: string) => {
    setSelectedRelatedObjects((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Column toggle
  const toggleColumn = (id: string) => {
    setSelectedColumns((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Get available columns based on selected sources
  const getAvailableColumnsForStep3 = () => {
    const sources = [primarySource, ...Array.from(selectedRelatedObjects)];
    const columns: Record<string, ColumnOption[]> = {};

    sources.forEach((sourceId) => {
      if (availableColumns[sourceId]) {
        const sourceLabel = availableColumns[sourceId][0]?.sourceLabel || sourceId;
        columns[sourceLabel] = availableColumns[sourceId];
      }
    });

    return columns;
  };

  // Get related objects for selected primary source
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _relatedObjects = primarySource ? availableRelatedObjects[primarySource] || [] : [];

  // Get related objects for a specific source
  const getRelatedObjectsForSource = (sourceId: string) => {
    return availableRelatedObjects[sourceId] || [];
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-3">
            {/* Step title */}
            <span className="text-xs font-medium text-gray-700">{stepTitles[1]}</span>

            {/* Primary source selection with nested related objects */}
            <div className="space-y-1.5">
              {availableDataSources.map((source) => {
                const isSelected = primarySource === source.id;
                const sourceRelatedObjects = getRelatedObjectsForSource(source.id);
                const hasRelatedObjects = sourceRelatedObjects.length > 0;

                return (
                  <div key={source.id}>
                    <RadioOption
                      selected={isSelected}
                      label={source.label}
                      onClick={() => setPrimarySource(source.id)}
                    />

                    {/* Related objects nested under selected source */}
                    <AnimatePresence>
                      {isSelected && hasRelatedObjects && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          className="overflow-hidden"
                        >
                          <div className="ml-4 pl-3 border-l border-gray-200 mt-1.5 space-y-1.5">
                            <span className="text-[11px] font-medium text-gray-500 pb-2 tracking-wide">
                              Available to join
                            </span>
                            {sourceRelatedObjects.map((obj) => (
                              <CheckboxOption
                                key={obj.id}
                                checked={selectedRelatedObjects.has(obj.id)}
                                label={obj.label}
                                description={`via ${obj.relationField}`}
                                onChange={() => toggleRelatedObject(obj.id)}
                              />
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-3">
            {/* Step title */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-700">{stepTitles[2]}</span>
              <AddButton onClick={handleAddFilter}>Add Filter</AddButton>
            </div>

            {filters.length === 0 ? (
              <div className="py-4 text-center">
                <p className="text-[13px] text-gray-500">No filters added</p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Click "Add Filter" to filter your data
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filters.map((filter) => (
                  <FilterRow
                    key={filter.id}
                    fields={availableFilterFields}
                    field={filter.field}
                    operator={filter.operator}
                    value={filter.value}
                    onFieldChange={(field) => handleUpdateFilter(filter.id, { field })}
                    onOperatorChange={(operator) => handleUpdateFilter(filter.id, { operator })}
                    onValueChange={(value) => handleUpdateFilter(filter.id, { value })}
                    onRemove={() => handleRemoveFilter(filter.id)}
                    showRemove={true}
                  />
                ))}
              </div>
            )}
          </div>
        );

      case 3: {
        const columnGroups = getAvailableColumnsForStep3();
        return (
          <div className="space-y-4">
            {/* Step title */}
            <span className="text-xs font-medium text-gray-700">{stepTitles[3]}</span>

            {Object.entries(columnGroups).map(([sourceLabel, columns]) => (
              <div key={sourceLabel} className="space-y-2">
                <span className="text-[11px] font-medium text-gray-500">From {sourceLabel}:</span>
                <div className="flex flex-wrap gap-1.5">
                  {columns.map((col) => (
                    <ColumnCheckbox
                      key={col.id}
                      checked={selectedColumns.has(col.id)}
                      label={col.label}
                      onChange={() => toggleColumn(col.id)}
                    />
                  ))}
                </div>
              </div>
            ))}

            <button
              type="button"
              className="flex items-center gap-2 px-3 py-2 text-[13px] text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
            >
              <Sparkle size={16} weight="duotone" />
              <span>Add AI Column</span>
            </button>
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm"
            onClick={handleCancel}
          />

          {/* Modal panel - centered popup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md max-h-[85vh] z-[10000] flex flex-col rounded-2xl border border-gray-200 shadow-xl overflow-hidden"
          >
            {/* Background */}
            <div className="absolute inset-0 bg-white rounded-2xl overflow-hidden" />

            {/* Content */}
            <div className="relative z-10 flex flex-col flex-1 p-5 overflow-hidden">
              {/* Header */}
              <div className="flex flex-row items-center gap-2 pb-4 mb-4 border-b border-gray-100">
                <Table size={20} weight="duotone" className="text-gray-700" />
                <h3 className="text-base font-medium text-gray-900">Create New Report</h3>
              </div>

              {/* Scrollable Form Content */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.15 }}
                  >
                    {renderStepContent()}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 pt-4 mt-auto">
                {currentStep > 1 ? (
                  <GhostButton onClick={handleBack} fullWidth>
                    Back
                  </GhostButton>
                ) : (
                  <GhostButton onClick={handleCancel} fullWidth>
                    Cancel
                  </GhostButton>
                )}
                {currentStep < 3 ? (
                  <PrimaryButton onClick={handleNext} disabled={!canGoNext()} fullWidth>
                    Next ({currentStep} of {totalSteps})
                  </PrimaryButton>
                ) : (
                  <PrimaryButton onClick={handleConfirm} disabled={!canGoNext()} fullWidth>
                    Create Report
                  </PrimaryButton>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NewReportModal;
