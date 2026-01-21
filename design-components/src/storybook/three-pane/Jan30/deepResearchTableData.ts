/**
 * Deep Research Data Tables - Sample Data for Data Reference Drawer
 *
 * Contains raw data tables with hundreds of rows that can be
 * filtered, sorted, and have AI columns added.
 */

import type { ReportColumn, AIReasoningData } from '../../../components/ReportTable/ReportTable';

// ============================================================================
// Types
// ============================================================================

export interface DataTableConfig {
  id: string;
  name: string;
  description: string;
  columns: ReportColumn[];
  data: Record<string, unknown>[];
  aiReasoningData?: Record<string, AIReasoningData>;
  rowCount: number;
}

// ============================================================================
// Salesforce Opportunities Table (200+ rows)
// ============================================================================

const opportunityColumns: ReportColumn[] = [
  { id: 'name', label: 'Opportunity Name', type: 'text', width: 200, sortable: true },
  { id: 'accountName', label: 'Account', type: 'text', width: 160, sortable: true },
  { id: 'ownerName', label: 'Owner', type: 'text', width: 120, sortable: true },
  { id: 'amount', label: 'Amount', type: 'currency', width: 110, sortable: true },
  { id: 'stage', label: 'Stage', type: 'picklist', width: 130, sortable: true },
  {
    id: 'dealScore',
    label: 'Deal Score',
    type: 'number',
    width: 100,
    sortable: true,
    isAI: true,
    aiPrompt:
      'Calculate deal health score (0-100) based on engagement, stage velocity, and buyer signals.',
    aiDataSources: ['Salesforce Activity', 'Gong Calls', 'Email Engagement'],
  },
  {
    id: 'riskFlag',
    label: 'Risk Flag',
    type: 'picklist',
    width: 100,
    sortable: true,
    isAI: true,
    aiPrompt:
      'Identify risk level (Low/Medium/High) based on deal stagnation and competitive presence.',
    aiDataSources: ['Stage Duration', 'Competitor Mentions', 'Champion Activity'],
  },
  {
    id: 'winProbability',
    label: 'Win Probability',
    type: 'percentage',
    width: 120,
    sortable: true,
    isAI: true,
    aiPrompt:
      'Predict win probability based on historical patterns, engagement signals, and deal characteristics.',
    aiDataSources: ['Historical Win Data', 'Engagement Metrics', 'Deal Attributes'],
  },
  {
    id: 'nextBestAction',
    label: 'Next Best Action',
    type: 'text',
    width: 180,
    sortable: true,
    isAI: true,
    aiPrompt: 'Recommend the most impactful next action to advance this deal.',
    aiDataSources: ['Deal Stage', 'Activity History', 'Playbook Analysis'],
  },
  {
    id: 'championStrength',
    label: 'Champion Strength',
    type: 'picklist',
    width: 140,
    sortable: true,
    isAI: true,
    aiPrompt:
      'Assess champion strength (Weak/Moderate/Strong) based on engagement and advocacy signals.',
    aiDataSources: ['Meeting Attendance', 'Email Engagement', 'Internal Advocacy'],
  },
  { id: 'probability', label: 'Probability', type: 'percentage', width: 100, sortable: true },
  { id: 'closeDate', label: 'Close Date', type: 'date', width: 110, sortable: true },
  { id: 'createdDate', label: 'Created', type: 'date', width: 110, sortable: true },
  { id: 'type', label: 'Type', type: 'picklist', width: 120, sortable: true },
  { id: 'leadSource', label: 'Lead Source', type: 'picklist', width: 130, sortable: true },
  { id: 'region', label: 'Region', type: 'picklist', width: 100, sortable: true },
];

