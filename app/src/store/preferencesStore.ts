import { create } from "zustand";
import createSelectors from "./createSelectors";

// Business stages as const object
export const BusinessStage = {
  PROSPECT: "Prospect",
  QUALIFIED: "Qualified",
  TECHNICAL_WIN: "Technical Win",
} as const;

export type BusinessStage = (typeof BusinessStage)[keyof typeof BusinessStage];

// Customer stages as const object
export const CustomerStage = {
  NEW: "New",
  INTERNAL_SYNC_COMPLETE: "Internal Sync Complete",
  ALL_CONTACT_MADE: "All Contact Made",
} as const;

export type CustomerStage = (typeof CustomerStage)[keyof typeof CustomerStage];

// Field configuration
export interface Field {
  id: string;
  name: string;
  type: string;
  description: string;
  salesforceObject: string; // e.g., "Opportunity", "Account", "Contact"
  salesforceFieldName: string; // e.g., "Amount", "Competition__c"
}

// Email categorization settings
export interface EmailCategorizationSettings {
  enabled: boolean;
  emailObjectType: string; // e.g., "Task"
  opportunityField: string; // e.g., "Related To ID"
  accountField: string; // e.g., "Account ID"
  emailBodyField: string; // e.g., "Description"
  filterConditions: FilterCondition[];
  filterGroups?: FilterGroup[]; // Optional grouped filters
}

export interface FilterCondition {
  id: string;
  field: string;
  operator: "equals" | "contains" | "startsWith" | "endsWith";
  value: string;
  logicalOperator?: "AND" | "OR";
}

export interface FilterGroup {
  id: string;
  conditions: FilterCondition[];
  logicalOperator?: "AND" | "OR"; // How this group connects to the previous group
}

// Process configuration settings
export interface ProcessConfigurationSettings {
  businessStages: BusinessStage[];
  customerStages: CustomerStage[];
  churnSignalField: string;
  renewalDetectionField: string;
  customerIdentificationField: string;
  salesforceDescription: string;
  salesQuarter: "Fiscal" | "Calendar";
}

// Integration configuration
export interface IntegrationConfig {
  id?: string; // Integration ID for edit mode
  accessLevel: "tenant" | "user";
  // Salesforce specific
  environmentType?: "development" | "production";
  instanceUrl?: string;
  apiVersion?: string;
  // Gong specific
  gongApiBaseUrl?: string;
}

interface PreferencesState {
  // Tab state for defaults panel
  defaultsActiveTab: "email-categorization" | "process-configuration";
  setDefaultsActiveTab: (
    tab: "email-categorization" | "process-configuration",
  ) => void;

  // Fields data
  salesforceFields: Field[];

  // Server sync method
  syncFromServer: (data: {
    salesforceFields: Field[];
    emailCategorization: EmailCategorizationSettings;
    processConfiguration: ProcessConfigurationSettings;
  }) => void;

  // Fields UI state
  fieldsSearchTerm: string;
  setFieldsSearchTerm: (term: string) => void;
  expandedFieldIds: string[];
  toggleFieldExpanded: (id: string) => void;
  editingFieldId: string | null;
  setEditingField: (id: string | null) => void;

  // Field management methods
  addField: (field: Field) => void;
  updateField: (id: string, updates: Partial<Field>) => void;
  deleteField: (id: string) => void;

  // Email categorization settings
  emailCategorization: EmailCategorizationSettings;
  updateEmailCategorization: (
    settings: Partial<EmailCategorizationSettings>,
  ) => void;
  addFilterCondition: (condition: FilterCondition) => void;
  removeFilterCondition: (id: string) => void;
  updateFilterCondition: (
    id: string,
    updates: Partial<FilterCondition>,
  ) => void;
  addFilterGroup: (group: FilterGroup) => void;
  removeFilterGroup: (groupId: string) => void;
  addConditionToGroup: (groupId: string, condition: FilterCondition) => void;
  removeConditionFromGroup: (groupId: string, conditionId: string) => void;
  updateConditionInGroup: (
    groupId: string,
    conditionId: string,
    updates: Partial<FilterCondition>,
  ) => void;
  updateFilterGroup: (groupId: string, updates: Partial<FilterGroup>) => void;

