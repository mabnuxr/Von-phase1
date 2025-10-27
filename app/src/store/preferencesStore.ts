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
  apiName: string;
  type: string;
  enabled: boolean;
  description: string;
  prompt: string;
  mappedSalesforceField: string;
  runConditionPrompt: string;
  runConditionPreview: string;
  source: string;
  createdAt: string;
  updatedAt: string;
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
  salesQuarter: "Fiscal" | "Calendar";
  keywords: string[];
  businessProcess: string;
  companyInfo: string;
}

interface PreferencesState {
  // Tab state for defaults panel
  defaultsActiveTab: "email-categorization" | "process-configuration";
  setDefaultsActiveTab: (
    tab: "email-categorization" | "process-configuration",
  ) => void;

  // Tab state for fields panel
  fieldsActiveTab: "von-fields" | "salesforce-fields";
  setFieldsActiveTab: (tab: "von-fields" | "salesforce-fields") => void;

  // Fields data
  vonFields: Field[];
  salesforceFields: Field[];

  // Fields UI state
  fieldsSearchTerm: string;
  setFieldsSearchTerm: (term: string) => void;
  expandedFieldIds: string[];
  toggleFieldExpanded: (id: string) => void;
  editingFieldId: string | null;
  setEditingField: (id: string | null) => void;

  // Field management methods
  addField: (field: Field, category: "von" | "salesforce") => void;
  updateField: (
    id: string,
    updates: Partial<Field>,
    category: "von" | "salesforce",
  ) => void;
  deleteField: (id: string, category: "von" | "salesforce") => void;
  toggleFieldEnabled: (id: string, category: "von" | "salesforce") => void;

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
  addKeyword: (keyword: string) => void;
  removeKeyword: (keyword: string) => void;
}