const stages = [
  'Qualification',
  'Discovery',
  'Demo',
  'Proposal',
  'Negotiation',
  'Closed Won',
  'Closed Lost',
];
const owners = [
  'Sarah Chen',
  'Marcus Johnson',
  'Emily Rodriguez',
  'David Kim',
  'Jennifer Walsh',
  'Alex Thompson',
  'Lisa Park',
  'Michael Brown',
  'Rachel Green',
  'James Wilson',
];
const accounts = [
  'Acme Corp',
  'TechFlow Inc',
  'GlobalRetail',
  'DataDriven',
  'CloudNine',
  'MedHealth',
  'FinServe',
  'EduTech',
  'AutoMax',
  'FoodChain',
  'LogiTrans',
  'SecureNet',
  'GreenEnergy',
  'MediaHub',
  'TravelPro',
  'RealEstate Plus',
  'SportZone',
  'FashionFirst',
  'HomeGoods',
  'PetCare',
  'BuildRight',
  'LegalEase',
  'ConsultPro',
  'MarketerX',
  'DevOps Hub',
  'AI Solutions',
  'BlockChain Co',
  'IoT Systems',
  'VR World',
  'QuantumTech',
];
const types = ['New Business', 'Expansion', 'Renewal', 'Upsell'];
const leadSources = [
  'Website',
  'Referral',
  'Conference',
  'Outbound',
  'Partner',
  'Social Media',
  'Webinar',
];
const regions = ['West', 'East', 'Central', 'International'];
const riskFlags = ['Low', 'Medium', 'High'];
const championStrengths = ['Weak', 'Moderate', 'Strong'];
const nextBestActions = [
  'Schedule executive alignment call',
  'Send ROI case study',
  'Request technical deep-dive',
  'Follow up on proposal',
  'Introduce customer success',
  'Schedule reference call',
  'Address security concerns',
  'Negotiate contract terms',
];

function generateOpportunities(count: number): Record<string, unknown>[] {
  const data: Record<string, unknown>[] = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const stage = stages[Math.floor(Math.random() * stages.length)];
    const isClosed = stage.startsWith('Closed');
    const probability = isClosed
      ? stage === 'Closed Won'
        ? 100
        : 0
      : Math.floor(Math.random() * 80) + 10;

    const daysAgo = Math.floor(Math.random() * 180);
    const closeOffset = Math.floor(Math.random() * 90) - 30;

    const createdDate = new Date(now);
    createdDate.setDate(createdDate.getDate() - daysAgo);

    const closeDate = new Date(now);
    closeDate.setDate(closeDate.getDate() + closeOffset);

    const account = accounts[Math.floor(Math.random() * accounts.length)];
    const amount = Math.floor(Math.random() * 450000) + 5000;

    data.push({
      id: `opp-${i + 1}`,
      name: `${account} - ${types[Math.floor(Math.random() * types.length)]} Q${Math.ceil((closeDate.getMonth() + 1) / 3)} ${closeDate.getFullYear()}`,
      accountName: account,
      ownerName: owners[Math.floor(Math.random() * owners.length)],
      amount,
      stage,
      probability: probability / 100,
      closeDate: closeDate.toISOString().split('T')[0],
      createdDate: createdDate.toISOString().split('T')[0],
      type: types[Math.floor(Math.random() * types.length)],
      leadSource: leadSources[Math.floor(Math.random() * leadSources.length)],
      region: regions[Math.floor(Math.random() * regions.length)],
      dealScore: Math.floor(Math.random() * 40) + 60,
      riskFlag: riskFlags[Math.floor(Math.random() * riskFlags.length)],
      winProbability: Math.random() * 0.5 + 0.3,
      nextBestAction: nextBestActions[Math.floor(Math.random() * nextBestActions.length)],
      championStrength: championStrengths[Math.floor(Math.random() * championStrengths.length)],
    });
  }

  return data;
}

// ============================================================================
// Gong Calls Table (150+ rows)
// ============================================================================

