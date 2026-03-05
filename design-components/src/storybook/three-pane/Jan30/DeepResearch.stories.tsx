import type { Meta, StoryObj, Decorator } from '@storybook/react-vite';
import { useState, useCallback, useRef, useMemo, useLayoutEffect, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircleIcon,
  CaretLeftIcon,
  CaretRightIcon,
  XIcon,
  DotsThreeIcon,
  ArrowsOutIcon,
  DownloadSimpleIcon,
  GridFourIcon,
  ThumbsUpIcon,
  ThumbsDownIcon,
  CopyIcon,
  FileMagnifyingGlassIcon,
} from '@phosphor-icons/react';
import { ChatSidebarV4 } from '../../../components/Jan17Demo/ChatSidebarV4';
import type {
  SidebarItem,
  Folder,
  ItemType,
  ItemStatus,
} from '../../../components/Jan17Demo/ChatSidebarV4';
import { StandardChatInputWithCommands } from '../../../components/Chat/StandardChatInput';
import type { ReferenceContext as InputReferenceContext } from '../../../components/Chat/StandardChatInput/types';
import {
  DEFAULT_TEMPLATES,
  TEMPLATE_CATEGORIES,
  type Template,
  type TemplateCategory,
} from '../../../components/Templates';
import { ChatPaneV2 } from '../../../components/Jan17Demo/ChatPaneV2';
import type {
  ChatMessage,
  ReferenceContext,
  ThinkingStep,
} from '../../../components/Jan17Demo/ChatPaneV2';
import { DashboardV2 } from '../../../components/Jan17Demo/DashboardV2';
import type {
  KPICardData,
  ChartData,
  TableData,
  TimelineFilter,
  DashboardFilter,
  OwnerOption,
  TextWidgetData,
} from '../../../components/Jan17Demo/DashboardV2';
import { InlineDrilldownPanel } from '../../../components/Jan17Demo/InlineDrilldownPanel';
import type {
  DrilldownFilter,
  DrilldownColumn,
} from '../../../components/Jan17Demo/InlineDrilldownPanel';
import { TransparencyDrawer } from '../../../components/Jan17Demo/TransparencyDrawer';
import type {
  QueryResult,
  CallTranscript,
  DeepResearchTable,
} from '../../../components/Jan17Demo/TransparencyDrawer';
import { WidgetEditSheet } from '../../../components/Jan17Demo/WidgetEditSheet';
import type { WidgetConfigData as WidgetEditConfigData } from '../../../components/Jan17Demo/WidgetEditSheet';
import { AmbientGlow } from '../../../components/Jan17Demo/AmbientGlow';
import { AgentProgressBar } from '../../../components/Jan17Demo/AgentProgressBar';
import type { AgentStatus } from '../../../components/Jan17Demo/AgentProgressBar';
import {
  DashboardSharePopover,
  type ShareConfig,
  ExpensiveOperationModal,
} from '../../../components/popups';
import { PrimaryButton } from '../../../components/forms/buttons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { MarkdownActionCard } from '../components/chat/MarkdownActionCard';
import { DeepResearchNotificationBar } from '../components/chat/DeepResearchNotificationBar';
import { deepResearchTables } from './deepResearchTableData';
import { DataTablesDrawer } from '../../../components/Jan17Demo/DataTablesDrawer';
import { DataTablesCard } from '../../../components/Jan17Demo/DataTablesCard';
import {
  generateDashboardFromData,
  type GeneratedDashboardData,
} from './deepResearchDashboardUtils';
import {
  TimelineThinkingProcess,
  type TimelineStep,
} from '../../../components/TimelineThinkingProcess';
import type { Command } from '../../../components/Commands/types';

// ============================================================================
// Convert Deep Research Tables for Transparency Drawer
// ============================================================================

// Pre-applied filters for demo - showing opportunities in "Negotiation" stage
const opportunitiesDefaultFilters = [
  {
    id: 'filter-1',
    conditions: [{ id: 'cond-1', field: 'stage', operator: 'equals', value: 'Negotiation' }],
    connector: 'and' as const,
  },
];

const convertToDeepResearchTableFormat = (
  tables: typeof deepResearchTables
): DeepResearchTable[] => {
  return tables.map((table) => ({
    id: table.id,
    name: table.name,
    description: table.description,
    // Pass through the columns directly - they're already in ReportColumn format
    columns: table.columns,
    data: table.data as Record<string, unknown>[],
    aiReasoningData: table.aiReasoningData,
    rowCount: table.rowCount,
    // Add pre-applied filters for opportunities table
    defaultFilters: table.id === 'opportunities' ? opportunitiesDefaultFilters : undefined,
  }));
};

const deepResearchTablesForDrawer = convertToDeepResearchTableFormat(deepResearchTables);

// ============================================================================
// Layout Decorator
// ========================================= ===================================

const FullLayoutDecorator: Decorator = (Story) => (
  <div
    style={{
      height: '100vh',
      width: '100%',
      display: 'flex',
      flexDirection: 'row',
      backgroundColor: '#f5f5f7',
      overflow: 'hidden',
      padding: '8px',
      gap: '4px',
    }}
  >
    <Story />
  </div>
);

// ============================================================================
// Types
// ============================================================================

type DeepResearchPhase =
  | 'landing'
  | 'sample-thinking'
  | 'sample-complete'
  | 'full-thinking'
  | 'report-complete'
  | 'building-dashboard'
  | 'dashboard-complete';

interface DeepResearchThinkingStep {
  id: string;
  text: string;
  status: 'pending' | 'in-progress' | 'complete';
  subtitle?: string;
  icon?: 'salesforce' | 'database' | 'chart' | 'table';
}

// ============================================================================
// Sidebar Data
// ============================================================================

const dummySidebarItems: SidebarItem[] = [
  { id: 'chat-1', label: 'Q4 Sales Performance Analysis', type: 'chat' },
  { id: 'chat-2', label: 'Win Rate Optimization', type: 'chat' },
  { id: 'chat-3', label: 'Revenue Forecast Discussion', type: 'chat' },
  { id: 'dash-1', label: 'Sales Overview', type: 'dashboard', ownership: 'mine' },
  {
    id: 'dash-2',
    label: 'Team Performance',
    type: 'dashboard',
    ownership: 'shared',
    ownerName: 'Sarah Chen',
  },
];

const dummyFolders: Folder[] = [{ id: 'folder-1', label: 'Q4 Analysis', isExpanded: false }];

// ============================================================================
// Deep Research Content
// ============================================================================

const DEEP_RESEARCH_PROMPT =
  'Perform a comprehensive analysis of our Q4 sales performance across all regions and product categories. Identify trends, top-performing segments, underperforming areas, and provide strategic recommendations for Q1 planning.';

// Sample analysis thinking steps (shorter) - matches Dashboard V2 style
const sampleThinkingSteps: DeepResearchThinkingStep[] = [
  {
    id: 'sample-1',
    text: 'Connecting to Salesforce',
    subtitle: 'Authenticated via OAuth 2.0',
    status: 'pending',
    icon: 'salesforce',
  },
  {
    id: 'sample-2',
    text: 'Querying opportunity data',
    subtitle: 'SELECT Id, Name, Amount, CloseDate, Stage FROM Opportunity',
    status: 'pending',
    icon: 'database',
  },
  {
    id: 'sample-3',
    text: 'Filtering deals for Q4 2025',
    subtitle: 'Found 847 matching opportunities',
    status: 'pending',
    icon: 'table',
  },
  {
    id: 'sample-4',
    text: 'Calculating performance metrics',
    subtitle: 'Total value: $12.8M, Avg deal: $15.1K',
    status: 'pending',
    icon: 'chart',
  },
  {
    id: 'sample-5',
    text: 'Generating sample preview',
    subtitle: 'Preparing key highlights and observations',
    status: 'pending',
    icon: 'chart',
  },
];

// Full research thinking steps (extensive)
const fullResearchThinkingSteps: DeepResearchThinkingStep[] = [
  { id: 'full-1', text: 'Connecting to Salesforce CRM...', status: 'pending' },
  { id: 'full-2', text: 'Analyzing 2,847 deals from Q4 2025...', status: 'pending' },
  { id: 'full-3', text: 'Segmenting by region and product category...', status: 'pending' },
  { id: 'full-4', text: 'Calculating conversion rates and deal velocities...', status: 'pending' },
  { id: 'full-5', text: 'Identifying top performers and patterns...', status: 'pending' },
  { id: 'full-6', text: 'Analyzing seasonal trends...', status: 'pending' },
  { id: 'full-7', text: 'Comparing against Q3 benchmarks...', status: 'pending' },
  { id: 'full-8', text: 'Pulling Gong call sentiment data...', status: 'pending' },
  { id: 'full-9', text: 'Cross-referencing with marketing campaigns...', status: 'pending' },
  { id: 'full-10', text: 'Identifying competitive displacement patterns...', status: 'pending' },
  {
    id: 'full-11',
    text: 'Calculating customer acquisition costs by segment...',
    status: 'pending',
  },
  { id: 'full-12', text: 'Generating strategic recommendations...', status: 'pending' },
  { id: 'full-13', text: 'Compiling executive summary...', status: 'pending' },
  { id: 'full-14', text: 'Formatting comprehensive report...', status: 'pending' },
];

// Sample partial response
const sampleAnalysisContent = `## Sample Analysis Preview

Based on initial data review, here's a preview of the insights I can provide:

### Key Highlights
- **Total Q4 Revenue**: $12.8M across 847 closed deals
- **Top Region**: West Coast (+18% vs Q3)
- **Highest Growth Category**: Enterprise SaaS (+32%)

### Initial Observations
- Deal velocity improved by 12% compared to Q3
- Average deal size increased from $14.2K to $15.1K
- Win rate held steady at 28%

### Potential Areas of Concern
- Mid-market segment showing 8% decline
- Longer sales cycles in healthcare vertical

---

### AI-Enhanced Columns in Full Report

The full analysis will include AI-generated insights for each table:

**Top Performers Table**
- **Deal Health Score** — Calculate deal health (0-100) based on pipeline velocity, win rate trends, and engagement patterns
- **Next Best Action** — Recommend the single most impactful action each rep should take this week

**Regional Performance Table**
- **Q1 Forecast** — Project Q1 revenue based on pipeline, seasonality, and growth trajectory
- **Risk Level** — Assess risk (Low/Medium/High) based on pipeline coverage and deal concentration

**Deal Velocity Table**
- **Improvement Potential** — Identify biggest improvement opportunity at each stage based on win/loss analysis`;

