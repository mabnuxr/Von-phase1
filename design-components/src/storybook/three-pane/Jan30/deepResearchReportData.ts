/**
 * Deep Research Report - Interactive Table Data
 *
 * Contains structured data for the Q4 2025 Sales Performance Analysis report
 * with AI-generated columns and their prompts/sources.
 */

import type { ReportColumn, AIReasoningData } from '../../../components/ReportTable/ReportTable';

// ============================================================================
// Top Performers Table
// ============================================================================

export interface TopPerformerRow {
  id: string;
  rank: number;
  rep: string;
  revenue: number;
  deals: number;
  quotaAttainment: number;
  avgDeal: number;
  // AI columns
  dealHealthScore: number;
  nextBestAction: string;
}

export const topPerformersColumns: ReportColumn[] = [
  { id: 'rank', label: 'Rank', type: 'number', width: 70 },
  { id: 'rep', label: 'Rep', type: 'text', width: 140 },
  { id: 'revenue', label: 'Revenue', type: 'currency', width: 110 },
  { id: 'deals', label: 'Deals', type: 'number', width: 80 },
  { id: 'quotaAttainment', label: 'Quota Att.', type: 'percentage', width: 100 },
  { id: 'avgDeal', label: 'Avg Deal', type: 'currency', width: 100 },
  {
    id: 'dealHealthScore',
    label: 'Deal Health',
    type: 'number',
    isAI: true,
    aiPrompt:
      'Calculate deal health score (0-100) based on pipeline velocity, win rate trends, and engagement patterns from the last 90 days.',
    aiDataSources: ['Salesforce Opportunities', 'Gong Calls', 'Email Activity'],
    width: 110,
  },
  {
    id: 'nextBestAction',
    label: 'Next Best Action',
    type: 'text',
    isAI: true,
    aiPrompt:
      'Recommend the single most impactful action this rep should take this week based on their pipeline composition and deal stages.',
    aiDataSources: ['Salesforce Opportunities', 'Calendar', 'Historical Win Patterns'],
    width: 180,
  },
];

export const topPerformersData: TopPerformerRow[] = [
  {
    id: '1',
    rank: 1,
    rep: 'Sarah Chen',
    revenue: 1420000,
    deals: 68,
    quotaAttainment: 1.42,
    avgDeal: 20882,
    dealHealthScore: 92,
    nextBestAction: 'Follow up on TechFlow expansion',
  },
  {
    id: '2',
    rank: 2,
    rep: 'Marcus Johnson',
    revenue: 1180000,
    deals: 54,
    quotaAttainment: 1.18,
    avgDeal: 21852,
    dealHealthScore: 88,
    nextBestAction: 'Schedule GlobalRetail demo',
  },
  {
    id: '3',
    rank: 3,
    rep: 'Emily Rodriguez',
    revenue: 985000,
    deals: 72,
    quotaAttainment: 1.09,
    avgDeal: 13681,
    dealHealthScore: 85,
    nextBestAction: 'Close MedHealth by EOW',
  },
  {
    id: '4',
    rank: 4,
    rep: 'David Kim',
    revenue: 892000,
    deals: 45,
    quotaAttainment: 0.99,
    avgDeal: 19822,
    dealHealthScore: 78,
    nextBestAction: 'Re-engage CloudNine stakeholders',
  },
  {
    id: '5',
    rank: 5,
    rep: 'Jennifer Walsh',
    revenue: 856000,
    deals: 61,
    quotaAttainment: 0.95,
    avgDeal: 14033,
    dealHealthScore: 74,
    nextBestAction: 'Send DataDriven proposal',
  },
];

export const topPerformersAIReasoning: Record<string, AIReasoningData> = {
  'dealHealthScore-0': {
    reasoning:
      "Sarah's deals show strong velocity with 15% above-average engagement. All 8 open opportunities have recent activity within 5 days.",
    confidence: 0.94,
    sources: ['68 Gong calls', '142 emails', 'CRM activity logs'],
  },
  'dealHealthScore-1': {
    reasoning:
      'Marcus has solid pipeline health. 2 deals showing slight stagnation in negotiation stage - recommend attention.',
    confidence: 0.89,
    sources: ['54 Gong calls', '98 emails', 'CRM activity logs'],
  },
  'dealHealthScore-2': {
    reasoning:
      'Emily maintains high volume with consistent engagement. Some smaller deals may need qualification review.',
    confidence: 0.87,
    sources: ['72 Gong calls', '156 emails', 'CRM activity logs'],
  },
  'dealHealthScore-3': {
    reasoning:
      'David has fewer but larger deals. CloudNine opportunity showing 12 days without activity - risk flag.',
    confidence: 0.82,
    sources: ['45 Gong calls', '67 emails', 'CRM activity logs'],
  },
  'dealHealthScore-4': {
    reasoning:
      'Jennifer has good activity volume but 3 deals in discovery for 20+ days. May need to advance or disqualify.',
    confidence: 0.79,
    sources: ['61 Gong calls', '89 emails', 'CRM activity logs'],
  },
  'nextBestAction-0': {
    reasoning:
      'TechFlow has budget approval and champion alignment. Contract sent 3 days ago - follow-up timing is optimal.',
    confidence: 0.91,
    sources: ['Recent Gong call sentiment', 'Email open rates', 'Historical close patterns'],
  },
  'nextBestAction-1': {
    reasoning:
      'GlobalRetail requested demo last week. 3 stakeholders confirmed interested. High conversion probability if scheduled within 5 days.',
    confidence: 0.88,
    sources: ['Email thread analysis', 'Stakeholder mapping', 'Demo-to-close correlation'],
  },
  'nextBestAction-2': {
    reasoning:
      'MedHealth in final negotiation. Legal review complete. 85% probability to close if pushed this week.',
    confidence: 0.86,
    sources: ['Stage duration analysis', 'Legal status', 'Quarter-end patterns'],
  },
  'nextBestAction-3': {
    reasoning:
      'CloudNine champion went silent after budget discussion. Re-engagement needed before deal goes cold.',
    confidence: 0.83,
    sources: ['Engagement decay analysis', 'Champion activity', 'Similar deal outcomes'],
  },
  'nextBestAction-4': {
    reasoning:
      'DataDriven confirmed budget and timeline. Proposal delivery is the natural next step in the sales process.',
    confidence: 0.85,
    sources: ['Stage requirements', 'Buyer signals', 'Process compliance'],
  },
};

