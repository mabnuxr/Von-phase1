/**
 * Templates feature types
 * Self-contained module for prompt template functionality
 */

export type TemplateCategory =
  | 'Popular'
  | 'Pipeline'
  | 'Coaching'
  | 'Deals'
  | 'Forecast'
  | 'Accounts'
  | 'Reporting & QBR';

export interface Template {
  id: string;
  category: TemplateCategory;
  shortPrompt: string;
  prompt: string;
  isPopular?: boolean;
}

export interface TemplatesState {
  templates: Template[];
  activeCategory: TemplateCategory;
}

export const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  'Popular',
  'Pipeline',
  'Coaching',
  'Deals',
  'Forecast',
  'Accounts',
  'Reporting & QBR',
];

// Default templates organized by category for sales teams
// Based on quick prompts for revenue operations workflows
// Templates with isPopular: true will appear in both Popular and their main category
// Popular templates are ordered by their index in this array (popularity order from sheet)
export const DEFAULT_TEMPLATES: Template[] = [
  // ============================================
  // POPULAR TEMPLATES (ordered by popularity rank)
  // ============================================
  // Popularity: 1
  {
    id: 'tpl-forecast-1',
    category: 'Forecast',
    shortPrompt: 'Which commit deals should I be worried about?',
    prompt: `Look at my / my team's new business commit and tell me what I should worry about. Flag deals with low engagement, slipped dates, or quiet champions. Use calls and emails to check activity.`,
    isPopular: true,
  },
  // Popularity: 2
  {
    id: 'tpl-deals-1',
    category: 'Deals',
    shortPrompt: 'Give me a rundown on my top deals this week',
    prompt: `What are the top new business deals right now? Give me stage, health, last activity from calls and emails, risks, and what's next. Keep it tight.`,
    isPopular: true,
  },
  // Popularity: 3
  {
    id: 'tpl-accounts-1',
    category: 'Accounts',
    shortPrompt: 'Which accounts are at risk of churning?',
    prompt: `Which of the accounts are showing churn risk? Look for declining engagement in calls and emails, negative sentiment, champion changes, or complaints. Tell me who to save and how.`,
    isPopular: true,
  },
  // Popularity: 4
  {
    id: 'tpl-deals-2',
    category: 'Deals',
    shortPrompt: 'Which deals need attention this week?',
    prompt: `Which of my / my team's new business deals need attention this week? Break it down — which need exec help, which have blockers, which are going dark. Use calls and emails to figure out what's happening.`,
    isPopular: true,
  },
  // Popularity: 5
  {
    id: 'tpl-coaching-2',
    category: 'Coaching',
    shortPrompt: "Give me a summary of Rep's performance this month",
    prompt: `How's {{rep_name}} doing this month? Pull their numbers across new business and renewals, wins/losses, activity, and call quality. Give me the quick version. Use calls and emails for better context`,
    isPopular: true,
  },
  // Popularity: 6
  {
    id: 'tpl-pipeline-1',
    category: 'Pipeline',
    shortPrompt: 'How healthy is my pipeline right now?',
    prompt: `Quick health check on my / my team's new business pipeline — total value, stage mix, deal ages, anything to worry about. Flag what needs attention.`,
    isPopular: true,
  },
  // Popularity: 6 (tied)
  {
    id: 'tpl-forecast-3',
    category: 'Forecast',
    shortPrompt: 'Prep me for the forecast call',
    prompt: `Forecast call coming up — show me where I / my team stand on new business, what moved in or out of commit, and deals at risk. Use calls and emails to flag anything I should know.`,
    isPopular: true,
  },
  // Popularity: 7
  {
    id: 'tpl-pipeline-3',
    category: 'Pipeline',
    shortPrompt: 'Show me deals stuck in the same stage for 2+ weeks',
    prompt: `Which of the new business deals haven't moved stage in 2+ weeks? Show me when we last engaged using calls and emails, and what to do next.`,
    isPopular: true,
  },
  // Popularity: 8
  {
    id: 'tpl-reporting-1',
    category: 'Reporting & QBR',
    shortPrompt: 'Give me a 2-minute pipeline summary',
    prompt: `I need to brief leadership on my / my team's new business pipeline. Give me the exec version — total pipeline, coverage, top deals, key risks, and outlook. Tight enough for 2 minutes.`,
    isPopular: true,
  },

  // ============================================
  // COACHING TEMPLATES (1:1 & Coaching) - Non-popular
  // ============================================
  {
    id: 'tpl-coaching-1',
    category: 'Coaching',
    shortPrompt: 'Help me prepare for my upcoming 1:1',
    prompt: `Prep me for my next 1:1 — check my calendar, pull what's happened on my / my rep's deals this week, wins/losses and why, and what we should discuss. Use calls and emails for context. Keep it brief.`,
    isPopular: false,
  },
  {
    id: 'tpl-coaching-3',
    category: 'Coaching',
    shortPrompt: 'Which of my reps needs attention this week?',
    prompt: `Who on my team needs my attention this week? Check for at-risk new business deals, low activity, or coaching moments from their calls. Rank them for me.`,
    isPopular: false,
  },
  {
    id: 'tpl-coaching-4',
    category: 'Coaching',
    shortPrompt: 'Show me coaching moments from recent calls',
    prompt: `Find coaching moments from my / my team's new business calls this week — objections fumbled, discovery questions missed, or things that went well. Pull timestamps so I can review them.`,
    isPopular: false,
  },
  {
    id: 'tpl-coaching-5',
    category: 'Coaching',
    shortPrompt: 'What talk tracks are working best for objections?',
    prompt: `Find new business calls we handled objections well and the deal moved forward. Show me what was said so I can reuse it. Use calls and emails for better context`,
    isPopular: false,
  },
  {
    id: 'tpl-coaching-6',
    category: 'Coaching',
    shortPrompt: 'How did the rep handle calls this week?',
    prompt: `Pull {{rep_name}}'s calls from this week. How'd they handle objections, run discovery, set next steps? Give me the highlights and what to coach on.`,
    isPopular: false,
  },

  // ============================================
  // FORECAST TEMPLATES - Non-popular
  // ============================================
  {
    id: 'tpl-forecast-2',
    category: 'Forecast',
    shortPrompt: "What's changed in the forecast since last week?",
    prompt: `What moved in forecast since last week? Deals in or out of commit, amounts changed, new pipeline. Tell me why things moved using calls and emails.`,
    isPopular: false,
  },
  {
    id: 'tpl-forecast-4',
    category: 'Forecast',
    shortPrompt: 'Show me upside deals that could pull in',
    prompt: `What new business deals in my / my team's pipeline could pull into this quarter if I push? Show me deals with momentum based on recent calls and emails.`,
    isPopular: false,
  },

  // ============================================
  // DEALS TEMPLATES - Non-popular
  // ============================================
  {
    id: 'tpl-deals-3',
    category: 'Deals',
    shortPrompt: "What's happening with on a deal?",
    prompt: `Give me the full story on {{deal_name}}, where it stands, recent calls and emails, who's involved, any risks, and what we need to do next.`,
    isPopular: false,
  },
  {
    id: 'tpl-deals-4',
    category: 'Deals',
    shortPrompt: 'What did prospects say about pricing this week?',
    prompt: `Any pricing pushback on my / my team's new business deals this week? Pull from calls where pricing came up — what they said, how we handled it, and if it's becoming a pattern.`,
    isPopular: false,
  },
  {
    id: 'tpl-deals-5',
    category: 'Deals',
    shortPrompt: "What's blocking my late-stage deals?",
    prompt: `What's holding up my / my team's late-stage new business deals? Check calls and emails for blockers — legal, pricing, technical, approvals. Tell me what's stuck and how to clear it.`,
    isPopular: false,
  },
  {
    id: 'tpl-deals-6',
    category: 'Deals',
    shortPrompt: 'Help me prep for my meetings today',
    prompt: `Prep me for my meetings today — check my calendar, match to deals, and for each one tell me: what's the deal status, what did we discuss last in calls/emails, and what should I aim for. Keep it quick.`,
    isPopular: false,
  },
  {
    id: 'tpl-deals-7',
    category: 'Deals',
    shortPrompt: 'Show me deals I can accelerate this week',
    prompt: `Which of the new business deals have momentum I can push harder on? Look for strong engagement in calls and emails, active champions, clear urgency. Tell me how to speed them up.`,
    isPopular: false,
  },

  // ============================================
  // PIPELINE TEMPLATES - Non-popular
  // ============================================
  {
    id: 'tpl-pipeline-2',
    category: 'Pipeline',
    shortPrompt: 'Where are deals getting stuck?',
    prompt: `Where's my / my team's new business pipeline getting stuck? Show me which stages have deals sitting too long and why. Use calls to figure out what's stalling them.`,
    isPopular: false,
  },
  {
    id: 'tpl-pipeline-4',
    category: 'Pipeline',
    shortPrompt: 'What is the pipeline generated for the month?',
    prompt: `How much new business pipeline was created this month? Show me new deals, where they came from, and how it compares to usual pace.`,
    isPopular: false,
  },
  {
    id: 'tpl-pipeline-5',
    category: 'Pipeline',
    shortPrompt: 'Show me new deals that entered pipeline this week',
    prompt: `What's new in my / my team's new business pipeline this week? Show me the deals, sizes, sources, and any early signals from calls or emails.`,
    isPopular: false,
  },
  {
    id: 'tpl-pipeline-6',
    category: 'Pipeline',
    shortPrompt: "Update next steps based on last week's calls",
    prompt: `Go through my new business calls from last week and update next steps in Salesforce. Flag where things are out of sync or where commitments haven't been met. Update SFDC for me.`,
    isPopular: false,
  },

  // ============================================
  // ACCOUNTS TEMPLATES - Non-popular
  // ============================================
  {
    id: 'tpl-accounts-2',
    category: 'Accounts',
    shortPrompt: 'Which accounts are up for renewal soon?',
    prompt: `Show me my / my team's renewals coming in the next 90 days. For each, give me the value, health based on recent calls and engagement, expansion potential, and any risks.`,
    isPopular: false,
  },
  {
    id: 'tpl-accounts-3',
    category: 'Accounts',
    shortPrompt: "What's the health of an Account?",
    prompt: `Give me the full picture on {{account_name}} all the deals, key contacts, recent sentiment from calls, and any risk or expansion signals.`,
    isPopular: false,
  },
  {
    id: 'tpl-accounts-4',
    category: 'Accounts',
    shortPrompt: 'Build me an account scoring model',
    prompt: `Look at new business wins and losses from the last year — firmographics, engagement patterns from calls and emails, buying signals. Build me a scoring model and score my current pipeline against it.`,
    isPopular: false,
  },
  {
    id: 'tpl-accounts-5',
    category: 'Accounts',
    shortPrompt: 'Help me prepare for my meeting with an Account',
    prompt: `Meeting with {{account_name}} coming up — pull our history, recent calls and emails, deals, and tell me what to focus on.`,
    isPopular: false,
  },

  // ============================================
  // REPORTING & QBR TEMPLATES - Non-popular
  // ============================================
  {
    id: 'tpl-reporting-2',
    category: 'Reporting & QBR',
    shortPrompt: 'What were my biggest wins and losses this quarter?',
    prompt: `Recap the quarter — what new business did we win and why, what did we lose and why? Show me the patterns.`,
    isPopular: false,
  },
  {
    id: 'tpl-reporting-3',
    category: 'Reporting & QBR',
    shortPrompt: 'Show me our activity metrics',
    prompt: `How's my / my team's activity this month? Calls, meetings, emails, pipeline touched.`,
    isPopular: false,
  },
];