// Full comprehensive report
const fullReportContent = `# Q4 2025 Sales Performance Analysis

## Executive Summary

This comprehensive analysis examines sales performance across all regions and product categories for Q4 2025 (October - December). The quarter demonstrated strong overall growth with total revenue of **$12.8M**, representing a **15.2% increase** over Q4 2024 and **8.3% above target**.

Key findings indicate significant regional disparities, with the West region outperforming all others by a considerable margin. Product mix has shifted notably toward enterprise solutions, while the mid-market segment requires strategic attention.

---

## Overall Performance Metrics

| Metric | Q4 2025 | Q4 2024 | Change | Target | vs Target |
|--------|---------|---------|--------|--------|-----------|
| Total Revenue | $12.8M | $11.1M | +15.2% | $11.8M | +8.5% |
| Deals Closed | 847 | 756 | +12.0% | 800 | +5.9% |
| Average Deal Size | $15,112 | $14,683 | +2.9% | $14,750 | +2.5% |
| Win Rate | 28.4% | 27.1% | +1.3pp | 28.0% | +0.4pp |
| Sales Cycle (days) | 42 | 47 | -10.6% | 45 | -6.7% |
| Pipeline Coverage | 3.2x | 2.8x | +14.3% | 3.0x | +6.7% |

---

## Regional Performance Breakdown

### Revenue by Region

| Region | Revenue | % of Total | vs Q3 | vs Target | Key Driver |
|--------|---------|------------|-------|-----------|------------|
| West | $4.9M | 38.3% | +18.2% | +12.4% | Enterprise expansion |
| East | $3.8M | 29.7% | +11.5% | +6.2% | New customer acquisition |
| Central | $2.4M | 18.8% | +8.3% | +2.1% | Renewal upsells |
| International | $1.7M | 13.3% | +22.1% | +15.8% | APAC market entry |

### Regional Deal Metrics

| Region | Deals | Avg Size | Win Rate | Cycle Time |
|--------|-------|----------|----------|------------|
| West | 298 | $16,443 | 31.2% | 38 days |
| East | 267 | $14,232 | 27.8% | 44 days |
| Central | 178 | $13,483 | 26.1% | 46 days |
| International | 104 | $16,346 | 29.4% | 52 days |

**Analysis**: The West region's exceptional performance is driven primarily by enterprise deal expansion, with 12 deals over $100K compared to 5 in other regions combined. The International region, while smaller in absolute terms, shows the highest growth trajectory and should be a focus for Q1 investment.

---

## Product Category Analysis

### Revenue by Product Category

| Category | Revenue | % of Total | YoY Growth | Margin |
|----------|---------|------------|------------|--------|
| Enterprise SaaS | $5.4M | 42.2% | +32.1% | 78% |
| Growth Platform | $3.9M | 30.5% | +12.4% | 72% |
| Starter Suite | $2.1M | 16.4% | +4.2% | 65% |
| Professional Services | $1.4M | 10.9% | -2.8% | 45% |

### Product Performance Details

| Category | Deals | Avg Size | Win Rate | Attach Rate |
|----------|-------|----------|----------|-------------|
| Enterprise SaaS | 156 | $34,615 | 35.2% | 89% |
| Growth Platform | 342 | $11,404 | 28.6% | 72% |
| Starter Suite | 289 | $7,266 | 24.3% | 58% |
| Professional Services | 60 | $23,333 | 22.1% | 34% |

**Analysis**: Enterprise SaaS continues to be our growth engine, benefiting from the new AI features released in October. The Starter Suite shows signs of commoditization and may require pricing strategy revision.

---

## Sales Team Performance

### Top Performers (Q4 2025)

| Rank | Rep | Revenue | Deals | Quota Att. | Avg Deal |
|------|-----|---------|-------|------------|----------|
| 1 | Sarah Chen | $1.42M | 68 | 142% | $20,882 |
| 2 | Marcus Johnson | $1.18M | 54 | 118% | $21,852 |
| 3 | Emily Rodriguez | $985K | 72 | 109% | $13,681 |
| 4 | David Kim | $892K | 45 | 99% | $19,822 |
| 5 | Jennifer Walsh | $856K | 61 | 95% | $14,033 |

### Team Averages by Tenure

| Tenure | Reps | Avg Revenue | Quota Att. | Win Rate |
|--------|------|-------------|------------|----------|
| 2+ years | 4 | $1.12M | 124% | 32.1% |
| 1-2 years | 4 | $842K | 94% | 27.8% |
| <1 year | 2 | $521K | 72% | 22.4% |

**Analysis**: Experienced reps significantly outperform newer team members. The ramp time for new hires averages 8 months to reach 80% quota attainment. Consider enhanced onboarding and mentorship programs.

---

## Deal Velocity Analysis

### Sales Cycle by Stage

| Stage | Avg Days | Conversion | Drop-off Reason |
|-------|----------|------------|-----------------|
| Qualification → Discovery | 5.2 | 78% | Poor fit |
| Discovery → Demo | 8.4 | 72% | No budget |
| Demo → Proposal | 12.1 | 65% | Competitor |
| Proposal → Negotiation | 9.8 | 58% | Pricing |
| Negotiation → Closed | 6.5 | 82% | Legal delays |
| **Total Cycle** | **42.0** | **28.4%** | — |

### Month-over-Month Velocity

| Month | Deals Created | Deals Closed | Avg Cycle |
|-------|---------------|--------------|-----------|
| October | 312 | 258 | 44 days |
| November | 298 | 287 | 41 days |
| December | 276 | 302 | 40 days |

**Analysis**: Deal velocity improved throughout the quarter due to streamlined approval processes implemented in November. December's higher close count reflects deals pulled forward from Q1.

---

## Competitive Landscape

### Win/Loss by Competitor

| Competitor | Wins vs | Losses to | Win Rate | Primary Differentiator |
|------------|---------|-----------|----------|----------------------|
| Competitor A | 45 | 32 | 58% | Better integrations |
| Competitor B | 28 | 41 | 41% | Lower price point |
| Competitor C | 19 | 12 | 61% | Enterprise features |
| No Competition | 186 | — | 72% | — |

### Competitive Win Rate Trends

| Quarter | vs Comp A | vs Comp B | vs Comp C |
|---------|-----------|-----------|-----------|
| Q2 2025 | 52% | 38% | 55% |
| Q3 2025 | 55% | 40% | 58% |
| Q4 2025 | 58% | 41% | 61% |

**Analysis**: Competitive win rates are improving across the board, particularly against Competitor A due to our integration marketplace launch. Competitor B continues to win on price in the SMB segment.

---

## Customer Segment Analysis

### Revenue by Company Size

| Segment | Revenue | Deals | Avg Size | YoY Growth |
|---------|---------|-------|----------|------------|
| Enterprise (1000+) | $5.2M | 86 | $60,465 | +28.4% |
| Mid-Market (100-999) | $4.1M | 298 | $13,758 | -8.2% |
| SMB (<100) | $3.5M | 463 | $7,559 | +11.3% |

### Segment Health Indicators

| Segment | NRR | Churn | Expansion | Health Score |
|---------|-----|-------|-----------|--------------|
| Enterprise | 118% | 4.2% | 22.2% | 92 |
| Mid-Market | 102% | 8.8% | 10.8% | 74 |
| SMB | 98% | 12.4% | 10.4% | 68 |

**Analysis**: Mid-market decline is concerning and appears driven by increased competition and pricing pressure. This segment requires strategic focus in Q1.

---

## Q1 2026 Strategic Recommendations

### Immediate Actions (January)

1. **Launch Mid-Market Recovery Initiative**
   - Develop competitive pricing tiers for 100-500 employee companies
   - Create dedicated mid-market sales team of 3 reps
   - Target win-back campaign for churned accounts

2. **Accelerate Enterprise Momentum**
   - Increase enterprise SDR team by 2 headcount
   - Launch enterprise-only feature preview program
   - Develop 5 new enterprise case studies

3. **Optimize Sales Enablement**
   - Implement new onboarding curriculum (target: reduce ramp to 6 months)
   - Launch weekly competitive intelligence briefings
   - Deploy AI-powered email sequences

### Medium-term Initiatives (Q1)

| Initiative | Owner | Investment | Expected ROI |
|------------|-------|------------|--------------|
| APAC Expansion | VP International | $450K | 3.2x (18mo) |
| Partner Channel | Head of Partnerships | $280K | 2.8x (12mo) |
| Product-Led Growth | VP Product | $180K | 4.1x (12mo) |
| Sales AI Tools | Rev Ops | $120K | 2.4x (6mo) |

### Key Performance Targets (Q1 2026)

| Metric | Q1 Target | Stretch | Rationale |
|--------|-----------|---------|-----------|
| Revenue | $13.2M | $14.0M | 10% QoQ growth |
| Deals | 875 | 925 | Pipeline supports |
| Enterprise Mix | 45% | 48% | Strategic priority |
| Mid-Market Growth | +5% | +10% | Recovery focus |
| Win Rate | 30% | 32% | Process improvements |

---

## Appendix: Data Sources

| Source | Records | Time Range | Last Updated |
|--------|---------|------------|--------------|
| Salesforce CRM | 2,847 deals | Q4 2025 | Jan 15, 2026 |
| Gong Call Analytics | 4,521 calls | Q4 2025 | Jan 15, 2026 |
| Marketing Cloud | 12,843 campaigns | Q4 2025 | Jan 14, 2026 |
| Finance System | 847 invoices | Q4 2025 | Jan 15, 2026 |

---

*Report generated by Von AI on January 15, 2026*
*Data reflects sales performance through December 31, 2025*`;

// ============================================================================
// Dashboard Data (dynamically generated from 900 opportunity records)
// ============================================================================

// Generate dashboard data programmatically from the deep research data
const generatedDashboardData: GeneratedDashboardData = generateDashboardFromData();

// Extract individual components for use in the dashboard
const kpiCards: KPICardData[] = generatedDashboardData.kpiCards;
const barChart: ChartData = generatedDashboardData.barChart;
const pieChart: ChartData = generatedDashboardData.pieChart;
const tableData: TableData = generatedDashboardData.tableData;
const textWidgetData: TextWidgetData = {
  ...generatedDashboardData.textWidget,
  maxCharacters: 1500,
  isAIGenerated: true,
};

// Owner options for filter
const ownerOptions: OwnerOption[] = [
  { id: 'owner-1', name: 'Sarah Chen' },
  { id: 'owner-2', name: 'Marcus Johnson' },
  { id: 'owner-3', name: 'Emily Rodriguez' },
  { id: 'owner-4', name: 'David Kim' },
  { id: 'owner-5', name: 'Jennifer Walsh' },
];

const availableFilterFields = [
  'Rep Name',
  'Region',
  'Revenue',
  'Deals',
  'Quota Attainment',
  'Average Deal Size',
  'Product Category',
];

// ============================================================================
// Transparency Drawer Mock Data
// ============================================================================