const gongCallColumns: ReportColumn[] = [
  { id: 'title', label: 'Call Title', type: 'text', width: 220, sortable: true },
  { id: 'accountName', label: 'Account', type: 'text', width: 150, sortable: true },
  { id: 'ownerName', label: 'Rep', type: 'text', width: 120, sortable: true },
  { id: 'date', label: 'Date', type: 'date', width: 100, sortable: true },
  {
    id: 'engagementScore',
    label: 'Engagement',
    type: 'number',
    width: 100,
    sortable: true,
    isAI: true,
    aiPrompt:
      'Calculate buyer engagement score (0-100) based on questions asked, objections raised, and follow-up commitments.',
    aiDataSources: ['Call Transcript', 'Question Analysis', 'Commitment Tracking'],
  },
  {
    id: 'keyInsight',
    label: 'Key Insight',
    type: 'text',
    width: 200,
    sortable: true,
    isAI: true,
    aiPrompt: 'Identify the most important insight from this call that could impact deal outcome.',
    aiDataSources: ['Transcript Analysis', 'Objection Detection', 'Competitor Mentions'],
  },
  {
    id: 'buyerSentiment',
    label: 'Buyer Sentiment',
    type: 'picklist',
    width: 130,
    sortable: true,
    isAI: true,
    aiPrompt: 'Analyze overall buyer sentiment from tone, language, and engagement patterns.',
    aiDataSources: ['Voice Tone Analysis', 'Language Patterns', 'Response Timing'],
  },
  {
    id: 'objections',
    label: 'Objections Raised',
    type: 'text',
    width: 180,
    sortable: true,
    isAI: true,
    aiPrompt: 'Extract and categorize objections raised during the call.',
    aiDataSources: ['Transcript Analysis', 'Objection Library', 'Context Detection'],
  },
  {
    id: 'competitorMentions',
    label: 'Competitors',
    type: 'text',
    width: 150,
    sortable: true,
    isAI: true,
    aiPrompt: 'Identify any competitor mentions and context of discussion.',
    aiDataSources: ['Transcript Search', 'Competitor Database', 'Context Analysis'],
  },
  { id: 'duration', label: 'Duration', type: 'text', width: 90, sortable: true },
  { id: 'participants', label: 'Participants', type: 'number', width: 100, sortable: true },
  { id: 'talkRatio', label: 'Talk Ratio', type: 'percentage', width: 100, sortable: true },
  { id: 'sentiment', label: 'Sentiment', type: 'picklist', width: 100, sortable: true },
  { id: 'stage', label: 'Deal Stage', type: 'picklist', width: 120, sortable: true },
  { id: 'nextSteps', label: 'Next Steps', type: 'text', width: 180, sortable: true },
];

const callTypes = [
  'Discovery Call',
  'Demo',
  'Technical Review',
  'Pricing Discussion',
  'Executive Alignment',
  'Negotiation',
  'Onboarding Kickoff',
  'QBR',
];
const sentiments = ['Positive', 'Neutral', 'Negative'];
const nextStepsOptions = [
  'Send proposal',
  'Schedule demo',
  'Technical POC',
  'Legal review',
  'Executive meeting',
  'Reference call',
  'Security review',
  'Pricing negotiation',
  'Contract signing',
  'No clear next steps',
];
const keyInsights = [
  'Strong champion identified',
  'Budget approved for Q1',
  'Competitor mentioned - Competitor A',
  'Technical requirements aligned',
  'Procurement process unclear',
  'Decision maker engaged',
  'Timeline accelerated',
  'Scope expansion discussed',
  'Risk of delay - legal review',
  'Multi-year interest expressed',
  'Integration concerns raised',
  'ROI validation needed',
];
const buyerSentiments = ['Very Positive', 'Positive', 'Neutral', 'Concerned', 'Skeptical'];
const objectionsList = [
  'Pricing too high',
  'Implementation timeline',
  'Security concerns',
  'Integration complexity',
  'Budget constraints',
  'Competing priorities',
  'Need more references',
  'No objections raised',
];
const competitorsList = [
  'None mentioned',
  'Competitor A',
  'Competitor B',
  'Multiple competitors',
  'In-house solution',
];

