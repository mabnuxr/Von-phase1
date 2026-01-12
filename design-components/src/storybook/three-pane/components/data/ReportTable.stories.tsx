import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { ReportTable, type ReportColumn } from '../../../../components/ReportTable';

const meta = {
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
} satisfies Meta<typeof ReportTable>;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Sample Data - Salesforce Opportunities (28 rows for pagination demo)
// ============================================================================

interface Opportunity extends Record<string, unknown> {
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
  // AI columns
  dealScore: number;
  nextBestAction: string;
  riskLevel: string;
}

const sampleOpportunities: Opportunity[] = [
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
    dealScore: 0.92,
    nextBestAction: 'Schedule executive meeting',
    riskLevel: 'Low',
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
    dealScore: 0.78,
    nextBestAction: 'Send ROI analysis',
    riskLevel: 'Medium',
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
    dealScore: 0.65,
    nextBestAction: 'Complete technical assessment',
    riskLevel: 'Medium',
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
    dealScore: 0.71,
    nextBestAction: 'Demo compliance features',
    riskLevel: 'Low',
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
    dealScore: 0.95,
    nextBestAction: 'Finalize contract terms',
    riskLevel: 'Low',
  },
  {
    id: 'opp-006',
    name: 'EduTech Solutions - Annual Renewal',
    accountName: 'EduTech Solutions',
    amount: 45000,
    stage: 'Closed Won',
    closeDate: '2025-01-10',
    probability: 1.0,
    ownerName: 'Mike Johnson',
    type: 'Renewal',
    leadSource: 'Existing Customer',
    dealScore: 1.0,
    nextBestAction: 'Send welcome package',
    riskLevel: 'Low',
  },
  {
    id: 'opp-007',
    name: 'RetailMax - POS Integration',
    accountName: 'RetailMax Inc',
    amount: 180000,
    stage: 'Proposal',
    closeDate: '2025-03-20',
    probability: 0.55,
    ownerName: 'Emily Davis',
    type: 'New Business',
    leadSource: 'Outbound',
    dealScore: 0.68,
    nextBestAction: 'Address integration concerns',
    riskLevel: 'High',
  },
  {
    id: 'opp-008',
    name: 'AutoDrive Systems - Fleet Management',
    accountName: 'AutoDrive Systems',
    amount: 310000,
    stage: 'Discovery',
    closeDate: '2025-05-15',
    probability: 0.25,
    ownerName: 'James Wilson',
    type: 'New Business',
    leadSource: 'Partner Referral',
    dealScore: 0.52,
    nextBestAction: 'Schedule discovery call',
    riskLevel: 'Medium',
  },
  {
    id: 'opp-009',
    name: 'CloudFirst - Migration Services',
    accountName: 'CloudFirst Technologies',
    amount: 275000,
    stage: 'Proposal',
    closeDate: '2025-04-10',
    probability: 0.65,
    ownerName: 'Sarah Chen',
    type: 'New Business',
    leadSource: 'Web Direct',
    dealScore: 0.81,
    nextBestAction: 'Present migration timeline',
    riskLevel: 'Low',
  },
  {
    id: 'opp-010',
    name: 'FinanceHub - Analytics Platform',
    accountName: 'FinanceHub Corp',
    amount: 520000,
    stage: 'Negotiation',
    closeDate: '2025-03-30',
    probability: 0.72,
    ownerName: 'Mike Johnson',
    type: 'New Business',
    leadSource: 'Conference',
    dealScore: 0.88,
    nextBestAction: 'Review pricing with CFO',
    riskLevel: 'Medium',
  },
  {
    id: 'opp-011',
    name: 'LogiTrans - Warehouse Automation',
    accountName: 'LogiTrans International',
    amount: 185000,
    stage: 'Qualification',
    closeDate: '2025-05-01',
    probability: 0.4,
    ownerName: 'Emily Davis',
    type: 'New Business',
    leadSource: 'Inbound',
    dealScore: 0.62,
    nextBestAction: 'Send case studies',
    riskLevel: 'Medium',
  },
  {
    id: 'opp-012',
    name: 'MediaStream - Content Delivery',
    accountName: 'MediaStream Inc',
    amount: 92000,
    stage: 'Discovery',
    closeDate: '2025-04-15',
    probability: 0.3,
    ownerName: 'James Wilson',
    type: 'New Business',
    leadSource: 'Outbound',
    dealScore: 0.55,
    nextBestAction: 'Technical deep dive',
    riskLevel: 'High',
  },
  {
    id: 'opp-013',
    name: 'GreenEnergy Co - Monitoring System',
    accountName: 'GreenEnergy Co',
    amount: 145000,
    stage: 'Proposal',
    closeDate: '2025-03-25',
    probability: 0.58,
    ownerName: 'Sarah Chen',
    type: 'New Business',
    leadSource: 'Partner Referral',
    dealScore: 0.74,
    nextBestAction: 'Customize proposal',
    riskLevel: 'Low',
  },
  {
    id: 'opp-014',
    name: 'DataVault - Backup Solution',
    accountName: 'DataVault Security',
    amount: 68000,
    stage: 'Closed Won',
    closeDate: '2025-01-20',
    probability: 1.0,
    ownerName: 'Mike Johnson',
    type: 'Upsell',
    leadSource: 'Customer Request',
    dealScore: 1.0,
    nextBestAction: 'Begin implementation',
    riskLevel: 'Low',
  },
  {
    id: 'opp-015',
    name: 'SmartCity Solutions - IoT Platform',
    accountName: 'SmartCity Solutions',
    amount: 380000,
    stage: 'Discovery',
    closeDate: '2025-06-01',
    probability: 0.28,
    ownerName: 'Emily Davis',
    type: 'New Business',
    leadSource: 'Conference',
    dealScore: 0.48,
    nextBestAction: 'POC planning session',
    riskLevel: 'High',
  },
  {
    id: 'opp-016',
    name: 'FoodChain - Supply Chain Visibility',
    accountName: 'FoodChain Logistics',
    amount: 210000,
    stage: 'Qualification',
    closeDate: '2025-04-20',
    probability: 0.42,
    ownerName: 'James Wilson',
    type: 'New Business',
    leadSource: 'Web Direct',
    dealScore: 0.66,
    nextBestAction: 'Requirements gathering',
    riskLevel: 'Medium',
  },
  {
    id: 'opp-017',
    name: 'TravelEase - Booking Engine',
    accountName: 'TravelEase Global',
    amount: 125000,
    stage: 'Proposal',
    closeDate: '2025-03-10',
    probability: 0.62,
    ownerName: 'Sarah Chen',
    type: 'New Business',
    leadSource: 'Inbound',
    dealScore: 0.79,
    nextBestAction: 'Demo booking features',
    riskLevel: 'Low',
  },
  {
    id: 'opp-018',
    name: 'PharmaCare - Clinical Trial System',
    accountName: 'PharmaCare Research',
    amount: 650000,
    stage: 'Negotiation',
    closeDate: '2025-05-30',
    probability: 0.68,
    ownerName: 'Mike Johnson',
    type: 'New Business',
    leadSource: 'Partner Referral',
    dealScore: 0.85,
    nextBestAction: 'Legal review meeting',
    riskLevel: 'Medium',
  },
  {
    id: 'opp-019',
    name: 'InsureTech - Claims Processing',
    accountName: 'InsureTech Partners',
    amount: 290000,
    stage: 'Proposal',
    closeDate: '2025-04-05',
    probability: 0.52,
    ownerName: 'Emily Davis',
    type: 'New Business',
    leadSource: 'Outbound',
    dealScore: 0.7,
    nextBestAction: 'ROI presentation',
    riskLevel: 'Medium',
  },
  {
    id: 'opp-020',
    name: 'BuildRight - Project Management',
    accountName: 'BuildRight Construction',
    amount: 78000,
    stage: 'Discovery',
    closeDate: '2025-05-10',
    probability: 0.32,
    ownerName: 'James Wilson',
    type: 'New Business',
    leadSource: 'Web Direct',
    dealScore: 0.58,
    nextBestAction: 'Site visit coordination',
    riskLevel: 'Medium',
  },
  {
    id: 'opp-021',
    name: 'LegalEdge - Document Management',
    accountName: 'LegalEdge Law Firm',
    amount: 165000,
    stage: 'Qualification',
    closeDate: '2025-04-25',
    probability: 0.48,
    ownerName: 'Sarah Chen',
    type: 'New Business',
    leadSource: 'Conference',
    dealScore: 0.69,
    nextBestAction: 'Security compliance review',
    riskLevel: 'Low',
  },
  {
    id: 'opp-022',
    name: 'SportsPro - Fan Engagement',
    accountName: 'SportsPro Entertainment',
    amount: 115000,
    stage: 'Proposal',
    closeDate: '2025-03-18',
    probability: 0.56,
    ownerName: 'Mike Johnson',
    type: 'New Business',
    leadSource: 'Inbound',
    dealScore: 0.73,
    nextBestAction: 'Showcase analytics demo',
    riskLevel: 'Low',
  },
  {
    id: 'opp-023',
    name: 'AeroSpace Inc - Maintenance Tracking',
    accountName: 'AeroSpace Inc',
    amount: 445000,
    stage: 'Discovery',
    closeDate: '2025-06-15',
    probability: 0.22,
    ownerName: 'Emily Davis',
    type: 'New Business',
    leadSource: 'Partner Referral',
    dealScore: 0.45,
    nextBestAction: 'Technical feasibility study',
    riskLevel: 'High',
  },
  {
    id: 'opp-024',
    name: 'FashionForward - Inventory System',
    accountName: 'FashionForward Retail',
    amount: 88000,
    stage: 'Closed Won',
    closeDate: '2025-01-25',
    probability: 1.0,
    ownerName: 'James Wilson',
    type: 'Cross-sell',
    leadSource: 'Existing Customer',
    dealScore: 1.0,
    nextBestAction: 'Onboarding kickoff',
    riskLevel: 'Low',
  },
  {
    id: 'opp-025',
    name: 'TeleHealth - Patient Portal',
    accountName: 'TeleHealth Services',
    amount: 195000,
    stage: 'Negotiation',
    closeDate: '2025-04-01',
    probability: 0.78,
    ownerName: 'Sarah Chen',
    type: 'New Business',
    leadSource: 'Web Direct',
    dealScore: 0.89,
    nextBestAction: 'Finalize SLA terms',
    riskLevel: 'Low',
  },
  {
    id: 'opp-026',
    name: 'AgriTech - Crop Monitoring',
    accountName: 'AgriTech Innovations',
    amount: 135000,
    stage: 'Qualification',
    closeDate: '2025-05-20',
    probability: 0.38,
    ownerName: 'Mike Johnson',
    type: 'New Business',
    leadSource: 'Conference',
    dealScore: 0.6,
    nextBestAction: 'Field pilot proposal',
    riskLevel: 'Medium',
  },
  {
    id: 'opp-027',
    name: 'CyberShield - Security Assessment',
    accountName: 'CyberShield Corp',
    amount: 245000,
    stage: 'Proposal',
    closeDate: '2025-03-28',
    probability: 0.64,
    ownerName: 'Emily Davis',
    type: 'New Business',
    leadSource: 'Outbound',
    dealScore: 0.82,
    nextBestAction: 'Penetration test scope',
    riskLevel: 'Low',
  },
  {
    id: 'opp-028',
    name: 'EcoWaste - Recycling Platform',
    accountName: 'EcoWaste Management',
    amount: 72000,
    stage: 'Discovery',
    closeDate: '2025-05-05',
    probability: 0.35,
    ownerName: 'James Wilson',
    type: 'New Business',
    leadSource: 'Inbound',
    dealScore: 0.57,
    nextBestAction: 'Environmental impact analysis',
    riskLevel: 'Medium',
  },
];

