import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SquaresFour, UserSquare, BuildingOffice, Users } from '@phosphor-icons/react';
import { TextInput, EmailTagInput } from '../forms/input';
import { Select } from '../forms/dropdown';
import { PrimaryButton, SecondaryButton } from '../forms/buttons';

// ============================================================================
// Types
// ============================================================================

export type SharingOption = 'private' | 'guide' | 'shared';

export interface SalesforceDashboard {
  id: string;
  name: string;
}

export interface NewDashboardConfig {
  name: string;
  recreateFromSalesforce: boolean;
  salesforceDashboardId?: string;
  sharing: SharingOption;
  sharedWithEmails?: string[];
}

export interface NewDashboardModalProps {
  /**
   * Whether the modal is open
   */
  isOpen: boolean;

  /**
   * Available Salesforce dashboards to recreate from
   */
  salesforceDashboards?: SalesforceDashboard[];

  /**
   * Callback when user confirms creation
   */
  onConfirm: (config: NewDashboardConfig) => void;

  /**
   * Callback when user cancels
   */
  onCancel: () => void;
}

// ============================================================================
// Sub-components
// ============================================================================

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ checked, onChange, disabled }) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`
        relative inline-flex h-5 w-8.5 items-center rounded-full
        transition-colors duration-200 cursor-pointer
        focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
        ${checked ? 'bg-indigo-600' : 'bg-gray-200'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <span
        className={`
          inline-block h-4 w-4 transform rounded-full bg-white shadow-sm
          transition-transform duration-200
          ${checked ? 'translate-x-4' : 'translate-x-0.5'}
        `}
      />
    </button>
  );
};

// Sharing dropdown options with icons matching ChatSidebar dashboard types
const sharingDropdownOptions = [
  { value: 'private', label: 'Keep Private', icon: <UserSquare size={16} weight="regular" /> },
  { value: 'organization', label: 'Share with Organization', icon: <BuildingOffice size={16} weight="regular" /> },
  { value: 'shared', label: 'Share with Others', icon: <Users size={16} weight="regular" /> },
];

// Default Salesforce dashboards (used when none provided)
const defaultSalesforceDashboards: SalesforceDashboard[] = [
  { id: 'sf-1', name: 'Sales Performance Dashboard' },
  { id: 'sf-2', name: 'Pipeline Overview' },
  { id: 'sf-3', name: 'Revenue by Region' },
  { id: 'sf-4', name: 'Quarterly Forecast' },
  { id: 'sf-5', name: 'Lead Conversion Metrics' },
  { id: 'sf-6', name: 'Account Health Scores' },
];

// ============================================================================
// Component
// ============================================================================

/**
 * NewDashboardModal - A slide-up modal for creating a new dashboard
 *
 * Features:
 * - Dashboard name input
 * - Toggle to recreate from Salesforce dashboard
 * - Dropdown to select Salesforce dashboard (when toggle is on)
 * - Sharing settings with radio options
 * - Email tag input for sharing with others
 */
export const NewDashboardModal: React.FC<NewDashboardModalProps> = ({
  isOpen,
  salesforceDashboards,
  onConfirm,
  onCancel,
}) => {
  // Use provided dashboards or fall back to defaults
  const availableSalesforceDashboards = salesforceDashboards && salesforceDashboards.length > 0
    ? salesforceDashboards
    : defaultSalesforceDashboards;
  // Form state
  const [name, setName] = useState('');
  const [recreateFromSalesforce, setRecreateFromSalesforce] = useState(false);
  const [salesforceDashboardId, setSalesforceDashboardId] = useState('');
  const [sharing, setSharing] = useState<SharingOption>('private');
  const [sharedEmails, setSharedEmails] = useState<string[]>([]);

  // Form validation
  const [errors, setErrors] = useState<{ name?: string }>({});

  const handleConfirm = () => {
    // Validate
    const newErrors: { name?: string } = {};
    if (!name.trim()) {
      newErrors.name = 'Dashboard name is required';
    }
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    onConfirm({
      name: name.trim(),
      recreateFromSalesforce,
      salesforceDashboardId: recreateFromSalesforce ? salesforceDashboardId : undefined,
      sharing,
      sharedWithEmails: sharing === 'shared' ? sharedEmails : undefined,
    });

    // Reset form
    resetForm();
  };

  const handleCancel = () => {
    resetForm();
    onCancel();
  };

  const resetForm = () => {
    setName('');
    setRecreateFromSalesforce(false);
    setSalesforceDashboardId('');
    setSharing('private');
    setSharedEmails([]);
    setErrors({});
  };

  // Convert Salesforce dashboards to dropdown options
  const salesforceOptions = availableSalesforceDashboards.map((d) => ({
    value: d.id,
    label: d.name,
  }));

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop blur overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 z-[99] bg-white/10 backdrop-blur-[2px]"
            onClick={handleCancel}
          />

          {/* Modal panel */}
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute bottom-0 left-0 right-0 h-[90%] z-[100] px-2 flex flex-col rounded-t-2xl border border-gray-100 shadow-[0_-8px_30px_-8px_rgba(255,237,213,0.8)]"
          >
            {/* Blue to white gradient background */}
            <div className="absolute inset-0 bg-gradient-to-b from-white to-gray-50 rounded-t-2xl overflow-hidden" />

            {/* Content */}
            <div className="relative z-10 flex flex-col flex-1 py-3 overflow-hidden">
              {/* Header */}
              <div className="flex flex-row items-center gap-2 px-1 pb-3 mb-3 border-b border-gray-100">
                  <SquaresFour size={18} weight="duotone" className="text-gray-700" />
                <div>
                  <h3 className="font-medium text-gray-900">
                    Create Dashboard
                  </h3>
                </div>
              </div>

              {/* Scrollable Form Content */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden px-1 space-y-4">
                {/* Dashboard Name */}
                <div className=" ">
                  <TextInput
                    label="Dashboard Name"
                    labelClassName="text-xs font-medium text-gray-700"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (errors.name) setErrors({});
                    }}
                    placeholder="Enter dashboard name..."
                    error={errors.name}
                  />
                </div>


                {/* Sharing Settings */}
                <div className="space-y-3">
                  <Select
                    label="Sharing Settings"
                    labelClassName="text-xs font-medium text-gray-700"
                    options={sharingDropdownOptions}
                    value={sharing}
                    onChange={(value) => setSharing(value as SharingOption)}
                    placeholder="Select sharing option..."
                  />

                  {/* Email Input for Share with Others */}
                  <AnimatePresence>
                    {sharing === 'shared' && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="overflow-hidden"
                      >
                        <div>
                          <EmailTagInput
                            label="Share with"
                            labelClassName="text-xs font-medium text-gray-700"
                            emails={sharedEmails}
                            onChange={setSharedEmails}
                            placeholder="Enter email addresses..."
                            helperText="Press Enter or comma to add"
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Recreate from Salesforce */}
                <div className="space-y-3">
                  <div className="flex flex-row items-center justify-between">
                    <div>
                      <span className="text-xs font-medium text-gray-700">
                        Import from Salesforce
                      </span>
                      {/* <p className="text-[11px] text-gray-900 mt-0.5">
                        Import an existing Salesforce dashboard as a starting point
                      </p> */}
                    </div>
                    <ToggleSwitch
                      checked={recreateFromSalesforce}
                      onChange={setRecreateFromSalesforce}
                    />
                  </div>
                        
                        
                  {/* Salesforce Dashboard Selector */}
                  {recreateFromSalesforce && (
                    <div className=" ">
                      <Select
                        label="Select Salesforce Dashboard"
                        labelClassName="text-xs font-medium text-gray-700"
                        options={salesforceOptions}
                        value={salesforceDashboardId}
                        onChange={setSalesforceDashboardId}
                        placeholder="Choose a dashboard..."
                      />
                    </div>
                  )}
                </div>

              </div>

              {/* Action buttons */}
              <div className="flex flex-col items-center gap-2 pt-3 mt-3 border-t border-gray-100 px-1">
                <PrimaryButton onClick={handleConfirm} fullWidth>
                  Create Dashboard
                </PrimaryButton>
                <SecondaryButton onClick={handleCancel} fullWidth>
                  Cancel
                </SecondaryButton>

              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NewDashboardModal;