function generateGongCalls(count: number): Record<string, unknown>[] {
  const data: Record<string, unknown>[] = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const daysAgo = Math.floor(Math.random() * 90);
    const callDate = new Date(now);
    callDate.setDate(callDate.getDate() - daysAgo);

    const account = accounts[Math.floor(Math.random() * accounts.length)];
    const callType = callTypes[Math.floor(Math.random() * callTypes.length)];
    const durationMins = Math.floor(Math.random() * 45) + 15;

    data.push({
      id: `call-${i + 1}`,
      title: `${callType} - ${account}`,
      accountName: account,
      ownerName: owners[Math.floor(Math.random() * owners.length)],
      date: callDate.toISOString().split('T')[0],
      duration: `${durationMins}m`,
      participants: Math.floor(Math.random() * 5) + 2,
      talkRatio: Math.random() * 0.4 + 0.3,
      sentiment: sentiments[Math.floor(Math.random() * sentiments.length)],
      stage: stages[Math.floor(Math.random() * (stages.length - 2))],
      nextSteps: nextStepsOptions[Math.floor(Math.random() * nextStepsOptions.length)],
      engagementScore: Math.floor(Math.random() * 40) + 55,
      keyInsight: keyInsights[Math.floor(Math.random() * keyInsights.length)],
      buyerSentiment: buyerSentiments[Math.floor(Math.random() * buyerSentiments.length)],
      objections: objectionsList[Math.floor(Math.random() * objectionsList.length)],
      competitorMentions: competitorsList[Math.floor(Math.random() * competitorsList.length)],
    });
  }

  return data;
}

// ============================================================================
// Email Activity Table (300+ rows)
// ============================================================================

const emailColumns: ReportColumn[] = [
  { id: 'subject', label: 'Subject', type: 'text', width: 250, sortable: true },
  { id: 'accountName', label: 'Account', type: 'text', width: 150, sortable: true },
  { id: 'fromName', label: 'From', type: 'text', width: 120, sortable: true },
  { id: 'date', label: 'Date', type: 'date', width: 100, sortable: true },
  {
    id: 'responseTime',
    label: 'Response Time',
    type: 'text',
    width: 110,
    sortable: true,
    isAI: true,
    aiPrompt: 'Calculate average response time and compare to baseline for this account.',
    aiDataSources: ['Email Timestamps', 'Historical Response Patterns'],
  },
  {
    id: 'intentSignal',
    label: 'Intent Signal',
    type: 'picklist',
    width: 130,
    sortable: true,
    isAI: true,
    aiPrompt: 'Detect buying intent signals from email content and engagement patterns.',
    aiDataSources: ['Email Content', 'Open/Click Patterns', 'Timing Analysis'],
  },
  {
    id: 'sentimentAnalysis',
    label: 'Sentiment',
    type: 'picklist',
    width: 100,
    sortable: true,
    isAI: true,
    aiPrompt: 'Analyze email sentiment and tone of communication.',
    aiDataSources: ['Email Content', 'Language Patterns', 'Historical Context'],
  },
  {
    id: 'keyTopics',
    label: 'Key Topics',
    type: 'text',
    width: 160,
    sortable: true,
    isAI: true,
    aiPrompt: 'Extract main topics and themes discussed in the email thread.',
    aiDataSources: ['Email Content', 'Thread Analysis', 'Topic Modeling'],
  },
  {
    id: 'actionItems',
    label: 'Action Items',
    type: 'text',
    width: 180,
    sortable: true,
    isAI: true,
    aiPrompt: 'Identify action items and commitments from email content.',
    aiDataSources: ['Email Content', 'Commitment Detection', 'Follow-up Analysis'],
  },
  { id: 'toName', label: 'To', type: 'text', width: 120, sortable: true },
  { id: 'direction', label: 'Direction', type: 'picklist', width: 90, sortable: true },
  { id: 'status', label: 'Status', type: 'picklist', width: 90, sortable: true },
  { id: 'opens', label: 'Opens', type: 'number', width: 70, sortable: true },
  { id: 'clicks', label: 'Clicks', type: 'number', width: 70, sortable: true },
  { id: 'stage', label: 'Deal Stage', type: 'picklist', width: 120, sortable: true },
];

