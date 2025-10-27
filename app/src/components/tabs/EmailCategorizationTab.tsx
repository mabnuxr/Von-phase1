import usePreferencesStore from "../../store/preferencesStore";
import type {
  FilterCondition,
  FilterGroup,
} from "../../store/preferencesStore";

export function EmailCategorizationTab() {
  const {
    emailCategorization: config,
    updateEmailCategorization: updateConfig,
    addFilterCondition,
    removeFilterCondition,
    updateFilterCondition,
    addFilterGroup,
    removeFilterGroup,
    addConditionToGroup,
    removeConditionFromGroup,
    updateConditionInGroup,
    updateFilterGroup,
  } = usePreferencesStore();

  const handleAddCondition = () => {
    const newCondition: FilterCondition = {
      id: Date.now().toString(),
      field: "",
      operator: "equals",
      value: "",
      logicalOperator: "AND",
    };
    addFilterCondition(newCondition);
  };

  const handleAddConditionGroup = () => {
    // Create a new group with one empty condition
    const newGroup: FilterGroup = {
      id: Date.now().toString(),
      conditions: [
        {
          id: `${Date.now()}-1`,
          field: "",
          operator: "equals",
          value: "",
        },
      ],
      logicalOperator: "OR", // Groups are connected with OR by default
    };
    addFilterGroup(newGroup);
  };

  const handleAddConditionToGroup = (groupId: string) => {
    const newCondition: FilterCondition = {
      id: `${Date.now()}-${Math.random()}`,
      field: "",
      operator: "equals",
      value: "",
      logicalOperator: "AND", // Within group, default is AND
    };
    addConditionToGroup(groupId, newCondition);
  };

  return (
    <div className="px-6 pt-2 pb-6 space-y-6 max-w-4xl">
      {/* Email Categorization Toggle */}
      <div className="flex items-center gap-3">
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={(e) => updateConfig({ enabled: e.target.checked })}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
        </label>
        <div>
          <p className="text-sm font-medium text-[#1d1d1f]">
            Email correspondence
          </p>
        </div>
      </div>

      {/* Which object are emails logged to? */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-[#1d1d1f] mb-2">
          Which object are emails logged to?
          <span className="inline-flex items-center justify-center w-4 h-4 bg-purple-100 text-purple-600 rounded-full text-xs cursor-help">
            ?
          </span>
        </label>
        <select
          value={config.emailObjectType}
          onChange={(e) => updateConfig({ emailObjectType: e.target.value })}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
        >
          <option value="Task">Task</option>
          <option value="Email">Email</option>
          <option value="Activity">Activity</option>
        </select>
      </div>

      {/* Which field identifies the opportunity? */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-[#1d1d1f] mb-2">
          Which field identifies the opportunity?
          <span className="inline-flex items-center justify-center w-4 h-4 bg-purple-100 text-purple-600 rounded-full text-xs cursor-help">
            ?
          </span>
        </label>
        <select
          value={config.opportunityField}
          onChange={(e) => updateConfig({ opportunityField: e.target.value })}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
        >
          <option value="Related To ID">Related To ID</option>
          <option value="WhatId">WhatId</option>
          <option value="Opportunity__c">Opportunity__c</option>
        </select>
      </div>

      {/* Which field identifies the account? */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-[#1d1d1f] mb-2">
          Which field identifies the account?
          <span className="inline-flex items-center justify-center w-4 h-4 bg-purple-100 text-purple-600 rounded-full text-xs cursor-help">
            ?
          </span>
        </label>
        <select
          value={config.accountField}
          onChange={(e) => updateConfig({ accountField: e.target.value })}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
        >
          <option value="Account ID">Account ID</option>
          <option value="AccountId">AccountId</option>
          <option value="Account__c">Account__c</option>
        </select>
      </div>

      {/* Which field identifies the email body? */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-[#1d1d1f] mb-2">
          Which field identifies the email body?
          <span className="inline-flex items-center justify-center w-4 h-4 bg-purple-100 text-purple-600 rounded-full text-xs cursor-help">
            ?
          </span>
        </label>
        <select
          value={config.emailBodyField}
          onChange={(e) => updateConfig({ emailBodyField: e.target.value })}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
        >
          <option value="Description">Description</option>
          <option value="Body">Body</option>
          <option value="EmailBody__c">EmailBody__c</option>
        </select>
      </div>

      {/* Filter records - Entire section as a visual block */}
      <div className="border-2 border-gray-200 rounded-lg bg-gray-50/30 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-200 bg-white">
          <label className="flex items-center gap-2 text-sm font-medium text-[#1d1d1f] m-0">
            Filter records to which emails are logged
            <span className="inline-flex items-center justify-center w-4 h-4 bg-purple-100 text-purple-600 rounded-full text-xs cursor-help">
              ?
            </span>
          </label>
        </div>

        {/* Content Area */}
        <div className="p-5 space-y-3">
          {/* Individual Filter Conditions */}
          {config.filterConditions.map((condition, index) => (
            <div key={condition.id}>
              {/* Show logical operator toggle for conditions after the first */}
              {index > 0 && (
                <div className="flex items-center mb-2">
                  <div className="inline-flex rounded overflow-hidden border border-gray-300 bg-white">
                    <button
                      onClick={() =>
                        updateFilterCondition(condition.id, {
                          logicalOperator: "AND",
                        })
                      }
                      className={`px-3 py-1 text-xs font-semibold transition-colors ${
                        (condition.logicalOperator || "AND") === "AND"
                          ? "bg-gray-200 text-gray-900"
                          : "bg-white text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      AND
                    </button>
                    <div className="w-px bg-gray-300"></div>
                    <button
                      onClick={() =>
                        updateFilterCondition(condition.id, {
                          logicalOperator: "OR",
                        })
                      }
                      className={`px-3 py-1 text-xs font-semibold transition-colors ${
                        condition.logicalOperator === "OR"
                          ? "bg-gray-200 text-gray-900"
                          : "bg-white text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      OR
                    </button>
                  </div>
                </div>
              )}

              {/* Filter Condition Row */}
              <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-gray-300">
                <input
                  type="text"
                  value={condition.field}
                  onChange={(e) =>
                    updateFilterCondition(condition.id, {
                      field: e.target.value,
                    })
                  }
                  placeholder="Field"
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />

                <select
                  value={condition.operator}
                  onChange={(e) =>
                    updateFilterCondition(condition.id, {
                      operator: e.target.value as FilterCondition["operator"],
                    })
                  }
                  className="px-3 py-2 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="equals">Equal to</option>
                  <option value="contains">Contains</option>
                  <option value="startsWith">Starts with</option>
                  <option value="endsWith">Ends with</option>
                </select>

                <input
                  type="text"
                  value={condition.value}
                  onChange={(e) =>
                    updateFilterCondition(condition.id, {
                      value: e.target.value,
                    })
                  }
                  placeholder="Value"
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />

                <button
                  onClick={() => removeFilterCondition(condition.id)}
                  className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="Remove condition"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
          ))}

          {/* Filter Groups (OR connected groups with AND conditions inside) */}
          {(config.filterGroups || []).map((group, groupIndex) => (
            <div key={group.id}>
              {/* Show OR label before group if there are individual conditions or previous groups */}
              {(config.filterConditions.length > 0 || groupIndex > 0) && (
                <div className="flex items-center mb-2">
                  <div className="inline-flex rounded overflow-hidden border border-gray-300 bg-white">
                    <button
                      onClick={() =>
                        updateFilterGroup(group.id, {
                          logicalOperator: "AND",
                        })
                      }
                      className={`px-3 py-1 text-xs font-semibold transition-colors ${
                        group.logicalOperator === "AND"
                          ? "bg-gray-200 text-gray-900"
                          : "bg-white text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      AND
                    </button>
                    <div className="w-px bg-gray-300"></div>
                    <button
                      onClick={() =>
                        updateFilterGroup(group.id, {
                          logicalOperator: "OR",
                        })
                      }
                      className={`px-3 py-1 text-xs font-semibold transition-colors ${
                        (group.logicalOperator || "OR") === "OR"
                          ? "bg-gray-200 text-gray-900"
                          : "bg-white text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      OR
                    </button>
                  </div>
                </div>
              )}

              {/* Group Container - Subtle visual distinction */}
              <div className="space-y-3 pl-4 border-l-4 border-purple-300">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-purple-600 uppercase tracking-wide">
                    Condition Group
                  </span>
                  <button
                    onClick={() => removeFilterGroup(group.id)}
                    className="text-xs text-gray-500 hover:text-red-600 transition-colors"
                    title="Remove group"
                  >
                    Remove Group
                  </button>
                </div>

                {/* Conditions within the group */}
                {group.conditions.map((condition, condIndex) => (
                  <div key={condition.id}>
                    {condIndex > 0 && (
                      <div className="flex items-center mb-2">
                        <div className="inline-flex rounded overflow-hidden border border-gray-300 bg-white">
                          <button
                            onClick={() =>
                              updateConditionInGroup(group.id, condition.id, {
                                logicalOperator: "AND",
                              })
                            }
                            className={`px-3 py-1 text-xs font-semibold transition-colors ${
                              (condition.logicalOperator || "AND") === "AND"
                                ? "bg-gray-200 text-gray-900"
                                : "bg-white text-gray-600 hover:bg-gray-50"
                            }`}
                          >
                            AND
                          </button>
                          <div className="w-px bg-gray-300"></div>
                          <button
                            onClick={() =>
                              updateConditionInGroup(group.id, condition.id, {
                                logicalOperator: "OR",
                              })
                            }
                            className={`px-3 py-1 text-xs font-semibold transition-colors ${
                              condition.logicalOperator === "OR"
                                ? "bg-gray-200 text-gray-900"
                                : "bg-white text-gray-600 hover:bg-gray-50"
                            }`}
                          >
                            OR
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-gray-300">
                      <input
                        type="text"
                        value={condition.field}
                        onChange={(e) =>
                          updateConditionInGroup(group.id, condition.id, {
                            field: e.target.value,
                          })
                        }
                        placeholder="Field"
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />

                      <select
                        value={condition.operator}
                        onChange={(e) =>
                          updateConditionInGroup(group.id, condition.id, {
                            operator: e.target
                              .value as FilterCondition["operator"],
                          })
                        }
                        className="px-3 py-2 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="equals">Equal to</option>
                        <option value="contains">Contains</option>
                        <option value="startsWith">Starts with</option>
                        <option value="endsWith">Ends with</option>
                      </select>

                      <input
                        type="text"
                        value={condition.value}
                        onChange={(e) =>
                          updateConditionInGroup(group.id, condition.id, {
                            value: e.target.value,
                          })
                        }
                        placeholder="Value"
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />

                      <button
                        onClick={() =>
                          removeConditionFromGroup(group.id, condition.id)
                        }
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Remove condition"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}

                {/* Add condition to group button */}
                <button
                  onClick={() => handleAddConditionToGroup(group.id)}
                  className="w-full px-3 py-2 text-sm font-medium text-purple-600 bg-white border border-dashed border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  + Add condition to group
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer - Add Condition Buttons */}
        <div className="px-5 py-4 border-t border-gray-200 bg-white">
          <div className="flex gap-2">
            <button
              onClick={handleAddCondition}
              className="px-4 py-2 text-sm font-medium text-purple-600 bg-white border border-purple-600 rounded-lg hover:bg-purple-50 transition-colors"
            >
              + Add condition
            </button>
            <button
              onClick={handleAddConditionGroup}
              className="px-4 py-2 text-sm font-medium text-purple-600 bg-white border border-purple-600 rounded-lg hover:bg-purple-50 transition-colors"
            >
              + Add condition group
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
