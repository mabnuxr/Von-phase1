/**
 * Templates feature types
 * Self-contained module for prompt template functionality
 */

export type TemplateCategory =
  | 'Pipeline'
  | 'Forecasting'
  | 'Deal Intelligence'
  | 'Team Performance'
  | 'Customer Insights'
  | 'Reporting';

export interface Template {
  id: string;
  category: TemplateCategory;
  prompt: string;
}

export interface TemplatesState {
  templates: Template[];
  activeCategory: TemplateCategory;
}

export const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  'Pipeline',
  'Forecasting',
  'Deal Intelligence',
  'Team Performance',
  'Customer Insights',
  'Reporting',
];

// Default templates organized by category for sales teams
export const DEFAULT_TEMPLATES: Template[] = [
  // Pipeline Templates
  {
    id: 'tpl-pipeline-1',
    category: 'Pipeline',
    prompt: `Analyze my current sales pipeline and provide a comprehensive health check including:
- Total pipeline value and coverage ratio
- Stage distribution and conversion rates
- Deals stuck in stages longer than average
- Pipeline velocity trends
- Key risks and opportunities`,
  },
  {
    id: 'tpl-pipeline-2',
    category: 'Pipeline',
    prompt: `Identify all deals in my pipeline that have been stalled (no activity in the last 14 days). For each deal, show:
- Deal name and value
- Current stage and days in stage
- Last activity date and type
- Primary contact and their engagement level
- Suggested re-engagement actions`,
  },
  {
    id: 'tpl-pipeline-3',
    category: 'Pipeline',
    prompt: `Break down my pipeline by customer segment (Enterprise, Mid-Market, SMB) and show:
- Number of deals and total value per segment
- Average deal size comparison
- Win rates by segment
- Average sales cycle length
- Top opportunities in each segment`,
  },
  {
    id: 'tpl-pipeline-4',
    category: 'Pipeline',
    prompt: `Show me all new opportunities created in the last 7 days including:
- Deal name, value, and expected close date
- Source/lead origin
- Assigned rep
- Initial qualification notes
- Recommended next steps for each`,
  },
  {
    id: 'tpl-pipeline-5',
    category: 'Pipeline',
    prompt: `List all deals with close dates this month and provide:
- Deal name, value, and exact close date
- Current stage and probability
- Recent activity summary
- Risk assessment (high/medium/low)
- Key actions needed to close`,
  },

  // Forecasting Templates
  {
    id: 'tpl-forecast-1',
    category: 'Forecasting',
    prompt: `Generate a revenue forecast for the current quarter including:
- Committed revenue (closed deals)
- Best case scenario
- Most likely scenario
- Pipeline coverage analysis
- Comparison to quota/target
- Key deals that could impact the forecast`,
  },
  {
    id: 'tpl-forecast-2',
    category: 'Forecasting',
    prompt: `Show my current quota attainment status and projection:
- Quota target vs closed revenue
- Current attainment percentage
- Required run rate to hit quota
- Pipeline needed to close the gap
- Historical trends for similar periods`,
  },
  {
    id: 'tpl-forecast-3',
    category: 'Forecasting',
    prompt: `Provide an early outlook for next quarter:
- Deals with close dates in next quarter
- Expected pipeline value
- Deals likely to push from this quarter
- Historical Q-over-Q trends
- Areas needing pipeline development`,
  },
  {
    id: 'tpl-forecast-4',
    category: 'Forecasting',
    prompt: `Analyze forecast accuracy for the last 3 months:
- Forecasted vs actual revenue by month
- Variance percentage and trends
- Deals that caused forecast misses
- Patterns in over/under forecasting
- Recommendations to improve accuracy`,
  },

  // Deal Intelligence Templates
  {
    id: 'tpl-deal-1',
    category: 'Deal Intelligence',
    prompt: `Identify deals that are at risk and explain why:
- Deals with declining engagement
- Deals with negative sentiment in communications
- Deals missing key stakeholders
- Deals with competitor mentions
- Recommended save strategies for each`,
  },
  {
    id: 'tpl-deal-2',
    category: 'Deal Intelligence',
    prompt: `Analyze deal momentum across my pipeline:
- Deals with increasing engagement
- Deals with decreasing engagement
- Meeting frequency trends
- Email response rates
- Stakeholder expansion/contraction`,
  },
  {
    id: 'tpl-deal-3',
    category: 'Deal Intelligence',
    prompt: `Show me deals where competitors have been mentioned:
- Deal name and competitor identified
- Context of competitor mention
- Our positioning strengths/weaknesses
- Win rate against this competitor
- Recommended competitive strategies`,
  },
  {
    id: 'tpl-deal-4',
    category: 'Deal Intelligence',
    prompt: `Analyze multi-threading status on my top deals:
- Number of contacts engaged per deal
- Decision maker identification
- Champion identification
- Gaps in stakeholder coverage
- Recommendations for expanding relationships`,
  },
  {
    id: 'tpl-deal-5',
    category: 'Deal Intelligence',
    prompt: `Identify common blockers across my deals:
- Most frequent objections
- Budget/timing concerns
- Technical requirements gaps
- Procurement process delays
- Suggested responses and strategies`,
  },

  // Team Performance Templates
  {
    id: 'tpl-team-1',
    category: 'Team Performance',
    prompt: `Show me the team performance leaderboard:
- Closed revenue rankings
- Pipeline generation rankings
- Win rate comparison
- Average deal size by rep
- Activity metrics (calls, emails, meetings)`,
  },
  {
    id: 'tpl-team-2',
    category: 'Team Performance',
    prompt: `Compare top performers vs bottom performers:
- Key metrics comparison
- Activity pattern differences
- Deal qualification approaches
- Time spent per deal stage
- Best practices to share across team`,
  },
  {
    id: 'tpl-team-3',
    category: 'Team Performance',
    prompt: `Analyze rep capacity and workload:
- Active deals per rep
- Pipeline value per rep
- New leads/opportunities assigned
- Deals in late stages needing attention
- Recommendations for lead distribution`,
  },
  {
    id: 'tpl-team-4',
    category: 'Team Performance',
    prompt: `Identify coaching opportunities for the team:
- Reps struggling with specific stages
- Low conversion rate patterns
- Deals that could benefit from support
- Skill gaps indicated by metrics
- Recommended coaching focus areas`,
  },

  // Customer Insights Templates
  {
    id: 'tpl-customer-1',
    category: 'Customer Insights',
    prompt: `Show me account health scores for my key accounts:
- Overall health score and trend
- Engagement metrics
- Product usage indicators
- Support ticket trends
- Renewal/expansion risk assessment`,
  },
  {
    id: 'tpl-customer-2',
    category: 'Customer Insights',
    prompt: `Identify accounts with expansion opportunities:
- High usage/engagement accounts
- Accounts approaching license limits
- Cross-sell opportunities based on usage
- Timing indicators for expansion
- Recommended approach for each`,
  },
  {
    id: 'tpl-customer-3',
    category: 'Customer Insights',
    prompt: `Identify accounts at risk of churning:
- Declining engagement signals
- Support escalations
- Contract renewal dates approaching
- Competitive threat indicators
- Retention strategies per account`,
  },
  {
    id: 'tpl-customer-4',
    category: 'Customer Insights',
    prompt: `Analyze customer sentiment across my accounts:
- Overall sentiment trends
- Accounts with improving sentiment
- Accounts with declining sentiment
- Key topics driving sentiment
- Recommended actions for at-risk accounts`,
  },

  // Reporting Templates
  {
    id: 'tpl-report-1',
    category: 'Reporting',
    prompt: `Generate a weekly sales summary including:
- Deals closed this week
- New opportunities created
- Pipeline movement (advances, stalls, losses)
- Key meetings and their outcomes
- Top priorities for next week`,
  },
  {
    id: 'tpl-report-2',
    category: 'Reporting',
    prompt: `Create a comprehensive monthly performance report:
- Revenue closed vs target
- Pipeline generated
- Win/loss analysis
- Average deal metrics (size, cycle, etc.)
- Month-over-month trends
- Key wins and lessons learned`,
  },
  {
    id: 'tpl-report-3',
    category: 'Reporting',
    prompt: `Prepare data for my quarterly business review:
- Quarter revenue achievement
- Year-to-date performance
- Top wins and strategic deals
- Lost deal analysis
- Pipeline health going into next quarter
- Key initiatives and results`,
  },
  {
    id: 'tpl-report-4',
    category: 'Reporting',
    prompt: `Summarize my sales activities:
- Calls made and outcomes
- Emails sent and response rates
- Meetings held and scheduled
- Demos completed
- Proposals sent
- Activity trends over time`,
  },
  {
    id: 'tpl-report-5',
    category: 'Reporting',
    prompt: `Analyze my win/loss patterns:
- Win rate by segment, size, source
- Common factors in won deals
- Common reasons for losses
- Competitor win/loss rates
- Recommendations to improve win rate`,
  },
];