const emailSubjects = [
  'Re: Proposal for',
  'Follow up: Demo',
  'Meeting confirmed:',
  'Contract review -',
  'Questions about pricing',
  'Security questionnaire',
  'Integration requirements',
  'Next steps for',
  'Thank you for your time',
  'Introduction:',
  'Quick question about',
  'Partnership opportunity',
  'ROI analysis:',
  'Reference request',
  'Schedule update',
];
const directions = ['Outbound', 'Inbound'];
const emailStatuses = ['Sent', 'Opened', 'Clicked', 'Replied'];
const responseTimes = ['< 1 hour', '1-4 hours', '4-24 hours', '1-2 days', '> 2 days', 'No reply'];
const intentSignals = [
  'High interest',
  'Moderate interest',
  'Low interest',
  'Evaluating competitors',
  'Budget discussion',
  'Timeline concern',
  'No signal',
];
const contacts = [
  'John Smith',
  'Jane Doe',
  'Mike Wilson',
  'Sarah Johnson',
  'Tom Brown',
  'Lisa Anderson',
  'Chris Taylor',
  'Amy Davis',
];
const emailSentiments = ['Positive', 'Neutral', 'Cautious', 'Urgent', 'Formal'];
const keyTopicsList = [
  'Pricing & Terms',
  'Implementation Timeline',
  'Technical Requirements',
  'Security & Compliance',
  'ROI & Value',
  'Integration Needs',
  'Support & Training',
  'Contract Renewal',
];
const actionItemsList = [
  'Send pricing proposal',
  'Schedule technical call',
  'Provide security documentation',
  'Share case studies',
  'Follow up on contract',
  'Send integration guide',
  'Arrange demo',
  'No action items',
];

function generateEmails(count: number): Record<string, unknown>[] {
  const data: Record<string, unknown>[] = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const daysAgo = Math.floor(Math.random() * 60);
    const emailDate = new Date(now);
    emailDate.setDate(emailDate.getDate() - daysAgo);

    const account = accounts[Math.floor(Math.random() * accounts.length)];
    const direction = directions[Math.floor(Math.random() * directions.length)];
    const isInbound = direction === 'Inbound';

    data.push({
      id: `email-${i + 1}`,
      subject: `${emailSubjects[Math.floor(Math.random() * emailSubjects.length)]} ${account}`,
      accountName: account,
      fromName: isInbound
        ? contacts[Math.floor(Math.random() * contacts.length)]
        : owners[Math.floor(Math.random() * owners.length)],
      toName: isInbound
        ? owners[Math.floor(Math.random() * owners.length)]
        : contacts[Math.floor(Math.random() * contacts.length)],
      date: emailDate.toISOString().split('T')[0],
      direction,
      status: emailStatuses[Math.floor(Math.random() * emailStatuses.length)],
      opens: Math.floor(Math.random() * 8),
      clicks: Math.floor(Math.random() * 3),
      stage: stages[Math.floor(Math.random() * (stages.length - 2))],
      responseTime: responseTimes[Math.floor(Math.random() * responseTimes.length)],
      intentSignal: intentSignals[Math.floor(Math.random() * intentSignals.length)],
      sentimentAnalysis: emailSentiments[Math.floor(Math.random() * emailSentiments.length)],
      keyTopics: keyTopicsList[Math.floor(Math.random() * keyTopicsList.length)],
      actionItems: actionItemsList[Math.floor(Math.random() * actionItemsList.length)],
    });
  }

  return data;
}

// ============================================================================
// Account Activity Table (100+ rows)
// ============================================================================

