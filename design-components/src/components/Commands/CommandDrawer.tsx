/**
 * CommandDrawer component
 * Drawer for creating and editing commands with a 3-step wizard flow
 * Updated with new action type configurations and compact styling
 */

import React, { useState } from 'react';
import { X, Check, Lightning, CaretUp, CaretDown, MagnifyingGlass } from '@phosphor-icons/react';
import {
  type Command,
  type CommandCategory,
  type DataSource,
  type ActionType,
  type FillDocType,
  type SalesforceFieldConfig,
  type DataSourceConfig,
  type FillDocConfig,
  DATA_SOURCE_LABELS,
  ACTION_TYPE_LABELS,
  CATEGORY_OPTIONS,
  FILL_DOC_TYPE_LABELS,
  INTERNAL_DOC_FOLDERS,
} from './types';

interface CommandDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (command: Omit<Command, 'id' | 'createdAt' | 'updatedAt'>) => void;
  editingCommand?: Command | null;
  /** Optional: Salesforce fields for selection (fetched from API) */
  salesforceFields?: Array<{ name: string; label: string; type: string }>;
  /** Loading state for salesforce fields */
  isLoadingSalesforceFields?: boolean;
}

type Step = 1 | 2 | 3;

const DATA_SOURCES: DataSource[] = ['emails', 'calls', 'sfdc', 'internal_docs'];
const ACTION_TYPES: ActionType[] = ['update_salesforce', 'text_output', 'fill_doc', 'gmail_draft'];

// Mock salesforce fields for design preview (will be replaced with actual API data)
const MOCK_SALESFORCE_FIELDS = [
  { name: 'StageName', label: 'Deal Stage', type: 'picklist' },
  { name: 'CloseDate', label: 'Close Date', type: 'date' },
  { name: 'Amount', label: 'Deal Amount', type: 'currency' },
  { name: 'ContactRole', label: 'Contact Role', type: 'text' },
  { name: 'Probability', label: 'Probability', type: 'percent' },
  { name: 'NextStep', label: 'Next Step', type: 'text' },
  { name: 'Description', label: 'Description', type: 'textarea' },
  { name: 'KeyDecisionMakers', label: 'Key Decision Makers', type: 'textarea' },
];