  // Process configuration settings
  processConfiguration: ProcessConfigurationSettings;
  updateProcessConfiguration: (
    settings: Partial<ProcessConfigurationSettings>,
  ) => void;
  addBusinessStage: (stage: BusinessStage) => void;
  removeBusinessStage: (stage: BusinessStage) => void;
  addCustomerStage: (stage: CustomerStage) => void;
  removeCustomerStage: (stage: CustomerStage) => void;

  // Integrations UI state
  integrationsActiveTab: "apps" | "active-integrations";
  setIntegrationsActiveTab: (tab: "apps" | "active-integrations") => void;
  configuringIntegrationId: string | null;
  setConfiguringIntegration: (id: string | null) => void;

  // Integration configuration data
  integrationConfigs: Record<string, IntegrationConfig>;
  updateIntegrationConfig: (
    integrationId: string,
    config: Partial<IntegrationConfig>,
  ) => void;
  clearIntegrationConfig: (integrationId: string) => void;
}

const usePreferencesStoreBase = create<PreferencesState>((set) => ({
  // Tab state
  defaultsActiveTab: "process-configuration",
  setDefaultsActiveTab: (tab) => set({ defaultsActiveTab: tab }),

  // Fields data - Only Amount and Competition for Salesforce mapping
  salesforceFields: [
    {
      id: "sf-amount",
      name: "Amount",
      type: "Currency",
      description: "The Salesforce field that represents the deal amount",
      salesforceObject: "",
      salesforceFieldName: "",
    },
    {
      id: "sf-competition",
      name: "Competition",
      type: "Text",
      description:
        "The Salesforce field that represents competition information",
      salesforceObject: "",
      salesforceFieldName: "",
    },
  ],

  // Server sync method
  syncFromServer: (data) =>
    set({
      salesforceFields: data.salesforceFields,
      emailCategorization: data.emailCategorization,
      processConfiguration: data.processConfiguration,
    }),

  // Fields UI state
  fieldsSearchTerm: "",
  setFieldsSearchTerm: (term) => set({ fieldsSearchTerm: term }),
  expandedFieldIds: [],
  toggleFieldExpanded: (id) =>
    set((state) => ({
      expandedFieldIds: state.expandedFieldIds.includes(id)
        ? state.expandedFieldIds.filter((fieldId) => fieldId !== id)
        : [...state.expandedFieldIds, id],
    })),
  editingFieldId: null,
  setEditingField: (id) => set({ editingFieldId: id }),

  // Field management methods
  addField: (field) =>
    set((state) => ({
      salesforceFields: [...state.salesforceFields, field],
    })),

  updateField: (id, updates) =>
    set((state) => ({
      salesforceFields: state.salesforceFields.map((field) =>
        field.id === id ? { ...field, ...updates } : field,
      ),
    })),

  deleteField: (id) =>
    set((state) => ({
      salesforceFields: state.salesforceFields.filter(
        (field) => field.id !== id,
      ),
    })),

  // Email categorization defaults
  emailCategorization: {
    enabled: true,
    emailObjectType: "Task",
    opportunityField: "Related To ID",
    accountField: "Account ID",
    emailBodyField: "Description",
    filterConditions: [
      {
        id: "1",
        field: "Type",
        operator: "equals",
        value: "Email",
        logicalOperator: "AND",
      },
      {
        id: "2",
        field: "Subject",
        operator: "contains",
        value: "Gong",
      },
    ],
  },

  updateEmailCategorization: (settings) =>
    set((state) => ({
      emailCategorization: {
        ...state.emailCategorization,
        ...settings,
      },
    })),

  addFilterCondition: (condition) =>
    set((state) => ({
      emailCategorization: {
        ...state.emailCategorization,
        filterConditions: [
          ...state.emailCategorization.filterConditions,
          condition,
        ],
      },
    })),

  removeFilterCondition: (id) =>
    set((state) => ({
      emailCategorization: {
        ...state.emailCategorization,
        filterConditions: state.emailCategorization.filterConditions.filter(
          (c) => c.id !== id,
        ),
      },
    })),

  updateFilterCondition: (id, updates) =>
    set((state) => ({
      emailCategorization: {
        ...state.emailCategorization,
        filterConditions: state.emailCategorization.filterConditions.map((c) =>
          c.id === id ? { ...c, ...updates } : c,
        ),
      },
    })),

  addFilterGroup: (group) =>
    set((state) => ({
      emailCategorization: {
        ...state.emailCategorization,
        filterGroups: [
          ...(state.emailCategorization.filterGroups || []),
          group,
        ],
      },
    })),

  removeFilterGroup: (groupId) =>
    set((state) => ({
      emailCategorization: {
        ...state.emailCategorization,
        filterGroups: (state.emailCategorization.filterGroups || []).filter(
          (g) => g.id !== groupId,
        ),
      },
    })),

  addConditionToGroup: (groupId, condition) =>
    set((state) => ({
      emailCategorization: {
        ...state.emailCategorization,
        filterGroups: (state.emailCategorization.filterGroups || []).map((g) =>
          g.id === groupId
            ? { ...g, conditions: [...g.conditions, condition] }
            : g,
        ),
      },
    })),

  removeConditionFromGroup: (groupId, conditionId) =>
    set((state) => ({
      emailCategorization: {
        ...state.emailCategorization,
        filterGroups: (state.emailCategorization.filterGroups || []).map((g) =>
          g.id === groupId
            ? {
                ...g,
                conditions: g.conditions.filter((c) => c.id !== conditionId),
              }
            : g,
        ),
      },
    })),

  updateConditionInGroup: (groupId, conditionId, updates) =>
    set((state) => ({
      emailCategorization: {
        ...state.emailCategorization,
        filterGroups: (state.emailCategorization.filterGroups || []).map((g) =>
          g.id === groupId
            ? {
                ...g,
                conditions: g.conditions.map((c) =>
                  c.id === conditionId ? { ...c, ...updates } : c,
                ),
              }
            : g,
        ),
      },
    })),

  updateFilterGroup: (groupId, updates) =>
    set((state) => ({
      emailCategorization: {
        ...state.emailCategorization,
        filterGroups: (state.emailCategorization.filterGroups || []).map((g) =>
          g.id === groupId ? { ...g, ...updates } : g,
        ),
      },
    })),

  // Process configuration defaults
  processConfiguration: {
    businessStages: [],
    customerStages: [],
    churnSignalField: "",
    renewalDetectionField: "",
    customerIdentificationField: "",
    salesforceDescription: "",
    salesQuarter: "Fiscal",
  },

  updateProcessConfiguration: (settings) =>
    set((state) => ({
      processConfiguration: {
        ...state.processConfiguration,
        ...settings,
      },
    })),

  addBusinessStage: (stage) =>
    set((state) => ({
      processConfiguration: {
        ...state.processConfiguration,
        businessStages: [...state.processConfiguration.businessStages, stage],
      },
    })),

  removeBusinessStage: (stage) =>
    set((state) => ({
      processConfiguration: {
        ...state.processConfiguration,
        businessStages: state.processConfiguration.businessStages.filter(
          (s) => s !== stage,
        ),
      },
    })),

  addCustomerStage: (stage) =>
    set((state) => ({
      processConfiguration: {
        ...state.processConfiguration,
        customerStages: [...state.processConfiguration.customerStages, stage],
      },
    })),

  removeCustomerStage: (stage) =>
    set((state) => ({
      processConfiguration: {
        ...state.processConfiguration,
        customerStages: state.processConfiguration.customerStages.filter(
          (s) => s !== stage,
        ),
      },
    })),

  // Integrations UI state
  integrationsActiveTab: "apps",
  setIntegrationsActiveTab: (tab) => set({ integrationsActiveTab: tab }),
  configuringIntegrationId: null,
  setConfiguringIntegration: (id) => set({ configuringIntegrationId: id }),

  // Integration configuration data
  integrationConfigs: {},
  updateIntegrationConfig: (integrationId, config) =>
    set((state) => ({
      integrationConfigs: {
        ...state.integrationConfigs,
        [integrationId]: {
          ...(state.integrationConfigs[integrationId] || {
            accessLevel: "tenant",
            apiVersion: "v62.0",
            environmentType: "production",
          }),
          ...config,
        },
      },
    })),
  clearIntegrationConfig: (integrationId) =>
    set((state) => {
      const newConfigs = { ...state.integrationConfigs };
      delete newConfigs[integrationId];
      return { integrationConfigs: newConfigs };
    }),
}));

const usePreferencesStore = createSelectors(usePreferencesStoreBase);

export default usePreferencesStore;