const usePreferencesStoreBase = create<PreferencesState>((set) => ({
  // Tab state
  defaultsActiveTab: "process-configuration",
  setDefaultsActiveTab: (tab) => set({ defaultsActiveTab: tab }),

  // Fields tab state
  fieldsActiveTab: "von-fields",
  setFieldsActiveTab: (tab) => set({ fieldsActiveTab: tab }),

  // Fields data
  vonFields: [
    {
      id: "von-1",
      name: "Amount",
      apiName: "opp_amount",
      type: "Text",
      enabled: false,
      description: "This field signifies amount",
      prompt: "Check through existing deal data to configure amount",
      mappedSalesforceField: "Amount",
      runConditionPrompt: "Stage is S3",
      runConditionPreview: "S3",
      source: "All, @Calls, @Emails from last 10 days",
      createdAt: "2025-05-30T07:00:00Z",
      updatedAt: "2025-06-02T07:00:00Z",
    },
    {
      id: "von-2",
      name: "Competition",
      apiName: "opps_competition",
      type: "Text",
      enabled: true,
      description: "Track competitor information",
      prompt: "What competitors were mentioned in the conversation?",
      mappedSalesforceField: "Competition__c",
      runConditionPrompt: "When competitors are discussed",
      runConditionPreview: "Competitive deals",
      source: "Call, Meeting",
      createdAt: "2024-01-10T09:00:00Z",
      updatedAt: "2024-01-18T16:20:00Z",
    },
    {
      id: "von-3",
      name: "Executive sponsor confirmed?",
      apiName: "opp_amount",
      type: "Text",
      enabled: false,
      description: "",
      prompt: "",
      mappedSalesforceField: "",
      runConditionPrompt: "",
      runConditionPreview: "",
      source: "",
      createdAt: "2024-01-05T11:15:00Z",
      updatedAt: "2024-01-22T10:30:00Z",
    },
    {
      id: "von-4",
      name: "Use case defined?",
      apiName: "opp_amount",
      type: "Text",
      enabled: true,
      description: "",
      prompt: "",
      mappedSalesforceField: "",
      runConditionPrompt: "",
      runConditionPreview: "",
      source: "",
      createdAt: "2024-01-05T11:15:00Z",
      updatedAt: "2024-01-22T10:30:00Z",
    },
    {
      id: "von-5",
      name: "Timeline status",
      apiName: "opp_amount",
      type: "Text",
      enabled: true,
      description: "",
      prompt: "",
      mappedSalesforceField: "",
      runConditionPrompt: "",
      runConditionPreview: "",
      source: "",
      createdAt: "2024-01-05T11:15:00Z",
      updatedAt: "2024-01-22T10:30:00Z",
    },
    {
      id: "von-6",
      name: "ROI validation",
      apiName: "opp_amount",
      type: "Text",
      enabled: false,
      description: "",
      prompt: "",
      mappedSalesforceField: "",
      runConditionPrompt: "",
      runConditionPreview: "",
      source: "",
      createdAt: "2024-01-05T11:15:00Z",
      updatedAt: "2024-01-22T10:30:00Z",
    },
  ],
  salesforceFields: [
    {
      id: "sf-1",
      name: "Amount",
      apiName: "opp_amount",
      type: "Text",
      enabled: false,
      description: "This field signifies amount",
      prompt: "Check through existing deal data to configure amount",
      mappedSalesforceField: "Amount",
      runConditionPrompt: "Stage is S3",
      runConditionPreview: "S3",
      source: "All, @Calls, @Emails from last 10 days",
      createdAt: "2025-05-30T07:00:00Z",
      updatedAt: "2025-06-02T07:00:00Z",
    },
    {
      id: "sf-2",
      name: "Competition",
      apiName: "opps_competition",
      type: "Text",
      enabled: true,
      description: "",
      prompt: "",
      mappedSalesforceField: "Competition__c",
      runConditionPrompt: "",
      runConditionPreview: "",
      source: "",
      createdAt: "2024-01-10T09:00:00Z",
      updatedAt: "2024-01-18T16:20:00Z",
    },
    {
      id: "sf-3",
      name: "Executive sponsor confirmed?",
      apiName: "opp_amount",
      type: "Text",
      enabled: false,
      description: "",
      prompt: "",
      mappedSalesforceField: "",
      runConditionPrompt: "",
      runConditionPreview: "",
      source: "",
      createdAt: "2024-01-05T11:15:00Z",
      updatedAt: "2024-01-22T10:30:00Z",
    },
    {
      id: "sf-4",
      name: "Is Budget at Risk?",
      apiName: "opp_amount",
      type: "Text",
      enabled: true,
      description: "",
      prompt: "",
      mappedSalesforceField: "",
      runConditionPrompt: "",
      runConditionPreview: "",
      source: "",
      createdAt: "2024-01-05T11:15:00Z",
      updatedAt: "2024-01-22T10:30:00Z",
    },
    {
      id: "sf-5",
      name: "Timeline status",
      apiName: "opp_amount",
      type: "Text",
      enabled: true,
      description: "",
      prompt: "",
      mappedSalesforceField: "",
      runConditionPrompt: "",
      runConditionPreview: "",
      source: "",
      createdAt: "2024-01-05T11:15:00Z",
      updatedAt: "2024-01-22T10:30:00Z",
    },
    {
      id: "sf-6",
      name: "ROI validation",
      apiName: "opp_amount",
      type: "Text",
      enabled: false,
      description: "",
      prompt: "",
      mappedSalesforceField: "",
      runConditionPrompt: "",
      runConditionPreview: "",
      source: "",
      createdAt: "2024-01-05T11:15:00Z",
      updatedAt: "2024-01-22T10:30:00Z",
    },
    {
      id: "sf-7",
      name: "Decision maker present?",
      apiName: "opp_amount",
      type: "Text",
      enabled: true,
      description: "",
      prompt: "",
      mappedSalesforceField: "",
      runConditionPrompt: "",
      runConditionPreview: "",
      source: "",
      createdAt: "2024-01-05T11:15:00Z",
      updatedAt: "2024-01-22T10:30:00Z",
    },
    {
      id: "sf-8",
      name: "Urgency to close",
      apiName: "opp_amount",
      type: "Text",
      enabled: false,
      description: "",
      prompt: "",
      mappedSalesforceField: "",
      runConditionPrompt: "",
      runConditionPreview: "",
      source: "",
      createdAt: "2024-01-05T11:15:00Z",
      updatedAt: "2024-01-22T10:30:00Z",
    },
    {
      id: "sf-9",
      name: "Stakeholder alignment",
      apiName: "opp_amount",
      type: "Text",
      enabled: true,
      description: "",
      prompt: "",
      mappedSalesforceField: "",
      runConditionPrompt: "",
      runConditionPreview: "",
      source: "",
      createdAt: "2024-01-05T11:15:00Z",
      updatedAt: "2024-01-22T10:30:00Z",
    },
    {
      id: "sf-10",
      name: "Timeline status",
      apiName: "opp_amount",
      type: "Text",
      enabled: true,
      description: "",
      prompt: "",
      mappedSalesforceField: "",
      runConditionPrompt: "",
      runConditionPreview: "",
      source: "",
      createdAt: "2024-01-05T11:15:00Z",
      updatedAt: "2024-01-22T10:30:00Z",
    },
    {
      id: "sf-11",
      name: "Pricing acceptance",
      apiName: "opp_amount",
      type: "Text",
      enabled: true,
      description: "",
      prompt: "",
      mappedSalesforceField: "",
      runConditionPrompt: "",
      runConditionPreview: "",
      source: "",
      createdAt: "2024-01-05T11:15:00Z",
      updatedAt: "2024-01-22T10:30:00Z",
    },
    {
      id: "sf-12",
      name: "Legal approval",
      apiName: "opp_amount",
      type: "Text",
      enabled: false,
      description: "",
      prompt: "",
      mappedSalesforceField: "",
      runConditionPrompt: "",
      runConditionPreview: "",
      source: "",
      createdAt: "2024-01-05T11:15:00Z",
      updatedAt: "2024-01-22T10:30:00Z",
    },
  ],

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
  addField: (field, category) =>
    set((state) => ({
      [category === "von" ? "vonFields" : "salesforceFields"]: [
        ...(category === "von" ? state.vonFields : state.salesforceFields),
        field,
      ],
    })),

  updateField: (id, updates, category) =>
    set((state) => ({
      [category === "von" ? "vonFields" : "salesforceFields"]: (category ===
      "von"
        ? state.vonFields
        : state.salesforceFields
      ).map((field) => (field.id === id ? { ...field, ...updates } : field)),
    })),

  deleteField: (id, category) =>
    set((state) => ({
      [category === "von" ? "vonFields" : "salesforceFields"]: (category ===
      "von"
        ? state.vonFields
        : state.salesforceFields
      ).filter((field) => field.id !== id),
    })),

  toggleFieldEnabled: (id, category) =>
    set((state) => ({
      [category === "von" ? "vonFields" : "salesforceFields"]: (category ===
      "von"
        ? state.vonFields
        : state.salesforceFields
      ).map((field) =>
        field.id === id ? { ...field, enabled: !field.enabled } : field,
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
    salesQuarter: "Fiscal",
    keywords: [],
    businessProcess: "",
    companyInfo: "",
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

  addKeyword: (keyword) =>
    set((state) => ({
      processConfiguration: {
        ...state.processConfiguration,
        keywords: [...state.processConfiguration.keywords, keyword],
      },
    })),

  removeKeyword: (keyword) =>
    set((state) => ({
      processConfiguration: {
        ...state.processConfiguration,
        keywords: state.processConfiguration.keywords.filter(
          (k) => k !== keyword,
        ),
      },
    })),
}));

const usePreferencesStore = createSelectors(usePreferencesStoreBase);

export default usePreferencesStore;
