/**
 * Deep Research Dashboard Utilities
 *
 * Functions to compute dashboard KPIs, charts, and tables
 * programmatically from the 900 opportunity records.
 */

import type {
  KPICardData,
  ChartData,
  TableData,
  TextWidgetData,
} from '../../../components/Jan17Demo/DashboardV2';
import { deepResearchTables } from './deepResearchTableData';

// Get the opportunity data from the deep research tables
const getOpportunityData = () => {
  const oppTable = deepResearchTables.find((t) => t.id === 'opportunities');
  return (oppTable?.data || []) as OpportunityRecord[];
};

interface OpportunityRecord {
  id: string;
  name: string;
  accountName: string;
  ownerName: string;
  amount: number;
  stage: string;
  probability: number;
  closeDate: string;
  createdDate: string;
  type: string;
  leadSource: string;
  region: string;
  dealScore: number;
  riskFlag: string;
  winProbability: number;
  nextBestAction: string;
  championStrength: string;
}

// ============================================================================
// KPI Calculations
// ============================================================================

export interface ComputedKPIs {
  totalRevenue: number;
  dealsWon: number;
  totalDeals: number;
  avgDealSize: number;
  winRate: number;
  pipelineValue: number;
  avgDealScore: number;
  highRiskDeals: number;
}

export function computeKPIsFromData(): ComputedKPIs {
  const opportunities = getOpportunityData();

  // Filter for closed won deals
  const closedWon = opportunities.filter((opp) => opp.stage === 'Closed Won');
  const closedLost = opportunities.filter((opp) => opp.stage === 'Closed Lost');
  const openDeals = opportunities.filter(
    (opp) => opp.stage !== 'Closed Won' && opp.stage !== 'Closed Lost'
  );

  // Calculate metrics
  const totalRevenue = closedWon.reduce((sum, opp) => sum + opp.amount, 0);
  const dealsWon = closedWon.length;
  const totalClosedDeals = closedWon.length + closedLost.length;
  const avgDealSize = dealsWon > 0 ? totalRevenue / dealsWon : 0;
  const winRate = totalClosedDeals > 0 ? (dealsWon / totalClosedDeals) * 100 : 0;
  const pipelineValue = openDeals.reduce((sum, opp) => sum + opp.amount, 0);
  const avgDealScore =
    opportunities.reduce((sum, opp) => sum + opp.dealScore, 0) / opportunities.length;
  const highRiskDeals = opportunities.filter((opp) => opp.riskFlag === 'High').length;

  return {
    totalRevenue,
    dealsWon,
    totalDeals: opportunities.length,
    avgDealSize,
    winRate,
    pipelineValue,
    avgDealScore,
    highRiskDeals,
  };
}

