import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import {
  ReportTable,
  type ReportColumn,
  type DataSourceType,
  type AIReasoningData,
} from '../../../../components/ReportTable';
import {
  AIFilterPanel,
  type FilterGroup,
  type FilterField,
} from '../../../../components/ReportTable/AIFilterPanel';

const meta: Meta<typeof ReportTable> = {
  title: '3-Pane/Components/Data/ReportTable',
  component: ReportTable,
  parameters: {
    layout: 'padded',
    backgrounds: {
      default: 'light',
      values: [{ name: 'light', value: '#ffffff' }],
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ReportTable>;

// ============================================================================
// Sample Data with all field types and sources
// ============================================================================

interface OpportunityWithAllTypes extends Record<string, unknown> {
  id: string;
  name: string;
  accountName: string;
  amount: number;
  stage: string;
  closeDate: string;
  probability: number;
  ownerName: string;
  type: string;
  leadSource: string;
  tags: string[];
  sentiment: string;
  isActive: boolean;
  description: string;
  // AI columns
  dealScore: number;
  nextBestAction: string;
  riskLevel: string;
  // Source and AI reasoning
  _source: DataSourceType;
  _aiReasoning: Record<string, AIReasoningData>;
}

const sampleOpportunitiesWithTypes: OpportunityWithAllTypes[] = [
  {
    id: 'opp-001',
    name: 'Acme Corp - Enterprise License',
    accountName: 'Acme Corporation',
    amount: 150000,
    stage: 'Negotiation',
    closeDate: '2025-02-15',
    probability: 0.75,
    ownerName: 'Sarah Chen',
    type: 'New Business',
    leadSource: 'Partner Referral',
    tags: ['Enterprise', 'Q1 Priority'],
    sentiment: 'Positive',
    isActive: true,
    description:
      'Large enterprise deal with Acme Corporation for their global deployment. Multiple stakeholders involved including CTO and VP of Engineering.',
    dealScore: 0.92,
    nextBestAction: 'Schedule executive meeting with CTO to finalize terms',
    riskLevel: 'Low',
    _source: 'salesforce',
    _aiReasoning: {
      dealScore: {
        reasoning:
          'High engagement from decision makers, strong buying signals in recent calls, budget confirmed.',
        confidence: 0.92,
        sourceReferences: [
          { type: 'gong', label: 'Discovery Call - Jan 15', url: '#gong-call-1' },
          { type: 'gong', label: 'Demo Call - Jan 22', url: '#gong-call-2' },
          { type: 'salesforce', label: 'Opportunity Record', url: '#sf-opp-1' },
        ],
      },
      nextBestAction: {
        reasoning:
          'CTO expressed interest in executive alignment. Calendar shows availability next week.',
        confidence: 0.88,
        sourceReferences: [
          { type: 'gong', label: 'Demo Call - Jan 22', url: '#gong-call-2' },
          { type: 'calendar', label: 'CTO Availability', url: '#calendar-1' },
        ],
      },
      riskLevel: {
        reasoning: 'No competitor mentions, strong champion, budget approved.',
        confidence: 0.95,
        sourceReferences: [{ type: 'salesforce', label: 'Opportunity Notes', url: '#sf-notes-1' }],
      },
    },
  },
  {
    id: 'opp-002',
    name: 'TechStart Inc - Platform Upgrade',
    accountName: 'TechStart Inc',
    amount: 85000,
    stage: 'Proposal',
    closeDate: '2025-03-01',
    probability: 0.6,
    ownerName: 'Mike Johnson',
    type: 'Upsell',
    leadSource: 'Web Direct',
    tags: ['Upsell', 'Tech'],
    sentiment: 'Neutral',
    isActive: true,
    description: 'Platform upgrade for existing customer TechStart.',
    dealScore: 0.78,
    nextBestAction: 'Send ROI analysis document via email',
    riskLevel: 'Medium',
    _source: 'gong',
    _aiReasoning: {
      dealScore: {
        reasoning: 'Good relationship but budget concerns mentioned in last call.',
        confidence: 0.78,
        sourceReferences: [
          { type: 'gong', label: 'Follow-up Call - Jan 18', url: '#gong-call-3' },
          { type: 'gmail', label: 'Budget Discussion Email', url: '#gmail-1' },
        ],
      },
      nextBestAction: {
        reasoning: 'Customer requested ROI documentation before proceeding.',
        confidence: 0.85,
        sourceReferences: [{ type: 'gmail', label: 'Request Email - Jan 20', url: '#gmail-2' }],
      },
      riskLevel: {
        reasoning: 'Budget not fully confirmed, decision timeline unclear.',
        confidence: 0.72,
        sourceReferences: [{ type: 'gong', label: 'Follow-up Call - Jan 18', url: '#gong-call-3' }],
      },
    },
  },
  {
    id: 'opp-003',
    name: 'Global Industries - Multi-year Contract',
    accountName: 'Global Industries Ltd',
    amount: 420000,
    stage: 'Discovery',
    closeDate: '2025-04-30',
    probability: 0.35,
    ownerName: 'Emily Davis',
    type: 'New Business',
    leadSource: 'Conference',
    tags: ['Enterprise', 'Multi-year', 'International'],
    sentiment: 'Optimistic',
    isActive: true,
    description:
      'Strategic multi-year contract opportunity with Global Industries for their APAC expansion.',
    dealScore: 0.65,
    nextBestAction: 'Complete technical assessment and security review',
    riskLevel: 'Medium',
    _source: 'mixed',
    _aiReasoning: {
      dealScore: {
        reasoning: 'Early stage but strong interest from multiple regions.',
        confidence: 0.65,
        sourceReferences: [
          { type: 'salesforce', label: 'Lead Source', url: '#sf-lead-1' },
          { type: 'gong', label: 'Initial Call', url: '#gong-call-4' },
          { type: 'hubspot', label: 'Marketing Touchpoints', url: '#hubspot-1' },
        ],
      },
      nextBestAction: {
        reasoning: 'Security team needs to review before procurement can proceed.',
        confidence: 0.82,
        sourceReferences: [{ type: 'gmail', label: 'Security Requirements', url: '#gmail-3' }],
      },
      riskLevel: {
        reasoning: 'Complex procurement process, multiple decision makers.',
        confidence: 0.68,
        sourceReferences: [
          { type: 'gong', label: 'Stakeholder Call', url: '#gong-call-5' },
          { type: 'salesforce', label: 'Contact Hierarchy', url: '#sf-contacts-1' },
        ],
      },
    },
  },
  {
    id: 'opp-004',
    name: 'Sunrise Healthcare - Compliance Suite',
    accountName: 'Sunrise Healthcare',
    amount: 95000,
    stage: 'Qualification',
    closeDate: '2025-03-15',
    probability: 0.45,
    ownerName: 'James Wilson',
    type: 'New Business',
    leadSource: 'Inbound',
    tags: ['Healthcare', 'Compliance'],
    sentiment: 'Positive',
    isActive: true,
    description: 'HIPAA compliance solution for healthcare provider.',
    dealScore: 0.71,
    nextBestAction: 'Demo compliance features to security team',
    riskLevel: 'Low',
    _source: 'hubspot',
    _aiReasoning: {
      dealScore: {
        reasoning: 'Strong compliance need, urgent timeline mentioned.',
        confidence: 0.71,
        sourceReferences: [{ type: 'hubspot', label: 'Lead Form Submission', url: '#hubspot-2' }],
      },
      nextBestAction: {
        reasoning: 'Security team approval required for healthcare deals.',
        confidence: 0.9,
        sourceReferences: [{ type: 'gong', label: 'Discovery Call', url: '#gong-call-6' }],
      },
      riskLevel: {
        reasoning: 'Clear need, budget allocated, decision maker engaged.',
        confidence: 0.88,
        sourceReferences: [{ type: 'salesforce', label: 'Opportunity Details', url: '#sf-opp-2' }],
      },
    },
  },
  {
    id: 'opp-005',
    name: 'Metro Bank - Security Add-on',
    accountName: 'Metro Bank Corp',
    amount: 220000,
    stage: 'Negotiation',
    closeDate: '2025-02-28',
    probability: 0.85,
    ownerName: 'Sarah Chen',
    type: 'Cross-sell',
    leadSource: 'Customer Request',
    tags: ['Finance', 'Security', 'Existing Customer'],
    sentiment: 'Positive',
    isActive: true,
    description: 'Security module add-on for existing banking customer.',
    dealScore: 0.95,
    nextBestAction: 'Finalize contract terms with legal',
    riskLevel: 'Low',
    _source: 'salesforce',
    _aiReasoning: {
      dealScore: {
        reasoning: 'Existing customer with strong relationship, verbal commitment received.',
        confidence: 0.95,
        sourceReferences: [
          { type: 'gong', label: 'Negotiation Call', url: '#gong-call-7' },
          { type: 'salesforce', label: 'Account History', url: '#sf-account-1' },
        ],
      },
      nextBestAction: {
        reasoning: 'Legal review is the final step before signature.',
        confidence: 0.92,
        sourceReferences: [{ type: 'gmail', label: 'Legal Thread', url: '#gmail-4' }],
      },
      riskLevel: {
        reasoning: 'High confidence deal with existing happy customer.',
        confidence: 0.97,
        sourceReferences: [
          { type: 'salesforce', label: 'Customer Health Score', url: '#sf-health-1' },
        ],
      },
    },
  },
  {
    id: 'opp-006',
    name: 'RetailMax - POS Integration',
    accountName: 'RetailMax Inc',
    amount: 180000,
    stage: 'Proposal',
    closeDate: '2025-03-20',
    probability: 0.55,
    ownerName: 'Emily Davis',
    type: 'New Business',
    leadSource: 'Outbound',
    tags: ['Retail', 'Integration'],
    sentiment: 'Negative',
    isActive: true,
    description: 'Point of sale integration for retail chain with technical concerns.',
    dealScore: 0.68,
    nextBestAction: 'Address integration concerns with technical deep-dive',
    riskLevel: 'High',
    _source: 'gong',
    _aiReasoning: {
      dealScore: {
        reasoning: 'Interest present but significant technical objections raised.',
        confidence: 0.68,
        sourceReferences: [{ type: 'gong', label: 'Technical Review Call', url: '#gong-call-8' }],
      },
      nextBestAction: {
        reasoning: 'Technical team raised concerns about API compatibility.',
        confidence: 0.85,
        sourceReferences: [
          { type: 'gong', label: 'Technical Review Call', url: '#gong-call-8' },
          { type: 'gmail', label: 'Technical Questions', url: '#gmail-5' },
        ],
      },
      riskLevel: {
        reasoning: 'Competitor mentioned, technical fit uncertain.',
        confidence: 0.75,
        sourceReferences: [{ type: 'gong', label: 'Discovery Call', url: '#gong-call-9' }],
      },
    },
  },
  {
    id: 'opp-007',
    name: 'CloudFirst - Migration Services',
    accountName: 'CloudFirst Technologies',
    amount: 275000,
    stage: 'Proposal',
    closeDate: '2025-04-10',
    probability: 0.65,
    ownerName: 'Sarah Chen',
    type: 'New Business',
    leadSource: 'Web Direct',
    tags: ['Cloud', 'Migration'],
    sentiment: 'Optimistic',
    isActive: true,
    description: 'Cloud migration project for tech company.',
    dealScore: 0.81,
    nextBestAction: 'Present migration timeline to VP Engineering',
    riskLevel: 'Low',
    _source: 'calendar',
    _aiReasoning: {
      dealScore: {
        reasoning: 'Strong technical fit, positive demo feedback.',
        confidence: 0.81,
        sourceReferences: [
          { type: 'gong', label: 'Demo Call', url: '#gong-call-10' },
          { type: 'calendar', label: 'Follow-up Meeting', url: '#calendar-2' },
        ],
      },
      nextBestAction: {
        reasoning: 'VP Engineering requested timeline before final approval.',
        confidence: 0.88,
        sourceReferences: [{ type: 'gmail', label: 'Timeline Request', url: '#gmail-6' }],
      },
      riskLevel: {
        reasoning: 'Clear path forward, engaged stakeholders.',
        confidence: 0.85,
        sourceReferences: [
          { type: 'salesforce', label: 'Stakeholder Map', url: '#sf-stakeholders-1' },
        ],
      },
    },
  },
  {
    id: 'opp-008',
    name: 'FinanceHub - Analytics Platform',
    accountName: 'FinanceHub Corp',
    amount: 520000,
    stage: 'Negotiation',
    closeDate: '2025-03-30',
    probability: 0.72,
    ownerName: 'Mike Johnson',
    type: 'New Business',
    leadSource: 'Conference',
    tags: ['Finance', 'Analytics', 'Enterprise'],
    sentiment: 'Positive',
    isActive: true,
    description: 'Enterprise analytics platform for financial services firm.',
    dealScore: 0.88,
    nextBestAction: 'Review pricing with CFO in scheduled call',
    riskLevel: 'Medium',
    _source: 'mixed',
    _aiReasoning: {
      dealScore: {
        reasoning: 'Large deal with executive sponsorship, pricing discussion ongoing.',
        confidence: 0.88,
        sourceReferences: [
          { type: 'gong', label: 'Executive Call', url: '#gong-call-11' },
          { type: 'salesforce', label: 'Deal Details', url: '#sf-opp-3' },
        ],
      },
      nextBestAction: {
        reasoning: 'CFO call scheduled to finalize pricing.',
        confidence: 0.92,
        sourceReferences: [{ type: 'calendar', label: 'CFO Meeting', url: '#calendar-3' }],
      },
      riskLevel: {
        reasoning: 'Price sensitivity mentioned, but strong champion.',
        confidence: 0.78,
        sourceReferences: [{ type: 'gong', label: 'Pricing Discussion', url: '#gong-call-12' }],
      },
    },
  },
];

// ============================================================================
// Column Definitions with all field types
// ============================================================================

const interactiveColumns: ReportColumn[] = [
  { id: 'name', label: 'Opportunity Name', type: 'text', minWidth: 220, source: 'salesforce' },
  { id: 'ownerName', label: 'Owner', type: 'owner', minWidth: 150, source: 'salesforce' },
  { id: 'amount', label: 'Amount', type: 'currency', minWidth: 100, source: 'salesforce' },
  { id: 'stage', label: 'Stage', type: 'picklist', minWidth: 120, source: 'salesforce' },
  { id: 'tags', label: 'Tags', type: 'multiPicklist', minWidth: 180 },
  { id: 'sentiment', label: 'Sentiment', type: 'sentiment', minWidth: 100, source: 'gong' },
  { id: 'isActive', label: 'Active', type: 'boolean', minWidth: 80 },
  {
    id: 'dealScore',
    label: 'Deal Score',
    type: 'percentage',
    isAI: true,
    minWidth: 110,
    aiPrompt:
      'Calculate deal score based on engagement signals, buying intent, and historical patterns',
    aiDataSources: ['Salesforce Opportunities', 'Gong Call Recordings', 'Email Activity'],
  },
  {
    id: 'nextBestAction',
    label: 'Next Best Action',
    type: 'longText',
    isAI: true,
    minWidth: 200,
    aiPrompt: 'Recommend the next best action to advance this deal based on conversation history',
    aiDataSources: ['Gong Calls', 'Calendar Events', 'Email Threads'],
  },
  {
    id: 'riskLevel',
    label: 'Risk',
    type: 'sentiment',
    isAI: true,
    minWidth: 100,
    aiPrompt:
      'Assess deal risk based on competitor mentions, timeline concerns, and stakeholder engagement',
    aiDataSources: ['Gong Competitor Mentions', 'Salesforce Timeline', 'Email Sentiment'],
  },
  { id: 'closeDate', label: 'Close Date', type: 'date', minWidth: 100, source: 'salesforce' },
];

const standardColumns: ReportColumn[] = [
  { id: 'name', label: 'Opportunity Name', type: 'text', minWidth: 200 },
  { id: 'accountName', label: 'Account', type: 'text', minWidth: 150 },
  { id: 'amount', label: 'Amount', type: 'currency', minWidth: 100 },
  { id: 'stage', label: 'Stage', type: 'picklist', minWidth: 120 },
  { id: 'closeDate', label: 'Close Date', type: 'date', minWidth: 100 },
  { id: 'probability', label: 'Probability', type: 'percentage', minWidth: 100 },
  { id: 'ownerName', label: 'Owner', type: 'owner', minWidth: 150 },
];

// ============================================================================
// Filter Fields for AI Filter Panel
// ============================================================================

const filterFields: FilterField[] = [
  { value: 'name', label: 'Opportunity Name', type: 'text' },
  { value: 'accountName', label: 'Account', type: 'text' },
  { value: 'amount', label: 'Amount', type: 'number' },
  { value: 'stage', label: 'Stage', type: 'picklist' },
  { value: 'closeDate', label: 'Close Date', type: 'date' },
  { value: 'probability', label: 'Probability', type: 'number' },
  { value: 'ownerName', label: 'Owner', type: 'text' },
  { value: 'dealScore', label: 'Deal Score', type: 'number' },
  { value: 'riskLevel', label: 'Risk Level', type: 'picklist' },
  { value: 'isActive', label: 'Active', type: 'boolean' },
];

// ============================================================================
// Stories
// ============================================================================

/**
 * Interactive prototype with all field types, AI columns, source attribution,
 * and AI filter panel. This is the main demonstration of the ReportTable.
 */
const InteractiveWrapper = () => {
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [filterGroups, setFilterGroups] = useState<FilterGroup[]>([]);

  const handleRowSelect = (row: OpportunityWithAllTypes, selected: boolean) => {
    if (selected) {
      setSelectedRows([...selectedRows, row.id]);
    } else {
      setSelectedRows(selectedRows.filter((id) => id !== row.id));
    }
  };

  const handleRowOpen = (row: OpportunityWithAllTypes) => {
    console.log('Opening opportunity:', row.name);
    alert(`Opening: ${row.name}`);
  };

  const handleAIPromptSubmit = (prompt: string) => {
    console.log('AI Filter prompt:', prompt);
    // Simulate AI generating filters
    setFilterGroups([
      {
        id: '1',
        connector: 'and',
        conditions: [
          { id: '1', field: 'dealScore', operator: 'greater_than', value: '0.7' },
          { id: '2', field: 'riskLevel', operator: 'equals', value: 'Low' },
        ],
      },
    ]);
  };

  return (
    <div className="space-y-6">
      {/* AI Filter Panel */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <AIFilterPanel
          fields={filterFields}
          filterGroups={filterGroups}
          onFiltersChange={setFilterGroups}
          onAIPromptSubmit={handleAIPromptSubmit}
        />
      </div>

      {/* Selection indicator */}
      {selectedRows.length > 0 && (
        <div className="text-sm text-gray-700 px-1">
          {selectedRows.length} row{selectedRows.length > 1 ? 's' : ''} selected
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <ReportTable
          columns={interactiveColumns}
          data={sampleOpportunitiesWithTypes}
          selectedRows={selectedRows}
          onRowSelect={handleRowSelect}
          onRowOpen={handleRowOpen}
          rowIdKey="id"
          rowSourceKey="_source"
          aiReasoningKey="_aiReasoning"
          nameKey="name"
          pageSize={10}
        />
      </div>
    </div>
  );
};

export const Interactive: Story = {
  render: () => <InteractiveWrapper />,
  parameters: {
    layout: 'padded',
  },
};

/**
 * Loading state showing skeleton animation.
 */
export const Loading: Story = {
  args: {
    columns: standardColumns,
    data: [],
    isLoading: true,
  },
};