const mockQueries: QueryResult[] = [
  {
    id: 'query-1',
    name: 'Q4 Revenue Summary',
    description: 'Aggregated revenue data for Q4 2025',
    query: `SELECT SUM(Amount) as Revenue, COUNT(Id) as Deals, AVG(Amount) as AvgDeal
FROM Opportunity
WHERE CloseDate >= 2025-10-01 AND CloseDate <= 2025-12-31
  AND IsWon = true`,
    duration: 312,
    columns: [
      { key: 'revenue', label: 'Revenue', type: 'currency' },
      { key: 'deals', label: 'Deals', type: 'number' },
      { key: 'avgDeal', label: 'Avg Deal', type: 'currency' },
    ],
    rows: [{ revenue: 12800000, deals: 847, avgDeal: 15112 }],
  },
  {
    id: 'query-2',
    name: 'Regional Performance',
    description: 'Revenue breakdown by region',
    query: `SELECT Region__c, SUM(Amount) as Revenue, COUNT(Id) as Deals
FROM Opportunity
WHERE CloseDate >= 2025-10-01 AND CloseDate <= 2025-12-31
GROUP BY Region__c`,
    duration: 245,
    columns: [
      { key: 'region', label: 'Region', type: 'string' },
      { key: 'revenue', label: 'Revenue', type: 'currency' },
      { key: 'deals', label: 'Deals', type: 'number' },
    ],
    rows: [
      { region: 'West', revenue: 4900000, deals: 298 },
      { region: 'East', revenue: 3800000, deals: 267 },
      { region: 'Central', revenue: 2400000, deals: 178 },
      { region: 'International', revenue: 1700000, deals: 104 },
    ],
  },
  {
    id: 'query-3',
    name: 'Product Category Analysis',
    description: 'Revenue by product category with YoY comparison',
    query: `SELECT Product_Category__c, SUM(Amount) as Revenue,
  COUNT(Id) as Deals, AVG(Days_to_Close__c) as AvgCycle
FROM Opportunity
WHERE CloseDate >= 2025-10-01 AND CloseDate <= 2025-12-31
GROUP BY Product_Category__c
ORDER BY Revenue DESC`,
    duration: 428,
    columns: [
      { key: 'category', label: 'Category', type: 'string' },
      { key: 'revenue', label: 'Revenue', type: 'currency' },
      { key: 'deals', label: 'Deals', type: 'number' },
      { key: 'avgCycle', label: 'Avg Cycle', type: 'number' },
    ],
    rows: [
      { category: 'Enterprise', revenue: 5200000, deals: 156, avgCycle: 68 },
      { category: 'Mid-Market', revenue: 3800000, deals: 312, avgCycle: 42 },
      { category: 'SMB', revenue: 2100000, deals: 289, avgCycle: 21 },
      { category: 'Strategic', revenue: 1700000, deals: 90, avgCycle: 95 },
    ],
  },
  {
    id: 'query-4',
    name: 'Win Rate by Stage',
    description: 'Conversion rates through sales pipeline stages',
    query: `SELECT Stage, COUNT(Id) as Opps,
  SUM(CASE WHEN IsWon THEN 1 ELSE 0 END) / COUNT(Id) as WinRate
FROM Opportunity
WHERE CreatedDate >= 2025-10-01 AND CreatedDate <= 2025-12-31
GROUP BY Stage`,
    duration: 189,
    columns: [
      { key: 'stage', label: 'Stage', type: 'string' },
      { key: 'opps', label: 'Opportunities', type: 'number' },
      { key: 'winRate', label: 'Win Rate', type: 'percentage' },
    ],
    rows: [
      { stage: 'Discovery', opps: 1247, winRate: 0.68 },
      { stage: 'Qualification', opps: 892, winRate: 0.72 },
      { stage: 'Proposal', opps: 634, winRate: 0.78 },
      { stage: 'Negotiation', opps: 412, winRate: 0.85 },
      { stage: 'Closed Won', opps: 847, winRate: 1.0 },
    ],
  },
  {
    id: 'query-5',
    name: 'Top Performing Reps',
    description: 'Sales rep performance rankings for Q4',
    query: `SELECT Owner.Name, SUM(Amount) as Revenue, COUNT(Id) as Deals,
  AVG(Amount) as AvgDeal
FROM Opportunity
WHERE CloseDate >= 2025-10-01 AND IsWon = true
GROUP BY Owner.Name
ORDER BY Revenue DESC
LIMIT 10`,
    duration: 356,
    columns: [
      { key: 'rep', label: 'Sales Rep', type: 'string' },
      { key: 'revenue', label: 'Revenue', type: 'currency' },
      { key: 'deals', label: 'Deals', type: 'number' },
      { key: 'avgDeal', label: 'Avg Deal', type: 'currency' },
    ],
    rows: [
      { rep: 'Sarah Chen', revenue: 1850000, deals: 42, avgDeal: 44047 },
      { rep: 'Marcus Johnson', revenue: 1620000, deals: 38, avgDeal: 42631 },
      { rep: 'Emily Rodriguez', revenue: 1480000, deals: 51, avgDeal: 29019 },
      { rep: 'David Kim', revenue: 1340000, deals: 45, avgDeal: 29777 },
      { rep: 'Jessica Taylor', revenue: 1180000, deals: 36, avgDeal: 32777 },
    ],
  },
  {
    id: 'query-6',
    name: 'Competitive Win/Loss',
    description: 'Competitive displacement analysis',
    query: `SELECT Competitor__c,
  SUM(CASE WHEN IsWon THEN 1 ELSE 0 END) as Wins,
  SUM(CASE WHEN IsClosed AND NOT IsWon THEN 1 ELSE 0 END) as Losses
FROM Opportunity
WHERE Competitor__c != null AND CloseDate >= 2025-10-01
GROUP BY Competitor__c`,
    duration: 278,
    columns: [
      { key: 'competitor', label: 'Competitor', type: 'string' },
      { key: 'wins', label: 'Wins', type: 'number' },
      { key: 'losses', label: 'Losses', type: 'number' },
    ],
    rows: [
      { competitor: 'Competitor A', wins: 89, losses: 34 },
      { competitor: 'Competitor B', wins: 67, losses: 52 },
      { competitor: 'Competitor C', wins: 45, losses: 28 },
      { competitor: 'No Competitor', wins: 646, losses: 187 },
    ],
  },
  {
    id: 'query-7',
    name: 'Deal Velocity Trends',
    description: 'Average days to close by month',
    query: `SELECT MONTH(CloseDate) as Month, AVG(Days_to_Close__c) as AvgDays,
  COUNT(Id) as Deals
FROM Opportunity
WHERE CloseDate >= 2025-10-01 AND IsWon = true
GROUP BY MONTH(CloseDate)`,
    duration: 167,
    columns: [
      { key: 'month', label: 'Month', type: 'string' },
      { key: 'avgDays', label: 'Avg Days', type: 'number' },
      { key: 'deals', label: 'Deals', type: 'number' },
    ],
    rows: [
      { month: 'October', avgDays: 38, deals: 256 },
      { month: 'November', avgDays: 35, deals: 289 },
      { month: 'December', avgDays: 31, deals: 302 },
    ],
  },
  {
    id: 'query-8',
    name: 'Marketing Attribution',
    description: 'Revenue attributed to marketing campaigns',
    query: `SELECT Campaign.Name, SUM(Amount) as Revenue, COUNT(Id) as Deals
FROM Opportunity
WHERE Campaign != null AND CloseDate >= 2025-10-01 AND IsWon = true
GROUP BY Campaign.Name
ORDER BY Revenue DESC`,
    duration: 412,
    columns: [
      { key: 'campaign', label: 'Campaign', type: 'string' },
      { key: 'revenue', label: 'Revenue', type: 'currency' },
      { key: 'deals', label: 'Deals', type: 'number' },
    ],
    rows: [
      { campaign: 'Q4 Enterprise Push', revenue: 2400000, deals: 78 },
      { campaign: 'Product Launch Event', revenue: 1800000, deals: 92 },
      { campaign: 'Webinar Series', revenue: 1200000, deals: 145 },
      { campaign: 'Referral Program', revenue: 980000, deals: 67 },
    ],
  },
];

const mockCalls: CallTranscript[] = [
  {
    id: 'call-1',
    title: 'Q4 Sales Review - West Region',
    date: '2026-01-10',
    duration: '45 min',
    timeRange: '10:00 AM - 10:45 AM',
    participants: ['Sarah Chen', 'VP Sales'],
    accountName: 'Internal',
    sentiment: 'positive',
    summary:
      'Reviewed exceptional Q4 performance in West region. Discussed strategies for replicating success in other regions. Key driver was faster deal cycles and higher average deal sizes.',
    sourceUrl: 'https://example.com/calls/1',
  },
  {
    id: 'call-2',
    title: 'Enterprise Deal Review - TechCorp',
    date: '2026-01-08',
    duration: '32 min',
    timeRange: '2:00 PM - 2:32 PM',
    participants: ['Marcus Johnson', 'Deal Desk'],
    accountName: 'TechCorp Inc',
    sentiment: 'positive',
    summary:
      'Closed $450K enterprise deal after 3-month negotiation. Customer cited product reliability and support quality as deciding factors over Competitor A.',
    sourceUrl: 'https://example.com/calls/2',
  },
  {
    id: 'call-3',
    title: 'Lost Deal Analysis - GlobalBank',
    date: '2026-01-05',
    duration: '28 min',
    timeRange: '11:00 AM - 11:28 AM',
    participants: ['Emily Rodriguez', 'Sales Manager'],
    accountName: 'GlobalBank',
    sentiment: 'negative',
    summary:
      'Post-mortem on lost $320K deal. Customer went with Competitor B due to existing integration with their tech stack. Need to strengthen partnership ecosystem.',
    sourceUrl: 'https://example.com/calls/3',
  },
  {
    id: 'call-4',
    title: 'Mid-Market Strategy Session',
    date: '2026-01-03',
    duration: '55 min',
    timeRange: '3:00 PM - 3:55 PM',
    participants: ['David Kim', 'Product Team', 'Sales Ops'],
    accountName: 'Internal',
    sentiment: 'neutral',
    summary:
      'Addressed 8% decline in mid-market segment. Identified pricing pressure and longer sales cycles as key issues. Proposed new packaging options for Q1.',
    sourceUrl: 'https://example.com/calls/4',
  },
  {
    id: 'call-5',
    title: 'Customer Success Review - Acme Corp',
    date: '2025-12-28',
    duration: '40 min',
    timeRange: '9:00 AM - 9:40 AM',
    participants: ['Jessica Taylor', 'Customer Success'],
    accountName: 'Acme Corp',
    sentiment: 'positive',
    summary:
      'Upsell opportunity identified. Customer expanded from 50 to 200 seats after successful Q4 pilot. Potential $180K expansion in Q1.',
    sourceUrl: 'https://example.com/calls/5',
  },
  {
    id: 'call-6',
    title: 'Competitive Intelligence Briefing',
    date: '2025-12-20',
    duration: '35 min',
    timeRange: '4:00 PM - 4:35 PM',
    participants: ['Sales Team', 'Product Marketing'],
    accountName: 'Internal',
    sentiment: 'neutral',
    summary:
      'Competitor A launched new feature set. Our win rate against them improved to 72% in Q4 due to our faster implementation time and better ROI story.',
    sourceUrl: 'https://example.com/calls/6',
  },
];

// ============================================================================
// Drilldown data
// ============================================================================

const drilldownFilters: DrilldownFilter[] = [
  { id: 'filter-1', field: 'Time Period', operator: 'equals', value: 'Q4 2025' },
];

const drilldownFormula = 'SUM(Revenue) WHERE CloseDate BETWEEN "2025-10-01" AND "2025-12-31"';

// ============================================================================
// Success Toast Component
// ============================================================================

interface ToastProps {
  message: string;
  onDismiss: () => void;
}

const SuccessToast: React.FC<ToastProps> = ({ message, onDismiss }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed top-16 left-1/2 -translate-x-1/2 z-[200]"
    >
      <div className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
          <CheckCircleIcon size={14} weight="fill" className="text-emerald-600" />
        </div>
        <span className="text-sm font-medium text-gray-900">{message}</span>
        <button
          onClick={onDismiss}
          className="ml-2 text-gray-400 hover:text-gray-600 cursor-pointer"
        >
          ×
        </button>
      </div>
    </motion.div>
  );
};

// ============================================================================
// Ask Von Popover Component (for text selection)
// ============================================================================

interface AskVonPopoverProps {
  position: { x: number; y: number };
  onAskVon: () => void;
  onClose: () => void;
}

const AskVonPopover: React.FC<AskVonPopoverProps> = ({ position, onAskVon, onClose }) => {
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <motion.div
      ref={popoverRef}
      initial={{ opacity: 0, scale: 0.95, y: 4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 4 }}
      transition={{ duration: 0.1 }}
      className="fixed z-[100] flex items-center gap-1.5 bg-gray-900 text-white rounded-lg shadow-lg px-2.5 py-1.5 cursor-pointer hover:bg-gray-800 transition-colors"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translateX(-50%)',
      }}
      onClick={onAskVon}
    >
      {/* Small Von Logo */}
      <svg
        width={16}
        height={16}
        viewBox="0 0 28 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="14" cy="14" r="14" fill="url(#paint0_radial_von_popover)" />
        <path
          d="M15.937 11.1501C17.7702 12.4452 19.151 13.9556 19.9152 15.3235C20.7057 16.7385 20.7316 17.7813 20.3233 18.3594C19.9149 18.9375 18.9234 19.2616 17.3256 18.9894C15.7809 18.7262 13.8959 17.9296 12.0627 16.6345C10.2294 15.3394 8.84791 13.8285 8.08365 12.4605C7.29337 11.0458 7.26805 10.0032 7.67638 9.42519C8.08475 8.84721 9.07582 8.52262 10.6733 8.7947C12.2181 9.05788 14.1037 9.855 15.937 11.1501Z"
          stroke="white"
          strokeWidth="1.33"
        />
        <circle cx="13.9932" cy="14" r="7.835" stroke="white" strokeWidth="1.33" />
        <defs>
          <radialGradient
            id="paint0_radial_von_popover"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(21.875 1.75) rotate(120.964) scale(30.6125)"
          >
            <stop stopColor="#FFF3EB" />
            <stop offset="0.26" stopColor="#FF9042" />
            <stop offset="1" stopColor="#854FFF" />
          </radialGradient>
        </defs>
      </svg>
      <span className="text-[12px] font-medium whitespace-nowrap">Ask Von</span>
    </motion.div>
  );
};

// ============================================================================
// Von Logo Component (for assistant messages)
// ============================================================================

const VonLogo: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 28 28"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="14" cy="14" r="14" fill="url(#paint0_radial_von_msg)" />
    <path
      d="M15.937 11.1501C17.7702 12.4452 19.151 13.9556 19.9152 15.3235C20.7057 16.7385 20.7316 17.7813 20.3233 18.3594C19.9149 18.9375 18.9234 19.2616 17.3256 18.9894C15.7809 18.7262 13.8959 17.9296 12.0627 16.6345C10.2294 15.3394 8.84791 13.8285 8.08365 12.4605C7.29337 11.0458 7.26805 10.0032 7.67638 9.42519C8.08475 8.84721 9.07582 8.52262 10.6733 8.7947C12.2181 9.05788 14.1037 9.855 15.937 11.1501Z"
      stroke="white"
      strokeWidth="1.33"
    />
    <circle cx="13.9932" cy="14" r="7.835" stroke="white" strokeWidth="1.33" />
    <defs>
      <radialGradient
        id="paint0_radial_von_msg"
        cx="0"
        cy="0"
        r="1"
        gradientUnits="userSpaceOnUse"
        gradientTransform="translate(21.875 1.75) rotate(120.964) scale(30.6125)"
      >
        <stop stopColor="#FFF3EB" />
        <stop offset="0.26" stopColor="#FF9042" />
        <stop offset="1" stopColor="#854FFF" />
      </radialGradient>
    </defs>
  </svg>
);

