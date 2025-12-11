/**
 * Templates feature types
 * Self-contained module for prompt template functionality
 */

export type TemplateCategory =
  | '1:1 & Coaching'
  | 'Forecasting'
  | 'Pipeline'
  | 'Deals'
  | 'Accounts'
  | 'Team Performance'
  | 'Reporting & QBRs';

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
  '1:1 & Coaching',
  'Forecasting',
  'Pipeline',
  'Deals',
  'Accounts',
  'Team Performance',
  'Reporting & QBRs',
];

// Default templates organized by category for sales teams
// Based on quick prompts for revenue operations workflows
export const DEFAULT_TEMPLATES: Template[] = [
  // 1:1 & Coaching Templates
  {
    id: 'tpl-coaching-1',
    category: '1:1 & Coaching',
    prompt: 'Help me prepare for my 1:1 with my rep tomorrow',
  },
  {
    id: 'tpl-coaching-2',
    category: '1:1 & Coaching',
    prompt: 'Which rep needs my attention most this week?',
  },
  {
    id: 'tpl-coaching-3',
    category: '1:1 & Coaching',
    prompt: 'What should I celebrate with my team this week?',
  },
  {
    id: 'tpl-coaching-4',
    category: '1:1 & Coaching',
    prompt: 'Give me talk tracks my top reps are using on pricing objections',
  },
  {
    id: 'tpl-coaching-5',
    category: '1:1 & Coaching',
    prompt: 'Which SEs are getting pulled into the most deals?',
  },
  {
    id: 'tpl-coaching-6',
    category: '1:1 & Coaching',
    prompt: 'What did competitors say about us in calls this week?',
  },
  {
    id: 'tpl-coaching-7',
    category: '1:1 & Coaching',
    prompt: 'Which reps have the biggest gap between activity and results?',
  },

  // Forecasting Templates
  {
    id: 'tpl-forecast-1',
    category: 'Forecasting',
    prompt: "What's moved in or out of commit since last week?",
  },
  {
    id: 'tpl-forecast-2',
    category: 'Forecasting',
    prompt: 'How confident should we be in the current commit number?',
  },
  {
    id: 'tpl-forecast-3',
    category: 'Forecasting',
    prompt: 'Which deals in commit have gone quiet?',
  },
  {
    id: 'tpl-forecast-4',
    category: 'Forecasting',
    prompt: "What's the gap between commit and target this quarter?",
  },
  {
    id: 'tpl-forecast-5',
    category: 'Forecasting',
    prompt: 'What needs to close this week to stay on track?',
  },
  {
    id: 'tpl-forecast-6',
    category: 'Forecasting',
    prompt: 'Show me the upside deals that could pull in this quarter',
  },
  {
    id: 'tpl-forecast-7',
    category: 'Forecasting',
    prompt: 'Which reps are forecasting too optimistically based on history?',
  },
  {
    id: 'tpl-forecast-8',
    category: 'Forecasting',
    prompt: 'How has our forecast accuracy trended over the last 3 quarters?',
  },
  {
    id: 'tpl-forecast-9',
    category: 'Forecasting',
    prompt: "What's the worst-case scenario for this quarter?",
  },

  // Pipeline Templates
  {
    id: 'tpl-pipeline-1',
    category: 'Pipeline',
    prompt: "What's my pipeline coverage going into next quarter?",
  },
  {
    id: 'tpl-pipeline-2',
    category: 'Pipeline',
    prompt: 'Where are deals getting stuck in the pipeline?',
  },
  {
    id: 'tpl-pipeline-3',
    category: 'Pipeline',
    prompt: 'Show me deals that have been in the same stage for 3+ weeks',
  },
  {
    id: 'tpl-pipeline-4',
    category: 'Pipeline',
    prompt: "What's our pipeline generation trend month over month?",
  },
  {
    id: 'tpl-pipeline-5',
    category: 'Pipeline',
    prompt: 'Which stages have the worst conversion rates?',
  },
  {
    id: 'tpl-pipeline-6',
    category: 'Pipeline',
    prompt: 'How much pipeline did each rep generate this month?',
  },
  {
    id: 'tpl-pipeline-7',
    category: 'Pipeline',
    prompt: "What's the quality breakdown of our current pipeline?",
  },
  {
    id: 'tpl-pipeline-8',
    category: 'Pipeline',
    prompt: 'Are we seeing enough early-stage pipeline for Q2?',
  },
  {
    id: 'tpl-pipeline-9',
    category: 'Pipeline',
    prompt: "What's the weighted vs unweighted pipeline value right now?",
  },
  {
    id: 'tpl-pipeline-10',
    category: 'Pipeline',
    prompt: 'Which deals just entered pipeline this week?',
  },

  // Deals Templates
  {
    id: 'tpl-deals-1',
    category: 'Deals',
    prompt: 'Walk me through the top 5 deals I should focus on this week',
  },
  {
    id: 'tpl-deals-2',
    category: 'Deals',
    prompt: 'Which deals need executive involvement to close?',
  },
  {
    id: 'tpl-deals-3',
    category: 'Deals',
    prompt: 'Which deals are waiting on technical validation from our side?',
  },
  {
    id: 'tpl-deals-4',
    category: 'Deals',
    prompt: "Show me deals where we haven't multi-threaded yet",
  },
  {
    id: 'tpl-deals-5',
    category: 'Deals',
    prompt: 'Which deals have no next steps or next meeting scheduled?',
  },
  {
    id: 'tpl-deals-6',
    category: 'Deals',
    prompt: 'What are prospects saying about our pricing in late-stage deals?',
  },
  {
    id: 'tpl-deals-7',
    category: 'Deals',
    prompt: 'Which large deals are most likely to slip to next quarter?',
  },
  {
    id: 'tpl-deals-8',
    category: 'Deals',
    prompt: 'Give me the status on all deals over $100K',
  },
  {
    id: 'tpl-deals-9',
    category: 'Deals',
    prompt: 'What happened on the calls for deals that closed last week?',
  },

  // Accounts Templates
  {
    id: 'tpl-accounts-1',
    category: 'Accounts',
    prompt: 'Which accounts should I prioritize for executive outreach?',
  },
  {
    id: 'tpl-accounts-2',
    category: 'Accounts',
    prompt: 'Show me accounts with declining engagement this quarter',
  },
  {
    id: 'tpl-accounts-3',
    category: 'Accounts',
    prompt: 'Where do we have whitespace in our top 10 accounts?',
  },
  {
    id: 'tpl-accounts-4',
    category: 'Accounts',
    prompt: 'Which accounts have incomplete or outdated information?',
  },
  {
    id: 'tpl-accounts-5',
    category: 'Accounts',
    prompt: 'Which accounts represent the biggest concentration risk?',
  },
  {
    id: 'tpl-accounts-6',
    category: 'Accounts',
    prompt: 'What accounts are up for renewal in the next 90 days?',
  },
  {
    id: 'tpl-accounts-7',
    category: 'Accounts',
    prompt: 'Which accounts have we lost deals in but could re-engage?',
  },
  {
    id: 'tpl-accounts-8',
    category: 'Accounts',
    prompt: "Show me account coverage gaps in my team's territories",
  },
  {
    id: 'tpl-accounts-9',
    category: 'Accounts',
    prompt: "Which accounts haven't had a touchpoint in 60+ days?",
  },

  // Team Performance Templates
  {
    id: 'tpl-team-1',
    category: 'Team Performance',
    prompt: 'How is my team tracking against quota this quarter?',
  },
  {
    id: 'tpl-team-2',
    category: 'Team Performance',
    prompt: 'Who are my top and bottom performers this month?',
  },
  {
    id: 'tpl-team-3',
    category: 'Team Performance',
    prompt: "What's the average sales cycle by rep?",
  },
  {
    id: 'tpl-team-4',
    category: 'Team Performance',
    prompt: "Who's on track to hit accelerators this quarter?",
  },
  {
    id: 'tpl-team-5',
    category: 'Team Performance',
    prompt: "How does my team's activity compare to last month?",
  },
  {
    id: 'tpl-team-6',
    category: 'Team Performance',
    prompt: 'Which reps have the best win rate and why?',
  },
  {
    id: 'tpl-team-7',
    category: 'Team Performance',
    prompt: "Who's improved the most over the last quarter?",
  },
  {
    id: 'tpl-team-8',
    category: 'Team Performance',
    prompt: "What's the projected attainment by rep for this quarter?",
  },
  {
    id: 'tpl-team-9',
    category: 'Team Performance',
    prompt: 'Which reps are at risk of missing quota?',
  },
  {
    id: 'tpl-team-10',
    category: 'Team Performance',
    prompt: 'How does new hire ramp compare to expectations?',
  },

  // Reporting & QBRs Templates
  {
    id: 'tpl-reporting-1',
    category: 'Reporting & QBRs',
    prompt: 'Help me build the narrative for our QBR next week',
  },
  {
    id: 'tpl-reporting-2',
    category: 'Reporting & QBRs',
    prompt: 'Give me a 2-minute pipeline summary for the exec team',
  },
  {
    id: 'tpl-reporting-3',
    category: 'Reporting & QBRs',
    prompt: 'What were our biggest wins and losses this quarter?',
  },
  {
    id: 'tpl-reporting-4',
    category: 'Reporting & QBRs',
    prompt: 'What metrics should I highlight in the ops review?',
  },
  {
    id: 'tpl-reporting-5',
    category: 'Reporting & QBRs',
    prompt: 'How did we perform against plan this quarter?',
  },
  {
    id: 'tpl-reporting-6',
    category: 'Reporting & QBRs',
    prompt: "What's the story on why we missed target last month?",
  },
  {
    id: 'tpl-reporting-7',
    category: 'Reporting & QBRs',
    prompt: 'Prep me for questions the board might ask about pipeline',
  },
  {
    id: 'tpl-reporting-8',
    category: 'Reporting & QBRs',
    prompt: 'What process changes had the biggest impact this quarter?',
  },
  {
    id: 'tpl-reporting-9',
    category: 'Reporting & QBRs',
    prompt: 'Show me the quarter trending compared to last year',
  },
  {
    id: 'tpl-reporting-10',
    category: 'Reporting & QBRs',
    prompt: 'What should I tell the team in our all-hands tomorrow?',
  },
];