export function generateKPICards(): KPICardData[] {
  const kpis = computeKPIsFromData();
  const opportunities = getOpportunityData();

  // Calculate additional metrics for more KPIs
  const openDeals = opportunities.filter(
    (opp) => opp.stage !== 'Closed Won' && opp.stage !== 'Closed Lost'
  );
  const highValueDeals = openDeals.filter((opp) => opp.amount >= 100000);
  const avgCycleTime = 45; // days - would be calculated from actual data in production

  // Define realistic targets with varied completion rates
  const revenueTarget = kpis.totalRevenue * 1.35;
  const dealsTarget = Math.round(kpis.dealsWon * 1.85);
  const avgDealTarget = kpis.avgDealSize * 0.85;
  const winRateTarget = 48;
  const pipelineTarget = kpis.pipelineValue * 1.55;
  const cycleTimeTarget = 32;

  return [
    {
      id: 'kpi-total-revenue',
      title: 'Total Revenue (Closed Won)',
      kpi: {
        value: kpis.totalRevenue,
        format: ',.0f',
        prefix: '$',
        suffix: null,
        comparison: {
          value: -26.1,
          format: '.1f',
          suffix: '%',
          label: 'vs target',
          positive_is_good: true,
        },
        target: {
          value: revenueTarget,
          format: ',.0f',
          label: 'Target',
        },
      },
    },
    {
      id: 'kpi-deals-closed',
      title: 'Deals Won',
      kpi: {
        value: kpis.dealsWon,
        format: ',.0f',
        prefix: null,
        suffix: null,
        comparison: {
          value: -46.0,
          format: '.1f',
          suffix: '%',
          label: `of ${kpis.totalDeals} total opportunities`,
          positive_is_good: true,
        },
        target: {
          value: dealsTarget,
          format: ',.0f',
          label: 'Target',
        },
      },
    },
    {
      id: 'kpi-avg-deal',
      title: 'Average Deal Size',
      kpi: {
        value: kpis.avgDealSize,
        format: ',.0f',
        prefix: '$',
        suffix: null,
        comparison: {
          value: 17.6,
          format: '.1f',
          suffix: '%',
          label: 'per closed deal',
          positive_is_good: true,
        },
        target: {
          value: avgDealTarget,
          format: ',.0f',
          label: 'Target',
        },
      },
    },
    {
      id: 'kpi-win-rate',
      title: 'Win Rate',
      kpi: {
        value: kpis.winRate,
        format: '.1f',
        prefix: null,
        suffix: '%',
        comparison: {
          value: 5.0,
          format: '.1f',
          suffix: 'pp',
          label: 'closed won / total closed',
          positive_is_good: true,
        },
        target: {
          value: winRateTarget,
          format: '.0f',
          label: 'Target',
        },
      },
    },
    {
      id: 'kpi-pipeline-value',
      title: 'Pipeline Value',
      kpi: {
        value: kpis.pipelineValue,
        format: ',.0f',
        prefix: '$',
        suffix: null,
        comparison: {
          value: -35.5,
          format: '.1f',
          suffix: '%',
          label: `${openDeals.length} open opportunities`,
          positive_is_good: true,
        },
        target: {
          value: pipelineTarget,
          format: ',.0f',
          label: 'Target',
        },
      },
    },
    {
      id: 'kpi-cycle-time',
      title: 'Avg Sales Cycle',
      kpi: {
        value: avgCycleTime,
        format: ',.0f',
        prefix: null,
        suffix: ' days',
        comparison: {
          value: 40.6,
          format: '.1f',
          suffix: '%',
          label: `${highValueDeals.length} high-value deals in pipeline`,
          positive_is_good: false, // Higher cycle time is bad
        },
        target: {
          value: cycleTimeTarget,
          format: ',.0f',
          label: 'Target',
          inverted: true,
        },
      },
    },
  ];
}

// ============================================================================
// Chart Data Generation
// ============================================================================

export function generateRevenueByRegionChart(): ChartData {
  const opportunities = getOpportunityData();
  const closedWon = opportunities.filter((opp) => opp.stage === 'Closed Won');

  // Group by region
  const revenueByRegion: Record<string, number> = {};
  closedWon.forEach((opp) => {
    const region = opp.region || 'Unknown';
    revenueByRegion[region] = (revenueByRegion[region] || 0) + opp.amount;
  });

  // Sort by revenue descending
  const sortedRegions = Object.entries(revenueByRegion).sort((a, b) => b[1] - a[1]);

  return {
    id: 'chart-by-region',
    title: 'Revenue by Region',
    type: 'bar',
    data: {
      categories: sortedRegions.map(([region]) => region),
      series: [
        {
          name: 'Revenue ($K)',
          data: sortedRegions.map(([, amount]) => Math.round(amount / 1000)),
        },
      ],
    },
  };
}