const accountColumns: ReportColumn[] = [
  { id: 'name', label: 'Account Name', type: 'text', width: 180, sortable: true },
  { id: 'industry', label: 'Industry', type: 'picklist', width: 130, sortable: true },
  { id: 'revenue', label: 'Annual Revenue', type: 'currency', width: 130, sortable: true },
  {
    id: 'healthScore',
    label: 'Health Score',
    type: 'number',
    width: 100,
    sortable: true,
    isAI: true,
    aiPrompt:
      'Calculate account health score (0-100) based on engagement, deal velocity, and relationship strength.',
    aiDataSources: ['Activity History', 'Deal Progress', 'Relationship Mapping'],
  },
  {
    id: 'expansionPotential',
    label: 'Expansion',
    type: 'picklist',
    width: 100,
    sortable: true,
    isAI: true,
    aiPrompt:
      'Assess expansion potential (Low/Medium/High) based on product usage and whitespace analysis.',
    aiDataSources: ['Product Usage', 'Org Chart', 'Competitive Intel'],
  },
  {
    id: 'churnRisk',
    label: 'Churn Risk',
    type: 'picklist',
    width: 100,
    sortable: true,
    isAI: true,
    aiPrompt: 'Predict churn risk level based on engagement decline and support ticket patterns.',
    aiDataSources: ['Usage Trends', 'Support Tickets', 'NPS Scores'],
  },
  {
    id: 'executiveSponsor',
    label: 'Exec Sponsor',
    type: 'text',
    width: 140,
    sortable: true,
    isAI: true,
    aiPrompt: 'Identify executive sponsor and assess relationship strength.',
    aiDataSources: ['Meeting History', 'Email Engagement', 'Org Chart'],
  },
  {
    id: 'recommendedAction',
    label: 'Recommended Action',
    type: 'text',
    width: 180,
    sortable: true,
    isAI: true,
    aiPrompt: 'Suggest the most impactful next action for this account.',
    aiDataSources: ['Account Health', 'Activity Gaps', 'Opportunity Analysis'],
  },
  { id: 'employees', label: 'Employees', type: 'number', width: 100, sortable: true },
  { id: 'region', label: 'Region', type: 'picklist', width: 100, sortable: true },
  { id: 'owner', label: 'Owner', type: 'text', width: 120, sortable: true },
  { id: 'openOpps', label: 'Open Opps', type: 'number', width: 90, sortable: true },
  { id: 'totalPipeline', label: 'Pipeline', type: 'currency', width: 110, sortable: true },
  { id: 'lastActivity', label: 'Last Activity', type: 'date', width: 110, sortable: true },
  { id: 'callsLast30', label: 'Calls (30d)', type: 'number', width: 90, sortable: true },
  { id: 'emailsLast30', label: 'Emails (30d)', type: 'number', width: 100, sortable: true },
];

const industries = [
  'Technology',
  'Healthcare',
  'Finance',
  'Retail',
  'Manufacturing',
  'Education',
  'Media',
  'Transportation',
  'Energy',
  'Real Estate',
];
const expansionPotentials = ['Low', 'Medium', 'High'];
const churnRisks = ['Low', 'Medium', 'High'];
const executiveSponsors = [
  'VP of Sales',
  'CRO',
  'VP of Operations',
  'CFO',
  'CTO',
  'Director of IT',
  'Head of Revenue',
  'VP of Marketing',
  'COO',
  'No sponsor identified',
];
const recommendedActions = [
  'Schedule QBR',
  'Introduce new features',
  'Executive check-in',
  'Send usage report',
  'Expand to new department',
  'Address support concerns',
  'Renewal discussion',
  'Upsell opportunity',
];

function generateAccounts(count: number): Record<string, unknown>[] {
  const data: Record<string, unknown>[] = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const daysAgo = Math.floor(Math.random() * 30);
    const lastActivity = new Date(now);
    lastActivity.setDate(lastActivity.getDate() - daysAgo);

    const employees = Math.floor(Math.random() * 9500) + 500;
    const revenue = Math.floor(Math.random() * 900000000) + 10000000;

    data.push({
      id: `acc-${i + 1}`,
      name:
        accounts[i % accounts.length] +
        (i >= accounts.length ? ` ${Math.floor(i / accounts.length) + 1}` : ''),
      industry: industries[Math.floor(Math.random() * industries.length)],
      employees,
      revenue,
      region: regions[Math.floor(Math.random() * regions.length)],
      owner: owners[Math.floor(Math.random() * owners.length)],
      openOpps: Math.floor(Math.random() * 5),
      totalPipeline: Math.floor(Math.random() * 500000) + 50000,
      lastActivity: lastActivity.toISOString().split('T')[0],
      callsLast30: Math.floor(Math.random() * 15),
      emailsLast30: Math.floor(Math.random() * 40),
      healthScore: Math.floor(Math.random() * 40) + 55,
      expansionPotential:
        expansionPotentials[Math.floor(Math.random() * expansionPotentials.length)],
      churnRisk: churnRisks[Math.floor(Math.random() * churnRisks.length)],
      executiveSponsor: executiveSponsors[Math.floor(Math.random() * executiveSponsors.length)],
      recommendedAction: recommendedActions[Math.floor(Math.random() * recommendedActions.length)],
    });
  }

  return data;
}