// ============================================================================
// User Avatar Component
// ============================================================================

interface UserAvatarProps {
  initials: string;
  size?: number;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ initials, size = 24 }) => (
  <div
    className="rounded-full bg-indigo-600 flex items-center justify-center text-white font-medium flex-shrink-0"
    style={{ width: size, height: size, fontSize: size * 0.4 }}
  >
    {initials}
  </div>
);

// ============================================================================
// Timeline Helpers
// ============================================================================

const toTimelineSteps = (steps: DeepResearchThinkingStep[]): TimelineStep[] =>
  steps.map((step) => ({
    id: step.id,
    text: step.text,
    status: step.status,
    type: 'tool_call',
    description: step.subtitle,
  }));

// ============================================================================
// Deep Research Thinking Block with Progress (Dashboard V2 style)
// ============================================================================

interface DeepResearchThinkingBlockProps {
  steps: DeepResearchThinkingStep[];
  isThinking: boolean;
  progress: number;
  estimatedTimeRemaining: string;
  elapsedTime?: number;
  title?: string;
  showProgressBar?: boolean;
  defaultCollapsed?: boolean;
}

const DeepResearchThinkingBlock: React.FC<DeepResearchThinkingBlockProps> = ({
  steps,
  isThinking,
  progress,
  estimatedTimeRemaining,
  elapsedTime = 0,
  title = 'Thinking',
  showProgressBar = true,
  defaultCollapsed = false,
}) => {
  const completedCount = steps.filter((s) => s.status === 'complete').length;
  const totalCount = steps.length;
  const allComplete = completedCount === totalCount && totalCount > 0 && !isThinking;
  const timelineSteps = useMemo(() => toTimelineSteps(steps), [steps]);

  return (
    <div className="space-y-2">
      <TimelineThinkingProcess
        steps={timelineSteps}
        isThinking={isThinking}
        elapsedTime={elapsedTime}
        autoCollapse={allComplete}
        initiallyCollapsed={defaultCollapsed}
        title={title}
      />

      {!allComplete && showProgressBar && (
        <div className="px-2">
          <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-indigo-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[11px] text-gray-500">Progress</span>
            <span className="text-[11px] font-medium text-gray-700">
              {estimatedTimeRemaining} remaining
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

const getCommandDisplayMessage = (message: string, command?: Command) => {
  if (!command) return message;
  let display = message;
  if (message.startsWith(command.prompt)) {
    display = message.slice(command.prompt.length).trim();
  }
  display = display.replace(/^Additional context:\s*/i, '').trim();
  return display || `/ ${command.name}`;
};

// ============================================================================
// Shared Markdown Components for consistent rendering
// ============================================================================

const markdownComponents = {
  h1: ({ children }: { children?: React.ReactNode }) => (
    <h1 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
      {children}
    </h1>
  ),
  h2: ({ children }: { children?: React.ReactNode }) => (
    <h2 className="text-lg font-medium text-gray-900 mt-6 mb-3">{children}</h2>
  ),
  h3: ({ children }: { children?: React.ReactNode }) => (
    <h3 className="text-sm font-medium text-gray-900 mt-4 mb-2">{children}</h3>
  ),
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="text-sm text-gray-900 mb-3 leading-relaxed">{children}</p>
  ),
  strong: ({ children }: { children?: React.ReactNode }) => (
    <strong className="font-medium text-gray-900">{children}</strong>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="text-sm text-gray-900 mb-3 space-y-1 list-disc pl-4">{children}</ul>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ol className="text-sm text-gray-900 mb-3 space-y-1 list-decimal pl-4">{children}</ol>
  ),
  li: ({ children }: { children?: React.ReactNode }) => (
    <li className="text-sm text-gray-900">{children}</li>
  ),
  table: ({ children }: { children?: React.ReactNode }) => (
    <div className="overflow-x-auto mb-4 rounded-lg border border-gray-200">
      <table className="w-full text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }: { children?: React.ReactNode }) => (
    <thead className="bg-gray-50">{children}</thead>
  ),
  th: ({ children }: { children?: React.ReactNode }) => (
    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 border-b border-gray-200">
      {children}
    </th>
  ),
  td: ({ children }: { children?: React.ReactNode }) => (
    <td className="px-3 py-2 text-sm text-gray-900 border-b border-gray-100">{children}</td>
  ),
  hr: () => <hr className="my-6 border-gray-200" />,
  blockquote: ({ children }: { children?: React.ReactNode }) => (
    <blockquote className="border-l-4 border-indigo-300 pl-4 py-1 my-3 bg-indigo-50/50 rounded-r">
      {children}
    </blockquote>
  ),
  em: ({ children }: { children?: React.ReactNode }) => (
    <em className="text-gray-900 italic">{children}</em>
  ),
  code: ({ children }: { children?: React.ReactNode }) => (
    <code className="px-1.5 py-0.5 bg-gray-100 rounded text-[12px] font-mono text-gray-900">
      {children}
    </code>
  ),
  pre: ({ children }: { children?: React.ReactNode }) => (
    <pre className="p-3 bg-gray-50 rounded-lg overflow-x-auto mb-3 text-[12px]">{children}</pre>
  ),
};

// Card-specific markdown components (hides h1 since title is shown in card header)
const cardMarkdownComponents = {
  ...markdownComponents,
  h1: () => null, // Hide h1 in card preview since title is already shown in header
};

// ============================================================================
// Report Card Component
// ============================================================================

interface ReportCardProps {
  title: string;
  content: string;
  onExpand: () => void;
  onConvertToDashboard: () => void;
  onDownload?: () => void;
  showActions?: boolean;
}

const ReportCard: React.FC<ReportCardProps> = ({
  title,
  content,
  onExpand,
  onConvertToDashboard,
  onDownload,
  showActions = true,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useLayoutEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDownload = () => {
    onDownload?.();
    // Placeholder for PDF download functionality
    console.log('Download PDF clicked');
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:border-gray-200 transition-colors">
      {/* Header */}
      <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900">{title}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onExpand}
            className="p-1.5 text-gray-800 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
            title="Expand"
          >
            <ArrowsOutIcon size={16} />
          </button>
          {showActions && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1.5 text-gray-800 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
              >
                <DotsThreeIcon size={16} weight="bold" />
              </button>
              <AnimatePresence>
                {showMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.1 }}
                    className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-sm border border-gray-100 py-1 z-50"
                  >
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onConvertToDashboard();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-900 hover:bg-gray-50 transition-colors cursor-pointer text-left"
                    >
                      <GridFourIcon size={14} className="text-gray-700" />
                      Build Dashboard
                    </button>
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        handleDownload();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-900 hover:bg-gray-50 transition-colors cursor-pointer text-left"
                    >
                      <DownloadSimpleIcon size={14} className="text-gray-700" />
                      Download PDF
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Content preview - scrollable */}
      <div className="px-4 py-3 min-h-[35vh] max-h-[40vh] overflow-y-auto">
        <div className="prose prose-sm max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={cardMarkdownComponents}>
            {content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Report Modal Component
// ============================================================================

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string;
  onConvertToDashboard: () => void;
}

const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  title,
  content,
  onConvertToDashboard,
}) => {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="relative bg-white rounded-xl shadow-xl w-[90vw] max-w-3xl h-[85vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <h2 className="text-lg font-medium text-gray-900">{title}</h2>
          <div className="flex items-center gap-2">
            <PrimaryButton onClick={onConvertToDashboard}>Build Dashboard</PrimaryButton>
            <button
              onClick={() => console.log('Download PDF clicked')}
              className="p-2 text-gray-600 border border-gray-200 hover:bg-gray-50 hover:border-gray-300 rounded-lg transition-colors cursor-pointer"
              title="Download PDF"
            >
              <DownloadSimpleIcon size={16} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            >
              <XIcon size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {content}
            </ReactMarkdown>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ============================================================================
// Landing Page Component
// ============================================================================

interface LandingPageProps {
  onSendMessage: (message: string, command?: Command) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onSendMessage }) => {
  const [inputValue, setInputValue] = useState(DEEP_RESEARCH_PROMPT);
  const [activeCategory, setActiveCategory] = useState<TemplateCategory>('Popular');

  const templates = useMemo(() => {
    if (activeCategory === 'Popular') {
      return DEFAULT_TEMPLATES.filter((tpl) => tpl.isPopular === true);
    }
    return DEFAULT_TEMPLATES.filter((tpl) => tpl.category === activeCategory);
  }, [activeCategory]);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftChevron, setShowLeftChevron] = useState(false);
  const [showRightChevron, setShowRightChevron] = useState(true);

  const updateChevronVisibility = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const { scrollLeft, scrollWidth, clientWidth } = container;
    setShowLeftChevron(scrollLeft > 0);
    setShowRightChevron(scrollLeft < scrollWidth - clientWidth - 1);
  }, []);

  useLayoutEffect(() => {
    updateChevronVisibility();
  }, [templates, updateChevronVisibility]);

  const handleScroll = useCallback(() => {
    updateChevronVisibility();
  }, [updateChevronVisibility]);

  const scrollBy = useCallback((direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const scrollAmount = 804;
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  }, []);

  const handleCategoryChange = useCallback((category: TemplateCategory) => {
    setActiveCategory(category);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = 0;
    }
    setShowLeftChevron(false);
    setShowRightChevron(true);
  }, []);

  const handleTemplateClick = useCallback((template: Template) => {
    setInputValue(template.prompt);
  }, []);

  const handleSend = useCallback(
    (message: string, _attachments?: unknown, command?: Command) => {
      onSendMessage(message, command);
    },
    [onSendMessage]
  );

  return (
    <motion.div
      className="h-full w-full bg-white rounded-xl border border-gray-100 shadow-xs overflow-hidden flex flex-col items-center justify-start pt-6 px-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="pt-24" />

      {/* Von Logo */}
      <motion.div
        className="mb-6"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <svg
          width="48"
          height="48"
          viewBox="0 0 28 28"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0 8C0 3.58172 3.58172 0 8 0H20C24.4183 0 28 3.58172 28 8V20C28 24.4183 24.4183 28 20 28H8C3.58172 28 0 24.4183 0 20V8Z"
            fill="url(#paint0_radial_landing)"
          />
          <path
            d="M15.937 11.1501C17.7702 12.4452 19.151 13.9556 19.9152 15.3235C20.7057 16.7385 20.7316 17.7813 20.3233 18.3594C19.9149 18.9375 18.9234 19.2616 17.3256 18.9894C15.7809 18.7262 13.8959 17.9296 12.0627 16.6345C10.2294 15.3394 8.84791 13.8285 8.08365 12.4605C7.29337 11.0458 7.26805 10.0032 7.67638 9.42519C8.08475 8.84721 9.07582 8.52262 10.6733 8.7947C12.2181 9.05788 14.1037 9.855 15.937 11.1501Z"
            stroke="white"
            strokeWidth="1.33"
          />
          <circle cx="13.9932" cy="14" r="7.835" stroke="white" strokeWidth="1.33" />
          <defs>
            <radialGradient
              id="paint0_radial_landing"
              cx="0"
              cy="0"
              r="1"
              gradientUnits="userSpaceOnUse"
              gradientTransform="translate(21.875 1.75) rotate(120.964) scale(30.6125)"
            >
              <stop stopColor="#FFF3EB" />
              <stop offset="0.26" stopColor="#FF9042" />
              <stop offset="1" stopColor="#854FFF" />
            </radialGradient>
          </defs>
        </svg>
      </motion.div>

      {/* Greeting */}
      <motion.div
        className="text-center mb-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        <h2 className="text-3xl text-gray-800">Good afternoon, John</h2>
        <p className="text-3xl text-gray-800">How can I help you today?</p>
      </motion.div>

      {/* Chat Input - with Deep Research agent mode pre-selected */}
      <motion.div
        className="w-full max-w-3xl mb-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.4 }}
      >
        <StandardChatInputWithCommands
          placeholder="Ask Von for a deep research analysis"
          value={inputValue}
          onChange={setInputValue}
          onSend={handleSend}
        />
      </motion.div>

      {/* Templates Section */}
      <motion.div
        className="w-full max-w-3xl"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
      >
        <div className="flex flex-wrap gap-2 justify-center mb-4">
          {TEMPLATE_CATEGORIES.map((category) => {
            const isActive = category === activeCategory;
            return (
              <button
                key={category}
                onClick={() => handleCategoryChange(category)}
                className={`
                  px-3 py-1 text-xs font-medium rounded-full
                  transition-all duration-200 inline-flex items-center gap-1 cursor-pointer
                  ${
                    isActive
                      ? 'bg-gray-100/70 border border-gray-200 text-gray-900'
                      : 'bg-white border border-gray-100 text-gray-600 hover:border-gray-200'
                  }
                `}
              >
                {category}
              </button>
            );
          })}
        </div>

        <div className="relative">
          {showLeftChevron && (
            <button
              onClick={() => scrollBy('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center bg-white/90 rounded-full shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
              aria-label="Scroll left"
            >
              <CaretLeftIcon size={16} weight="bold" className="text-gray-600" />
            </button>
          )}

          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex gap-3 overflow-x-auto px-1 py-1"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {templates.map((template) => (
              <button
                key={template.id}
                onClick={() => handleTemplateClick(template)}
                className="flex-shrink-0 w-48 px-4 py-2.5 shadow-xs rounded-xl bg-white border border-gray-200 text-left transition-all flex flex-col justify-start hover:border-gray-300 hover:shadow-sm cursor-pointer"
              >
                <div className="text-sm font-medium text-gray-700 line-clamp-3">
                  {template.shortPrompt}
                </div>
              </button>
            ))}
          </div>

          {showRightChevron && templates.length > 3 && (
            <button
              onClick={() => scrollBy('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center bg-white/90 rounded-full shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
              aria-label="Scroll right"
            >
              <CaretRightIcon size={16} weight="bold" className="text-gray-600" />
            </button>
          )}
        </div>
      </motion.div>

      <div className="flex-1" />

      <motion.div
        className="w-full text-center pb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.4 }}
      >
        <p className="text-xs text-gray-500">
          Von AI may make mistakes. Please recheck all important information.
        </p>
      </motion.div>
    </motion.div>
  );
};