// ============================================================================
// Column Definitions
// ============================================================================

const standardColumns: ReportColumn[] = [
  { id: 'name', label: 'Opportunity Name', type: 'text', minWidth: 200 },
  { id: 'accountName', label: 'Account', type: 'text', minWidth: 150 },
  { id: 'amount', label: 'Amount', type: 'currency', minWidth: 100 },
  { id: 'stage', label: 'Stage', type: 'picklist', minWidth: 120 },
  { id: 'closeDate', label: 'Close Date', type: 'date', minWidth: 100 },
  { id: 'probability', label: 'Probability', type: 'percentage', minWidth: 100 },
  { id: 'ownerName', label: 'Owner', type: 'text', minWidth: 120 },
];

const columnsWithAI: ReportColumn[] = [
  { id: 'name', label: 'Opportunity Name', type: 'text', minWidth: 200 },
  { id: 'accountName', label: 'Account', type: 'text', minWidth: 150 },
  { id: 'amount', label: 'Amount', type: 'currency', minWidth: 100 },
  { id: 'stage', label: 'Stage', type: 'picklist', minWidth: 120 },
  { id: 'dealScore', label: 'Deal Score', type: 'percentage', isAI: true, minWidth: 100 },
  { id: 'nextBestAction', label: 'Next Best Action', type: 'text', isAI: true, minWidth: 180 },
  { id: 'riskLevel', label: 'Risk Level', type: 'text', isAI: true, minWidth: 100 },
  { id: 'closeDate', label: 'Close Date', type: 'date', minWidth: 100 },
  { id: 'ownerName', label: 'Owner', type: 'text', minWidth: 120 },
];