export const CommandDrawer: React.FC<CommandDrawerProps> = ({
  isOpen,
  onClose,
  onSave,
  editingCommand,
  salesforceFields = MOCK_SALESFORCE_FIELDS,
  isLoadingSalesforceFields = false,
}) => {
  const [step, setStep] = useState<Step>(1);
  const [name, setName] = useState(editingCommand?.name || '');
  const [description, setDescription] = useState(editingCommand?.description || '');
  const [category, setCategory] = useState<CommandCategory>(editingCommand?.category || 'Custom');

  // Data sources with configs
  const [dataSourceConfigs, setDataSourceConfigs] = useState<Record<DataSource, DataSourceConfig>>(
    editingCommand?.dataSourceConfigs || {
      emails: { enabled: false, instructions: '' },
      calls: { enabled: false, instructions: '' },
      sfdc: { enabled: false, instructions: '' },
      internal_docs: { enabled: false, instructions: '', folders: [] },
    }
  );
  const [expandedDataSources, setExpandedDataSources] = useState<DataSource[]>([]);

  // Action type state
  const [actionType, setActionType] = useState<ActionType | null>(editingCommand?.actionType || null);
  const [expandedActionType, setExpandedActionType] = useState<ActionType | null>(null);

  // Salesforce fields state
  const [selectedSalesforceFields, setSelectedSalesforceFields] = useState<SalesforceFieldConfig[]>(
    editingCommand?.salesforceFields || []
  );
  const [salesforceFieldSearch, setSalesforceFieldSearch] = useState('');

  // Fill doc state
  const [fillDocConfig, setFillDocConfig] = useState<FillDocConfig>(
    editingCommand?.fillDocConfig || { type: 'upload_on_chat' }
  );

  // Step 3 state
  const [prompt, setPrompt] = useState(editingCommand?.prompt || '');
  const [isPublic, setIsPublic] = useState(editingCommand?.isPublic || false);

  const resetForm = () => {
    setStep(1);
    setName('');
    setDescription('');
    setCategory('Custom');
    setDataSourceConfigs({
      emails: { enabled: false, instructions: '' },
      calls: { enabled: false, instructions: '' },
      sfdc: { enabled: false, instructions: '' },
      internal_docs: { enabled: false, instructions: '', folders: [] },
    });
    setExpandedDataSources([]);
    setActionType(null);
    setExpandedActionType(null);
    setSelectedSalesforceFields([]);
    setSalesforceFieldSearch('');
    setFillDocConfig({ type: 'upload_on_chat' });
    setPrompt('');
    setIsPublic(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleNext = () => {
    if (step < 3) {
      setStep((step + 1) as Step);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((step - 1) as Step);
    }
  };

  const handleSave = () => {
    if (!name.trim() || !actionType) return;

    const enabledDataSources = DATA_SOURCES.filter((ds) => dataSourceConfigs[ds].enabled);
    const finalPrompt =
      prompt.trim() ||
      `${name}\n\nPlease provide a comprehensive response based on the available data.`;

    onSave({
      name: name.trim(),
      description: description.trim() || `Custom command: ${name}`,
      category,
      dataSources: enabledDataSources,
      dataSourceConfigs,
      actionType,
      salesforceFields: actionType === 'update_salesforce' ? selectedSalesforceFields : undefined,
      fillDocConfig: actionType === 'fill_doc' ? fillDocConfig : undefined,
      prompt: finalPrompt,
      isPublic,
    });

    handleClose();
  };

  // Data source handlers
  const toggleDataSource = (source: DataSource) => {
    const wasEnabled = dataSourceConfigs[source].enabled;
    setDataSourceConfigs((prev) => ({
      ...prev,
      [source]: { ...prev[source], enabled: !prev[source].enabled },
    }));

    // Auto-expand when enabling, collapse when disabling
    if (!wasEnabled) {
      // Enabling - auto expand
      setExpandedDataSources((prev) => (prev.includes(source) ? prev : [...prev, source]));
    } else {
      // Disabling - collapse
      setExpandedDataSources((prev) => prev.filter((s) => s !== source));
    }
  };

  const toggleDataSourceExpanded = (source: DataSource) => {
    setExpandedDataSources((prev) =>
      prev.includes(source) ? prev.filter((s) => s !== source) : [...prev, source]
    );
  };

  const updateDataSourceInstructions = (source: DataSource, instructions: string) => {
    setDataSourceConfigs((prev) => ({
      ...prev,
      [source]: { ...prev[source], instructions },
    }));
  };

  const toggleInternalDocFolder = (folder: string) => {
    setDataSourceConfigs((prev) => {
      const currentFolders = prev.internal_docs.folders || [];
      const newFolders = currentFolders.includes(folder)
        ? currentFolders.filter((f) => f !== folder)
        : [...currentFolders, folder];
      return {
        ...prev,
        internal_docs: { ...prev.internal_docs, folders: newFolders },
      };
    });
  };

  // Salesforce field handlers
  const addSalesforceField = (field: { name: string; label: string; type: string }) => {
    if (selectedSalesforceFields.length >= 5) return;
    if (selectedSalesforceFields.some((f) => f.fieldName === field.name)) return;
    setSelectedSalesforceFields((prev) => [
      ...prev,
      { fieldName: field.name, fieldLabel: field.label, fieldType: field.type },
    ]);
    setSalesforceFieldSearch('');
  };

  const removeSalesforceField = (fieldName: string) => {
    setSelectedSalesforceFields((prev) => prev.filter((f) => f.fieldName !== fieldName));
  };

  const filteredSalesforceFields = salesforceFields.filter(
    (field) =>
      !selectedSalesforceFields.some((sf) => sf.fieldName === field.name) &&
      (field.label.toLowerCase().includes(salesforceFieldSearch.toLowerCase()) ||
        field.name.toLowerCase().includes(salesforceFieldSearch.toLowerCase()))
  );

  // Action type handlers
  const selectActionType = (type: ActionType) => {
    setActionType(type);
    // Auto-expand if it has configuration options
    if (type === 'update_salesforce' || type === 'fill_doc') {
      setExpandedActionType(type);
    } else {
      setExpandedActionType(null);
    }
  };

  const canProceedStep1 = name.trim().length > 0;
  const canProceedStep2 = actionType !== null;
  const enabledSourceCount = DATA_SOURCES.filter((ds) => dataSourceConfigs[ds].enabled).length;

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 transition-opacity duration-300 z-[55]"
        onClick={handleClose}
      />

      {/* Drawer */}
      <div
        className="fixed top-0 right-0 h-full p-2 z-[60]"
        style={{ width: '520px', maxWidth: '90vw' }}
      >
        <div className="h-full flex flex-col bg-white rounded-xl border border-gray-200 shadow-lg">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
            <h2 className="text-base font-semibold text-gray-900">
              {editingCommand ? 'Edit Quick Action' : 'Create Quick Action'}
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          {/* Progress Indicator */}
          <div className="px-5 py-3 border-b border-gray-100">
            <div className="flex items-center justify-between">
              {[1, 2, 3].map((s) => (
                <React.Fragment key={s}>
                  <div
                    className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-medium transition-colors ${
                      step >= s
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {step > s ? <Check size={14} weight="bold" /> : s}
                  </div>
                  {s < 3 && (
                    <div
                      className={`flex-1 h-0.5 mx-2 transition-colors ${
                        step > s ? 'bg-green-500' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-5 py-4">
            {/* Step 1: What are you trying to accomplish? */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-base font-semibold text-gray-900">
                    What are you trying to accomplish?
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">Describe the task you want to automate</p>
                </div>

                <div>
                  <textarea
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Example: Create a manager note for a deal"
                    className="w-full h-24 px-3 py-2.5 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">Category</label>
                  <div className="flex flex-wrap gap-1.5">
                    {CATEGORY_OPTIONS.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setCategory(cat)}
                        className={`px-3 py-1.5 text-xs rounded-lg border transition-colors cursor-pointer ${
                          category === cat
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Data Sources and Action Type */}
            {step === 2 && (
              <div className="space-y-5">
                {/* Action Type */}
                <div>
                  <h4 className="text-xs font-medium text-gray-900 mb-2">Action Type</h4>
                  <div className="space-y-2">
                    {ACTION_TYPES.map((type) => {
                      const isSelected = actionType === type;
                      const isExpanded = expandedActionType === type;
                      const hasConfig = type === 'update_salesforce' || type === 'fill_doc';

                      return (
                        <div
                          key={type}
                          className={`border rounded-lg transition-all ${
                            isSelected
                              ? 'border-gray-300 bg-gray-50/50'
                              : 'border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          {/* Action Header */}
                          <div
                            className="flex items-center p-3 cursor-pointer"
                            onClick={() => selectActionType(type)}
                          >
                            <div
                              className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center flex-shrink-0 ${
                                isSelected ? 'border-gray-900' : 'border-gray-300'
                              }`}
                            >
                              {isSelected && <div className="w-2 h-2 rounded-full bg-gray-900" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-900">
                                {ACTION_TYPE_LABELS[type].label}
                              </div>
                              <div className="text-xs text-gray-500">
                                {ACTION_TYPE_LABELS[type].description}
                              </div>
                            </div>
                            {hasConfig && isSelected && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedActionType(isExpanded ? null : type);
                                }}
                                className="text-gray-400 hover:text-gray-600 p-1"
                              >
                                {isExpanded ? <CaretUp size={16} /> : <CaretDown size={16} />}
                              </button>
                            )}
                          </div>

                          {/* Update Salesforce Config */}
                          {type === 'update_salesforce' && isSelected && isExpanded && (
                            <div className="px-3 pb-3 border-t border-gray-100 pt-3">
                              <label className="block text-xs font-medium text-gray-700 mb-2">
                                Select Salesforce Fields to Update
                              </label>

                              {/* Search Input */}
                              <div className="relative mb-2">
                                <MagnifyingGlass
                                  size={14}
                                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                />
                                <input
                                  type="text"
                                  value={salesforceFieldSearch}
                                  onChange={(e) => setSalesforceFieldSearch(e.target.value)}
                                  placeholder="Search and add fields..."
                                  className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300"
                                />
                              </div>

                              {/* Field Dropdown */}
                              {salesforceFieldSearch && (
                                <div className="mb-2 max-h-36 overflow-y-auto border border-gray-200 rounded-lg bg-white">
                                  {isLoadingSalesforceFields ? (
                                    <div className="px-3 py-2 text-xs text-gray-500">
                                      Loading fields...
                                    </div>
                                  ) : filteredSalesforceFields.length === 0 ? (
                                    <div className="px-3 py-2 text-xs text-gray-500">
                                      No fields found
                                    </div>
                                  ) : (
                                    filteredSalesforceFields.slice(0, 6).map((field) => (
                                      <button
                                        key={field.name}
                                        onClick={() => addSalesforceField(field)}
                                        className="w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors cursor-pointer border-b border-gray-100 last:border-b-0"
                                      >
                                        <div className="text-sm font-medium text-gray-900">
                                          {field.label}
                                        </div>
                                        <div className="text-xs text-gray-500">{field.type}</div>
                                      </button>
                                    ))
                                  )}
                                </div>
                              )}

                              {/* Selected Fields */}
                              {selectedSalesforceFields.length > 0 && (
                                <div>
                                  <div className="text-xs text-gray-500 mb-1.5">
                                    {selectedSalesforceFields.length} field
                                    {selectedSalesforceFields.length > 1 ? 's' : ''} selected
                                  </div>
                                  <div className="flex flex-wrap gap-1.5">
                                    {selectedSalesforceFields.map((field) => (
                                      <span
                                        key={field.fieldName}
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 rounded-full text-xs"
                                      >
                                        <span className="font-medium text-gray-900">
                                          {field.fieldLabel}
                                        </span>
                                        <span className="text-gray-500">· {field.fieldType}</span>
                                        <button
                                          onClick={() => removeSalesforceField(field.fieldName)}
                                          className="text-gray-400 hover:text-gray-600 ml-0.5"
                                        >
                                          <X size={12} />
                                        </button>
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Fill a Doc Config */}
                          {type === 'fill_doc' && isSelected && isExpanded && (
                            <div className="px-3 pb-3 border-t border-gray-100 pt-3">
                              <label className="block text-xs font-medium text-gray-700 mb-2">
                                Document Type
                              </label>
                              <div className="grid grid-cols-2 gap-2">
                                {(['upload_on_chat', 'upload_template'] as FillDocType[]).map(
                                  (docType) => (
                                    <button
                                      key={docType}
                                      onClick={() =>
                                        setFillDocConfig((prev) => ({ ...prev, type: docType }))
                                      }
                                      className={`p-3 rounded-lg border text-left transition-colors cursor-pointer ${
                                        fillDocConfig.type === docType
                                          ? 'border-indigo-300 bg-indigo-50'
                                          : 'border-gray-200 hover:bg-gray-50'
                                      }`}
                                    >
                                      <div
                                        className={`text-sm font-medium ${
                                          fillDocConfig.type === docType
                                            ? 'text-indigo-700'
                                            : 'text-gray-900'
                                        }`}
                                      >
                                        {FILL_DOC_TYPE_LABELS[docType].label}
                                      </div>
                                      <div
                                        className={`text-xs mt-0.5 ${
                                          fillDocConfig.type === docType
                                            ? 'text-indigo-600'
                                            : 'text-gray-500'
                                        }`}
                                      >
                                        {FILL_DOC_TYPE_LABELS[docType].description}
                                      </div>
                                    </button>
                                  )
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Data Sources */}
                <div>
                  <h4 className="text-xs font-medium text-gray-900 mb-2">Data Sources</h4>
                  <div className="space-y-2">
                    {DATA_SOURCES.map((source) => {
                      const config = dataSourceConfigs[source];
                      const isExpanded = expandedDataSources.includes(source);

                      return (
                        <div
                          key={source}
                          className={`border rounded-lg transition-all ${
                            config.enabled ? 'border-gray-300' : 'border-gray-200'
                          }`}
                        >
                          {/* Source Header */}
                          <div className="flex items-center justify-between p-3">
                            <div className="flex items-center gap-2">
                              {/* Toggle Switch */}
                              <div
                                className={`w-9 h-5 rounded-full relative cursor-pointer transition-colors ${
                                  config.enabled ? 'bg-green-500' : 'bg-gray-200'
                                }`}
                                onClick={() => toggleDataSource(source)}
                              >
                                <div
                                  className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                                    config.enabled ? 'translate-x-4' : 'translate-x-0.5'
                                  }`}
                                />
                              </div>
                              <span className="text-sm font-medium text-gray-900">
                                {DATA_SOURCE_LABELS[source]}
                              </span>
                            </div>
                            {config.enabled && (
                              <button
                                onClick={() => toggleDataSourceExpanded(source)}
                                className="text-gray-400 hover:text-gray-600 p-1"
                              >
                                {isExpanded ? <CaretUp size={16} /> : <CaretDown size={16} />}
                              </button>
                            )}
                          </div>

                          {/* Expanded Config */}
                          {config.enabled && isExpanded && (
                            <div className="px-3 pb-3 border-t border-gray-100 pt-3">
                              {source === 'internal_docs' ? (
                                <>
                                  <label className="block text-xs font-medium text-gray-700 mb-2">
                                    Select Folders
                                  </label>
                                  <div className="grid grid-cols-2 gap-2">
                                    {INTERNAL_DOC_FOLDERS.map((folder) => (
                                      <button
                                        key={folder}
                                        onClick={() => toggleInternalDocFolder(folder)}
                                        className={`px-3 py-2 text-xs rounded-lg border text-left transition-colors cursor-pointer ${
                                          config.folders?.includes(folder)
                                            ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                                            : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                                        }`}
                                      >
                                        {folder}
                                      </button>
                                    ))}
                                  </div>
                                </>
                              ) : (
                                <>
                                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                    Instructions
                                  </label>
                                  <input
                                    type="text"
                                    value={config.instructions || ''}
                                    onChange={(e) =>
                                      updateDataSourceInstructions(source, e.target.value)
                                    }
                                    placeholder={
                                      source === 'emails'
                                        ? 'e.g., last 10 days'
                                        : source === 'calls'
                                          ? 'e.g., last 3 calls'
                                          : 'e.g., specific instructions'
                                    }
                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300"
                                  />
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Review */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="w-10 h-10 mx-auto mb-2 bg-green-100 rounded-full flex items-center justify-center">
                    <Check size={20} className="text-green-600" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900">Review your Quick Action</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Check the generated prompt and configure privacy
                  </p>
                </div>

                {/* Command Badge */}
                <div className="flex justify-center">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full">
                    <Lightning size={14} className="text-gray-600" />
                    <span className="text-sm font-medium text-gray-900">/ {name}</span>
                  </div>
                </div>

                {/* Summary */}
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-700 flex flex-wrap items-center gap-1">
                    <span className="font-medium">{enabledSourceCount} sources</span>
                    <span className="text-gray-400">•</span>
                    <span>{actionType && ACTION_TYPE_LABELS[actionType].label}</span>
                    {actionType === 'fill_doc' && (
                      <>
                        <span className="text-gray-400">•</span>
                        <span>{FILL_DOC_TYPE_LABELS[fillDocConfig.type].label}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Generated Prompt */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Generated Prompt (AI-optimized)
                  </label>
                  <textarea
                    value={
                      prompt ||
                      `${name}\n\nPlease provide a comprehensive response based on the available data.`
                    }
                    onChange={(e) => setPrompt(e.target.value)}
                    className="w-full h-20 px-3 py-2.5 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-1 focus:ring-gray-300 bg-gray-50"
                  />
                </div>

                {/* Public Toggle */}
                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      Make this Quick Action public
                    </div>
                    <div className="text-xs text-gray-500">
                      Allow other team members to use this Quick Action
                    </div>
                  </div>
                  <div
                    className={`w-9 h-5 rounded-full relative cursor-pointer transition-colors ${
                      isPublic ? 'bg-gray-900' : 'bg-gray-200'
                    }`}
                    onClick={() => setIsPublic(!isPublic)}
                  >
                    <div
                      className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                        isPublic ? 'translate-x-4' : 'translate-x-0.5'
                      }`}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-gray-200 flex justify-between">
            {step > 1 ? (
              <button
                onClick={handleBack}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Back
              </button>
            ) : (
              <button
                onClick={handleClose}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            )}

            {step < 3 ? (
              <button
                onClick={handleNext}
                disabled={(step === 1 && !canProceedStep1) || (step === 2 && !canProceedStep2)}
                className={`px-5 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                  (step === 1 && canProceedStep1) || (step === 2 && canProceedStep2)
                    ? 'bg-gray-900 text-white hover:bg-gray-800'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSave}
                className="px-5 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer"
              >
                {editingCommand ? 'Save Changes' : 'Create Quick Action'}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
