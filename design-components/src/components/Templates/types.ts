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
// Popular templates are ordered by their index in the sheet
export const DEFAULT_TEMPLATES: Template[] = [
  // ============================================
  // COACHING TEMPLATES (1:1 & Coaching)
  // ============================================
  {
    id: 'tpl-coaching-1',
    category: 'Coaching',
    shortPrompt: 'Help me prepare for my upcoming 1:1',
    prompt: `Help me prepare for my upcoming 1:1. First, check my role to contextualize this request. If I'm a manager, look at my GCal and identify the rep I have a 1:1 with next, then analyze their performance. If I'm a rep, prepare me for my 1:1 with my manager by summarizing my own performance.

Create a rundown covering:
(1) Deals that have had impactful positive or negative activities in the last 7 days
(2) Deals won and lost with a concise one-liner on why we won or lost
(3) Key talking points or areas needing discussion.

Use SFDC, Von IQ, Calls, and Emails for context. Keep each deal to a 2-liner max that's easy to consume and actionable.`,
    isPopular: false,
  },
  {
    id: 'tpl-coaching-2',
    category: 'Coaching',
    shortPrompt: "Give me a summary of {{rep_name}}'s performance this month",
    prompt: `Pull {{rep_name}}'s data from SFDC, Calls, and Emails for this month. Summarize:

(1) ARR attainment and pipeline generated
(2) Deals won and lost with brief reasons
(3) Activity levels — calls made, emails sent, meetings held
(4) Call quality trends from Calls analysis
(5) Areas of strength and areas needing development.

Keep it to a 1-page equivalent, scannable sections with 2-liners per insight.`,
    isPopular: true,
  },
  {
    id: 'tpl-coaching-3',
    category: 'Coaching',
    shortPrompt: 'Which of my reps needs attention this week?',
    prompt: `Check my role to confirm I'm a manager. Analyze my team across SFDC, Von IQ, Calls, and Emails to identify which rep needs my attention most this week.

Consider:
(1) Reps with at-risk deals or slipping commit
(2) Reps with low activity or engagement compared to their peers
(3) Reps with upcoming key meetings or deal milestones
(4) Reps showing coaching moments in recent calls.

Rank my reps by urgency and give me a 2-liner on why each needs attention.`,
    isPopular: false,
  },
  {
    id: 'tpl-coaching-4',
    category: 'Coaching',
    shortPrompt: 'Show me coaching moments from recent calls',
    prompt: `Check my role. If I'm a manager, surface coaching moments from my team's calls in the last 7 days for new business deals. If I'm a rep, surface moments from my own calls where I could improve.

Use Calls data to identify:
(1) Objections that weren't handled well
(2) Missed discovery questions
(3) Pricing or competitor discussions that could have gone better
(4) Positive moments to replicate.

Provide specific call references with timestamps where possible. Keep each insight to a 2-liner with the call name and what to focus on.`,
    isPopular: false,
  },
  {
    id: 'tpl-coaching-5',
    category: 'Coaching',
    shortPrompt: 'What talk tracks are working best for objections?',
    prompt: `Check my role. Search through Calls for new business deals where objections (e.g., pricing, competitor, timing) were raised. Identify successful talk tracks where the objection was overcome and the deal progressed in SFDC.

Pull 3-5 examples with:
(1) The exact language or approach used
(2) The rep who used it
(3) The outcome.

Format as a mini playbook I can reference or share with my team.`,
    isPopular: false,
  },
  {
    id: 'tpl-coaching-6',
    category: 'Coaching',
    shortPrompt: 'How did {{rep_name}} handle their calls this week?',
    prompt: `Pull all Calls for {{rep_name}} from this week for new business deals.

Analyze:
(1) Overall call quality and engagement
(2) How they handled objections
(3) Discovery depth and question quality
(4) Next steps set and follow-through
(5) Standout moments — both positive and needs improvement.

Cross-reference with SFDC to see if calls moved deals forward. Summarize with specific call references and 2-liner takeaways.`,
    isPopular: false,
  },

  // ============================================
  // FORECAST TEMPLATES
  // ============================================
  {
    id: 'tpl-forecast-1',
    category: 'Forecast',
    shortPrompt: 'Which commit deals should I be worried about?',
    prompt: `Check my role. Pull the current new business commit from SFDC — show me the total commit number and the deals that make it up.

For each deal in commit, assess the risk of it not closing based on:
(1) Von IQ health score — flag anything below threshold
(2) Days since last meaningful activity in Calls or Emails
(3) Number of times the close date has been pushed
(4) Engagement level — is the champion active or gone quiet?
(5) Historical patterns — does this deal type typically close on time?

Group deals into: Solid (high confidence), At Risk (warning signs), and Unlikely (should probably be moved out). Show the commit value that's solid vs. at risk.

If I'm a manager, break this down by rep and suggest questions I should ask each rep about their at-risk deals in the forecast call.`,
    isPopular: true,
  },
  {
    id: 'tpl-forecast-2',
    category: 'Forecast',
    shortPrompt: "What's changed in the forecast since last week?",
    prompt: `Check my role. Compare this week's forecast snapshot against last week from SFDC for new business deals.

Show me:
(1) Deals that moved into commit
(2) Deals that moved out of commit with reasons
(3) Deal amounts that changed (up or down)
(4) New deals added to pipeline
(5) Deals that closed or were lost.

Use Von IQ and recent Calls/Emails to add context on why changes happened. Keep each change to a 2-liner with deal name, what changed, and why.`,
    isPopular: false,
  },
  {
    id: 'tpl-forecast-3',
    category: 'Forecast',
    shortPrompt: 'Prep me for the forecast call',
    prompt: `Help me prepare for my forecast call. Check my role — if I'm a leader, summarize my team's forecast; if I'm a rep, summarize my own. Focus on new business deals.

Pull from SFDC and Von IQ, calls and email (if required) to show:
(1) Current commit vs. target with gap analysis
(2) Deals that moved into or out of commit since last week
(3) Key deals in commit and their risk level based on recent activity from Calls and Emails
(4) Upside deals that could pull in and deals that were pushed out of the quarter
(5) Deals at risk of slipping with reasons.

Format as a forecast brief — scannable with clear commit/upside/risk sections.`,
    isPopular: true,
  },
  {
    id: 'tpl-forecast-4',
    category: 'Forecast',
    shortPrompt: 'Show me upside deals that could pull in',
    prompt: `Check my role. Pull new business deals from SFDC that are in best case or pipeline but not commit. Use Von IQ scores and recent Calls/Emails to identify which have momentum:

(1) Recent positive activity or engagement
(2) Strong call sentiment
(3) Shorter time in stage than average
(4) Decision maker involvement.

Rank by likelihood to pull in and give me a 2-liner per deal on what would need to happen to accelerate it.`,
    isPopular: false,
  },

  // ============================================
  // DEALS TEMPLATES
  // ============================================
  {
    id: 'tpl-deals-1',
    category: 'Deals',
    shortPrompt: 'Give me a rundown on my top deals this week',
    prompt: `Check my role and pull my top new business deals (or team's if I'm a manager) from SFDC ranked by value and close date proximity.

For each top deal show:
(1) Current stage and Von IQ health score
(2) Last activity from Calls and Emails
(3) Key risks or blockers
(4) Next steps and what's scheduled in GCal.

Keep each deal to a 2-3 liner. Help me know where to focus my energy this week.`,
    isPopular: true,
  },
  {
    id: 'tpl-deals-2',
    category: 'Deals',
    shortPrompt: 'Which deals need attention this week?',
    prompt: `Check my role. Pull my open new business deals (or team's if I'm a manager) from SFDC, Von IQ, Calls, and Emails. Categorize deals that need intervention into these buckets:

Executive Alignment Required — Deals where exec involvement could accelerate or save the deal:
(1) Large deal size
(2) Economic buyer or C-level on their side not yet engaged
(3) Stalled at late stage with no movement
(4) Competitor exec is involved but ours isn't
(5) Multi-stakeholder or committee decision pending.

For each, suggest what type of exec involvement — intro email, joint call, dinner, escalation.

Blockers to Resolve — Deals stuck due to specific obstacles:
(1) Legal or procurement delays — waiting on redlines or approvals
(2) Technical concerns or validation pending
(3) Budget or pricing objection unresolved
(4) Internal champion waiting on their leadership sign-off
(5) Integration or security review in progress.

For each, surface the blocker from Calls/Emails and suggest how to unblock.

Re-engagement Needed — Deals going dark:
(1) No activity in 7+ days despite close date within 14 days
(2) Champion or key contact stopped responding
(3) No next meeting in GCal
(4) Von IQ score dropped from previous week.

For each, suggest re-engagement tactics — multi-thread to another contact, try different channel, send value-add content, or involve exec.

Monitor Closely — Deals with early warning signs but not critical yet:
(1) Negative sentiment in recent call but deal still progressing
(2) Close date pushed once already
(3) Engagement slowing but not dead.

Flag these so I keep an eye on them.

For each deal, give me: Deal name, amount, current stage, the issue, and a specific 1-liner action. Prioritize by deal size and close date urgency.`,
    isPopular: true,
  },
  {
    id: 'tpl-deals-3',
    category: 'Deals',
    shortPrompt: "What's happening with {{deal_name}}?",
    prompt: `Check my role. Deep dive on {{deal_name}}. Pull from SFDC for deal details, Von IQ for health assessment, Calls for recent conversations, and Emails for communication history.

Tell me:
(1) Current status and stage
(2) Recent activity timeline
(3) Key stakeholders and their engagement level
(4) Risks or concerns surfaced in calls
(5) What needs to happen next to move forward.

Give me the full picture in a scannable format.`,
    isPopular: false,
  },
  {
    id: 'tpl-deals-4',
    category: 'Deals',
    shortPrompt: 'What did prospects say about pricing this week?',
    prompt: `Check my role. Search through this week's Calls for new business deals where pricing was discussed.

Pull out:
(1) Specific objections or concerns raised
(2) Competitor pricing mentions
(3) Budget constraints surfaced
(4) How the conversation was handled — well or poorly
(5) Deal names and stages where pricing came up.

Help me understand if pricing is becoming a broader blocker and how we're handling it.`,
    isPopular: false,
  },
  {
    id: 'tpl-deals-5',
    category: 'Deals',
    shortPrompt: "What's blocking my late-stage deals?",
    prompt: `Check my role. Pull new business deals in late stages (negotiation, contract, etc.) from SFDC and analyze blockers from Calls, Emails, and Von IQ.

Identify:
(1) Legal or procurement delays
(2) Stakeholder or approval issues
(3) Technical concerns not yet resolved
(4) Pricing or term negotiations
(5) Competition still in play.

For each deal, give me the specific blocker and suggested action to unblock.`,
    isPopular: false,
  },
  {
    id: 'tpl-deals-6',
    category: 'Deals',
    shortPrompt: 'Help me prep for my meetings today',
    prompt: `Check my role. Pull my GCal for today and identify all external meetings (exclude internal 1:1s and team meetings). For each meeting, match the attendees or account to SFDC.

For each meeting, give me a brief covering:
(1) Context — Account name, open opportunities, deal stage and value
(2) Last interaction — Summary of the most recent Call or Email thread with this contact/account
(3) Deal health — Von IQ score and any risk signals
(4) Key topics likely to come up — Based on where we are in the sales cycle and recent conversation themes
(5) Goal for this meeting — What should I aim to accomplish or move forward?

Flag any meetings where:
(1) There's no recent activity — I'm going in cold
(2) The deal has risk signals I should address
(3) New stakeholders are attending I haven't met before.

Keep each meeting prep to a scannable 4-5 liner. Order by meeting time so I can prep sequentially through my day.

If I'm a manager and have customer meetings, prep those. If I have internal deal reviews, prep me with the deal context instead.`,
    isPopular: false,
  },
  {
    id: 'tpl-deals-7',
    category: 'Deals',
    shortPrompt: 'Show me deals I can accelerate this week',
    prompt: `Check my role. Analyze my new business pipeline from SFDC and Von IQ to find deals with acceleration potential.

Look for:
(1) High Von IQ scores but not in late stage
(2) Strong recent engagement in Calls and Emails
(3) Champion pushing internally
(4) Clear timeline or urgency
(5) All stakeholders engaged.

For each deal, suggest acceleration tactics — schedule demo, send proposal, bring in exec, etc.`,
    isPopular: false,
  },

  // ============================================
  // PIPELINE TEMPLATES
  // ============================================
  {
    id: 'tpl-pipeline-1',
    category: 'Pipeline',
    shortPrompt: 'How healthy is my pipeline right now?',
    prompt: `Check my role. Give me a pipeline health assessment for new business deals. Pull from SFDC and Von IQ to analyze:

(1) Total pipeline value and coverage ratio
(2) Stage distribution — is it balanced?
(3) Average deal age and velocity
(4) Deals with strong vs. weak health scores
(5) Recent pipeline added vs. pipeline lost.

Highlight the top concerns and what I should focus on. Format as a health scorecard with green/yellow/red indicators.`,
    isPopular: true,
  },
  {
    id: 'tpl-pipeline-2',
    category: 'Pipeline',
    shortPrompt: 'Where are deals getting stuck?',
    prompt: `Check my role. Analyze my new business pipeline (or team's if I'm a manager) from SFDC for bottlenecks.

Identify:
(1) Stages with longest average time
(2) Deals currently stuck longer than average in each stage
(3) Common reasons for stalling — from Calls and Von IQ signals
(4) Conversion rates by stage to find the leakiest points.

Give me specific deals that need attention and suggested actions to unstick them.`,
    isPopular: false,
  },
  {
    id: 'tpl-pipeline-3',
    category: 'Pipeline',
    shortPrompt: 'Show me deals stuck in the same stage for 2+ weeks',
    prompt: `Check my role. Pull from SFDC all new business deals (mine or my team's based on role) that haven't moved stage in 14+ days.

For each deal, show:
(1) Current stage and days in stage
(2) Last activity from Calls and Emails
(3) Von IQ health score
(4) Suggested next action to move it forward.

Flag deals that may need to be re-qualified or removed from pipeline. Keep each deal to a 2-liner.`,
    isPopular: true,
  },
  {
    id: 'tpl-pipeline-4',
    category: 'Pipeline',
    shortPrompt: 'What is the pipeline generated for the month?',
    prompt: `Check my role. Pull my activity from SFDC and show new business pipeline I created this month:

(1) New deals added with amounts and sources
(2) Meetings that converted to opportunities
(3) Total pipeline value added
(4) How it compares to my monthly average or target.

If I'm a manager, break this down by rep. Show both volume (number of deals) and value.`,
    isPopular: false,
  },
  {
    id: 'tpl-pipeline-5',
    category: 'Pipeline',
    shortPrompt: 'Show me new deals that entered pipeline this week',
    prompt: `Check my role. Pull from SFDC all new business deals created in the last 7 days (mine or team's based on role).

For each new deal, show:
(1) Account name and deal size
(2) Source — how it came in
(3) Stage and expected close date
(4) Key contacts and initial engagement
(5) Any early signals from Calls or Emails.

Help me understand what's new and what needs immediate attention.`,
    isPopular: false,
  },
  {
    id: 'tpl-pipeline-6',
    category: 'Pipeline',
    shortPrompt: "Update next steps based on last week's calls",
    prompt: `Check my role. Pull my Calls from the last 7 days for new business deals and match them to deals in SFDC.

For each call, extract:
(1) What the prospect committed to
(2) What I committed to
(3) Any dates or deadlines mentioned
(4) New stakeholders to add.

Compare against SFDC and flag where:
(1) Next Step field doesn't match the call
(2) Close Date is unrealistic based on conversation
(3) Stage should move forward or backward
(4) I promised something I haven't done yet.

For each deal, show: Deal name | What was agreed | What SFDC says | Recommended update.

Update SFDC with the corrected next steps, dates, and stage changes. Summarize what was updated.

If I'm a manager, show this across my team and flag reps with the most mismatches.`,
    isPopular: false,
  },

  // ============================================
  // ACCOUNTS TEMPLATES
  // ============================================
  {
    id: 'tpl-accounts-1',
    category: 'Accounts',
    shortPrompt: 'Which accounts are at risk of churning?',
    prompt: `Check my role. Analyze my accounts (or team's if I'm a manager) from SFDC, Calls, and Emails for churn risk signals. Focus on existing customers.

Flag accounts with:
(1) Declining engagement or contact frequency
(2) Negative sentiment in recent calls
(3) Champion departure or change
(4) Support issues or complaints
(5) Usage decline if data available.

For each at-risk account, give me the warning signs and suggested save plays.`,
    isPopular: true,
  },
  {
    id: 'tpl-accounts-2',
    category: 'Accounts',
    shortPrompt: 'Which accounts are up for renewal soon?',
    prompt: `Check my role. Pull from SFDC all accounts with renewals in the next 90 days (mine or team's based on role).

For each upcoming renewal, show:
(1) Renewal date and contract value
(2) Account health signals from Calls and engagement
(3) Expansion potential alongside renewal
(4) Risks or concerns to address
(5) Suggested prep actions.

Prioritize by value and risk.`,
    isPopular: false,
  },
  {
    id: 'tpl-accounts-3',
    category: 'Accounts',
    shortPrompt: "What's the health of {{account_name}}?",
    prompt: `Check my role. Deep dive on {{account_name}}. Pull from SFDC for all relationship data, Calls for recent conversations, Emails for communication patterns, and Von IQ for deal health.

Show me:
(1) All open and recent closed opportunities (new business and renewals)
(2) Key contacts and engagement levels
(3) Recent sentiment from calls
(4) Support or issues if any
(5) Expansion or risk signals.

Give me the full account picture.`,
    isPopular: false,
  },
  {
    id: 'tpl-accounts-4',
    category: 'Accounts',
    shortPrompt: 'Build me an account scoring model',
    prompt: `Check my role. Analyze my closed-won and closed-lost new business deals from SFDC over the last 12 months to identify patterns that predict account success. Build a scoring model based on:

Firmographic Fit —
(1) Company size — which employee ranges convert best?
(2) Industry — which verticals have highest win rates?
(3) Geography — any regional patterns?
(4) Tech stack or tools used if available
(5) Funding stage or company maturity.

Engagement Signals —
From Calls and Emails, identify what early engagement looks like in deals we won:
(1) Response time to outreach
(2) Number of stakeholders engaged in first 30 days
(3) Meeting attendance and participation patterns
(4) Inbound vs. outbound — which converts better?
(5) Content or assets they engaged with.

Relationship & Access —
(1) Seniority of first contact — does starting higher help?
(2) Multi-threading depth — how many contacts before close?
(3) Executive involvement — ours or theirs
(4) Champion strength signals from call sentiment
(5) Speed to economic buyer access.

Buying Signals from Conversations —
Mine Calls for phrases or topics that appeared in won deals:
(1) Timeline or urgency language
(2) Pain acknowledgment depth
(3) Budget discussions initiated by them
(4) Competitive mentions — who were we beating?
(5) Internal initiative or mandate references.

Deal Characteristics —
(1) Average sales cycle by segment
(2) Deal size correlation with win rate
(3) Discount patterns — do we win more or less with discounts?
(4) Product mix or use case fit.

Based on this analysis, create a weighted scoring model with:
(1) The top 10 attributes that predict success
(2) Suggested point values for each attribute
(3) Score thresholds — what score = hot, warm, cold?
(4) Which of my current open new Biz pipeline deals score highest using this model.

Show me the open deals/accounts that I should prioritize and that may not be a fit.`,
    isPopular: false,
  },
  {
    id: 'tpl-accounts-5',
    category: 'Accounts',
    shortPrompt: 'Help me prepare for my meeting with {{account_name}}',
    prompt: `I have a meeting with {{account_name}} coming up. Check my GCal for the meeting details. Pull from SFDC for account and opportunity context, Calls for recent conversation history, and Emails for communication thread.

Prepare me with:
(1) Account overview and our relationship status
(2) Open opportunities and their status (new business and renewals)
(3) Key points from recent conversations
(4) Topics likely to come up
(5) Goals I should have for this meeting.`,
    isPopular: false,
  },

  // ============================================
  // REPORTING & QBR TEMPLATES
  // ============================================
  {
    id: 'tpl-reporting-1',
    category: 'Reporting & QBR',
    shortPrompt: 'Give me a 2-minute pipeline summary',
    prompt: `Check my role. Prepare a brief new business pipeline summary I can share with leadership. Pull from SFDC and Von IQ to cover:

(1) Total pipeline value and coverage ratio
(2) Pipeline by stage
(3) Top deals and their status
(4) Key risks in pipeline
(5) Outlook for the quarter.

Keep it executive-level — high signal, no fluff, 2-minute verbal delivery length.`,
    isPopular: true,
  },
  {
    id: 'tpl-reporting-2',
    category: 'Reporting & QBR',
    shortPrompt: 'What were my biggest wins and losses this quarter?',
    prompt: `Check my role. Pull from SFDC all new business deals closed (won and lost) this quarter (mine or team's based on role).

For each win, summarize: what made it successful.
For each loss, summarize: why we lost.

Cross-reference with Calls for competitive mentions or key moments. Identify patterns — what's working and what's not. Format as a wins/losses briefing with actionable takeaways.`,
    isPopular: false,
  },
  {
    id: 'tpl-reporting-3',
    category: 'Reporting & QBR',
    shortPrompt: 'Show me our activity metrics',
    prompt: `Check my role. If I'm a rep, show my activity. If I'm a manager, show team activity broken down by rep.

Pull from SFDC, Calls, and Emails for this month:
(1) Calls made and meetings held
(2) Emails sent and response rates
(3) Pipeline touched or generated.

Keep it scannable — I want to know in 30 seconds if I'm on track and what to fix.`,
    isPopular: false,
  },
];