export function generateRevenueByTypeChart(): ChartData {
  const opportunities = getOpportunityData();
  const closedWon = opportunities.filter((opp) => opp.stage === 'Closed Won');

  // Group by deal type
  const revenueByType: Record<string, number> = {};
  closedWon.forEach((opp) => {
    const type = opp.type || 'Unknown';
    revenueByType[type] = (revenueByType[type] || 0) + opp.amount;
  });

  // Calculate total for percentages
  const total = Object.values(revenueByType).reduce((sum, val) => sum + val, 0);

  // Colors for pie chart
  const colors = ['#6366f1', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];

  return {
    id: 'chart-by-type',
    title: 'Revenue by Deal Type',
    type: 'pie',
    data: Object.entries(revenueByType)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value], index) => ({
        name,
        y: Number(((value / total) * 100).toFixed(1)),
        color: colors[index % colors.length],
      })),
  };
}

// ============================================================================
// Table Data Generation
// ============================================================================

export function generateTopPerformersTable(): TableData {
  const opportunities = getOpportunityData();
  const closedWon = opportunities.filter((opp) => opp.stage === 'Closed Won');

  // Group by owner
  const performerStats: Record<
    string,
    { revenue: number; deals: number; avgDealScore: number; totalScore: number }
  > = {};

  closedWon.forEach((opp) => {
    const owner = opp.ownerName;
    if (!performerStats[owner]) {
      performerStats[owner] = { revenue: 0, deals: 0, avgDealScore: 0, totalScore: 0 };
    }
    performerStats[owner].revenue += opp.amount;
    performerStats[owner].deals += 1;
    performerStats[owner].totalScore += opp.dealScore;
  });

  // Calculate avg deal score and sort by revenue
  const sortedPerformers = Object.entries(performerStats)
    .map(([name, stats]) => ({
      name,
      revenue: stats.revenue,
      deals: stats.deals,
      avgDeal: stats.deals > 0 ? stats.revenue / stats.deals : 0,
      avgDealScore: stats.deals > 0 ? stats.totalScore / stats.deals : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10); // Top 10

  // Determine trends based on deal score
  const getTrend = (avgScore: number): string => {
    if (avgScore >= 85) return 'Strong momentum';
    if (avgScore >= 75) return 'Consistent performer';
    if (avgScore >= 65) return 'Improving';
    return 'Needs attention';
  };

  // Get risk assessment based on performance
  const getRiskLevel = (revenue: number, deals: number, avgScore: number): string => {
    if (revenue > 3000000 && avgScore >= 80) return 'Low';
    if (revenue > 2000000 && avgScore >= 70) return 'Medium';
    return 'High';
  };

  // Get next best action recommendation
  const getNextAction = (avgScore: number, deals: number): string => {
    if (avgScore >= 85) return 'Scale winning playbook';
    if (avgScore >= 75 && deals > 15) return 'Mentor junior reps';
    if (avgScore >= 65) return 'Focus on deal velocity';
    return 'Review pipeline quality';
  };

  // Get win probability for pipeline
  const getWinProbability = (avgScore: number): string => {
    if (avgScore >= 85) return '78%';
    if (avgScore >= 75) return '65%';
    if (avgScore >= 65) return '52%';
    return '38%';
  };

  // Calculate quota attainment (assuming $1M quota per rep)
  const quotaTarget = 1000000;

  return {
    id: 'table-top-performers',
    title: 'Top Performing Sales Reps',
    columns: [
      { id: 'rank', label: 'Rank', type: 'number' },
      { id: 'name', label: 'Rep', type: 'string' },
      { id: 'trend', label: 'Trend', type: 'string', isAI: true, aiSource: 'Von IQ' },
      { id: 'revenue', label: 'Revenue', type: 'currency' },
      { id: 'deals', label: 'Deals', type: 'number' },
      { id: 'quotaAtt', label: 'Quota Att.', type: 'string' },
      { id: 'avgDeal', label: 'Avg Deal', type: 'currency' },
      { id: 'riskLevel', label: 'Risk', type: 'string', isAI: true, aiSource: 'Von IQ' },
      {
        id: 'nextAction',
        label: 'Next Best Action',
        type: 'string',
        isAI: true,
        aiSource: 'Von IQ',
      },
      { id: 'winProb', label: 'Win Prob.', type: 'string', isAI: true, aiSource: 'Von IQ' },
    ],
    rows: sortedPerformers.map((performer, index) => ({
      rank: index + 1,
      name: performer.name,
      trend: getTrend(performer.avgDealScore),
      revenue: performer.revenue,
      deals: performer.deals,
      quotaAtt: `${Math.round((performer.revenue / quotaTarget) * 100)}%`,
      avgDeal: Math.round(performer.avgDeal),
      riskLevel: getRiskLevel(performer.revenue, performer.deals, performer.avgDealScore),
      nextAction: getNextAction(performer.avgDealScore, performer.deals),
      winProb: getWinProbability(performer.avgDealScore),
    })),
  };
}

// ============================================================================
// Text Widget (Recommendations)
// ============================================================================

export function generateRecommendationsWidget(): TextWidgetData {
  const opportunities = getOpportunityData();

  // Analyze data for insights
  const highRiskDeals = opportunities.filter((opp) => opp.riskFlag === 'High');
  const weakChampionDeals = opportunities.filter((opp) => opp.championStrength === 'Weak');
  const stuckInNegotiation = opportunities.filter((opp) => opp.stage === 'Negotiation');

  // Get most common next best actions
  const actionCounts: Record<string, number> = {};
  opportunities.forEach((opp) => {
    actionCounts[opp.nextBestAction] = (actionCounts[opp.nextBestAction] || 0) + 1;
  });
  const topActions = Object.entries(actionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  // Calculate regional performance
  const closedWon = opportunities.filter((opp) => opp.stage === 'Closed Won');
  const revenueByRegion: Record<string, number> = {};
  closedWon.forEach((opp) => {
    revenueByRegion[opp.region] = (revenueByRegion[opp.region] || 0) + opp.amount;
  });
  const [topRegion] = Object.entries(revenueByRegion).sort((a, b) => b[1] - a[1])[0] || [
    'Unknown',
    0,
  ];
  const [bottomRegion] = Object.entries(revenueByRegion).sort((a, b) => a[1] - b[1])[0] || [
    'Unknown',
    0,
  ];

  const avgDealScore = Math.round(
    opportunities.reduce((sum, opp) => sum + opp.dealScore, 0) / opportunities.length
  );

  return {
    id: 'text-recommendations',
    title: 'Von Recommendations',
    content: `Based on analysis of **${opportunities.length} opportunities**, here are the key priorities:

### Immediate Actions Required

- **${highRiskDeals.length} high-risk deals** need immediate attention. Focus on the ${stuckInNegotiation.length} deals stuck in Negotiation stage to prevent slippage.

- **${weakChampionDeals.length} opportunities** have weak champion strength. Schedule executive alignment calls or provide additional enablement materials.

### Regional Strategy

The **${topRegion}** region is outperforming others. Analyze their playbook and apply best practices to improve **${bottomRegion}** performance.

### Top Recommended Actions

${topActions.map(([action, count], i) => `${i + 1}. **${action}** — ${count} deals`).join('\n')}

### Pipeline Health

Average deal score is **${avgDealScore}/100**. Prioritize improving engagement for deals scoring below 70.`,
  };
}

// ============================================================================
// Main Export - Generate All Dashboard Data
// ============================================================================

export interface GeneratedDashboardData {
  kpiCards: KPICardData[];
  barChart: ChartData;
  pieChart: ChartData;
  tableData: TableData;
  textWidget: TextWidgetData;
  computedKPIs: ComputedKPIs;
}

export function generateDashboardFromData(): GeneratedDashboardData {
  return {
    kpiCards: generateKPICards(),
    barChart: generateRevenueByRegionChart(),
    pieChart: generateRevenueByTypeChart(),
    tableData: generateTopPerformersTable(),
    textWidget: generateRecommendationsWidget(),
    computedKPIs: computeKPIsFromData(),
  };
}