// ============================================================================
// Regional Performance Table
// ============================================================================

export interface RegionalPerformanceRow {
  id: string;
  region: string;
  revenue: number;
  percentOfTotal: number;
  vsQ3: number;
  vsTarget: number;
  keyDriver: string;
  // AI columns
  q1Forecast: number;
  riskLevel: string;
}

export const regionalPerformanceColumns: ReportColumn[] = [
  { id: 'region', label: 'Region', type: 'text', width: 120 },
  { id: 'revenue', label: 'Revenue', type: 'currency', width: 110 },
  { id: 'percentOfTotal', label: '% of Total', type: 'percentage', width: 100 },
  { id: 'vsQ3', label: 'vs Q3', type: 'percentage', width: 90 },
  { id: 'vsTarget', label: 'vs Target', type: 'percentage', width: 100 },
  { id: 'keyDriver', label: 'Key Driver', type: 'text', width: 160 },
  {
    id: 'q1Forecast',
    label: 'Q1 Forecast',
    type: 'currency',
    isAI: true,
    aiPrompt:
      'Project Q1 revenue based on current pipeline, historical seasonality, and growth trajectory.',
    aiDataSources: ['Pipeline Data', 'Historical Trends', 'Seasonality Model'],
    width: 120,
  },
  {
    id: 'riskLevel',
    label: 'Risk Level',
    type: 'text',
    isAI: true,
    aiPrompt:
      'Assess risk level (Low/Medium/High) based on pipeline coverage, deal concentration, and economic indicators.',
    aiDataSources: ['Pipeline Coverage', 'Deal Distribution', 'Market Signals'],
    width: 100,
  },
];

export const regionalPerformanceData: RegionalPerformanceRow[] = [
  {
    id: '1',
    region: 'West',
    revenue: 4900000,
    percentOfTotal: 0.383,
    vsQ3: 0.182,
    vsTarget: 0.124,
    keyDriver: 'Enterprise expansion',
    q1Forecast: 5200000,
    riskLevel: 'Low',
  },
  {
    id: '2',
    region: 'East',
    revenue: 3800000,
    percentOfTotal: 0.297,
    vsQ3: 0.115,
    vsTarget: 0.062,
    keyDriver: 'New customer acquisition',
    q1Forecast: 4100000,
    riskLevel: 'Medium',
  },
  {
    id: '3',
    region: 'Central',
    revenue: 2400000,
    percentOfTotal: 0.188,
    vsQ3: 0.083,
    vsTarget: 0.021,
    keyDriver: 'Renewal upsells',
    q1Forecast: 2500000,
    riskLevel: 'Medium',
  },
  {
    id: '4',
    region: 'International',
    revenue: 1700000,
    percentOfTotal: 0.133,
    vsQ3: 0.221,
    vsTarget: 0.158,
    keyDriver: 'APAC market entry',
    q1Forecast: 2100000,
    riskLevel: 'High',
  },
];