// ============================================================================
// AI Reasoning Data
// ============================================================================

function generateAIReasoning(tableId: string, rowCount: number): Record<string, AIReasoningData> {
  const reasonings: Record<string, AIReasoningData> = {};

  const dealScoreReasons = [
    'Strong email engagement (8 opens, 3 clicks) combined with positive call sentiment.',
    'Deal progressing faster than average - 15% shorter stage duration.',
    'Multiple stakeholders engaged, champion actively advocating internally.',
    'Recent activity spike suggests renewed interest after quiet period.',
    'Technical POC completed successfully, awaiting business validation.',
  ];

  const riskReasons = [
    'No activity in 12 days - deal may be stalling.',
    'Competitor A mentioned in last call - active evaluation.',
    'Champion went on leave - need new internal advocate.',
    'Budget discussion delayed twice - procurement concerns.',
    'Stage duration 40% longer than average for this deal size.',
  ];

  const engagementReasons = [
    'Prospect asked 12 questions during call - high engagement.',
    'Executive sponsor joined unexpectedly - positive signal.',
    'Technical team raised integration concerns - needs follow-up.',
    'Clear buying signals detected - timeline discussion initiated.',
    'Limited questions asked - may need to re-qualify interest.',
  ];

  for (let i = 0; i < Math.min(rowCount, 50); i++) {
    if (tableId === 'opportunities') {
      reasonings[`dealScore-${i}`] = {
        reasoning: dealScoreReasons[i % dealScoreReasons.length],
        confidence: 0.75 + Math.random() * 0.2,
        sources: ['Salesforce Activity', 'Gong Calls', 'Email Tracking'],
      };
      reasonings[`riskFlag-${i}`] = {
        reasoning: riskReasons[i % riskReasons.length],
        confidence: 0.7 + Math.random() * 0.25,
        sources: ['Stage Analysis', 'Activity Patterns', 'Competitor Intel'],
      };
    } else if (tableId === 'gong-calls') {
      reasonings[`engagementScore-${i}`] = {
        reasoning: engagementReasons[i % engagementReasons.length],
        confidence: 0.8 + Math.random() * 0.15,
        sources: ['Transcript Analysis', 'Question Detection', 'Sentiment Analysis'],
      };
    }
  }

  return reasonings;
}

// ============================================================================
// Export Table Configurations
// ============================================================================

const opportunityData = generateOpportunities(900);
const gongCallData = generateGongCalls(900);
const emailData = generateEmails(900);
const accountData = generateAccounts(900);

export const deepResearchTables: DataTableConfig[] = [
  {
    id: 'opportunities',
    name: 'Opportunities',
    description: 'All Q4 opportunities from Salesforce CRM',
    columns: opportunityColumns,
    data: opportunityData,
    aiReasoningData: generateAIReasoning('opportunities', opportunityData.length),
    rowCount: opportunityData.length,
  },
  {
    id: 'gong-calls',
    name: 'Gong Calls',
    description: 'Call recordings and transcripts from Gong',
    columns: gongCallColumns,
    data: gongCallData,
    aiReasoningData: generateAIReasoning('gong-calls', gongCallData.length),
    rowCount: gongCallData.length,
  },
  {
    id: 'emails',
    name: 'Email Activity',
    description: 'Email engagement data from Outreach',
    columns: emailColumns,
    data: emailData,
    aiReasoningData: generateAIReasoning('emails', emailData.length),
    rowCount: emailData.length,
  },
  {
    id: 'accounts',
    name: 'Accounts',
    description: 'Account information and activity metrics',
    columns: accountColumns,
    data: accountData,
    aiReasoningData: generateAIReasoning('accounts', accountData.length),
    rowCount: accountData.length,
  },
];

export type { DataTableConfig };