const minimalColumns: ReportColumn[] = [
  { id: 'name', label: 'Opportunity', type: 'text', minWidth: 250 },
  { id: 'amount', label: 'Amount', type: 'currency', minWidth: 100 },
  { id: 'stage', label: 'Stage', type: 'picklist', minWidth: 120 },
  { id: 'probability', label: 'Probability', type: 'percentage', minWidth: 100 },
];

// ============================================================================
// Stories
// ============================================================================

/**
 * Default ReportTable with standard Salesforce opportunity fields.
 * Features sorting on all columns and pagination.
 */
export const Default: Story = {
  args: {
    columns: standardColumns,
    data: sampleOpportunities,
    pageSize: 10,
  },
};

/**
 * ReportTable with AI-generated columns (Von IQ).
 * AI columns display with gradient text styling and the Von icon in headers.
 */
export const WithAIColumns: Story = {
  args: {
    columns: columnsWithAI,
    data: sampleOpportunities,
    pageSize: 10,
  },
};

/**
 * Interactive example with row selection and open action.
 */
const InteractiveWrapper = () => {
  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  const handleRowSelect = (row: Opportunity, selected: boolean) => {
    if (selected) {
      setSelectedRows([...selectedRows, row.id]);
    } else {
      setSelectedRows(selectedRows.filter((id) => id !== row.id));
    }
  };

  const handleRowOpen = (row: Opportunity) => {
    console.log('Opening opportunity:', row.name);
    alert(`Opening: ${row.name}`);
  };

  return (
    <div className="space-y-4">
      <div className="text-[13px] text-gray-700">
        Selected: {selectedRows.length > 0 ? selectedRows.join(', ') : 'None'}
      </div>
      <ReportTable
        columns={columnsWithAI}
        data={sampleOpportunities}
        selectedRows={selectedRows}
        onRowSelect={handleRowSelect}
        onRowOpen={handleRowOpen}
        rowIdKey="id"
        pageSize={10}
      />
    </div>
  );
};

