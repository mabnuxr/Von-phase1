/**
 * CommandDrawer component
 * Drawer for creating and editing commands with a 3-step wizard flow
 */

import React, { useState } from 'react';
import { X, Check, Lightning } from '@phosphor-icons/react';
import {
  type Command,
  type CommandCategory,
  type DataSource,
  type ActionType,
  DATA_SOURCE_LABELS,
  ACTION_TYPE_LABELS,
  CATEGORY_OPTIONS,
} from './types';

interface CommandDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (command: Omit<Command, 'id' | 'createdAt' | 'updatedAt'>) => void;
  editingCommand?: Command | null;
}

type Step = 1 | 2 | 3;

const DATA_SOURCES: DataSource[] = ['emails', 'calls', 'sfdc', 'internal_docs'];
const ACTION_TYPES: ActionType[] = ['update_salesforce', 'text_output', 'fill_doc', 'gmail_draft'];

export const CommandDrawer: React.FC<CommandDrawerProps> = ({
  isOpen,
  onClose,
  onSave,
  editingCommand,
}) => {
  const [step, setStep] = useState<Step>(1);
  const [name, setName] = useState(editingCommand?.name || '');
  const [description, setDescription] = useState(editingCommand?.description || '');
  const [category, setCategory] = useState<CommandCategory>(editingCommand?.category || 'Custom');
  const [dataSources, setDataSources] = useState<DataSource[]>(editingCommand?.dataSources || []);
  const [actionType, setActionType] = useState<ActionType | null>(
    editingCommand?.actionType || null
  );
  const [prompt, setPrompt] = useState(editingCommand?.prompt || '');
  const [isPublic, setIsPublic] = useState(editingCommand?.isPublic || false);

  const resetForm = () => {
    setStep(1);
    setName('');
    setDescription('');
    setCategory('Custom');
    setDataSources([]);
    setActionType(null);
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

    // Generate prompt if not provided
    const finalPrompt =
      prompt.trim() ||
      `${name}\n\nPlease provide a comprehensive response based on the available data.`;

    onSave({
      name: name.trim(),
      description: description.trim() || `Custom command: ${name}`,
      category,
      dataSources,
      actionType,
      prompt: finalPrompt,
      isPublic,
    });

    handleClose();
  };

  const toggleDataSource = (source: DataSource) => {
    setDataSources((prev) =>
      prev.includes(source) ? prev.filter((s) => s !== source) : [...prev, source]
    );
  };

  const canProceedStep1 = name.trim().length > 0;
  const canProceedStep2 = actionType !== null;

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
        className="fixed top-0 right-0 h-full w-[520px] max-w-[90vw] bg-white shadow-xl z-[60] flex flex-col"
        style={{ transform: isOpen ? 'translateX(0)' : 'translateX(100%)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {editingCommand ? 'Edit Quick Command' : 'Create Quick Command'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((s) => (
              <React.Fragment key={s}>
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                    step >= s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {step > s ? <Check size={16} weight="bold" /> : s}
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
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {/* Step 1: What are you trying to accomplish? */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900">
                  What are you trying to accomplish?
                </h3>
                <p className="text-sm text-gray-500 mt-1">Describe the task you want to automate</p>
              </div>

              <div>
                <textarea
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Example: Create a manager note for a deal"
                  className="w-full h-32 px-4 py-3 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORY_OPTIONS.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategory(cat)}
                      className={`px-3 py-1.5 text-sm rounded-lg border transition-colors cursor-pointer ${
                        category === cat
                          ? 'bg-blue-50 border-blue-200 text-blue-700'
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
            <div className="space-y-6">
              {/* Data Sources */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Data Sources</h4>
                <div className="space-y-2">
                  {DATA_SOURCES.map((source) => (
                    <label
                      key={source}
                      className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-colors ${
                        dataSources.includes(source)
                          ? 'border-blue-200 bg-blue-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-sm font-medium text-gray-900">
                        {DATA_SOURCE_LABELS[source]}
                      </span>
                      <div
                        className={`w-10 h-6 rounded-full relative transition-colors ${
                          dataSources.includes(source) ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                        onClick={() => toggleDataSource(source)}
                      >
                        <div
                          className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                            dataSources.includes(source) ? 'translate-x-5' : 'translate-x-1'
                          }`}
                        />
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Action Type */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Action Type</h4>
                <div className="space-y-2">
                  {ACTION_TYPES.map((type) => (
                    <label
                      key={type}
                      className={`flex items-center p-4 border rounded-xl cursor-pointer transition-colors ${
                        actionType === type
                          ? 'border-blue-200 bg-blue-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                      onClick={() => setActionType(type)}
                    >
                      <div
                        className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center ${
                          actionType === type ? 'border-blue-600' : 'border-gray-300'
                        }`}
                      >
                        {actionType === type && (
                          <div className="w-2 h-2 rounded-full bg-blue-600" />
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {ACTION_TYPE_LABELS[type].label}
                        </div>
                        <div className="text-xs text-gray-500">
                          {ACTION_TYPE_LABELS[type].description}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 bg-green-100 rounded-full flex items-center justify-center">
                  <Check size={24} className="text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Review your Quick Command</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Check the generated prompt and configure privacy
                </p>
              </div>

              {/* Command Badge */}
              <div className="flex justify-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full">
                  <Lightning size={16} className="text-gray-600" />
                  <span className="text-sm font-medium text-gray-900">/ {name}</span>
                </div>
              </div>

              {/* Summary */}
              <div className="p-4 bg-blue-50 rounded-xl">
                <div className="text-sm text-blue-700">
                  <span className="font-medium">{dataSources.length} sources</span>
                  <span className="mx-2">•</span>
                  <span>{actionType && ACTION_TYPE_LABELS[actionType].label}</span>
                </div>
              </div>

              {/* Generated Prompt */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Generated Prompt (AI-optimized)
                </label>
                <textarea
                  value={
                    prompt ||
                    `${name}\n\nPlease provide a comprehensive response based on the available data.`
                  }
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full h-24 px-4 py-3 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all bg-gray-50"
                />
              </div>

              {/* Public Toggle */}
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    Make this Quick Command public
                  </div>
                  <div className="text-xs text-gray-500">
                    Allow other team members to use this Quick Command
                  </div>
                </div>
                <div
                  className={`w-10 h-6 rounded-full relative cursor-pointer transition-colors ${
                    isPublic ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                  onClick={() => setIsPublic(!isPublic)}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                      isPublic ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
          {step > 1 ? (
            <button
              onClick={handleBack}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Back
            </button>
          ) : (
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
          )}

          {step < 3 ? (
            <button
              onClick={handleNext}
              disabled={(step === 1 && !canProceedStep1) || (step === 2 && !canProceedStep2)}
              className={`px-6 py-2 text-sm font-medium rounded-xl transition-colors cursor-pointer ${
                (step === 1 && canProceedStep1) || (step === 2 && canProceedStep2)
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-blue-200 text-blue-400 cursor-not-allowed'
              }`}
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSave}
              className="px-6 py-2 text-sm font-medium bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors cursor-pointer"
            >
              {editingCommand ? 'Save Changes' : 'Create Quick Command'}
            </button>
          )}
        </div>
      </div>
    </>
  );
};
