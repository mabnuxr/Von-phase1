import {
  MultiSelect,
  type MultiSelectOption,
} from "@vonlabs/design-components";
import usePreferencesStore from "../../store/preferencesStore";
import type {
  BusinessStage,
  CustomerStage,
} from "../../store/preferencesStore";
import { ChevronDownIcon } from "../icons";

export function ProcessConfigurationTab() {
  const {
    processConfiguration: config,
    updateProcessConfiguration: updateConfig,
  } = usePreferencesStore();

  // Business stage options for multi-select
  const businessStageOptions: MultiSelectOption[] = [
    { value: "Prospect", label: "Prospect" },
    { value: "Qualified", label: "Qualified" },
    { value: "Technical Win", label: "Technical Win" },
  ];

  // Customer stage options for multi-select
  const customerStageOptions: MultiSelectOption[] = [
    { value: "New", label: "New" },
    { value: "Internal Sync Complete", label: "Internal Sync Complete" },
    { value: "All Contact Made", label: "All Contact Made" },
  ];

  const handleBusinessStagesChange = (selected: string[]) => {
    updateConfig({ businessStages: selected as BusinessStage[] });
  };

  const handleCustomerStagesChange = (selected: string[]) => {
    updateConfig({ customerStages: selected as CustomerStage[] });
  };

  return (
    <div className="px-6 pt-2 pb-6 space-y-6 max-w-4xl">
      {/* Business Stages Section */}
      <div className="space-y-4">
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-[#1d1d1f] mb-3">
            What stage is qualified opportunity. What stages do you use and for
            which business line (including renewals)
            <span className="inline-flex items-center justify-center w-4 h-4 bg-purple-100 text-purple-600 rounded-full text-xs cursor-help">
              ?
            </span>
          </label>

          {/* Business Stages Multi-Select */}
          <div className="mb-4">
            <p className="text-xs text-[#6e6e73] mb-2">Business stage</p>
            <MultiSelect
              options={businessStageOptions}
              value={config.businessStages}
              onChange={handleBusinessStagesChange}
              placeholder="Select business stages..."
              fullWidth
            />
          </div>

          {/* Customer Stages Multi-Select */}
          <div>
            <p className="text-xs text-[#6e6e73] mb-2">Customer stage</p>
            <MultiSelect
              options={customerStageOptions}
              value={config.customerStages}
              onChange={handleCustomerStagesChange}
              placeholder="Select customer stages..."
              fullWidth
            />
          </div>
        </div>
      </div>

      {/* Churn Signal Field */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-[#1d1d1f] mb-2">
          How do you signify churn in Salesforce
          <span className="inline-flex items-center justify-center w-4 h-4 bg-purple-100 text-purple-600 rounded-full text-xs cursor-help">
            ?
          </span>
        </label>
        <textarea
          value={config.churnSignalField}
          onChange={(e) => updateConfig({ churnSignalField: e.target.value })}
          placeholder="Opportunity type is partial churn or churn"
          className="w-full px-3 py-2 text-sm text-[#1d1d1f] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200 bg-white"
          style={{
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif',
          }}
          rows={2}
        />
      </div>

      {/* Renewal Detection Field */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-[#1d1d1f] mb-2">
          How do we let what is a renewal opportunity
          <span className="inline-flex items-center justify-center w-4 h-4 bg-purple-100 text-purple-600 rounded-full text-xs cursor-help">
            ?
          </span>
        </label>
        <textarea
          value={config.renewalDetectionField}
          onChange={(e) =>
            updateConfig({ renewalDetectionField: e.target.value })
          }
          placeholder='Enter opportunity type contains word "renewal" or the opportunity name contains word "renewal"'
          className="w-full px-3 py-2 text-sm text-[#1d1d1f] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200 bg-white"
          style={{
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif',
          }}
          rows={2}
        />
      </div>

      {/* Customer Identification Field */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-[#1d1d1f] mb-2">
          How do you let who is a customer?
          <span className="inline-flex items-center justify-center w-4 h-4 bg-purple-100 text-purple-600 rounded-full text-xs cursor-help">
            ?
          </span>
        </label>
        <textarea
          value={config.customerIdentificationField}
          onChange={(e) =>
            updateConfig({ customerIdentificationField: e.target.value })
          }
          placeholder='Account type field, on the account object, is "Customer"'
          className="w-full px-3 py-2 text-sm text-[#1d1d1f] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200 bg-white"
          style={{
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif',
          }}
          rows={2}
        />
      </div>

      {/* Sales Quarter */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-[#1d1d1f] mb-2">
          What is your sales quarter?
          <span className="inline-flex items-center justify-center w-4 h-4 bg-purple-100 text-purple-600 rounded-full text-xs cursor-help">
            ?
          </span>
        </label>
        <div className="relative">
          <select
            value={config.salesQuarter}
            onChange={(e) =>
              updateConfig({
                salesQuarter: e.target.value as "Fiscal" | "Calendar",
              })
            }
            className="w-full px-3 py-2 pr-10 text-sm text-[#1d1d1f] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-all duration-200 cursor-pointer appearance-none"
            style={{
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif',
            }}
          >
            <option value="Fiscal">Fiscal</option>
            <option value="Calendar">Calendar</option>
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <ChevronDownIcon className="w-4 h-4 text-gray-600" />
          </div>
        </div>
      </div>
    </div>
  );
}