export const Interactive: Story = {
  render: () => <InteractiveWrapper />,
};

/**
 * Minimal table with fewer columns.
 */
export const Minimal: Story = {
  args: {
    columns: minimalColumns,
    data: sampleOpportunities,
    pageSize: 10,
  },
};

/**
 * Empty state when no data is available.
 */
export const Empty: Story = {
  args: {
    columns: standardColumns,
    data: [],
    emptyMessage: 'No opportunities found matching your criteria',
  },
};

/**
 * Loading state.
 */
export const Loading: Story = {
  args: {
    columns: standardColumns,
    data: [],
    isLoading: true,
  },
};

/**
 * Without pagination - shows all rows.
 */
export const NoPagination: Story = {
  args: {
    columns: standardColumns,
    data: sampleOpportunities.slice(0, 8),
    showPagination: false,
  },
};

/**
 * Custom page size - 5 rows per page.
 */
export const SmallPageSize: Story = {
  args: {
    columns: columnsWithAI,
    data: sampleOpportunities,
    pageSize: 5,
  },
};

/**
 * Full-width example showing the endless table feel with pagination.
 */
const FullWidthWrapper = () => {
  return (
    <div className="w-full bg-white rounded-xl border border-gray-100 overflow-hidden">
      <ReportTable columns={columnsWithAI} data={sampleOpportunities} pageSize={10} />
    </div>
  );
};

export const FullWidth: Story = {
  render: () => <FullWidthWrapper />,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <div className="p-6 bg-gray-50 min-h-screen">
        <Story />
      </div>
    ),
  ],
};