export const regionalPerformanceAIReasoning: Record<string, AIReasoningData> = {
  'q1Forecast-0': {
    reasoning:
      'West pipeline is 3.8x coverage with strong enterprise momentum. Historically Q1 sees 6% seasonal uplift.',
    confidence: 0.91,
    sources: ['$19.7M pipeline', 'Q1 2024 actuals', 'Enterprise deal trends'],
  },
  'q1Forecast-1': {
    reasoning:
      'East shows solid new logo activity but 2 large deals at risk. Conservative estimate applied.',
    confidence: 0.84,
    sources: ['$14.2M pipeline', 'Deal risk analysis', 'Rep capacity'],
  },
  'q1Forecast-2': {
    reasoning:
      'Central renewal base is stable. Limited new business pipeline constrains upside potential.',
    confidence: 0.88,
    sources: ['$8.1M pipeline', 'Renewal calendar', 'Upsell opportunities'],
  },
  'q1Forecast-3': {
    reasoning:
      'International growth trajectory strong but execution risk in new APAC markets.',
    confidence: 0.76,
    sources: ['$7.8M pipeline', 'APAC ramp plan', 'Currency considerations'],
  },
  'riskLevel-0': {
    reasoning:
      'Strong pipeline coverage (3.8x), diversified deal portfolio, experienced team. Low concentration risk.',
    confidence: 0.93,
    sources: ['Pipeline analysis', 'Deal concentration', 'Team tenure'],
  },
  'riskLevel-1': {
    reasoning:
      '2 deals represent 35% of pipeline. Loss of either significantly impacts forecast.',
    confidence: 0.86,
    sources: ['Deal concentration analysis', 'Competitive intelligence', 'Stage distribution'],
  },
  'riskLevel-2': {
    reasoning:
      'Heavy reliance on renewals (72%). New business pipeline below target coverage.',
    confidence: 0.84,
    sources: ['Revenue mix', 'Pipeline by source', 'Growth targets'],
  },
  'riskLevel-3': {
    reasoning:
      'New market entry risk. 3 deals with extended cycles. Currency and regulatory factors.',
    confidence: 0.78,
    sources: ['Market maturity', 'Deal velocity', 'Macro indicators'],
  },
};

// ============================================================================
// Deal Velocity Table
// ============================================================================

export interface DealVelocityRow {
  id: string;
  stage: string;
  avgDays: number;
  conversion: number;
  dropOffReason: string;
  // AI columns
  improvementPotential: string;
}

export const dealVelocityColumns: ReportColumn[] = [
  { id: 'stage', label: 'Stage', type: 'text', width: 200 },
  { id: 'avgDays', label: 'Avg Days', type: 'number', width: 100 },
  { id: 'conversion', label: 'Conversion', type: 'percentage', width: 110 },
  { id: 'dropOffReason', label: 'Drop-off Reason', type: 'text', width: 140 },
  {
    id: 'improvementPotential',
    label: 'Improvement Potential',
    type: 'text',
    isAI: true,
    aiPrompt:
      'Identify the biggest improvement opportunity at this stage based on win/loss analysis and best practices.',
    aiDataSources: ['Win/Loss Analysis', 'Best Practices', 'Competitor Intel'],
    width: 200,
  },
];

export const dealVelocityData: DealVelocityRow[] = [
  {
    id: '1',
    stage: 'Qualification → Discovery',
    avgDays: 5.2,
    conversion: 0.78,
    dropOffReason: 'Poor fit',
    improvementPotential: 'Tighter ICP scoring criteria',
  },
  {
    id: '2',
    stage: 'Discovery → Demo',
    avgDays: 8.4,
    conversion: 0.72,
    dropOffReason: 'No budget',
    improvementPotential: 'Earlier budget qualification',
  },
  {
    id: '3',
    stage: 'Demo → Proposal',
    avgDays: 12.1,
    conversion: 0.65,
    dropOffReason: 'Competitor',
    improvementPotential: 'Competitive battle cards',
  },
  {
    id: '4',
    stage: 'Proposal → Negotiation',
    avgDays: 9.8,
    conversion: 0.58,
    dropOffReason: 'Pricing',
    improvementPotential: 'Value-based pricing training',
  },
  {
    id: '5',
    stage: 'Negotiation → Closed',
    avgDays: 6.5,
    conversion: 0.82,
    dropOffReason: 'Legal delays',
    improvementPotential: 'Pre-approved contract templates',
  },
];

export const dealVelocityAIReasoning: Record<string, AIReasoningData> = {
  'improvementPotential-0': {
    reasoning:
      '22% of disqualified deals at this stage would have been caught earlier with better ICP scoring. Could save 40 hours/month.',
    confidence: 0.87,
    sources: ['Disqualification analysis', 'ICP match scores', 'Rep time tracking'],
  },
  'improvementPotential-1': {
    reasoning:
      '68% of "no budget" losses had no budget discussion in discovery. BANT framework adoption is inconsistent.',
    confidence: 0.91,
    sources: ['Call transcript analysis', 'Loss reasons', 'Top performer patterns'],
  },
  'improvementPotential-2': {
    reasoning:
      'Competitor mentions increased 34% this quarter. Top performers use battle cards 3x more than average.',
    confidence: 0.89,
    sources: ['Competitive mention tracking', 'Win rate by competitor', 'Battle card usage'],
  },
  'improvementPotential-3': {
    reasoning:
      'Pricing objections down 18% when reps lead with ROI. Only 42% of proposals include ROI calculator.',
    confidence: 0.85,
    sources: ['Proposal analysis', 'Win rate by content', 'Training completion'],
  },
  'improvementPotential-4': {
    reasoning:
      'Legal review adds 4.2 days on average. Pre-approved templates reduce this to 1.5 days for 70% of deals.',
    confidence: 0.92,
    sources: ['Contract cycle analysis', 'Legal team data', 'Template usage'],
  },
};