// ============================================================================
// Chat View with Deep Research Flow
// ============================================================================

interface DeepResearchChatViewProps {
  messages: ChatMessage[];
  phase: DeepResearchPhase;
  sampleThinkingSteps: DeepResearchThinkingStep[];
  fullThinkingSteps: DeepResearchThinkingStep[];
  sampleProgress: number;
  fullProgress: number;
  sampleTimeRemaining: string;
  fullTimeRemaining: string;
  sampleElapsedTime: number;
  fullElapsedTime: number;
  onRunFullAnalysis: () => void;
  onDeclineFull: () => void;
  onExpandReport: () => void;
  onConvertToDashboard: () => void;
  onSourcesClick?: () => void;
  onTextSelect?: (text: string) => void;
  onSkipThinking?: () => void;
  onSkipSampleThinking?: () => void;
  onDataTablesClick?: () => void;
  /** When true, disables auto-scroll to bottom on phase change */
  disableAutoScroll?: boolean;
}

const DeepResearchChatView: React.FC<DeepResearchChatViewProps> = ({
  messages,
  phase,
  sampleThinkingSteps,
  fullThinkingSteps,
  sampleProgress,
  fullProgress,
  sampleTimeRemaining,
  fullTimeRemaining,
  sampleElapsedTime,
  fullElapsedTime,
  onRunFullAnalysis,
  onDeclineFull,
  onExpandReport,
  onConvertToDashboard,
  onSourcesClick,
  onTextSelect,
  onSkipThinking,
  onSkipSampleThinking,
  onDataTablesClick,
  disableAutoScroll = false,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [selectionPopover, setSelectionPopover] = useState<{
    x: number;
    y: number;
    text: string;
  } | null>(null);

  useLayoutEffect(() => {
    // Don't auto-scroll if disabled (e.g., after skipping thinking)
    if (disableAutoScroll) return;
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, phase, disableAutoScroll]);

  // Handle text selection
  const handleMouseUp = useCallback(() => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) {
      const selectedText = selection.toString().trim();
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      // Position popover above the selection
      setSelectionPopover({
        x: rect.left + rect.width / 2,
        y: rect.top - 8,
        text: selectedText,
      });
    }
  }, []);

  // Handle Ask Von click
  const handleAskVon = useCallback(() => {
    if (selectionPopover && onTextSelect) {
      onTextSelect(selectionPopover.text);
    }
    setSelectionPopover(null);
    // Clear selection
    window.getSelection()?.removeAllRanges();
  }, [selectionPopover, onTextSelect]);

  // Close popover
  const handleClosePopover = useCallback(() => {
    setSelectionPopover(null);
  }, []);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4" onMouseUp={handleMouseUp}>
      {/* Ask Von Popover */}
      <AnimatePresence>
        {selectionPopover && (
          <AskVonPopover
            position={{ x: selectionPopover.x, y: selectionPopover.y }}
            onAskVon={handleAskVon}
            onClose={handleClosePopover}
          />
        )}
      </AnimatePresence>

      <div ref={contentRef} className="max-w-3xl mx-auto space-y-4">
        {/* User message */}
        {messages.length > 0 && messages[0].type === 'user' && (
          <div className="flex justify-end gap-2">
            <div className="max-w-[80%] bg-gray-50 rounded-2xl rounded-br-md px-3 py-2">
              <p className="text-sm text-gray-900">{messages[0].content}</p>
            </div>
            <UserAvatar initials="JD" size={28} />
          </div>
        )}

        {/* Sample thinking phase */}
        {(phase === 'sample-thinking' || phase === 'sample-complete') && (
          <div className="flex gap-2 pr-4">
            <div className="flex-shrink-0 mt-0.5">
              <VonLogo size={28} />
            </div>
            <div className="flex-1 space-y-3 min-w-0">
              {/* Thinking block - no progress bar for sample */}
              <DeepResearchThinkingBlock
                steps={sampleThinkingSteps}
                isThinking={phase === 'sample-thinking'}
                progress={sampleProgress}
                estimatedTimeRemaining={sampleTimeRemaining}
                elapsedTime={sampleElapsedTime}
                title="Thinking"
                showProgressBar={false}
              />

              {/* Skip button for demo purposes */}
              {phase === 'sample-thinking' && onSkipSampleThinking && (
                <div className="flex justify-start">
                  <button
                    onClick={onSkipSampleThinking}
                    className="text-xs text-gray-500 hover:text-gray-700 hover:underline transition-colors cursor-pointer"
                  >
                    Skip to result (demo)
                  </button>
                </div>
              )}

              {phase === 'sample-complete' && (
                <MarkdownActionCard
                  variant="analysis-request"
                  markdown={`${sampleAnalysisContent}`}
                  primaryAction={{
                    label: 'Run Full Analysis',
                    onClick: onRunFullAnalysis,
                  }}
                  secondaryAction={{
                    label: 'Skip',
                    onClick: onDeclineFull,
                  }}
                  beforeActions={
                    onDataTablesClick && (
                      <DataTablesCard tables={deepResearchTables} onClick={onDataTablesClick} />
                    )
                  }
                />
              )}
            </div>
          </div>
        )}

        {/* Full thinking phase */}
        {(phase === 'full-thinking' ||
          phase === 'report-complete' ||
          phase === 'building-dashboard' ||
          phase === 'dashboard-complete') && (
          <div className="space-y-4">
            {/* Show the complete sample response (thinking + content) */}
            <div className="flex gap-2">
              <div className="flex-shrink-0 mt-0.5">
                <VonLogo size={28} />
              </div>
              <div className="flex-1 space-y-3 min-w-0">
                {/* Sample thinking block (collapsed) */}
                <DeepResearchThinkingBlock
                  steps={sampleThinkingSteps.map((s) => ({ ...s, status: 'complete' as const }))}
                  isThinking={false}
                  progress={100}
                  estimatedTimeRemaining="0s"
                  elapsedTime={sampleElapsedTime}
                  title="Thinking"
                  showProgressBar={false}
                  defaultCollapsed={true}
                />

                {/* Sample content - inline without card styling */}
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                    {sampleAnalysisContent}
                  </ReactMarkdown>
                </div>

                {/* Confirmation prompt */}
                <div className="text-sm text-gray-700 mt-4">
                  I've generated a sample analysis based on your request. This preview shows the
                  type of insights I can provide. Would you like me to proceed with the full
                  comprehensive research and generate the complete report?
                </div>

                {/* Action icons for sample message */}
                <div className="flex items-center gap-1 pt-3">
                  <button
                    className="p-1.5 text-gray-800 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                    title="Copy"
                  >
                    <CopyIcon size={14} weight="regular" />
                  </button>
                  <button
                    className="p-1.5 text-gray-800 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                    title="Download"
                  >
                    <DownloadSimpleIcon size={14} weight="regular" />
                  </button>
                  <button
                    className="p-1.5 text-gray-800 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                    title="Good response"
                  >
                    <ThumbsUpIcon size={14} weight="regular" />
                  </button>
                  <button
                    className="p-1.5 text-gray-800 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                    title="Bad response"
                  >
                    <ThumbsDownIcon size={14} weight="regular" />
                  </button>
                  {onSourcesClick && (
                    <>
                      <div className="w-px h-4 bg-gray-200 mx-1" />
                      <button
                        onClick={onSourcesClick}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 text-[12px] text-gray-800 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                        title="View sources"
                      >
                        <FileMagnifyingGlassIcon size={14} weight="regular" />
                        <span>Sources</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* User confirmation message */}
            <div className="flex justify-end gap-2">
              <div className="max-w-[80%] bg-gray-50 rounded-2xl rounded-br-md px-3 py-2">
                <p className="text-sm text-gray-900">Yes, run full analysis</p>
              </div>
              <UserAvatar initials="JD" size={28} />
            </div>

            {/* Full research thinking with Von logo */}
            <div className="flex gap-2">
              <div className="flex-shrink-0 mt-0.5">
                <VonLogo size={28} />
              </div>
              <div className="flex-1 space-y-3 min-w-0">
                <DeepResearchThinkingBlock
                  steps={fullThinkingSteps}
                  isThinking={phase === 'full-thinking'}
                  progress={fullProgress}
                  estimatedTimeRemaining={fullTimeRemaining}
                  elapsedTime={fullElapsedTime}
                  title="Thinking"
                  showProgressBar={true}
                />

                {/* Skip button for demo purposes */}
                {phase === 'full-thinking' && onSkipThinking && (
                  <div className="flex justify-start">
                    <button
                      onClick={onSkipThinking}
                      className="text-xs text-gray-500 hover:text-gray-700 hover:underline transition-colors cursor-pointer"
                    >
                      Skip to result (demo)
                    </button>
                  </div>
                )}

                {/* Report complete */}
                {(phase === 'report-complete' ||
                  phase === 'building-dashboard' ||
                  phase === 'dashboard-complete') && (
                  <>
                    <div className="text-sm text-gray-700">
                      I have completed the comprehensive analysis. I found strong Q4 performance
                      with $12.8M in revenue (+15.2% YoY), significant regional disparities favoring
                      the West, and a concerning 8% decline in mid-market. Click on the card to see
                      the full details.
                    </div>

                    <ReportCard
                      title="Q4 2025 Sales Performance Analysis"
                      content={fullReportContent}
                      onExpand={onExpandReport}
                      onConvertToDashboard={onConvertToDashboard}
                      showActions={phase === 'report-complete'}
                    />

                    {/* Feedback row */}
                    <div className="flex items-center gap-1 pt-1">
                      <button
                        className="p-1.5 text-gray-800 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                        title="Copy"
                      >
                        <CopyIcon size={14} weight="regular" />
                      </button>
                      <button
                        className="p-1.5 text-gray-800 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                        title="Download"
                      >
                        <DownloadSimpleIcon size={14} weight="regular" />
                      </button>
                      <button
                        className="p-1.5 text-gray-800 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                        title="Good response"
                      >
                        <ThumbsUpIcon size={14} weight="regular" />
                      </button>
                      <button
                        className="p-1.5 text-gray-800 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                        title="Bad response"
                      >
                        <ThumbsDownIcon size={14} weight="regular" />
                      </button>
                      {onSourcesClick && (
                        <>
                          <div className="w-px h-4 bg-gray-200 mx-1" />
                          <button
                            onClick={onSourcesClick}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 text-[12px] text-gray-800 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                            title="View sources"
                          >
                            <FileMagnifyingGlassIcon size={14} weight="regular" />
                            <span>Sources</span>
                          </button>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

// ============================================================================
// Main Story Component
// ============================================================================

const DeepResearchDemo = () => {
  // Phase state
  const [phase, setPhase] = useState<DeepResearchPhase>('landing');

  // Sidebar state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [selectedSidebarItem, setSelectedSidebarItem] = useState<string>('');
  const [folders, setFolders] = useState<Folder[]>(dummyFolders);
  // Track item overrides (folderId, label changes, deletions) for interactive demo
  const [itemOverrides, setItemOverrides] = useState<
    Record<string, { folderId?: string | null; label?: string; deleted?: boolean }>
  >({});

  // Thinking state
  const [sampleSteps, setSampleSteps] = useState<DeepResearchThinkingStep[]>([]);
  const [fullSteps, setFullSteps] = useState<DeepResearchThinkingStep[]>([]);
  const [sampleProgress, setSampleProgress] = useState(0);
  const [fullProgress, setFullProgress] = useState(0);
  const [sampleTimeRemaining, setSampleTimeRemaining] = useState('~15s');
  const [fullTimeRemaining, setFullTimeRemaining] = useState('~1min');
  const [sampleElapsedTime, setSampleElapsedTime] = useState(0);
  const [fullElapsedTime, setFullElapsedTime] = useState(0);

  // Modal state
  const [showReportModal, setShowReportModal] = useState(false);
  const [showExpensiveOperationModal, setShowExpensiveOperationModal] = useState(false);

  // Flag to disable auto-scroll after skipping
  const [disableAutoScroll, setDisableAutoScroll] = useState(false);

  // Chat messages
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [initialUserMessage, setInitialUserMessage] = useState(DEEP_RESEARCH_PROMPT);
  const [initialUserCommand, setInitialUserCommand] = useState<Command | null>(null);

  // Chat pane state
  const [isChatPaneCollapsed, setIsChatPaneCollapsed] = useState(true);
  const [chatPaneWidth, setChatPaneWidth] = useState(456); // Increased by 20% from 380
  const chatPaneResizeRef = useRef<HTMLDivElement>(null);
  const isResizingChatPane = useRef(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  // Dashboard build state
  const [visibleWidgets, setVisibleWidgets] = useState<string[]>([]);
  const [agentStatus, setAgentStatus] = useState<AgentStatus>('idle');
  const [agentMessage, setAgentMessage] = useState('');
  const [agentProgress, setAgentProgress] = useState(0);
  const [ambientGlowActive, setAmbientGlowActive] = useState(false);
  const [dashboardName, setDashboardName] = useState('Q4 Sales Performance Dashboard');

  // Drilldown state
  const [drilldownWidget, setDrilldownWidget] = useState<string | null>(null);

  // Toast state
  const [showToast, setShowToast] = useState(false);

  // Dashboard action popovers state
  const [showSharePopover, setShowSharePopover] = useState(false);
  const [sharePopoverPosition, setSharePopoverPosition] = useState<{ top: number; right: number }>({
    top: 60,
    right: 20,
  });

  // New filter state for dashboard
  const [timelineFilter, setTimelineFilter] = useState<TimelineFilter>('this-quarter');
  const [ownerFilter, setOwnerFilter] = useState<string>('all');
  const [advancedFilters, setAdvancedFilters] = useState<DashboardFilter[]>([]);

  // Widget Edit Sheet state
  const [showWidgetEditSheet, setShowWidgetEditSheet] = useState(false);
  const [editingWidgetId, setEditingWidgetId] = useState<string | null>(null);
  const [editingWidgetConfig, setEditingWidgetConfig] = useState<
    Partial<WidgetEditConfigData> | undefined
  >(undefined);

  // Transparency Drawer state
  const [showTransparencyDrawer, setShowTransparencyDrawer] = useState(false);

  // Data Tables Drawer state
  const [showDataTablesDrawer, setShowDataTablesDrawer] = useState(false);

  // Reference context state
  const [referenceContext, setReferenceContext] = useState<ReferenceContext>({
    type: 'dashboard',
    name: 'Q4 Sales Performance Dashboard',
    id: 'dashboard-q4-performance',
  });

  // Quote reference for chat input (Ask Von feature)
  const [quoteReference, setQuoteReference] = useState<InputReferenceContext | null>(null);

  // Handle text selection for Ask Von
  const handleTextSelect = useCallback((selectedText: string) => {
    setQuoteReference({
      type: 'quote',
      name: 'Selected text',
      id: `quote-${Date.now()}`,
      content: selectedText,
    });
  }, []);

  // Handle removing quote reference
  const handleRemoveQuoteReference = useCallback(() => {
    setQuoteReference(null);
  }, []);

  // Compute sidebar items with deep research status
  const sidebarItems = useMemo((): SidebarItem[] => {
    // Determine the status of the deep research item
    const getDeepResearchStatus = (): ItemStatus | undefined => {
      if (phase === 'full-thinking') return 'running';
      if (
        phase === 'report-complete' ||
        phase === 'building-dashboard' ||
        phase === 'dashboard-complete'
      )
        return 'complete';
      return undefined;
    };

    const deepResearchStatus = getDeepResearchStatus();

    let baseItems: SidebarItem[];
    // Only show deep research item in sidebar once we're past landing/sample phases
    if (phase !== 'landing' && phase !== 'sample-thinking' && phase !== 'sample-complete') {
      baseItems = [
        {
          id: 'deep-research-current',
          label: 'Q4 Sales Performance Analysis',
          type: 'chat' as const,
          status: deepResearchStatus,
        },
        ...dummySidebarItems,
      ];
    } else {
      baseItems = dummySidebarItems;
    }

    // Apply overrides (folderId, label, deletions)
    return baseItems
      .map((item) => {
        const override = itemOverrides[item.id];
        if (!override) return item;
        if (override.deleted) return null;
        return {
          ...item,
          ...(override.folderId !== undefined ? { folderId: override.folderId } : {}),
          ...(override.label !== undefined ? { label: override.label } : {}),
        };
      })
      .filter((item): item is SidebarItem => item !== null);
  }, [phase, itemOverrides]);

  // Timeout refs
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);
  // Interval refs for elapsed time
  const sampleElapsedIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const fullElapsedIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const clearAllTimeouts = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    // Also clear elapsed time intervals
    if (sampleElapsedIntervalRef.current) {
      clearInterval(sampleElapsedIntervalRef.current);
      sampleElapsedIntervalRef.current = null;
    }
    if (fullElapsedIntervalRef.current) {
      clearInterval(fullElapsedIntervalRef.current);
      fullElapsedIntervalRef.current = null;
    }
  }, []);

  const addTimeout = useCallback((callback: () => void, delay: number) => {
    const timeout = setTimeout(callback, delay);
    timeoutsRef.current.push(timeout);
    return timeout;
  }, []);

  // Handle landing page message
  const handleLandingMessage = (content: string, command?: Command) => {
    const displayContent = getCommandDisplayMessage(content, command);
    setInitialUserMessage(displayContent);
    setInitialUserCommand(command || null);
    setPhase('sample-thinking');
    setChatMessages([{ id: 'msg-1', type: 'user', content: displayContent }]);
    setSampleElapsedTime(0);

    // Initialize sample thinking steps
    setSampleSteps(sampleThinkingSteps.map((s) => ({ ...s, status: 'pending' as const })));

    // Start elapsed time counter
    sampleElapsedIntervalRef.current = setInterval(() => {
      setSampleElapsedTime((prev) => prev + 1);
    }, 1000);

    // Simulate sample thinking
    let time = 0;
    sampleThinkingSteps.forEach((step, idx) => {
      addTimeout(
        () => {
          setSampleSteps((prev) =>
            prev.map((s, i) => ({
              ...s,
              status: i === idx ? 'in-progress' : i < idx ? 'complete' : 'pending',
            }))
          );
          setSampleProgress(((idx + 0.5) / sampleThinkingSteps.length) * 100);
          setSampleTimeRemaining(
            `~${Math.max(1, Math.round((sampleThinkingSteps.length - idx) * 3))}s`
          );
        },
        (time += 800)
      );

      addTimeout(
        () => {
          setSampleSteps((prev) =>
            prev.map((s, i) => ({
              ...s,
              status: i <= idx ? 'complete' : 'pending',
            }))
          );
          setSampleProgress(((idx + 1) / sampleThinkingSteps.length) * 100);
        },
        (time += 600)
      );
    });

    // Show sample complete
    addTimeout(() => {
      setPhase('sample-complete');
      if (sampleElapsedIntervalRef.current) {
        clearInterval(sampleElapsedIntervalRef.current);
        sampleElapsedIntervalRef.current = null;
      }
    }, time + 300);
  };

  // Handle run full analysis - shows confirmation modal first
  const handleRunFullAnalysis = useCallback(() => {
    setShowExpensiveOperationModal(true);
  }, []);

  // Actually start the full analysis (called after modal confirmation)
  const startFullAnalysis = useCallback(() => {
    setShowExpensiveOperationModal(false);
    setPhase('full-thinking');
    setFullElapsedTime(0);

    // Initialize full thinking steps
    setFullSteps(fullResearchThinkingSteps.map((s) => ({ ...s, status: 'pending' as const })));

    // Start elapsed time counter
    fullElapsedIntervalRef.current = setInterval(() => {
      setFullElapsedTime((prev) => prev + 1);
    }, 1000);

    // Simulate full research thinking - approximately 30 seconds total
    // 14 steps, so each step takes about 2.1 seconds
    const stepDuration = 2100; // ms per step
    let time = 0;

    fullResearchThinkingSteps.forEach((step, idx) => {
      // Start the step (in-progress)
      addTimeout(
        () => {
          setFullSteps((prev) =>
            prev.map((s, i) => ({
              ...s,
              status: i === idx ? 'in-progress' : i < idx ? 'complete' : 'pending',
            }))
          );
          setFullProgress(((idx + 0.5) / fullResearchThinkingSteps.length) * 100);
          // Calculate remaining time in seconds
          const remainingSteps = fullResearchThinkingSteps.length - idx;
          const remainingSeconds = Math.round((remainingSteps * stepDuration) / 1000);
          setFullTimeRemaining(
            remainingSeconds > 60
              ? `~${Math.round(remainingSeconds / 60)}min`
              : `~${remainingSeconds}s`
          );
        },
        (time += stepDuration * 0.3) // 30% of step for starting
      );

      // Complete the step
      addTimeout(
        () => {
          setFullSteps((prev) =>
            prev.map((s, i) => ({
              ...s,
              status: i <= idx ? 'complete' : 'pending',
            }))
          );
          setFullProgress(((idx + 1) / fullResearchThinkingSteps.length) * 100);
        },
        (time += stepDuration * 0.7) // 70% of step for completing
      );
    });

    // Show report complete
    addTimeout(() => {
      setPhase('report-complete');
      if (fullElapsedIntervalRef.current) {
        clearInterval(fullElapsedIntervalRef.current);
        fullElapsedIntervalRef.current = null;
      }
    }, time + 500);
  }, [addTimeout]);

  // Handle decline full analysis
  const handleDeclineFull = useCallback(() => {
    // Could reset to landing or keep sample - for now keep sample
    console.log('User declined full analysis');
  }, []);

  // Handle skip thinking (demo purposes)
  const handleSkipThinking = useCallback(() => {
    clearAllTimeouts();
    // Disable auto-scroll when skipping
    setDisableAutoScroll(true);
    // Mark all steps as complete
    setFullSteps((prev) => prev.map((s) => ({ ...s, status: 'complete' as const })));
    setFullProgress(100);
    setPhase('report-complete');
  }, [clearAllTimeouts]);

  // Handle skip sample thinking (demo purposes)
  const handleSkipSampleThinking = useCallback(() => {
    clearAllTimeouts();
    // Disable auto-scroll when skipping
    setDisableAutoScroll(true);
    // Mark all sample steps as complete
    setSampleSteps((prev) => prev.map((s) => ({ ...s, status: 'complete' as const })));
    setSampleProgress(100);
    setPhase('sample-complete');
  }, [clearAllTimeouts]);

  // Handle expand report
  const handleExpandReport = useCallback(() => {
    setShowReportModal(true);
  }, []);

  // Handle convert to dashboard
  const handleConvertToDashboard = useCallback(() => {
    setShowReportModal(false);
    setPhase('building-dashboard');
    setAmbientGlowActive(true);
    setAgentStatus('working');
    setAgentMessage('Building your dashboard...');
    setAgentProgress(0);
    setVisibleWidgets([]);
    setIsChatPaneCollapsed(false);

    // Create full conversation history for the chat pane
    // This shows the complete DeepResearch flow: user request → sample → full analysis → dashboard
    const sampleThinkingStepsForChat: ThinkingStep[] = sampleThinkingSteps.map((step) => ({
      id: step.id,
      text: step.text,
      status: 'complete' as const,
      subtitle: step.subtitle,
      icon: step.icon,
    }));

    const fullThinkingStepsForChat: ThinkingStep[] = fullResearchThinkingSteps.map((step) => ({
      id: step.id,
      text: step.text,
      status: 'complete' as const,
      subtitle: step.subtitle,
      icon: step.icon,
    }));

    const fullConversation: ChatMessage[] = [
      // 1. User's initial research request
      {
        id: 'msg-1-user-request',
        type: 'user',
        content: initialUserMessage,
        command: initialUserCommand || undefined,
      },
      // 2. Sample analysis with thinking steps (collapsed)
      {
        id: 'msg-2-sample-thinking',
        type: 'assistant',
        content: '',
        thinkingSteps: sampleThinkingStepsForChat,
        thinkingElapsedTime: sampleElapsedTime,
      },
      // 3. Sample preview output
      {
        id: 'msg-3-sample-preview',
        type: 'assistant',
        content: sampleAnalysisContent,
      },
      // 4. User confirms to run full analysis
      {
        id: 'msg-4-user-confirm',
        type: 'user',
        content: 'Run Full Analysis',
      },
      // 5. Full thinking process (collapsed)
      {
        id: 'msg-5-full-thinking',
        type: 'assistant',
        content: '',
        thinkingSteps: fullThinkingStepsForChat,
        thinkingElapsedTime: fullElapsedTime,
      },
      // 6. Full report complete message with artifact
      {
        id: 'msg-6-report-complete',
        type: 'assistant',
        content:
          "I've completed the comprehensive Q4 Sales Performance Analysis. The report includes detailed breakdowns by region, product category, sales team performance, and strategic recommendations.",
        artifact: {
          type: 'dashboard',
          title: 'Q4 2025 Sales Performance Analysis',
          description:
            'Comprehensive research report with 10 sections covering all aspects of Q4 performance',
          items: [
            { label: 'Total Revenue', value: '$12.8M' },
            { label: 'Deals Analyzed', value: '847' },
            { label: 'Regions Covered', value: '4' },
          ],
        },
      },
      // 7. User requests dashboard
      {
        id: 'msg-7-user-dashboard',
        type: 'user',
        content: 'Build Dashboard',
      },
      // 8. Building dashboard message
      {
        id: 'msg-8-building-dashboard',
        type: 'assistant',
        content: 'Converting the report into an interactive dashboard...',
      },
    ];

    setChatMessages(fullConversation);

    let time = 0;
    const allWidgetIds = [
      ...kpiCards.map((k) => k.id),
      barChart.id,
      pieChart.id,
      tableData.id,
      textWidgetData.id,
    ];

    // Build widgets one by one
    allWidgetIds.forEach((widgetId, idx) => {
      addTimeout(
        () => {
          setAgentMessage(`Adding widget ${idx + 1} of ${allWidgetIds.length}...`);
          setAgentProgress(((idx + 1) / allWidgetIds.length) * 100);
          setVisibleWidgets((prev) => [...prev, widgetId]);
        },
        (time += 600)
      );
    });

    // Complete
    addTimeout(() => {
      setPhase('dashboard-complete');
      setAgentStatus('complete');
      setAgentMessage('Dashboard created');
      setAgentProgress(100);
      setShowToast(true);

      // Add completion message with dynamically computed KPI values
      const computedKPIs = generatedDashboardData.computedKPIs;
      const formatCurrency = (value: number): string => {
        if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
        if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
        return `$${value.toFixed(0)}`;
      };

      setChatMessages((prev) => [
        ...prev,
        {
          id: `msg-dashboard-complete-${Date.now()}`,
          type: 'assistant',
          content:
            "I've created your Q4 Sales Performance Dashboard based on the comprehensive research report.",
          artifact: {
            type: 'dashboard',
            title: 'Q4 Sales Performance Dashboard',
            description: `Interactive dashboard with ${kpiCards.length} KPIs, 2 charts, and detailed performance tables`,
            items: [
              { label: 'Total Revenue (Won)', value: formatCurrency(computedKPIs.totalRevenue) },
              { label: 'Deals Won', value: computedKPIs.dealsWon.toString() },
              { label: 'Win Rate', value: `${computedKPIs.winRate.toFixed(1)}%` },
            ],
          },
        },
      ]);
    }, time + 400);

    // Fade out glow
    addTimeout(() => {
      setAmbientGlowActive(false);
    }, time + 1500);

    // Hide progress bar
    addTimeout(() => {
      setAgentStatus('idle');
    }, time + 2500);
  }, [addTimeout, sampleElapsedTime, fullElapsedTime, initialUserMessage, initialUserCommand]);

  // Reset to landing
  const handleReset = useCallback(() => {
    clearAllTimeouts();
    setPhase('landing');
    setSampleSteps([]);
    setFullSteps([]);
    setSampleProgress(0);
    setFullProgress(0);
    setVisibleWidgets([]);
    setAgentStatus('idle');
    setAgentMessage('');
    setAgentProgress(0);
    setAmbientGlowActive(false);
    setShowToast(false);
    setIsChatPaneCollapsed(true);
    setChatMessages([]);
    setInitialUserMessage(DEEP_RESEARCH_PROMPT);
    setInitialUserCommand(null);
  }, [clearAllTimeouts]);

  // Handle sidebar item click
  const handleSidebarItemClick: (id: string, type: ItemType) => void = (id) => {
    setSelectedSidebarItem(id);
  };

  // Handle chat pane resize
  const handleChatPaneResizeStart = useCallback(
    (e: React.MouseEvent) => {
      isResizingChatPane.current = true;
      startXRef.current = e.clientX;
      startWidthRef.current = chatPaneWidth;
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
    },
    [chatPaneWidth]
  );

  const handleChatPaneResizeMove = useCallback((e: MouseEvent) => {
    if (!isResizingChatPane.current) return;
    const deltaX = startXRef.current - e.clientX;
    const newWidth = Math.min(600, Math.max(280, startWidthRef.current + deltaX));
    setChatPaneWidth(newWidth);
  }, []);

  const handleChatPaneResizeEnd = useCallback(() => {
    isResizingChatPane.current = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  useLayoutEffect(() => {
    document.addEventListener('mousemove', handleChatPaneResizeMove);
    document.addEventListener('mouseup', handleChatPaneResizeEnd);
    return () => {
      document.removeEventListener('mousemove', handleChatPaneResizeMove);
      document.removeEventListener('mouseup', handleChatPaneResizeEnd);
    };
  }, [handleChatPaneResizeMove, handleChatPaneResizeEnd]);

  // Handle widget drilldown
  const handleWidgetDrillDown = (widgetId: string) => {
    setDrilldownWidget(widgetId);
    let widgetName = '';
    if (widgetId.startsWith('kpi-')) {
      widgetName = kpiCards.find((k) => k.id === widgetId)?.title || 'KPI';
    } else if (widgetId === barChart.id) {
      widgetName = barChart.title;
    } else if (widgetId === pieChart.id) {
      widgetName = pieChart.title;
    } else if (widgetId === tableData.id) {
      widgetName = tableData.title;
    }
    setReferenceContext({
      type: 'widget',
      name: widgetName,
      id: widgetId,
    });
  };

  // Handle closing drilldown
  const handleCloseDrilldown = () => {
    setDrilldownWidget(null);
    setReferenceContext({
      type: 'dashboard',
      name: 'Q4 Sales Performance Dashboard',
      id: 'dashboard-q4-performance',
    });
  };

  // Handle widget edit
  const handleWidgetEdit = (widgetId: string) => {
    setEditingWidgetId(widgetId);
    setShowWidgetEditSheet(true);
  };

  // Handle widget edit sheet save
  const handleWidgetEditSheetSave = (config: WidgetEditConfigData) => {
    console.log('Widget edit sheet saved:', config);
    setShowWidgetEditSheet(false);
    setEditingWidgetId(null);
    setEditingWidgetConfig(undefined);
  };

  // Handle share
  const handleShare = (config: ShareConfig) => {
    console.log('Sharing dashboard with config:', config);
    alert(`Dashboard shared with ${config.recipients.length} recipient(s)!`);
  };

  // Determine what to show
  const showLandingPage = phase === 'landing';
  const showConversation =
    phase !== 'landing' && phase !== 'building-dashboard' && phase !== 'dashboard-complete';
  const showDashboard = phase === 'building-dashboard' || phase === 'dashboard-complete';
  const showAgentBar = phase === 'building-dashboard' || agentStatus === 'complete';

  // Get drilldown data
  const getDrilldownData = () => {
    if (!drilldownWidget) return null;
    const columns: DrilldownColumn[] = tableData.columns;
    const rows = tableData.rows;
    return { columns, rows };
  };

  const drilldownData = getDrilldownData();

  return (
    <div className="flex h-full w-full gap-1 relative">
      {/* Ambient Glow */}
      <AmbientGlow isActive={ambientGlowActive} intensity={0.4} animationSpeed={3} />

      {/* Agent Progress Bar */}
      <AgentProgressBar
        isVisible={showAgentBar}
        status={agentStatus}
        message={agentMessage}
        progress={agentProgress}
      />

      {/* Toast */}
      <AnimatePresence>
        {showToast && (
          <SuccessToast message="Dashboard created" onDismiss={() => setShowToast(false)} />
        )}
      </AnimatePresence>

      {/* Report Modal */}
      <AnimatePresence>
        {showReportModal && (
          <ReportModal
            isOpen={showReportModal}
            onClose={() => setShowReportModal(false)}
            title="Q4 2025 Sales Performance Analysis"
            content={fullReportContent}
            onConvertToDashboard={handleConvertToDashboard}
          />
        )}
      </AnimatePresence>

      {/* ChatSidebarV4 */}
      <div
        style={{
          height: showAgentBar ? 'calc(100% - 48px)' : '100%',
          marginTop: showAgentBar ? '48px' : '0',
          width: isSidebarCollapsed ? '50px' : '240px',
          transition: 'width 0.3s ease, height 0.3s ease, margin-top 0.3s ease',
          borderRadius: '8px',
          overflow: 'hidden',
          backgroundColor: '#ffffff',
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
          border: '1px solid #e5e7eb',
          flexShrink: 0,
        }}
      >
        <ChatSidebarV4
          items={sidebarItems}
          folders={folders}
          selectedItemId={selectedSidebarItem}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          onItemClick={handleSidebarItemClick}
          onNewChatClick={handleReset}
          onNewChatFolderClick={(folderName) => {
            setFolders([
              ...folders,
              { id: `folder-${Date.now()}`, label: folderName, isExpanded: false },
            ]);
          }}
          onFolderToggle={(folderId, isExpanded) => {
            setFolders(folders.map((f) => (f.id === folderId ? { ...f, isExpanded } : f)));
          }}
          onDeleteFolder={(folderId) => {
            setFolders(folders.filter((f) => f.id !== folderId));
          }}
          onRenameFolder={(folderId, newName) => {
            setFolders(folders.map((f) => (f.id === folderId ? { ...f, label: newName } : f)));
          }}
          onPinFolder={(folderId, isPinned) => {
            setFolders(folders.map((f) => (f.id === folderId ? { ...f, isPinned } : f)));
          }}
          onRenameItem={(id, _type, newName) => {
            setItemOverrides((prev) => ({ ...prev, [id]: { ...prev[id], label: newName } }));
          }}
          onDeleteItem={(id) => {
            setItemOverrides((prev) => ({ ...prev, [id]: { ...prev[id], deleted: true } }));
          }}
          onMoveItemToFolder={(itemId, _itemType, folderId) => {
            setItemOverrides((prev) => ({ ...prev, [itemId]: { ...prev[itemId], folderId } }));
          }}
          onCreateFolderAndMoveItem={(itemId, _itemType, newFolderName) => {
            const newFolderId = `folder-${Date.now()}`;
            setFolders((prev) => [
              ...prev,
              { id: newFolderId, label: newFolderName, isExpanded: true },
            ]);
            setItemOverrides((prev) => ({
              ...prev,
              [itemId]: { ...prev[itemId], folderId: newFolderId },
            }));
          }}
          onRemoveItemFromFolder={(itemId) => {
            setItemOverrides((prev) => ({
              ...prev,
              [itemId]: { ...prev[itemId], folderId: null },
            }));
          }}
          userName="John Doe"
          userEmail="john@example.com"
          avatarLabel="JD"
          hasNextPage={false}
        />
      </div>

      {/* Main Content */}
      <div
        style={{
          height: showAgentBar ? 'calc(100% - 48px)' : '100%',
          marginTop: showAgentBar ? '48px' : '0',
          flex: 1,
          minWidth: 0,
          transition: 'height 0.3s ease, margin-top 0.3s ease',
        }}
      >
        {/* Landing Page */}
        {showLandingPage && <LandingPage onSendMessage={handleLandingMessage} />}

        {/* Conversation View */}
        {showConversation && (
          <div className="h-full w-full bg-white rounded-xl border border-gray-100 shadow-xs overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0">
              <h2 className="text-sm font-medium text-gray-900">Deep Research Analysis</h2>
            </div>

            {/* Chat content */}
            <DeepResearchChatView
              messages={chatMessages}
              phase={phase}
              sampleThinkingSteps={sampleSteps}
              fullThinkingSteps={fullSteps}
              sampleProgress={sampleProgress}
              fullProgress={fullProgress}
              sampleTimeRemaining={sampleTimeRemaining}
              fullTimeRemaining={fullTimeRemaining}
              sampleElapsedTime={sampleElapsedTime}
              fullElapsedTime={fullElapsedTime}
              onRunFullAnalysis={handleRunFullAnalysis}
              onDeclineFull={handleDeclineFull}
              onExpandReport={handleExpandReport}
              onConvertToDashboard={handleConvertToDashboard}
              onSourcesClick={() => setShowTransparencyDrawer(true)}
              onTextSelect={handleTextSelect}
              onSkipThinking={handleSkipThinking}
              onSkipSampleThinking={handleSkipSampleThinking}
              onDataTablesClick={() => setShowDataTablesDrawer(true)}
              disableAutoScroll={disableAutoScroll}
            />

            {/* Input area */}
            <div className="px-8 py-3">
              <div className="max-w-3xl mx-auto">
                {/* Deep Research notification bar - shown during long-running research */}
                <DeepResearchNotificationBar isVisible={phase === 'full-thinking'} />
              </div>

              <StandardChatInputWithCommands
                placeholder="Ask a follow-up question"
                isStreaming={phase === 'sample-thinking' || phase === 'full-thinking'}
                onStop={() => {
                  // In a real app, this would cancel the request
                  console.log('Stop generation clicked');
                }}
                agentMode="deep-research"
                referenceContext={quoteReference || undefined}
                onRemoveReference={handleRemoveQuoteReference}
              />
            </div>

            {/* Transparency Drawer for conversation view */}
            <TransparencyDrawer
              isOpen={showTransparencyDrawer}
              onClose={() => setShowTransparencyDrawer(false)}
              queries={mockQueries}
              calls={mockCalls}
              deepResearchTables={deepResearchTablesForDrawer}
              title="Sources"
            />

            {/* Data Tables Drawer for raw data reference */}
            <DataTablesDrawer
              isOpen={showDataTablesDrawer}
              onClose={() => setShowDataTablesDrawer(false)}
              tables={deepResearchTables}
              title="Data Reference"
            />
          </div>
        )}

        {/* Dashboard */}
        {showDashboard && (
          <div className="relative h-full w-full overflow-hidden rounded-xl">
            <DashboardV2
              name={dashboardName}
              onNameChange={setDashboardName}
              kpiCards={kpiCards}
              barChart={barChart}
              pieChart={pieChart}
              table={tableData}
              textWidget={textWidgetData}
              onTextWidgetChange={(content) => console.log('Text widget updated:', content)}
              isBuilding={phase === 'building-dashboard'}
              visibleWidgets={visibleWidgets}
              onWidgetDrillDown={handleWidgetDrillDown}
              onWidgetEdit={handleWidgetEdit}
              onWidgetDelete={(widgetId) => console.log('Delete widget:', widgetId)}
              onExportClick={() => console.log('Export')}
              onRefreshClick={() => console.log('Refresh')}
              onShareClick={(rect) => {
                setSharePopoverPosition({
                  top: rect.bottom + 8,
                  right: window.innerWidth - rect.right,
                });
                setShowSharePopover(true);
              }}
              timestamp="Jan 15, 2026 at 3:30 PM"
              createdBy="John Doe"
              onCancelClick={handleReset}
              timelineFilter={timelineFilter}
              onTimelineFilterChange={setTimelineFilter}
              ownerFilter={ownerFilter}
              onOwnerFilterChange={setOwnerFilter}
              ownerOptions={ownerOptions}
              advancedFilters={advancedFilters}
              onAdvancedFiltersChange={setAdvancedFilters}
              availableFilterFields={availableFilterFields}
              onChartSegmentClick={(widgetId, segmentData) =>
                console.log('Chart segment clicked:', widgetId, segmentData)
              }
              onWidgetClick={(widgetId) => console.log('Widget clicked:', widgetId)}
            />

            {/* Inline Drilldown Panel */}
            <AnimatePresence>
              {drilldownWidget && drilldownData && (
                <InlineDrilldownPanel
                  isOpen={!!drilldownWidget}
                  onClose={handleCloseDrilldown}
                  widgetName={
                    kpiCards.find((k) => k.id === drilldownWidget)?.title ||
                    (barChart.id === drilldownWidget
                      ? barChart.title
                      : pieChart.id === drilldownWidget
                        ? pieChart.title
                        : tableData.id === drilldownWidget
                          ? tableData.title
                          : 'Widget')
                  }
                  columns={drilldownData.columns}
                  rows={drilldownData.rows}
                  filters={drilldownFilters}
                  formula={drilldownFormula}
                  onFiltersChange={(filters) => console.log('Filters changed:', filters)}
                  onFormulaChange={(formula) => console.log('Formula changed:', formula)}
                  availableFields={tableData.columns.map((c) => c.label)}
                  defaultFilterGroups={[
                    {
                      id: 'drilldown-filter-1',
                      conditions: [
                        {
                          id: 'cond-1',
                          field: 'revenue',
                          operator: 'greater_than',
                          value: '500000',
                        },
                      ],
                      connector: 'and',
                    },
                  ]}
                />
              )}
            </AnimatePresence>

            {/* Widget Edit Sheet */}
            <WidgetEditSheet
              isOpen={showWidgetEditSheet}
              onClose={() => {
                setShowWidgetEditSheet(false);
                setEditingWidgetId(null);
                setEditingWidgetConfig(undefined);
              }}
              onSave={handleWidgetEditSheetSave}
              existingConfig={editingWidgetConfig}
              widgetId={editingWidgetId || undefined}
              mode="edit"
              availableFilterFields={availableFilterFields}
            />

            {/* Transparency Drawer */}
            <TransparencyDrawer
              isOpen={showTransparencyDrawer}
              onClose={() => setShowTransparencyDrawer(false)}
              queries={mockQueries}
              calls={mockCalls}
              deepResearchTables={deepResearchTablesForDrawer}
              title="Sources"
            />
          </div>
        )}
      </div>

      {/* ChatPaneV2 - Only in dashboard view */}
      {showDashboard && (
        <div
          style={{
            height: showAgentBar ? 'calc(100% - 48px)' : '100%',
            marginTop: showAgentBar ? '48px' : '0',
            width: isChatPaneCollapsed ? '48px' : `${chatPaneWidth}px`,
            transition: isResizingChatPane.current
              ? 'none'
              : 'width 0.3s ease, height 0.3s ease, margin-top 0.3s ease',
            flexShrink: 0,
            position: 'relative',
          }}
        >
          {/* Resize Handle */}
          {!isChatPaneCollapsed && (
            <div
              ref={chatPaneResizeRef}
              onMouseDown={handleChatPaneResizeStart}
              className="absolute left-0 top-0 bottom-0 w-1.5 cursor-ew-resize hover:bg-indigo-500/30 transition-colors z-10 group"
              style={{ marginLeft: '-3px' }}
            >
              <div className="absolute inset-y-0 left-1/2 w-0.5 bg-transparent group-hover:bg-indigo-400 transition-colors" />
            </div>
          )}
          <ChatPaneV2
            conversationName="Deep Research Analysis"
            messages={chatMessages}
            isCollapsed={isChatPaneCollapsed}
            onToggleCollapse={() => setIsChatPaneCollapsed(!isChatPaneCollapsed)}
            placeholder="Ask about this dashboard..."
            referenceContext={referenceContext}
            onSourcesClick={() => setShowTransparencyDrawer(true)}
            onArtifactClick={(messageId) => {
              // Open report modal when clicking on the report artifact (msg-6-report-complete)
              if (messageId === 'msg-6-report-complete') {
                setShowReportModal(true);
              }
            }}
          />
        </div>
      )}

      {/* Dashboard Share Popover */}
      <DashboardSharePopover
        isOpen={showSharePopover}
        position={sharePopoverPosition}
        currentConfig={{
          recipients: [],
          accessLevel: 'restricted',
        }}
        onShare={handleShare}
        onClose={() => setShowSharePopover(false)}
      />

      {/* Expensive Operation Modal - shown before running full analysis */}
      <ExpensiveOperationModal
        isOpen={showExpensiveOperationModal}
        recordCount={2847}
        estimatedTime="10-15 minutes"
        operationName="Run Full Analysis"
        onConfirm={startFullAnalysis}
        onCancel={() => setShowExpensiveOperationModal(false)}
      />
    </div>
  );
};

// ============================================================================
// Story Configuration
// ============================================================================

const meta = {
  title: 'Prototypes/Deep Research',
  component: DeepResearchDemo,
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'neutral',
      values: [{ name: 'neutral', value: '#f5f5f7' }],
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof DeepResearchDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * # Deep Research - Interactive Prototype
 *
 * A demonstration of the Deep Research capability for long-running analytical tasks.
 *
 * ## Flow
 *
 * 1. **Landing Page** - Pre-filled with a complex research query, Deep Research mode indicator
 * 2. **Sample Generation** - Quick thinking process generates a preview of the analysis
 * 3. **User Confirmation** - User chooses to run full analysis or accept sample
 * 4. **Full Analysis** - Extended thinking with scrollable steps, progress bar, and time estimate
 * 5. **Report Complete** - Comprehensive report shown as expandable card
 * 6. **Report Modal** - Full-screen modal with complete markdown report
 * 7. **Convert to Dashboard** - Transforms report into interactive dashboard
 *
 * ## Features
 *
 * - **Progressive Disclosure** - Sample first, then full analysis
 * - **User Confirmation** - Explicit approval before long-running task
 * - **Scrollable Thinking** - Shows only 2 steps at a time during processing
 * - **Progress Bar** - Visual progress with percentage and time estimate
 * - **Expandable Report Card** - Click to view full report in modal
 * - **Three-Dot Menu** - Convert to Dashboard option
 * - **Dashboard Generation** - Same flow as default prototype
 *
 * ## Report Contents
 *
 * - Executive Summary
 * - Overall Performance Metrics (with tables)
 * - Regional Performance Breakdown
 * - Product Category Analysis
 * - Sales Team Performance
 * - Deal Velocity Analysis
 * - Competitive Landscape
 * - Customer Segment Analysis
 * - Strategic Recommendations
 * - Appendix with Data Sources
 */
export const Default: Story = {
  decorators: [FullLayoutDecorator],
  render: () => <DeepResearchDemo />,
};
