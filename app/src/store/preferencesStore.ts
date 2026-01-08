import { create } from "zustand";
import createSelectors from "./createSelectors";

// Business stages - dynamic from Salesforce
export type BusinessStage = string;

// Customer stages - dynamic from Salesforce
export type CustomerStage = string;

// Field configuration (Salesforce fields)
export interface Field {
  id: string;
  name: string;
  type: string;
  description: string;
  salesforceObject: string; // e.g., "Opportunity", "Account", "Contact"
  salesforceFieldName: string; // e.g., "Amount", "Competition__c"
}

// Von Field (fetched from backend)
export interface VonIQField {
  id: string;
  name: string;
  type: string;
  sourceFieldDisplayName: string;
  sourceFieldDescription: string;
  sourceFieldDataType: string;
  isCustom: boolean; // false for default fields, true for user-defined
  prompt?: string; // Markdown prompt text for the field
}

// VonIQ Field customization (user preferences stored in frontend/backend)
export interface VonIQFieldCustomization {
  fieldId: string; // references VonIQField.id
  enabled: boolean; // toggle state
  // For user-defined fields only
  description?: string;
  salesforceObject?: string;
  salesforceFieldName?: string;
}

// Default VonIQ fields (stored in frontend)
export const DEFAULT_VONIQ_FIELDS: VonIQField[] = [
  {
    id: "voniq-competitor",
    name: "von_iq_competitor",
    type: "string",
    sourceFieldDisplayName: "Competitor",
    sourceFieldDescription:
      "Identifies which competitor (if any) the customer mentioned when comparing solutions.",
    sourceFieldDataType: "Picklist",
    isCustom: false,
    prompt: `If competition is being considered, identify the competitor. If multiple competitors are mentioned, select the one most prominently discussed.`,
  },
  {
    id: "voniq-how-is-competitor-viewed",
    name: "von_iq_how_is_the_competitor_viewed",
    type: "string",
    sourceFieldDisplayName: "How Is The Competitor Viewed",
    sourceFieldDescription:
      "Describes how the customer perceives the competitor relative to your solution.",
    sourceFieldDataType: "Picklist",
    isCustom: false,
    prompt: `Which best describes how the prospect views the competitor relative to our solution—each option explained below:

- More favorably than us (they’ve indicated the competitor is a better fit or preference)
- About the same as us (they see pros and cons as roughly equal between both)
- Less favorably than us (they’ve raised more concerns about the competitor than about us)
- No comparison made / unknown (they haven’t directly compared us to competitors)`, // TODO: Add prompt value
  },
  {
    id: "voniq-buyer-stage",
    name: "von_iq_buyer_stage",
    type: "string",
    sourceFieldDisplayName: "Buyer Stage",
    sourceFieldDescription:
      "Indicates where the customer is in their buying journey from unaware to decision-ready.",
    sourceFieldDataType: "Picklist",
    isCustom: false,
    prompt: `Which best describes the customer’s current stage in their buying journey?

- Unaware - hasn't recognized they have a problem
- Problem Aware - understands the problem but not yet exploring solutions
- Solution Aware - researching different types of solutions (but not our product specifically)
- Product Aware - knows our product and is comparing it to others
- Decision Ready - has narrowed options and is ready to choose/purchase`,
  },
  {
    id: "voniq-severity-of-pain",
    name: "von_iq_severity_of_pain",
    type: "string",
    sourceFieldDisplayName: "Severity Of Pain",
    sourceFieldDescription:
      "Reflects how severe or urgent the customer's problem or pain point is.",
    sourceFieldDataType: "Picklist",
    isCustom: false,
    prompt: `Which best describes the severity of the problem the prospect has identified—each option explained below:
- Low severity (minor inconvenience they can workaround)
- Moderate severity (noticeable inefficiencies causing measurable pain)
- High severity (significant disruption that must be addressed soon)
- Critical severity (urgent crisis risking major loss or compliance issues)`, // TODO: Add prompt value
  },
  {
    id: "voniq-budget-confirmed",
    name: "von_iq_budget_confirmed",
    type: "string",
    sourceFieldDisplayName: "Budget Confirmed",
    sourceFieldDescription:
      "Shows whether a budget for this project has been confirmed or allocated.",
    sourceFieldDataType: "Picklist",
    isCustom: false,
    prompt: `Has the prospect indicated there is a dedicated or available budget for the project?

- Dedicated budget confirmed (a specific funding line has been approved)
- Budget available but not earmarked (funds exist but aren't formally allocated to this project)
- No budget yet (no funding committed)
- Unknown (budget status hasn't been clarified)`,
  },
  {
    id: "voniq-decisionmaking-authority",
    name: "von_iq_decisionmaking_authority",
    type: "string",
    sourceFieldDisplayName: "Decisionmaking Authority",
    sourceFieldDescription:
      "Indicates whether contact has been made with individuals who can make or influence the purchase decision.",
    sourceFieldDataType: "Picklist",
    isCustom: false,
    prompt: `Are we in contact with the individual(s) who can make or significantly influence the purchase decision?

- Direct contact (we've engaged with key decision-makers/influencers)
- Indirect contact (we've spoken with their team but not the decision-maker)
- No contact (no engagement with any decision influencers)`,
  },
  {
    id: "voniq-champion-identified",
    name: "von_iq_champion_identified",
    type: "string",
    sourceFieldDisplayName: "Champion Identified",
    sourceFieldDescription:
      "Assesses if an internal advocate or champion has been identified within the prospect's organization.",
    sourceFieldDataType: "Picklist",
    isCustom: false,
    prompt: `Is there an internal advocate/champion who actively supports and promotes our solution within the prospect’s organization?

- Identified advocate (we have a champion promoting us)
- Potential advocate (someone shows interest but hasn't committed)
- No advocate (no one is actively championing us)`,
  },
  {
    id: "voniq-economic-buyer",
    name: "von_iq_economic_buyer",
    type: "string",
    sourceFieldDisplayName: "Economic Buyer",
    sourceFieldDescription:
      "Evaluates the relationship and engagement level with the person controlling budget approval.",
    sourceFieldDataType: "Picklist",
    isCustom: false,
    prompt: `For the Economic Buyer (the person who controls budget allocation and approves spend), which best describes our status?`,
  },
  {
    id: "voniq-decision-maker",
    name: "von_iq_decision_maker",
    type: "string",
    sourceFieldDisplayName: "Decision Maker",
    sourceFieldDescription:
      "Evaluates the relationship and engagement level with the final decision-maker.",
    sourceFieldDataType: "Picklist",
    isCustom: false,
    prompt: `For the Decision Maker (the individual with final authority to sign the contract OR say final yes/no), which best describes our status?`,
  },
  {
    id: "voniq-decision-making-process",
    name: "von_iq_decision_making_process",
    type: "string",
    sourceFieldDisplayName: "Decision Making Process",
    sourceFieldDescription:
      "Captures how well the seller understands and has documented the customer's internal decision-making process.",
    sourceFieldDataType: "Picklist",
    isCustom: false,
    prompt: `Which best describes how well the seller has documented the customer’s internal decision-making process (steps, people, timing)—each option explained below:

- Not documented (no decision path captured)
- Stakeholders identified (we know who's involved but haven't mapped steps)
- High-level mapping (major steps and roles noted)
- Fully documented (detailed steps, roles, and timelines all captured)`,
  },
  {
    id: "voniq-stakeholder-turnover",
    name: "von_iq_stakeholder_turnover",
    type: "string",
    sourceFieldDisplayName: "Stakeholder Turnover",
    sourceFieldDescription:
      "Flags whether key stakeholders have changed during the deal, potentially causing delays.",
    sourceFieldDataType: "Picklist",
    isCustom: false,
    prompt: `Have key stakeholders (or your main point of contact) changed, causing possible resets or delays?`,
  },
  {
    id: "voniq-timeline-urgency",
    name: "von_iq_timeline_urgency",
    type: "string",
    sourceFieldDisplayName: "Timeline Urgency",
    sourceFieldDescription:
      "Indicates how clearly the customer has communicated their timeline or urgency.",
    sourceFieldDataType: "Picklist",
    isCustom: false,
    prompt: `which best describes the clarity of the prospect's timeline or urgent need—each option explained below:
- No timeline (no deadline stated)
- Rough timeline (general timeframe mentioned)
- Firm deadline (specific date or month provided)
- Critical urgency (immediate need emphasized)`,
  },
  {
    id: "voniq-stated-priority-level",
    name: "von_iq_stated_priority_level",
    type: "string",
    sourceFieldDisplayName: "Stated Priority Level",
    sourceFieldDescription:
      "Reflects how important or urgent the initiative is within the customer's organization.",
    sourceFieldDataType: "Picklist",
    isCustom: false,
    prompt: `Select which best describes how the prospect prioritizes this initiative internally—each option explained below:

- Top priority (highest focus and urgency)
- High priority (important but not urgent)
- Medium priority (one of several initiatives)
- Low priority (nice-to-have)
- Unknown (status not clear)`,
  },
  {
    id: "voniq-next-step-scheduled",
    name: "von_iq_next_step_scheduled",
    type: "string",
    sourceFieldDisplayName: "Next Step Scheduled",
    sourceFieldDescription:
      "Shows whether the next step in the sales process is clearly defined, unclear, or missing.",
    sourceFieldDataType: "Picklist",
    isCustom: false,
    prompt: `Select which best describes the status of the next action item—where:
- Clear next step names what will happen, who is responsible, and when it will occur
- Unclear next step is missing one or more of those details
- No next step has been defined

Examples:
- Clear next step: “John (Sales Engineer) to deliver a 45-minute integration deep-dive with Acme IT team by May 2nd at 10 AM.”
- Unclear next step: “Schedule a follow-up call next week.” (who exactly? what time?)
- No next step: “We'll follow up soon`,
  },
  {
    id: "voniq-customer-ghosting",
    name: "von_iq_customer_ghosting",
    type: "string",
    sourceFieldDisplayName: "Customer Ghosting",
    sourceFieldDescription:
      "Describes how responsive the customer has been to the seller's outreach.",
    sourceFieldDataType: "Picklist",
    isCustom: false,
    prompt: `Has the customer failed to respond to our seller’s outreach? I am trying to understand if the customer is ghosting our seller. 

Options:

No - 24hrs

Slow to respond - always replies but in >24 hours

Occasionally - misses 1 of 3 outreach attempts

Frequently - misses > 1 of 3 attempts

Ghosting - no response after ≥ 3 outreach attempts over 7 days`,
  },
  {
    id: "voniq-internal-leadership-involvement",
    name: "von_iq_internal_leadership_involvement",
    type: "string",
    sourceFieldDisplayName: "Internal Leadership Involvement",
    sourceFieldDescription:
      "Indicates whether and at what level internal leadership has been involved in the deal.",
    sourceFieldDataType: "Picklist",
    isCustom: false,
    prompt: `Select which best describes whether the seller has looped in internal leadership for alignment or support, and at what level—each option explained below:
- None involved (no leadership brought into the deal)
- Manager (sales manager or equivalent)
- Director (department head or equivalent)
- Vice President (VP-level leader)
- C-level executive (CXO or equivalent)`,
  },
  {
    id: "voniq-how-did-seller-followup",
    name: "von_iq_how_did_our_seller_followup",
    type: "string",
    sourceFieldDisplayName: "How Did Our Seller Followup",
    sourceFieldDescription:
      "Evaluates how proactive and consistent the seller's follow-up efforts have been.",
    sourceFieldDataType: "Picklist",
    isCustom: false,
    prompt: `Select which best describes how consistent the seller's follow-up has been after demos or proposals—each option explained below:
- Always consistent (follow-up as promised, within agreed timelines)
- Usually consistent (minor delays but generally reliable)
- Sometimes consistent (inconsistent cadence, gaps evident)
- Rarely consistent (often missed or delayed follow-up)`,
  },
  {
    id: "voniq-opportunity-qualification-depth",
    name: "von_iq_opportunity_qualification_depth",
    type: "string",
    sourceFieldDisplayName: "Opportunity Qualification Depth",
    sourceFieldDescription:
      "Measures how thoroughly the seller has qualified the opportunity across key MEDDICC areas.",
    sourceFieldDataType: "Picklist",
    isCustom: false,
    prompt: `Select which best describes how thoroughly the seller qualified this opportunity—covering business impact, budget, timeline, and stakeholders—each option explained below:
- Fully qualified (all key criteria explored in depth)
- Mostly qualified (covered most areas, with minor gaps)
- Partially qualified (touched on some but left significant holes)
- Not qualified (little to no qualification work done)`,
  },
  {
    id: "voniq-summary",
    name: "von_iq_summary",
    type: "string",
    sourceFieldDisplayName: "Summary",
    sourceFieldDescription:
      "Narrative summary of the overall deal context, capturing key business needs, buyer motivations, progress, and outstanding issues discussed across calls and emails.",
    sourceFieldDataType: "LONG TEXT AREA",
    isCustom: false,
    prompt: `## SUMMARY
    
(If Closed Won: summarize the journey to signature and immediate post-close context—implementation plans and early outcomes—when present. If Closed Lost: summarize the journey and decisive reasons for loss when present; include any re-engagement signals.)

Create a comprehensive narrative summary that tells the complete story of this deal/account.

**Include the following in your narrative:**

1. **Company Background & Context:**
   - Who is this company? (industry, size, what they do)
   - How did this relationship begin? (inbound, outbound, referral, triggering event)
   - When did we first engage with them?

2. **Business Situation & Needs:**
   - What pain points or business needs are driving this relationship?
   - What problems are they trying to solve?
   - What's their current situation and why does it matter?

3. **Relationship Journey:**
   - What has happened in this relationship so far?
   - What were the key moments, turning points, or milestones?
   - How has the relationship evolved over time?
   - What challenges have we encountered and how were they handled?

4. **Key Stakeholders:**
   - Who are the most important people involved?
   - Who champions this relationship and why?
   - What's the quality and depth of our relationships?

5. **Current State:**
   - Where do things stand right now?
   - What's the current momentum or trajectory?
   - How healthy is this relationship?
   - Are there any active issues, concerns, or opportunities?

6. **Value & Outcomes:**
   - What value have we delivered or are we promising to deliver?
   - What outcomes matter most to them?
   - How are we performing against their expectations?

7. **Future Outlook:**
   - What's next for this relationship?
   - What opportunities exist (expansion, renewal, upsell)?
   - What could go wrong and what needs attention?
   - What actions are needed to move things forward?

**Writing Guidelines:**
- Write in narrative prose (2-4 paragraphs), not bullet points
- Be specific with details from actual conversations and interactions
- Tell the human story with relevant context and color commentary
- Be honest about challenges, mistakes, and uncertainties
- Write as if briefing a colleague who knows nothing about this deal/account
- Focus on what's most important and decision-relevant
- Use professional but conversational tone

**The reader should understand:**
- Who this customer is and why they matter
- What's happened in the relationship
- Where things stand now
- What needs to happen next`,
  },
  {
    id: "voniq-risk",
    name: "von_iq_risk",
    type: "string",
    sourceFieldDisplayName: "Risk",
    sourceFieldDescription:
      "Consolidated list of major risks or blockers to the deal's success, each paired with supporting evidence and recommended next actions.",
    sourceFieldDataType: "LONG TEXT AREA",
    isCustom: false,
    prompt: `## RISK
(If Closed Won: assess risks to post-sale success, value realization, adoption, renewal, or expansion—only when supported by the conversations. If Closed Lost: assess risks and contributing loss factors strictly as evidenced in the conversations.)

You are a star-performing sales representative and sales manager with decades of experience closing complex B2B deals. Your expertise lies in analyzing sales conversations to identify risks that could derail deals and providing specific remediation strategies.

**Your Task**
Analyze the provided call transcripts and email exchanges to identify deal risks and provide actionable recommendations to address each risk. You must output your analysis in a specific structured format with the following components:

1. Overall risk assessment (High/Medium/Low)
2. Negative risk factors with embedded recommendations

**Analysis Framework**

**Risk Identification (Red Flags)**
Look for evidence of:

- Unclear or inaccessible decision makers
- Budget constraints or procurement delays
- Active competitor evaluation
- Lack of urgency or changing priorities
- Single-threaded relationships
- Technical, security, or compliance concerns
- Low engagement or delayed responses
- Adoption challenges or value realization gaps
- Scope creep or shifting requirements
- Misaligned expectations or success criteria
- Internal resistance or political obstacles
- Resource constraints or implementation concerns

**Chronology and Overrides**
- The provided context is already chronological (earlier → later).
- Later evidence overrides earlier concerns unless contradicted again.
- If a risk/blocker is raised but later explicitly resolved, **do not list it as a current risk**.
- Only surface risks that remain active or unresolved at the end of the timeline.

Risk Assessment Guidelines
Overall Risk Categories:

High: Multiple critical red flags, unclear path to success, weak relationships, high probability of deal loss
Medium: Several concerning factors that could delay or reduce deal size, but manageable with proper attention
Low: Minor friction points, strong momentum overall, minimal blockers

Impact Levels for Individual Risk Factors:

High: Deal-killer potential or major revenue impact (>30% probability of deal loss)
Medium: Could delay deal 2+ months or reduce deal size by 20-50%
Low: Minor friction causing 1-4 week delays or <20% size reduction

Recommendation Framework for Each Risk
For every risk factor identified, provide a specific recommendation with:

immediate_action (within 5 business days): Urgent interventions to prevent deal degradation
strategic_positioning (within 30 days): Relationship and competitive positioning improvements
risk_mitigation (ongoing): Process and engagement strategies to reduce risk impact

Output Requirements
For each risk factor you identify, produce exactly two concise fields:

1. Risk: One compact sentence that states what happened, who/when/where, and the consequence. Do not quote; paraphrase with concrete specifics (names, dates, systems, statuses) inside this sentence. Choose only the most decision-relevant details and avoid enumerations. Risk sentences should reflect the **final state** of the issue; do not mention intermediate blockers that were later resolved.
2. Action: One compact, imperative sentence with the single highest-leverage next step. Include a brief rationale only when it improves clarity. Write in natural, fluent business prose; avoid repetitive phrasing. Keep it concise and non-templated. Include owner and/or a deadline only when timing is clearly supported or implied by the conversations (e.g., stated dates, quarter/fiscal cycles, scheduled meetings, procurement/legal SLAs). If timing is not supported, omit numeric deadlines and keep the action outcome-oriented.

Additionally assign:
- impact level (High/Medium/Low)
- recommendation_category (immediate_action | strategic_positioning | risk_mitigation)
- priority (High/Medium/Low)

Risk Prioritization and Ordering
When presenting risk factors, YOU MUST order them by criticality in descending order (most critical first):

1. First Priority: Deal-killer risks requiring immediate action (High impact + immediate_action)
2. Second Priority: High impact risks with longer remediation windows
3. Third Priority: Medium impact risks requiring immediate action
4. Fourth Priority: All other risks ordered by impact level, then by recommendation timing

The ordering should reflect both:
- Severity of impact on the deal (risk of loss, delay, or reduction)
- Urgency of required action (immediate vs strategic vs ongoing)

This ensures the sales team focuses on the most critical blockers first.

Critical Analysis Rules

- Evidence-Based: Only identify risks directly supported by the provided conversations
- Specific Over Generic: Be precise about people, issues, timeline, and actions
- Action-Oriented: Every recommendation must be executable by the sales team
- Risk-Focused: Prioritize factors most likely to cause deal loss or significant delays
- Solution-Driven: Don't just identify problems - provide clear paths to resolution
- Concise: Keep descriptions clear and focused on what matters for deal success
- Style: Write full sentences and use periods. Do not use semicolons.
- Cross-risk: Avoid repeating the same actors, dependencies, or time anchors across risks unless adding new information.
- **Resolution Handling**: Do not flag risks that were explicitly resolved later in the context.
- **Recency Bias**: Prefer later statements and confirmations when earlier and later evidence conflict.
- **Resolution Citations**: If an earlier risk was overridden by later evidence, cite only the latest decisive statement.

**Clarity & Brevity (no hard caps)**

- Lead with the core point; include supporting detail only if it meaningfully strengthens the point
- Prefer plain business English; avoid hedging and filler (e.g., "it appears", "as of")
- Use decisive, active verbs; avoid multi-verb chains and long subordinate clauses
- Avoid enumerations and stacked qualifiers; prefer one representative example when helpful
- Deadlines must be grounded in conversation evidence. Do not invent numeric timelines. Use non-numeric urgency only if helpful and supported.

**Self-Edit Checklist**

- If removing one supporting detail keeps the sentence clear, remove it
- If a name/date/system repeats across risks without new information, remove the duplicate
- Replace generic actions (e.g., "follow up", "align") with more decisive, specific verbs or simplify

**Example Risk Analysis Pattern (concise)**

Risk Factor Example:
- Risk: The security review has no defined timeline, and Dani reported that the cyber team has previously blocked deployments during security reviews (April 2025, InfoSec thread).
- Action: Schedule a security architecture review within three business days, share a one-page SOC2/encryption overview, and pre-brief the cyber team lead before the review to prevent last-minute blocks and accelerate approval.
- Impact: High | Category: immediate_action | Priority: High

Remember: Your job is to help sales teams WIN DEALS by identifying what could go wrong and providing specific strategies to prevent it. Every risk should have a clear path to resolution.
`,
  },
  {
    id: "voniq-stakeholders",
    name: "von_iq_stakeholders",
    type: "string",
    sourceFieldDisplayName: "Stakeholders",
    sourceFieldDescription:
      "Structured profile of all key buyer-side contacts, detailing their roles, influence levels, stances, engagement history, and relationships.",
    sourceFieldDataType: "LONG TEXT AREA",
    isCustom: false,
    prompt: `## STAKEHOLDERS
(If Closed Won: include post-sale stakeholders—implementation, success, support—when mentioned. If Closed Lost: note champions who remain supportive, detractors, and re-entry influencers when mentioned.)

Create a comprehensive stakeholder map. Document every significant person involved in this deal/account, their relationships, influence, and stance toward our solution.

**Format each stakeholder as:**

**[Name]** - [Title/Role] | [Department]
- **Influence Level:** [Executive Sponsor / Decision Maker / Influencer / Evaluator / End User / Blocker]
- **Stance:** [Champion / Strong Supporter / Supporter / Neutral / Skeptic / Blocker / Detractor]
- **Activity Level:** [Highly Active / Active / Moderate / Low / Disengaged / Left Company]
- **Reports To:** [Name/Title if known]
- **Key Relationships:** [Who they're close with, who influences them]
- **Personal Motivations/Preferences:** [What drives them, career goals, personal wins they seek]
- **Communication Style:** [Analytical / Big picture / Detail-oriented / Relationship-driven / Direct / Political]
- **Key Concerns/Objections:** [Their specific worries or hesitations]
- **Engagement History:** [Summary of their involvement - meetings, emails, calls participated in]
- **Notable Quotes:** [Any revealing statements they've made]
- **Additional Context:** [Tenure, background, upcoming role changes, anything else relevant]

---

**Classification Guidelines:**

**Influence Level:**
- **Executive Sponsor:** C-suite or VP who can champion/kill initiatives, controls budget
- **Decision Maker:** Has authority to approve purchases or major decisions (economic buyer)
- **Influencer:** Significantly impacts decisions without final authority
- **Evaluator:** Assesses solutions, creates requirements, makes recommendations
- **End User:** Will use the product/service, provides input on usability
- **Blocker:** Actively works against us or creates obstacles

**Stance Toward Us:**
- **Champion:** Actively sells internally for us, coaches us, goes above and beyond
- **Strong Supporter:** Very positive, will advocate when asked
- **Supporter:** Generally positive but passive
- **Neutral:** No strong opinion either way
- **Skeptic:** Has concerns, unconvinced, needs persuading
- **Blocker:** Actively opposes or creates obstacles
- **Detractor:** Advocates against us

**Activity Level:**
- **Highly Active:** Initiates conversations, very responsive, drives things forward
- **Active:** Regularly engaged and responsive
- **Moderate:** Participates when needed, normal responsiveness
- **Low:** Minimal engagement, slow to respond
- **Disengaged:** Not participating, ghosting
- **Left Company:** No longer with organization (note departure date if known)

**What to look for in calls/emails:**
- Who speaks most/loudest in meetings (reveals influence)
- Who defers to whom (reveals power dynamics)
- Who gets cc'd on important emails (reveals influence and information flow)
- Personal anecdotes about career goals, frustrations, priorities
- Political dynamics: "I need to get buy-in from...", "Let me run this by..."
- Relationship indicators: "I'll talk to Sarah, she trusts my judgment"
- Communication patterns: analytical questions vs. emotional responses
- Specific concerns each person raises consistently
- Who introduces you to others (indicates trust and advocacy)
- Decision-making behavior: who makes calls, who needs to be consulted

**Reporting Structure:**
- Map out who reports to whom when possible
- Note dotted-line relationships if mentioned
- Identify power centers and decision-making paths
- Understand formal vs. informal influence

**Personal Context to Capture:**
- Career goals: "I'm trying to modernize our operations...", "I want to prove ROI to get promoted..."
- Tenure: "I've been here 15 years...", "I'm new in this role..."
- Past experiences: "Last implementation was a disaster...", "We've been burned before..."
- Personal wins they seek: "This would help my team's productivity...", "I need a quick win..."
- Risk tolerance: "I'm not comfortable being the first...", "Let's move fast..."
- Upcoming changes: promotions, departures, reorganizations

**Multi-threading Assessment:**
- Do we have relationships across multiple departments?
- Do we have multiple champions in different areas?
- Are we over-reliant on a single person?
- What's the breadth and depth of our stakeholder coverage?

**Order stakeholders by importance:**
1. Executive Sponsor (if exists)
2. Decision Makers / Economic Buyers
3. Champions
4. Strong Influencers
5. Evaluators
6. End Users
7. Blockers/Detractors

**Visual Indicators:**
- 🏆 Mark champions
- 🚩 Mark blockers/detractors
- ⚠️ Mark anyone who left company or is leaving
- 💼 Mark economic buyer
- 👑 Mark executive sponsor

**Be specific, not generic:**
❌ Bad: "Supportive of solution"
✅ Good: "Excited about automation features because his team is drowning in manual work and working weekends. Sees this as way to reduce overtime and improve team morale. Mentioned he's trying to demonstrate value to his new VP."

**Critical:** Identify gaps in stakeholder coverage - who should we be talking to that we're not? Who has influence that we haven't engaged?`,
  },
  {
    id: "voniq-timeline",
    name: "von_iq_timeline",
    type: "string",
    sourceFieldDisplayName: "Timeline",
    sourceFieldDescription:
      "Chronological summary of deal milestones, meetings, and communication threads showing progression and timing of key events.",
    sourceFieldDataType: "LONG TEXT AREA",
    isCustom: false,
    prompt: `## TIMELINE
(If Closed Won: include signature and any post-close kickoff or early adoption milestones when present. If Closed Lost: include the loss decision event and any follow-up or debrief interactions.)

Create a chronological timeline of significant interactions. Each entry should capture meaningful touchpoints that moved the relationship forward, revealed important information, or represented turning points.

**Format each interaction as:**
📅 **[Date]** | [Interaction Type] | [Participants]
→ [What happened and key outcomes]

**Interaction Types:**
- Discovery Call
- Demo/Presentation
- Technical Deep-Dive
- Pricing Discussion
- Executive Meeting
- Email Thread (when substantive - group related emails on same topic)
- POC/Trial Kickoff or Review
- Proposal Presentation
- Negotiation Session
- Contract Discussion
- Reference Call
- Check-in/QBR
- Support Escalation
- Renewal Discussion
- Expansion Discussion
- Problem Resolution
- Strategy Session
- Any other significant touchpoint

**What to capture for each interaction:**
- **Date:** As specific as possible (MM/DD/YYYY). If approximate, indicate: "~Q2 2024" or "Early March 2024"
- **Who participated:** Names and roles when available
- **Key discussion topics:** What was talked about
- **Important revelations:** New information learned about their needs, constraints, priorities, politics
- **Decisions made:** What was decided or agreed upon
- **Next steps:** What was committed to happen next
- **Objections or concerns raised:** Any pushback, hesitations, or issues surfaced
- **Sentiment shifts:** Changes in enthusiasm, tone, or engagement
- **Breakthrough moments:** Key wins or turning points
- **Red flags:** Warning signs or concerning signals
- **Critical quotes:** Particularly revealing or important statements

**Guidelines:**
- Include ONLY significant interactions - not routine emails or quick check-ins
- Group related email threads on the same topic into one entry
- Highlight turning points clearly:
  - Use "BREAKTHROUGH:" for major positive moments
  - Use "RED FLAG:" for warning signs or concerning developments
  - Use "DECISION:" for key decisions made
  - Use "BLOCKER:" for obstacles that emerged
- Show momentum changes: note when things accelerate or decelerate
- Capture the narrative arc: someone reading should understand how the relationship evolved
- Include both positive and negative developments honestly
- Maintain strict chronological order (earliest first, most recent last)
- If dates are missing, estimate based on context: "Between discovery and demo, ~mid-Feb"

**Example entries:**

📅 **01/15/2024** | Discovery Call | Sarah (VP Sales), John (Director Ops)
→ Initial conversation revealed they're struggling with manual processes costing 20hrs/week per person across 12-person team. Looking to solve by Q2 before busy season. Mentioned evaluating 2 other vendors. Strong urgency due to team burnout and errors increasing. Sarah seemed like potential champion - very engaged and asked great questions. John more reserved, concerned about implementation disrupting operations. Next: Product demo scheduled for 1/22 with broader team.

📅 **01/22/2024** | Demo | Sarah, John, + 4 team members (analysts)
→ Demoed workflow automation and reporting features. Team very engaged - analysts asked detailed questions about Salesforce integration and custom dashboards. John raised concern about 3-week implementation timeline being too long. Sarah pushed back on him: "We need to do this right." BREAKTHROUGH: Sarah is definitely our champion. One analyst (Marcus) super impressed, called it "exactly what we need." Competitor X mentioned - they're also in eval. Next: Technical deep-dive with IT scheduled, Sarah will arrange.

📅 **01/29/2024** | Email Thread | Sarah
→ Sarah forwarded email chain showing she got executive team approval for budget in Q1! Asking about pricing for 15 users to start, with plan to expand to full team if successful. BREAKTHROUGH: Budget confirmed, timeline accelerated. Also mentioned her VP wants to see ROI projection. Sent pricing proposal + ROI calculator.

📅 **02/05/2024** | Pricing Discussion | Sarah, John, Maria (CFO)
→ Reviewed proposal with finance. Maria concerned about price - mentioned Competitor X quoted 25% less. Discussed our superior integrations, support, and total cost of ownership. Maria: "I need to justify the premium." Agreed to provide 3 customer references in similar use cases. RED FLAG: Strong price sensitivity. Sarah defended our value but CFO not fully convinced yet. Next: Reference calls being arranged.

📅 **02/12/2024** | Email Thread | John
→ RED FLAG: John went dark for a week. Finally responded - IT has concerns about API rate limits and wants technical validation session. Timeline slipping. Sarah also less responsive than usual.

📅 **02/18/2024** | Technical Deep-Dive | John, Marcus, IT team (David - IT Director)
→ Detailed technical session on architecture, APIs, security. David grilled us on rate limits, error handling, disaster recovery. Marcus advocated for us throughout. Addressed most concerns but David wants 1-week POC to validate performance. BLOCKER partially cleared: IT giving conditional green light pending POC. David: "If POC goes well, I'm comfortable." Schedule POC to start 2/25.

📅 **02/25 - 03/03** | POC Period | Marcus leading, 5 analysts testing
→ POC launched with 10 users. Daily check-ins with Marcus. Day 2: found minor bug in dashboard refresh - fixed within 4 hours. Marcus impressed with responsiveness. By day 5, team created 8 custom dashboards. Sarah forwarded email from analyst: "This is game-changing." VP saw demo of results and is enthusiastic.

📅 **03/05/2024** | POC Debrief Call | Sarah, John, Marcus, David (IT), Karen (VP)
→ POC review meeting. Team unanimously positive. Marcus: "Best tool we've tested, and we looked at 4 vendors." David: "Performance exceeded expectations, I'm satisfied." Karen (VP) impressed by exec dashboard. DECISION: Karen said "Let's move forward. What's the timeline to get contracts done?" Competitor X still in picture but losing momentum. Next: Formal contract process, aiming for 3/20 signature.

📅 **03/10/2024** | Email Thread | Sarah + Maria (CFO)
→ Sarah shared that Maria still pushing back on price. Competitor X came in 30% cheaper in final bid. Need to justify premium or risk losing deal. Sent additional ROI data + offered to connect with CFO reference customer. Clock ticking - they want decision by 3/18.

📅 **03/12/2024** | Reference Calls | Maria + Sarah
→ Arranged 2 reference calls for Maria with CFO/VP-level contacts. Both gave glowing feedback, emphasized ROI achieved and superior support vs cheaper alternatives. Maria forwarded feedback to Sarah: "This helps a lot. Quality matters."

📅 **03/15/2024** | Negotiation Call | Sarah, Maria, Legal (both sides)
→ Contract negotiation. Maria pushed for 15% discount. Held at 10% for annual prepay + quarterly business reviews commitment. Agreement reached at $67.5K annual (from $75K list). Standard terms, minimal legal back and forth. DECISION: Deal approved, contracts to be signed 3/18.

📅 **03/18/2024** | Contract Signature | Sarah, Karen (VP)
→ Contracts signed! Sarah: "Team is thrilled. Can't wait to roll this out." Implementation kickoff scheduled 3/25. Karen mentioned potential expansion to sales team (20 users) if first phase successful - revisit in Q3. Next: Implementation kickoff meeting.

📅 **03/25/2024** | Implementation Kickoff | Full project team
→ Kickoff went smoothly. Reviewed timeline, milestones, roles. Go-live target: 4/15. John's concerns about disruption addressed with phased rollout plan. Team engaged and optimistic. First weekly check-in scheduled 4/1.

**Length guidance:**
- Quick sales cycles (1-2 months): 5-10 entries
- Typical sales cycles (3-6 months): 8-15 entries
- Complex sales cycles (6+ months): 15-25 entries
- Long-term customer relationships: Focus on last 6-12 months of activity (10-20 entries) unless earlier history is critical

**The timeline should tell a story:** Anyone reading it should understand the journey of this relationship - the ups, downs, breakthroughs, and challenges.`,
  },
  {
    id: "voniq-pain-why-anything-why-now",
    name: "von_iq_pain_why_anything_why_now",
    type: "string",
    sourceFieldDisplayName: "Pain Why Anything Why Now",
    sourceFieldDescription:
      'Analysis of the customer\'s core business pains, urgency drivers, and reasons for change, emphasizing "why anything" and "why now."',
    sourceFieldDataType: "LONG TEXT AREA",
    isCustom: false,
    prompt: `## PAIN / WHY ANYTHING & WHY NOW
(If Closed Won: pains and urgency should align with why they purchased; include any post-close outcome targets if present. If Closed Lost: still document pains/urgency as expressed; if behavior contradicted statements of urgency, capture that.)

Document the customer's pain points, business needs, and urgency drivers.

**PART 1: PAIN POINTS & BUSINESS NEEDS (Why Anything)**

What problems are they trying to solve? Why do they need a solution?

**Extract and document:**

1. **Specific Pain Points:**
   For each pain point, capture:
   - What is the specific problem or challenge?
   - How does it manifest day-to-day?
   - Who is most affected? (teams, roles, individuals)
   - How long have they had this problem?
   - What have they tried before that didn't work?

   **Rank pain points by importance to the customer** (not by what we solve best).

2. **Business Impact:**
   For each pain point, quantify the impact:
   - Financial cost (money lost, waste, opportunity cost)
   - Time cost (hours wasted, delays, inefficiency)
   - Operational impact (errors, quality issues, customer satisfaction)
   - Strategic impact (competitive disadvantage, missed opportunities, growth limitations)
   - People impact (burnout, morale, turnover, manual toil)

   Look for specific numbers: "20 hours per week", "$50K annually in waste", "30% error rate"

3. **Current State:**
   - What's their current solution or process?
   - Why is the current state failing them?
   - What specific frustrations do they express about it?
   - Is current state getting worse, stable, or improving?
   - What's the cost/risk of maintaining status quo?

4. **Desired Outcomes:**
   - What would success look like for them?
   - What specific outcomes are they trying to achieve?
   - How would their business/work improve?
   - What metrics would they use to measure success?
   - What would be different if this problem were solved?

5. **Consequences of Inaction:**
   - What happens if they don't solve this?
   - Are consequences increasing over time?
   - What's at risk if they do nothing?

**Look for pain signals in conversations:**
- Explicit: "We're struggling with...", "Our biggest problem is...", "We're losing money because..."
- Emotional: Frustration, exasperation, urgency, concern in tone
- Quantified: Specific numbers, percentages, time/money impacts
- Comparative: "Better than what we have...", "Unlike our current process..."
- Consequence-focused: "If we don't fix this, we'll..."

---

**PART 2: URGENCY & TIMING (Why Now)**

What's creating urgency? Why now versus later?

**Extract and document:**

1. **Triggering Events:**
   - What specific event prompted them to act now?
   - When did this trigger occur?
   - How did it surface the need?

   Common triggers:
   - New executive or leadership change
   - Bad incident or failure of current system
   - Competitive pressure or market shift
   - Growth or expansion plans
   - Regulatory or compliance requirement
   - Budget cycle or funding approval
   - Strategic initiative launch
   - Customer demands or complaints

2. **Timeline & Deadlines:**
   - Do they have explicit deadlines?
   - What's driving these deadlines?
   - What happens if they miss the deadline?
   - How firm vs. flexible is the timeline?
   - Are there multiple deadlines for different milestones?

3. **Business Drivers Creating Urgency:**
   - Upcoming initiatives that require this solution
   - Growth plans dependent on solving this
   - Cost pressures or efficiency mandates
   - Revenue opportunities tied to this
   - Competitive threats ("Competitors can do X, we can't")
   - Customer commitments or promises made
   - Market shifts or industry changes

4. **Organizational Drivers:**
   - New leadership with new priorities
   - Strategic goals or OKRs tied to this
   - Budget availability ("Use it or lose it")
   - Organizational changes (reorg, expansion, M&A)
   - Team issues (burnout, turnover, capacity constraints)
   - Performance pressure from above

5. **Urgency Level Assessment:**

   Rate overall urgency and explain why:

   - **Critical:** Must solve immediately, severe consequences of delay, very tight timeline, pain is acute
   - **High:** Important priority, clear timeline, meaningful consequences of delay, executive attention
   - **Medium:** Important but somewhat flexible timeline, could wait a quarter if needed
   - **Low:** "Nice to have", exploratory, no pressing deadline, could easily be postponed
   - **None:** Just looking around, no compelling reason to act now vs. much later

6. **Pain Intensity & Trend:**
   - How acute is the current pain? (mild annoyance vs. crisis)
   - Is pain increasing, stable, or decreasing?
   - How many people/teams are affected?
   - Is this keeping stakeholders up at night?
   - Is the problem getting worse over time?

7. **Urgency Signals Observed:**
   Document specific evidence of urgency (or lack thereof):
   - Fast: Quick responses, rapid decision-making, executive involvement, compressed timeline
   - Medium: Normal pace, standard process, measured approach
   - Slow: Slow responses, extended timelines, "just exploring", no real deadline

   Specific behaviors:
   - How quickly do they respond to emails/calls?
   - How fast are they moving through their process?
   - How many people are engaged?
   - Are they willing to accommodate our schedule or pushing us to move faster?
   - Are they talking about budget allocation vs. "we'll figure out budget later"?

**Document the "Why Now" Story:**
Write 1-2 paragraphs that tell the story of what's driving urgency:
- What was the specific trigger?
- What deadlines or time pressures exist?
- What happens if they don't act now?
- How urgent is this really (based on observed behavior, not just what they say)?

**Be honest about urgency:**
Don't confuse what customer says about urgency with what their behavior demonstrates. Note any disconnects: "They say this is urgent but have extended timeline 3 times and are slow to respond."

**Red flags for false urgency:**
- Says "urgent" but actions don't match (slow responses, delayed meetings)
- No clear deadline or consequence
- Timeline keeps extending
- Budget not approved or unclear
- Key stakeholders not engaged
- Competing priorities getting more attention`,
  },
  {
    id: "voniq-decision-criteria-and-process",
    name: "von_iq_decision_criteria_and_process",
    type: "string",
    sourceFieldDisplayName: "Decision Criteria And Process",
    sourceFieldDescription:
      "Documentation of how the buyer will decide — their formal evaluation criteria, approval steps, key stakeholders, and decision timeline.",
    sourceFieldDataType: "LONG TEXT AREA",
    isCustom: false,
    prompt: `## DECISION CRITERIA AND PROCESS
(If Closed Won: reflect criteria and process that led to selection; include any post-selection approval notes if present. If Closed Lost: reflect decisive criteria that resulted in loss when present; identify unknowns as "Unknown".)

Document how this customer makes decisions and what criteria matter most to them.

**PART 1: DECISION CRITERIA**

What factors matter most in their evaluation and decision? What will they use to choose?

**Extract and document:**

1. **Stated Decision Criteria:**
   What have they explicitly said matters to them?

   For each criterion, capture:
   - What is the specific criterion?
   - How important is it? (deal-breaker, very important, nice-to-have)
   - How will they evaluate it?
   - How do we stack up on this criterion?
   - Who cares most about this criterion?

   Common criteria:
   - Specific features or capabilities
   - Price/cost/ROI
   - Ease of use
   - Implementation speed/complexity
   - Integration capabilities
   - Scalability
   - Security/compliance
   - Support and service quality
   - Vendor stability/reputation
   - References and social proof

2. **Implied/Unstated Criteria:**
   What seems to matter based on their questions, concerns, or behavior even if not explicitly stated?

   Look for:
   - What do they spend most time asking about?
   - What objections or concerns do they raise repeatedly?
   - What competitive comparisons do they make?
   - What stakeholders focus on what aspects?

3. **Prioritization:**
   - Rank criteria by importance to them (not by what we do best)
   - Which criteria are must-haves vs. nice-to-haves?
   - What are the deal-breakers (negative criteria)?
   - Where are there trade-offs they're willing to make?

4. **Success Metrics:**
   - How will they measure success post-purchase?
   - What KPIs or metrics matter to them?
   - What would "winning" look like?
   - How will they justify the decision internally?

5. **Evaluation Approach:**
   - Are they using a formal scorecard or evaluation matrix?
   - How are they comparing alternatives?
   - What's their evaluation process?
   - Are they doing hands-on testing (POC, trial)?

**Look for clues in conversations:**
- "We need..." or "It's critical that..."
- "How does this compare to [competitor] on [feature]?"
- "Our biggest concern is..."
- "We'd choose you if you could..."
- Questions they ask repeatedly
- Objections that keep coming up

---

**PART 2: DECISION PROCESS**

How will they make this decision? Who's involved and what are the steps?

**Extract and document:**

1. **Decision-Making Structure:**
   - Who makes the final decision? (single person, committee, consensus)
   - What's the formal decision process?
   - What are the approval layers or gates?
   - Is there a formal RFP/RFI process?
   - Is this a committee decision or single decision-maker?

2. **Key Stakeholders in Decision:**
   Map out the RACI (or similar):
   - **Decision Makers:** Who can say "yes" and make it happen?
   - **Approvers:** Who must approve (budget, legal, technical, executive)?
   - **Influencers:** Who significantly impacts the decision without final authority?
   - **Evaluators:** Who assesses options and makes recommendations?
   - **Blockers:** Who could veto or significantly delay?

   For each, note:
   - Their specific role in the decision
   - What they care about most
   - Their current stance
   - What would make them say yes/no

3. **Decision Steps & Timeline:**
   Map out their process:
   - What are the stages in their evaluation/decision process?
   - Where are we currently in that process?
   - What are the next steps?
   - What milestones or gates must be passed?
   - What's the timeline for each step?
   - When is the final decision expected?

   Example stages: initial research → demos → technical evaluation → business case → finalist selection → contract negotiation → final approval → signature

4. **Approval Requirements:**
   - What approvals are needed? (budget, technical, legal, security, executive)
   - Who provides each approval?
   - What's required to get each approval?
   - Have any approvals been obtained already?
   - What's the risk with each approval gate?

5. **Budget & Authority:**
   - Is budget approved, or must it still be secured?
   - Who controls the budget?
   - What's the budget approval process?
   - Are there budget cycles or timing considerations?
   - Is this budgeted or requires new budget allocation?

6. **Procurement & Legal Process:**
   - What's the procurement process?
   - Is there a preferred vendor list or procurement requirements?
   - What legal/contract review is required?
   - How long does their typical contract process take?
   - Are there standard terms or will negotiation be required?
   - Who's involved from procurement/legal?

7. **Decision Timeline:**
   - When do they want to make a decision?
   - What's driving that timing?
   - How firm is the timeline?
   - Has the timeline changed? If so, why?
   - What could accelerate or delay the decision?

8. **Competitive Process:**
   - Are they evaluating alternatives simultaneously?
   - How many vendors are in consideration?
   - Who are the competitors?
   - What's the competitive dynamic?
   - When will they down-select or eliminate options?
   - Are we being compared formally or informally?

9. **Decision Risks:**
   What could derail or delay the decision?
   - Stakeholder misalignment
   - Budget challenges
   - Procurement complications
   - Technical evaluation failure
   - Timeline pressures
   - Competing priorities
   - Change in circumstances
   - No-decision risk (choose to do nothing)

10. **Our Position:**
    - Where do we stand in their process?
    - Are we a front-runner, in the mix, or long shot?
    - What do we need to do to win?
    - What could cause us to lose?
    - What's our unique advantage in their decision process?

**Map the Decision Journey:**
Create a visual or narrative map showing:
- Where they started
- Key milestones passed
- Where they are now
- What's left in their process
- Expected timeline to decision

**Example:**
"They started evaluation in January after new VP joined. Completed initial vendor research and demos in Feb. Currently in technical validation phase (3 vendors including us). Next step is finalist selection by March 15, followed by business case to CFO, then final executive approval. Decision expected by March 30. Budget already approved. Main risk is technical evaluation - IT Director is skeptical and has veto power."

**Be specific about unknowns:**
If you don't know something important about their decision process, explicitly note it as a gap: "UNKNOWN: We don't know if executive approval is required beyond the VP level."
`,
  },
  {
    id: "voniq-competition-why-us",
    name: "von_iq_competition_why_us",
    type: "string",
    sourceFieldDisplayName: "Competition Why Us",
    sourceFieldDescription:
      "Assessment of competitive landscape, summarizing rival vendors, customer perceptions, and reasons the prospect prefers or may choose your solution.",
    sourceFieldDataType: "LONG TEXT AREA",
    isCustom: false,
    prompt: `## COMPETITION / WHY US
(If Closed Won: emphasize “Why Us” and proof points referenced in conversations. If Closed Lost: emphasize “Why Not Us / Why Them” as supported by conversations, and document loss reasons explicitly.)

Document the competitive landscape and our positioning - who we're competing against and why we win or lose.

**PART 1: COMPETITIVE LANDSCAPE**

Who and what are we competing against?

**Identify all alternatives:**

1. **Direct Competitors:**
   List each competing vendor:
   - Competitor name and product
   - How serious is this competitive threat?
   - What stage are they in the evaluation?
   - Have they been ruled out, still in play, or are they the front-runner?

2. **Incumbent Solution:**
   - What's their current solution (if any)?
   - Why are they looking to change?
   - How entrenched is the incumbent?
   - What's their relationship with incumbent vendor?
   - Is incumbent fighting to keep the business?
   - What pain points exist with incumbent?

3. **Status Quo / Do Nothing:**
   - Is "do nothing" a real alternative?
   - How strong is the status quo bias?
   - What would keep them from buying anything?
   - Who prefers status quo and why?

4. **Internal Build:**
   - Are they considering building internally?
   - How serious is this option?
   - Do they have capability/resources to build?
   - What are pros/cons of building vs buying from their perspective?

**For each competitive option, document:**

1. **What Customer Likes About Them:**
   - Specific strengths or advantages
   - Features or capabilities they have
   - What the customer finds appealing
   - Why they're still in consideration

2. **What Customer Dislikes or Concerns:**
   - Weaknesses or disadvantages
   - What gives customer pause
   - Objections or concerns about them
   - Why they might not choose them

3. **Pricing Comparison:**
   - How does their pricing compare to ours? (if known)
   - Is price a differentiator for them?
   - Are they significantly cheaper or more expensive?

4. **Competitive Dynamics:**
   - How are they positioning against us?
   - What's their sales strategy or approach?
   - What are they saying about us?
   - How aggressive are they being?

5. **Customer's Perception:**
   - How does customer view this competitor relative to us?
   - Who's the perceived leader?
   - Where do we rank in their consideration?

---

**PART 2: WHY US (Our Positioning & Differentiation)**

Why should they choose us? What's our value proposition and differentiation?

**Document:**

1. **Our Key Strengths (That Matter to Them):**
   What advantages do we have that this customer cares about?

   For each strength:
   - What is it specifically?
   - Why does it matter to this customer?
   - How does it address their pain points or criteria?
   - What evidence or proof do we have?
   - Who at the customer values this most?

   Focus on strengths that matter to THIS customer, not generic strengths.

2. **Our Differentiators:**
   What makes us different/better than alternatives in ways that matter to them?

   - Unique capabilities or features they need
   - Superior approach to solving their problem
   - Better fit for their specific use case
   - Advantages in implementation, support, or partnership
   - Proof points (customers like them, case studies, references)

   **Be specific:** Not "better product" but "only solution with real-time sync to Salesforce, which solves their problem of data being 24hrs stale"

3. **Why We're Winning (or Could Win):**
   - What's resonating most with them?
   - What are our strongest selling points with this customer?
   - Who champions us and why?
   - What objections have we overcome successfully?
   - Where do we have clear advantage over alternatives?
   - What would make us their choice?

4. **Our Weaknesses (That Matter to Them):**
   Be honest about our disadvantages:
   - What do we lack that they want?
   - Where are competitors stronger?
   - What concerns or objections do we face?
   - What could cause us to lose?
   - How are we addressing these weaknesses?

5. **Competitive Positioning We're Using:**
   - How are we positioning ourselves vs. competitors?
   - What's our main message/value prop with them?
   - How are we handling competitive comparisons?
   - What narrative are we using to win?

6. **Head-to-Head Comparisons:**
   For key competitors, document how customer sees us vs. them:

   | Factor | Us | Competitor X | Customer's Preference |
   |--------|-----|--------------|---------------------|
   | Feature A | Strong | Weak | Advantage: Us |
   | Price | Higher | Lower | Concern for us |
   | Implementation | 3 weeks | 6 weeks | Advantage: Us |
   | Support | 24/7 | Business hours | Advantage: Us |

   Note: Only include factors that matter to THIS customer

7. **Customer Feedback on Us:**
   What are they saying about our solution?
   - What do they like most?
   - What concerns do they have?
   - What questions or objections keep coming up?
   - What would make them choose us?
   - What could make them choose someone else?
   - Capture specific quotes

8. **Competitive Intelligence Gathered:**
   What have we learned about competitors from this deal?
   - Pricing strategies
   - Sales tactics
   - Product capabilities or gaps
   - Customer perceptions
   - Strengths and weaknesses
   - How they position vs. us

---

**PART 3: WIN/LOSS FACTORS**

What will determine whether we win or lose?

**Document:**

1. **Factors in Our Favor:**
   - What gives us advantage?
   - What's working for us?
   - Where are we stronger than alternatives?
   - What relationships or champions do we have?
   - What proof points or momentum do we have?

2. **Factors Against Us:**
   - What's working against us?
   - Where are competitors stronger?
   - What objections or concerns are unresolved?
   - What relationships or champions do competitors have?
   - What risks could cause us to lose?

3. **The Deciding Factors:**
   - What will ultimately drive their choice?
   - What few things matter most?
   - What could swing the decision?
   - Where must we win to win the deal?

4. **Our Path to Winning:**
   - What do we need to do to win?
   - What objections must we overcome?
   - Who do we need to convince?
   - What proof or validation is needed?
   - What's our strategy to close?

**Be brutally honest:** The goal is to understand our true competitive position, not to rationalize or wishful think. If we're losing, say why. If we're not the favorite, be clear about what it would take to become the favorite.

**Structure the response:**
Start with competitive summary (2-3 sentences on landscape), then details on each competitor, then our positioning and differentiation, then win/loss analysis.
`,
  },
  {
    id: "voniq-next-steps",
    name: "von_iq_next_steps",
    type: "string",
    sourceFieldDisplayName: "Next Steps",
    sourceFieldDescription:
      "Enumerated list of agreed upcoming actions, owners, deadlines, and dependencies required to advance the deal toward close.",
    sourceFieldDataType: "LONG TEXT AREA",
    isCustom: false,
    prompt: `## 8. NEXT STEPS

(If Closed Won: focus on post-sale activities—implementation, training, value delivery, expansion—explicitly mentioned; otherwise mark as "Unknown". If Closed Lost: include only documented re-engagement or follow-up items from conversations; do not invent revival plans.)

Document what needs to happen next to move this deal/relationship forward. Be specific and actionable.

**Provide:**

1. **Immediate Next Steps (Next 1-2 Weeks):**

   For each immediate action:
   - **What:** Specific action that needs to happen
   - **Who:** Who owns this action (on our side and their side)
   - **When:** Target date or deadline
   - **Why:** Why this matters / what it enables
   - **Status:** Not started / In progress / Blocked
   - **Dependencies:** What must happen first

   Examples:
   - "Schedule technical deep-dive with IT team - Our Solutions Engineer + their IT Director David - Target: by Feb 15 - Required to get technical approval - Status: Waiting on David's calendar"
   - "Send ROI calculator with customer-specific data - Our AE - Target: Feb 10 - CFO Maria needs this to justify budget - Status: In progress"
   - "Customer to provide reference calls for legal peers - Their Procurement lead Lisa - Target: by Feb 12 - Required for vendor approval - Status: Not started"

2. **Near-Term Steps (Next 2-6 Weeks):**
   What needs to happen after immediate steps?
   - Key meetings or milestones coming up
   - Decisions that need to be made
   - Approvals needed
   - Evaluations or validations to complete
   - Stakeholders to engage
   - Information or materials to provide

3. **Critical Path Actions:**
   What steps are on the critical path to moving forward?
   - What absolutely must happen for this to progress?
   - What are the gate items or blockers?
   - What could derail progress if not addressed?
   - What's most time-sensitive?

4. **Stakeholder Engagement:**
   Who needs to be engaged and how?
   - Which stakeholders need meetings or conversations?
   - What's the purpose of each engagement?
   - Who should lead from our side?
   - What's the desired outcome?

   Example: "Need to schedule executive briefing with their VP Karen - Our VP to present strategic vision and partnership value - Target: before final decision in March - Purpose: secure executive sponsorship and differentiate from competitors"

5. **Information Needed:**
   What information do we need to provide or obtain?
   - Materials to send them (proposals, case studies, technical docs, references)
   - Information we need from them (requirements, timeline, budget, approvals)
   - Questions that need answers
   - Gaps in our understanding that need filling

6. **Risks to Address:**
   What risks or concerns need active management?
   - Objections to overcome
   - Concerns to address
   - Competitive threats to counter
   - Relationship gaps to fill
   - Timeline pressures to manage

7. **Our Internal Actions:**
   What do we need to do internally?
   - Resources needed (SEs, executives, legal, etc.)
   - Approvals we need (pricing, terms, resources)
   - Preparation required (proposals, presentations, ROI models)
   - Team alignment or strategy sessions needed

8. **Expected Timeline:**
   Map out the timeline for next steps:
   - What happens when?
   - What's the sequence of events?
   - When are key milestones or decisions?
   - What's the target close/renewal/expansion date?

9. **If No Clear Next Steps:**
   If there are no active next steps (deal stalled, customer unresponsive, waiting period):
   - Why are there no next steps?
   - What are we waiting for?
   - When should we follow up?
   - What could re-engage them?
   - Is this deal still viable?

**Format as an action plan:**
Structure next steps as a clear, scannable action plan that anyone could pick up and execute.

Use this format:
IMMEDIATE (Next 1-2 weeks): □ Action item 1 - Owner - By [date] - Why it matters □ Action item 2 - Owner - By [date] - Why it matters
NEAR-TERM (Next 2-6 weeks): □ Action item 3 - Owner - By [date] - Why it matters □ Action item 4 - Owner - By [date] - Why it matters
CRITICAL PATH: 🚨 Critical action 1 - BLOCKER if not done 🚨 Critical action 2 - Gate item for next stage
STAKEHOLDER ENGAGEMENT NEEDED: 👤 Stakeholder 1 - Purpose - Who leads - Target date 👤 Stakeholder 2 - Purpose - Who leads - Target date

**Be specific and actionable:**
❌ Bad: "Follow up with customer"
✅ Good: "Follow up with Sarah by email this Friday to confirm POC kickoff date and participant list - Critical to keep momentum and hit their March 15 deadline"

❌ Bad: "Address pricing concerns"
✅ Good: "Schedule call with CFO Maria and our VP to walk through ROI model and discuss flexible payment terms - Target: by Feb 18 - Required to overcome price objection and secure budget approval"

**If stuck or stalled:**
Be honest about it. If the deal is stuck with no clear path forward, say so and identify:
- Why it's stuck
- What would unstick it
- Whether it's salvageable
- What our strategy should be

**Example next steps section:**

IMMEDIATE (Next 1-2 weeks): □ Send technical architecture document to IT Director David - Our SE Mike - By 2/12 - Required for David's approval □ Schedule reference call for CFO Maria with similar customer - Our AE Sarah - By 2/15 - Needed to justify pricing premium □ Customer's legal team to review contract - Their counsel Lisa - By 2/16 - On critical path for 2/28 close date
NEAR-TERM (Next 3-4 weeks): □ POC kickoff meeting - Both teams - Week of 2/19 - Validate technical fit □ Executive business review - Our VP + their VP Karen - By 2/25 - Secure executive sponsorship □ Contract negotiation - Both legal teams - Week of 2/26 - Finalize terms
CRITICAL PATH: 🚨 POC must complete successfully by 3/1 - BLOCKER: If POC fails, deal dies 🚨 Budget approval from CFO Maria by 2/22 - GATE: Required to proceed to contract
STAKEHOLDER ENGAGEMENT NEEDED: 👤 VP Karen - Executive sponsorship & strategic alignment - Our VP leads - Target: 2/25 👤 IT Director David - Final technical sign-off post-POC - Our SE Mike leads - Target: 3/1 👤 Procurement lead Lisa - Vendor paperwork & payment terms - Our Ops leads - Target: 2/20
RISKS TO MANAGE: ⚠️ Competitor X still in play - they're cheaper. Need to reinforce value differentiation with CFO. ⚠️ Timeline is tight - 2/28 close date only works if nothing slips. Build in buffer. ⚠️ Champion Sarah going on vacation 2/25-3/5 - need backup contact.
`,
  },
  {
    id: "voniq-momentum",
    name: "von_iq_momentum",
    type: "string",
    sourceFieldDisplayName: "Momentum",
    sourceFieldDescription:
      "Evaluation of overall deal velocity and direction, highlighting engagement trends, stakeholder alignment, and whether momentum is increasing or stalling.",
    sourceFieldDataType: "LONG TEXT AREA",
    isCustom: false,
    prompt: `## MOMENTUM
(If Closed Won: assess momentum of the customer relationship and value realization trajectory, not the pre-close cycle. If Closed Lost: assess momentum of any ongoing relationship or re-entry potential if present; otherwise note momentum as negative or Unknown based on evidence.)

Assess the current momentum of this deal/relationship - is it moving forward, stalling, or moving backward? What's the trajectory?

**Provide momentum assessment across multiple dimensions:**

---

**1. OVERALL MOMENTUM RATING**

Rate the current momentum and explain why:


- **🚀 Strong Positive:** Deal/relationship is accelerating, things are moving faster than expected, strong progress
- **✅ Positive:** Deal/relationship is moving forward at healthy pace, on track
- **➡️ Neutral/Flat:** Not moving forward or backward, stalled or waiting
- **⚠️ Declining:** Deal/relationship is slowing down, losing steam, red flags emerging
- **🚨 Negative:** Deal/relationship is moving backward, serious risk of loss/churn

**Provide 2-3 sentence summary of current momentum:**
Example: "Deal has strong positive momentum. We've moved from discovery to POC in 3 weeks (faster than typical 6-week cycle). Executive sponsor engagement is increasing and competitor X is losing favor after their demo underwhelmed."

---

**2. ENGAGEMENT MOMENTUM**

How is engagement and responsiveness trending?

**Assess:**
- **Response times:** Getting faster, staying consistent, or slowing down?
- **Communication frequency:** Increasing, stable, or decreasing?
- **Meeting attendance:** Are they showing up, engaged, or canceling/no-showing?
- **Proactivity:** Are they initiating contact or only responding?
- **Depth of conversations:** Getting deeper or more superficial?

**Rate:**
- **Increasing:** More frequent contact, faster responses, deeper engagement
- **Stable:** Consistent engagement patterns
- **Decreasing:** Slower responses, less frequent contact, declining engagement

**Evidence:**
Cite specific examples:
- "Champion Sarah has gone from 24hr to 4hr response time over last 2 weeks"
- "Went 8 days without response after previously responding same-day"
- "They've initiated 3 meetings in past week vs. us always scheduling before"

---

**3. STAKEHOLDER MOMENTUM**

How is stakeholder engagement and alignment trending?

**Assess:**
- **Breadth:** Are we engaging more or fewer stakeholders over time?
- **Level:** Are we reaching higher or staying at same level?
- **Alignment:** Are stakeholders becoming more aligned or more divided?
- **Champions:** Are champions becoming stronger or weakening?
- **Blockers:** Are blockers being converted or becoming more entrenched?

**Rate:**
- **Improving:** Engaging more stakeholders, reaching higher levels, gaining champions
- **Stable:** Consistent stakeholder engagement
- **Declining:** Losing access, stakeholders disengaging, losing champions

**Evidence:**
- "Gained access to VP-level for first time last week"
- "Champion John has gone quiet, haven't heard from him in 10 days"
- "CFO who was skeptic is now supportive after reference call"

---

**4. TIMELINE MOMENTUM**

How is the timeline trending?

**Assess:**
- **Acceleration:** Is timeline compressing (moving faster)?
- **On track:** Is timeline holding as planned?
- **Slippage:** Is timeline extending or slipping?
- **Delays:** Are there delays or postponements?
- **Urgency:** Is urgency increasing or decreasing?

**Rate:**
- **Accelerating:** Timeline compressing, moving faster than planned
- **On Track:** Hitting planned milestones
- **Slipping:** Timeline extending, delays occurring
- **Stalled:** No timeline or stuck indefinitely

**Evidence:**
- "Close date moved up from Q2 to March 30 due to new urgency"
- "Decision timeline has extended from 'end of Feb' to 'sometime Q1' to 'maybe Q2'"
- "Hit every milestone on schedule for 6 weeks straight"

---

**5. DECISION MOMENTUM**

How is progress through their decision process?

**Assess:**
- **Forward movement:** Are we moving through their stages/gates?
- **Completion:** Are action items and next steps being completed?
- **Decisions:** Are decisions being made or delayed?
- **Approvals:** Are approvals being obtained or stuck?
- **Blockers:** Are blockers being cleared or accumulating?

**Rate:**
- **Progressing:** Moving through stages, clearing gates, getting decisions
- **Stuck:** Not moving through process, decisions delayed
- **Regressing:** Going backward in process, decisions being reversed

**Evidence:**
- "Passed technical evaluation, security review, and budget approval in 3 weeks"
- "Still waiting on technical sign-off we expected 2 weeks ago"
- "VP overrode decision to move forward, back to square one"

---

**6. COMPETITIVE MOMENTUM**

How is our competitive position trending?

**Assess:**
- **Position:** Are we pulling ahead, falling behind, or holding position?
- **Eliminations:** Are competitors being eliminated or are we?
- **Preference signals:** Are customer signals favoring us more or less?
- **Comparison:** Are comparisons going in our favor?

**Rate:**
- **Winning:** Pulling ahead of competition, becoming clear favorite
- **Competitive:** Neck and neck, could go either way
- **Losing:** Falling behind, competitor(s) favored

**Evidence:**
- "Competitor X eliminated after failed POC, down to us vs. Competitor Y"
- "Customer repeatedly mentions how Competitor Y's pricing is more attractive"
- "Champion said 'You're our first choice if we can make the numbers work'"

---

**7. VALUE/SATISFACTION MOMENTUM** (For Customers)

How is perceived value and satisfaction trending?

**Assess:**
- **Adoption:** Is usage increasing or decreasing?
- **Satisfaction:** Are they more or less satisfied over time?
- **Value realization:** Are they seeing more value or less?
- **Feedback:** Is feedback becoming more positive or negative?
- **Expansion signals:** Are expansion opportunities growing or shrinking?

**Rate:**
- **Increasing:** Growing satisfaction, expanding usage, more value seen
- **Stable:** Consistent satisfaction and value
- **Decreasing:** Declining satisfaction, reduced usage, value questioned

---

**8. MOMENTUM INDICATORS**

Document specific indicators of momentum (positive or negative):

**Positive Momentum Indicators:**
- Timeline acceleration
- Faster response times
- More stakeholder engagement
- Executive involvement increasing
- Competitors being eliminated
- Budget approved ahead of schedule
- More meetings requested by them
- Deeper technical engagement
- Champions becoming more active
- Objections being overcome
- Approvals obtained
- Urgency increasing
- They're initiating next steps
- Expanding scope or requirements
- Positive sentiment shifts

**Negative Momentum Indicators:**
- Timeline slipping
- Slower responses or ghosting
- Stakeholders disengaging
- Meetings being cancelled/postponed
- Competing priorities emerging
- Budget questions arising
- Champion going quiet
- New objections surfacing
- Competitive threats strengthening
- Urgency decreasing
- Decisions being delayed
- We're always chasing for next steps
- Scope being reduced
- Negative sentiment shifts
- Warning signs of churn

**List the specific indicators you're seeing:**
- ✅ "CFO approved budget 2 weeks early"
- ⚠️ "Champion hasn't responded to 3 emails in 10 days"
- ✅ "They moved demo up a week citing urgency"
- 🚨 "VP mentioned 'revisiting timing' in last meeting"

---

**9. MOMENTUM TREND**

What's the trend over time?

**Assess:**
- Last 2 weeks
- Last month
- Last quarter (if applicable)

**Has momentum been:**
- **Building:** Getting better over time, accelerating
- **Consistent:** Steady state, not changing
- **Declining:** Getting worse over time, decelerating
- **Volatile:** Up and down, unpredictable

**Describe the trend:**
Example: "Momentum has been declining over past month. Started strong in January with quick progression through discovery and demo stages. But in February, responses slowed from same-day to 3-5 days, technical review has been delayed twice, and champion has been less engaged. Timeline has slipped from 'end of Feb close' to 'sometime Q1'. Need to diagnose why and course-correct."

---

**10. MOMENTUM RISKS & OPPORTUNITIES**

What could accelerate or decelerate momentum?

**Momentum Accelerators (what could speed things up):**
- New urgency driver emerges
- Executive champion gets engaged
- Competitor makes mistake
- Budget becomes available
- Successful POC/trial
- Strong reference call
- Internal approval obtained
- Blocker removed
- Market/business event creates urgency

**Momentum Decelerators (what could slow things down):**
- Champion leaves or goes quiet
- Competing priority emerges
- Budget questions arise
- Negative evaluation result
- Competitor undercuts on price
- Economic buyer not engaged
- Internal approval delayed
- Technical blocker surfaces
- Timeline conflict emerges

**List specific risks and opportunities for THIS deal:**

---

**11. MOMENTUM ACTION PLAN**

What should we do about current momentum?

**If momentum is positive:**
- How do we maintain it?
- How do we accelerate further?
- What could kill momentum?
- What's our plan to keep pushing forward?

**If momentum is flat/stalled:**
- What's causing the stall?
- What could restart momentum?
- Should we escalate or wait?
- What's our activation plan?

**If momentum is declining:**
- What's causing the decline?
- Can we reverse it? How?
- Should we de-prioritize?
- What's our recovery plan?

**Provide specific actions:**
Example: "Momentum has stalled. Root cause: champion on vacation and no backup contact. Action: (1) Reach out to VP directly to maintain continuity (2) Propose scaled-down next step that doesn't require champion (3) Schedule re-engagement meeting for when champion returns. Timeline: restart momentum by 2/20 when champion is back."

---

**12. MOMENTUM SUMMARY**

Provide a final summary paragraph:
- Overall momentum rating and direction
- Key indicators driving that assessment
- Trend over time
- Biggest risks to momentum
- Action plan to maintain/improve momentum

**Example Summary:**
"Momentum is positive and accelerating. We've moved from first call to signed contract in 6 weeks (vs. typical 12-week cycle). Key indicators: (1) Timeline compressed twice at their request (2) Executive sponsor actively championing us (3) Beat two competitors in evaluation (4) Budget approved ahead of schedule. Primary risk: implementation complexity concerns from IT. If POC goes well next week, expect continued strong momentum toward April go-live. Action: Ensure flawless POC execution and maintain weekly cadence with all stakeholders."

---

**Be data-driven and specific:**
Don't just say "momentum is good" - cite specific evidence, behaviors, and timeline changes that demonstrate momentum direction.`,
  },
  {
    id: "voniq-open-action-items",
    name: "von_iq_open_action_items",
    type: "string",
    sourceFieldDisplayName: "Open Action Items",
    sourceFieldDescription:
      "Current outstanding tasks for both seller and buyer teams, each with responsible owner, priority level, and completion status.",
    sourceFieldDataType: "LONG TEXT AREA",
    isCustom: false,
    prompt: `## 10. OPEN ACTION ITEMS
(If Closed Won: include post-sale delivery items still open only if present. If Closed Lost: include only still-relevant closeout or re-engagement items explicitly committed in conversations.)

Identify all open action items that are currently active and relevant - commitments that still need to be fulfilled and matter to moving this relationship forward.

**CRITICAL FILTERING RULES:**

1. **Only include action items that are BOTH:**
   - Not yet completed OR partially completed
   - Still relevant to current situation (context hasn't made them obsolete)

2. **Exclude:**
   - Actions that were promised but became irrelevant as the deal evolved
   - Commitments that are now outdated or superseded by newer agreements
   - Items that were implicitly abandoned or deprioritized by both parties
   - "Nice to have" items that neither party is actively pursuing

3. **Prioritization logic:**
   - **Critical items** matter regardless of age (e.g., "Provide SOC2 cert" promised 5 months ago still blocks deal)
   - **Recent items** (last 2-4 weeks) automatically get higher priority
   - **Blocking items** (anything preventing next step) are highest priority
   - **Time-sensitive items** with deadlines get elevated priority

---

**For each open action item, extract:**

**Action Description:**
- What specifically needs to be done?
- Be precise - not "follow up with customer" but "send technical architecture diagram to IT Director David"

**Owner:**
- Who is responsible? (Our team or their team)
- Specific person if known

**Context:**
- When was this committed? (date or timeframe)
- Why does this matter? (what does it unblock or enable)
- What happens if not done?

**Status:**
- Not started
- In progress
- Blocked (and why)
- Waiting on [person/team]

**Priority:**
Rate each item:
- **🔴 Critical:** Blocking progress, deal/renewal/expansion can't move forward without this
- **🟡 High:** Important for next stage, should be done within 1-2 weeks
- **🟢 Medium:** Valuable but not urgent, can wait 2-4 weeks
- **⚪ Low:** Nice to have, no immediate urgency

**Deadline/Target:**
- Hard deadline if one exists
- Target date if discussed
- "ASAP" if time-sensitive but no specific date
- "No deadline" if not time-bound

**Dependencies:**
- What must happen first before this can be done?
- What's waiting on this to be completed?

---

**INTELLIGENCE IN FILTERING:**

**Look for signals that an action item is NO LONGER RELEVANT:**
- "Actually, we don't need that anymore"
- "Let's skip that and move straight to..."
- Deal progressed past the stage where that item mattered
- Neither party has mentioned it in weeks/months despite multiple interactions
- Superseded by a newer approach or agreement
- Original reason for the action no longer applies

**Look for signals that an OLD action item IS STILL RELEVANT:**
- Recently mentioned again despite being old
- Still required for a gate/approval that hasn't happened yet
- Customer asks about it: "Are you still going to..."
- Blockers haven't been resolved that made it necessary
- Compliance/legal/technical requirement that can't be skipped

**Examples of filtering logic:**

✅ INCLUDE - Promised 4 months ago, still relevant:
"Provide SOC2 Type 2 certification - Promised in October during security review - Still blocks final contract signature - Legal team waiting on this"

❌ EXCLUDE - Promised 2 weeks ago, no longer relevant:
"Send competitive comparison against Competitor X - Promised 2 weeks ago - BUT: Competitor X was eliminated from evaluation, customer no longer considering them"

✅ INCLUDE - Recent and important:
"Schedule executive briefing with VP Karen - Committed last Friday - Required to secure executive sponsorship before final decision next week"

❌ EXCLUDE - Old and abandoned:
"Provide pricing for 100-user tier - Discussed in February - BUT: Deal moved to 50-user tier in March, this pricing no longer needed"

✅ INCLUDE - Old but still blocking:
"Customer to complete vendor registration paperwork - Waiting since January - Still required before we can process PO and start implementation"

---

**ORGANIZATION:**

Group action items by owner and priority:

**OUR TEAM - CRITICAL:**
🔴 Action 1 - Owner - Target date - Why critical - Current status

**OUR TEAM - HIGH:**
🟡 Action 2 - Owner - Target date - Why important - Current status

**THEIR TEAM - CRITICAL:**
🔴 Action 3 - Owner - Target date - Why critical - Current status

**THEIR TEAM - HIGH:**
🟡 Action 4 - Owner - Target date - Why important - Current status

**MEDIUM/LOW PRIORITY:**
🟢 Action 5 - Owner - No urgent deadline - Nice to have
⚪ Action 6 - Owner - When convenient - Low priority

---

**SPECIAL CALLOUTS:**

Highlight items that need special attention:

⚠️ **OVERDUE:** Any action item past its deadline
🚨 **BLOCKING:** Any action item blocking next critical step
⏰ **TIME-SENSITIVE:** Any action item with deadline in next 1-2 weeks
❓ **STUCK:** Any action item that's been "in progress" for 3+ weeks with no movement
🔄 **WAITING ON:** Any action item waiting on someone else

---

**EXAMPLES OF WELL-FORMATTED ACTION ITEMS:**

**OUR TEAM - CRITICAL:**
🔴 **Provide signed BAA (Business Associate Agreement)**
- Owner: Our Legal team
- Committed: 3 weeks ago during contract negotiation
- Why critical: Blocks contract signature. HIPAA requirement, deal can't close without it.
- Status: In progress - Legal reviewing their redlines
- Target: By March 15 (customer's hard deadline)
- 🚨 BLOCKING final approval

🔴 **Send reference customer contact for healthcare vertical**
- Owner: Our AE Sarah
- Committed: Last week
- Why critical: CFO Maria requires this to approve budget
- Status: Not started - waiting to identify right reference
- Target: By March 10
- ⏰ TIME-SENSITIVE: CFO decision meeting is March 12

**OUR TEAM - HIGH:**
🟡 **Deliver technical architecture diagram for security team**
- Owner: Our Solutions Engineer Mike
- Committed: 10 days ago
- Why important: Needed for security review, last item for IT Director sign-off
- Status: In progress - Mike creating custom diagram
- Target: By March 8
- Dependency: Security review can't start until this is delivered

**THEIR TEAM - CRITICAL:**
🔴 **Complete vendor registration in procurement system**
- Owner: Their Procurement (Lisa)
- Committed: 6 weeks ago
- Why critical: Required before PO can be issued. Blocks everything.
- Status: ❓ STUCK - Been "in progress" for 6 weeks, keep getting "IT is working on access"
- Target: ASAP - now 3 weeks overdue
- 🚨 BLOCKING deal close and implementation start

**THEIR TEAM - HIGH:**
🟡 **Provide list of required integrations and API endpoints**
- Owner: Their IT team (David)
- Committed: Last week during technical call
- Why important: We need this to size implementation effort and timeline
- Status: Waiting on David
- Target: By March 10
- Dependency: Implementation plan and timeline depend on this

**MEDIUM PRIORITY:**
🟢 **Share Q4 usage report for upsell sizing**
- Owner: Our Customer Success Manager
- Committed: 2 weeks ago
- Why it matters: Helps inform expansion conversation
- Status: In progress
- Target: By end of month
- No urgent deadline, but useful for Q2 expansion planning

---

**IF NO OPEN ACTION ITEMS:**

If there are genuinely no open action items, state clearly:
"No open action items currently. All previous commitments have been fulfilled or are no longer relevant given where the deal/relationship stands."

---

**REALITY CHECK:**

Ask yourself:
- If I called the customer tomorrow, what would they say we still owe them?
- If I looked at our last 3 conversations, what commitments are still unfulfilled?
- What's actually blocking progress right now?
- What items are we or they actively waiting on?

Don't include items just because they were mentioned once. Include items that are:
- Actively tracked or referenced
- Blocking progress
- Recently committed (last 2-4 weeks)
- Old but still critical (compliance, legal, technical requirements that can't be skipped)

---

**FINAL OUTPUT FORMAT:**

Provide a scannable list organized by priority, with critical blockers at the top. Make it immediately actionable - someone should be able to pick up this list and know exactly what needs to happen and why it matters`,
  },
  {
    id: "voniq-is-available",
    name: "von_iq_is_available",
    type: "boolean",
    sourceFieldDisplayName: "Is Available",
    sourceFieldDescription: "Indicates if we have VonIQ data available",
    sourceFieldDataType: "Checkbox",
    isCustom: false,
    prompt: "", // TODO: Add prompt value
  },
];

// Email categorization settings
export interface EmailCategorizationSettings {
  enabled: boolean;
  emailObjectType: string; // e.g., "Task"
  opportunityField: string; // e.g., "Related To ID"
  accountField: string; // e.g., "Account ID"
  emailBodyField: string; // e.g., "Description"
  filterConditions: FilterCondition[];
  filterGroups?: FilterGroup[]; // Optional grouped filters
}

export interface FilterCondition {
  id: string;
  field: string;
  operator: "equals" | "contains" | "startsWith" | "endsWith";
  value: string;
}

export interface FilterGroup {
  id: string;
  conditions: FilterCondition[];
  internalLogicalOperator: "AND" | "OR"; // How conditions within group are combined
  groupLogicalOperator: "AND" | "OR"; // How this group connects to previous groups/conditions
}

// Process configuration settings
export interface ProcessConfigurationSettings {
  businessStages: BusinessStage[];
  customerStages: CustomerStage[];
  churnSignalField: string;
  renewalDetectionField: string;
  customerIdentificationField: string;
  salesforceDescription: string;
  salesQuarter: "Fiscal" | "Calendar";
  keywords: string;
  businessProcess: string;
  companyDescription: string;
}

// Integration configuration
export interface IntegrationConfig {
  id?: string; // Integration ID for edit mode
  accessLevel: "tenant" | "user";
  // Salesforce specific
  environmentType?: "sandbox" | "production";
  instanceUrl?: string;
  apiVersion?: string;
  // Gong specific
  gongApiBaseUrl?: string;
}

interface PreferencesState {
  // Tab state for defaults panel
  defaultsActiveTab: "email-categorization" | "process-configuration";
  setDefaultsActiveTab: (
    tab: "email-categorization" | "process-configuration",
  ) => void;

  // Tab state for fields panel
  fieldsActiveTab: "salesforce" | "voniq";
  setFieldsActiveTab: (tab: "salesforce" | "voniq") => void;

  // Salesforce Fields data
  salesforceFields: Field[];

  // VonIQ Fields customization (stored, fetched from backend)
  voniqFieldCustomizations: VonIQFieldCustomization[];
  userDefinedVonIQFields: VonIQField[]; // User-created custom fields

  // Server sync method
  syncFromServer: (data: {
    salesforceFields: Field[];
    voniqFields?: VonIQField[];
    voniqFieldCustomizations?: VonIQFieldCustomization[];
    userDefinedVonIQFields?: VonIQField[];
    emailCategorization: EmailCategorizationSettings;
    processConfiguration: ProcessConfigurationSettings;
  }) => void;

  // Fields UI state
  fieldsSearchTerm: string;
  setFieldsSearchTerm: (term: string) => void;
  expandedFieldIds: string[];
  toggleFieldExpanded: (id: string) => void;
  editingFieldId: string | null;
  editingFieldType: "salesforce" | "voniq" | null;
  setEditingField: (
    id: string | null,
    fieldType?: "salesforce" | "voniq",
  ) => void;

  // Salesforce Field management methods
  addField: (field: Field) => void;
  updateField: (id: string, updates: Partial<Field>) => void;
  deleteField: (id: string) => void;

  // VonIQ Field customization methods
  toggleVonIQFieldEnabled: (fieldId: string) => void;
  updateVonIQFieldCustomization: (
    fieldId: string,
    updates: Partial<VonIQFieldCustomization>,
  ) => void;
  addUserDefinedVonIQField: (field: VonIQField) => void;
  updateUserDefinedVonIQField: (
    id: string,
    updates: Partial<VonIQField>,
  ) => void;
  deleteUserDefinedVonIQField: (id: string) => void;

  // Email categorization settings
  emailCategorization: EmailCategorizationSettings;
  updateEmailCategorization: (
    settings: Partial<EmailCategorizationSettings>,
  ) => void;
  addFilterCondition: (condition: FilterCondition) => void;
  removeFilterCondition: (id: string) => void;
  updateFilterCondition: (
    id: string,
    updates: Partial<FilterCondition>,
  ) => void;
  addFilterGroup: (group: FilterGroup) => void;
  removeFilterGroup: (groupId: string) => void;
  addConditionToGroup: (groupId: string, condition: FilterCondition) => void;
  removeConditionFromGroup: (groupId: string, conditionId: string) => void;
  updateConditionInGroup: (
    groupId: string,
    conditionId: string,
    updates: Partial<FilterCondition>,
  ) => void;
  updateFilterGroup: (groupId: string, updates: Partial<FilterGroup>) => void;
  updateGroupInternalOperator: (
    groupId: string,
    operator: "AND" | "OR",
  ) => void;

  // Process configuration settings
  processConfiguration: ProcessConfigurationSettings;
  updateProcessConfiguration: (
    settings: Partial<ProcessConfigurationSettings>,
  ) => void;
  addBusinessStage: (stage: BusinessStage) => void;
  removeBusinessStage: (stage: BusinessStage) => void;
  addCustomerStage: (stage: CustomerStage) => void;
  removeCustomerStage: (stage: CustomerStage) => void;

  // Separate pane state for workspace and personal integrations
  // This allows each pane to have isolated state and mount/unmount independently
  configuringWorkspaceIntegration: string | null;
  setConfiguringWorkspaceIntegration: (id: string | null) => void;
  configuringPersonalIntegration: string | null;
  setConfiguringPersonalIntegration: (id: string | null) => void;

  // Loading state for OAuth authorization (shared between toggle and sidepanel flows)
  loadingIntegrationId: string | null;
  setLoadingIntegrationId: (id: string | null) => void;

  // Edit mode integration data (passed when editing existing integrations)
  editingIntegrationData: IntegrationConfig | null;
  setEditingIntegrationData: (data: IntegrationConfig | null) => void;

  // Team management UI state
  addingTeamMember: boolean;
  setAddingTeamMember: (adding: boolean) => void;
}

const usePreferencesStoreBase = create<PreferencesState>((set) => ({
  // Tab state
  defaultsActiveTab: "process-configuration",
  setDefaultsActiveTab: (tab) => set({ defaultsActiveTab: tab }),

  // Fields tab state
  fieldsActiveTab: "voniq",
  setFieldsActiveTab: (tab) => set({ fieldsActiveTab: tab }),

  // Salesforce Fields data - Only Amount and Competition for Salesforce mapping
  salesforceFields: [
    {
      id: "sf-amount",
      name: "Amount",
      type: "Currency",
      description: "The Salesforce field that represents the deal amount",
      salesforceObject: "",
      salesforceFieldName: "",
    },
    {
      id: "sf-competition",
      name: "Competition",
      type: "Text",
      description:
        "The Salesforce field that represents competition information",
      salesforceObject: "",
      salesforceFieldName: "",
    },
  ],

  // VonIQ Fields customization
  voniqFieldCustomizations: [],
  userDefinedVonIQFields: [],

  // Server sync method
  syncFromServer: (data) =>
    set({
      salesforceFields: data.salesforceFields,
      voniqFieldCustomizations: data.voniqFieldCustomizations || [],
      userDefinedVonIQFields: data.userDefinedVonIQFields || [],
      emailCategorization: data.emailCategorization,
      processConfiguration: data.processConfiguration,
    }),

  // Note: voniqFields (default fields) are fetched separately and not stored in the store
  // They come from the backend preferences API and are used directly in the VonIQ panel

  // Fields UI state
  fieldsSearchTerm: "",
  setFieldsSearchTerm: (term) => set({ fieldsSearchTerm: term }),
  expandedFieldIds: [],
  toggleFieldExpanded: (id) =>
    set((state) => ({
      expandedFieldIds: state.expandedFieldIds.includes(id)
        ? state.expandedFieldIds.filter((fieldId) => fieldId !== id)
        : [...state.expandedFieldIds, id],
    })),
  editingFieldId: null,
  editingFieldType: null,
  setEditingField: (id, fieldType) =>
    set({
      editingFieldId: id,
      editingFieldType: fieldType || null,
    }),

  // Salesforce Field management methods
  addField: (field) =>
    set((state) => ({
      salesforceFields: [...state.salesforceFields, field],
    })),

  updateField: (id, updates) =>
    set((state) => ({
      salesforceFields: state.salesforceFields.map((field) =>
        field.id === id ? { ...field, ...updates } : field,
      ),
    })),

  deleteField: (id) =>
    set((state) => ({
      salesforceFields: state.salesforceFields.filter(
        (field) => field.id !== id,
      ),
    })),

  // VonIQ Field customization methods
  toggleVonIQFieldEnabled: (fieldId) =>
    set((state) => {
      const existingCustomization = state.voniqFieldCustomizations.find(
        (c) => c.fieldId === fieldId,
      );

      if (existingCustomization) {
        // Toggle existing customization
        return {
          voniqFieldCustomizations: state.voniqFieldCustomizations.map((c) =>
            c.fieldId === fieldId ? { ...c, enabled: !c.enabled } : c,
          ),
        };
      } else {
        // Create new customization (default is enabled, so toggle to disabled)
        return {
          voniqFieldCustomizations: [
            ...state.voniqFieldCustomizations,
            { fieldId, enabled: false },
          ],
        };
      }
    }),

  updateVonIQFieldCustomization: (fieldId, updates) =>
    set((state) => {
      const existingCustomization = state.voniqFieldCustomizations.find(
        (c) => c.fieldId === fieldId,
      );

      if (existingCustomization) {
        return {
          voniqFieldCustomizations: state.voniqFieldCustomizations.map((c) =>
            c.fieldId === fieldId ? { ...c, ...updates } : c,
          ),
        };
      } else {
        return {
          voniqFieldCustomizations: [
            ...state.voniqFieldCustomizations,
            { fieldId, enabled: true, ...updates },
          ],
        };
      }
    }),

  addUserDefinedVonIQField: (field) =>
    set((state) => ({
      userDefinedVonIQFields: [...state.userDefinedVonIQFields, field],
    })),

  updateUserDefinedVonIQField: (id, updates) =>
    set((state) => ({
      userDefinedVonIQFields: state.userDefinedVonIQFields.map((field) =>
        field.id === id ? { ...field, ...updates } : field,
      ),
    })),

  deleteUserDefinedVonIQField: (id) =>
    set((state) => ({
      userDefinedVonIQFields: state.userDefinedVonIQFields.filter(
        (field) => field.id !== id,
      ),
    })),

  // Email categorization defaults
  emailCategorization: {
    enabled: true,
    emailObjectType: "",
    opportunityField: "",
    accountField: "",
    emailBodyField: "",
    filterConditions: [],
    filterGroups: [],
  },

  updateEmailCategorization: (settings) =>
    set((state) => ({
      emailCategorization: {
        ...state.emailCategorization,
        ...settings,
      },
    })),

  addFilterCondition: (condition) =>
    set((state) => ({
      emailCategorization: {
        ...state.emailCategorization,
        filterConditions: [
          ...state.emailCategorization.filterConditions,
          condition,
        ],
      },
    })),

  removeFilterCondition: (id) =>
    set((state) => ({
      emailCategorization: {
        ...state.emailCategorization,
        filterConditions: state.emailCategorization.filterConditions.filter(
          (c) => c.id !== id,
        ),
      },
    })),

  updateFilterCondition: (id, updates) =>
    set((state) => ({
      emailCategorization: {
        ...state.emailCategorization,
        filterConditions: state.emailCategorization.filterConditions.map((c) =>
          c.id === id ? { ...c, ...updates } : c,
        ),
      },
    })),

  addFilterGroup: (group) =>
    set((state) => ({
      emailCategorization: {
        ...state.emailCategorization,
        filterGroups: [
          ...(state.emailCategorization.filterGroups || []),
          group,
        ],
      },
    })),

  removeFilterGroup: (groupId) =>
    set((state) => ({
      emailCategorization: {
        ...state.emailCategorization,
        filterGroups: (state.emailCategorization.filterGroups || []).filter(
          (g) => g.id !== groupId,
        ),
      },
    })),

  addConditionToGroup: (groupId, condition) =>
    set((state) => ({
      emailCategorization: {
        ...state.emailCategorization,
        filterGroups: (state.emailCategorization.filterGroups || []).map((g) =>
          g.id === groupId
            ? { ...g, conditions: [...g.conditions, condition] }
            : g,
        ),
      },
    })),

  removeConditionFromGroup: (groupId, conditionId) =>
    set((state) => ({
      emailCategorization: {
        ...state.emailCategorization,
        filterGroups: (state.emailCategorization.filterGroups || []).map((g) =>
          g.id === groupId
            ? {
                ...g,
                conditions: g.conditions.filter((c) => c.id !== conditionId),
              }
            : g,
        ),
      },
    })),

  updateConditionInGroup: (groupId, conditionId, updates) =>
    set((state) => ({
      emailCategorization: {
        ...state.emailCategorization,
        filterGroups: (state.emailCategorization.filterGroups || []).map((g) =>
          g.id === groupId
            ? {
                ...g,
                conditions: g.conditions.map((c) =>
                  c.id === conditionId ? { ...c, ...updates } : c,
                ),
              }
            : g,
        ),
      },
    })),

  updateFilterGroup: (groupId, updates) =>
    set((state) => ({
      emailCategorization: {
        ...state.emailCategorization,
        filterGroups: (state.emailCategorization.filterGroups || []).map((g) =>
          g.id === groupId ? { ...g, ...updates } : g,
        ),
      },
    })),

  updateGroupInternalOperator: (groupId: string, operator: "AND" | "OR") =>
    set((state) => ({
      emailCategorization: {
        ...state.emailCategorization,
        filterGroups: (state.emailCategorization.filterGroups || []).map((g) =>
          g.id === groupId ? { ...g, internalLogicalOperator: operator } : g,
        ),
      },
    })),

  // Process configuration defaults
  processConfiguration: {
    businessStages: [],
    customerStages: [],
    churnSignalField: "",
    renewalDetectionField: "",
    customerIdentificationField: "",
    salesforceDescription: "",
    salesQuarter: "Fiscal",
    keywords: "",
    businessProcess: "",
    companyDescription: "",
  },

  updateProcessConfiguration: (settings) =>
    set((state) => ({
      processConfiguration: {
        ...state.processConfiguration,
        ...settings,
      },
    })),

  addBusinessStage: (stage) =>
    set((state) => ({
      processConfiguration: {
        ...state.processConfiguration,
        businessStages: [...state.processConfiguration.businessStages, stage],
      },
    })),

  removeBusinessStage: (stage) =>
    set((state) => ({
      processConfiguration: {
        ...state.processConfiguration,
        businessStages: state.processConfiguration.businessStages.filter(
          (s) => s !== stage,
        ),
      },
    })),

  addCustomerStage: (stage) =>
    set((state) => ({
      processConfiguration: {
        ...state.processConfiguration,
        customerStages: [...state.processConfiguration.customerStages, stage],
      },
    })),

  removeCustomerStage: (stage) =>
    set((state) => ({
      processConfiguration: {
        ...state.processConfiguration,
        customerStages: state.processConfiguration.customerStages.filter(
          (s) => s !== stage,
        ),
      },
    })),

  // Separate pane state for workspace and personal integrations
  configuringWorkspaceIntegration: null,
  setConfiguringWorkspaceIntegration: (id) =>
    set({ configuringWorkspaceIntegration: id }),
  configuringPersonalIntegration: null,
  setConfiguringPersonalIntegration: (id) =>
    set({ configuringPersonalIntegration: id }),

  // Loading state for OAuth authorization
  loadingIntegrationId: null,
  setLoadingIntegrationId: (id) => set({ loadingIntegrationId: id }),

  // Edit mode integration data
  editingIntegrationData: null,
  setEditingIntegrationData: (data) => set({ editingIntegrationData: data }),

  // Team management UI state
  addingTeamMember: false,
  setAddingTeamMember: (adding) => set({ addingTeamMember: adding }),
}));

const usePreferencesStore = createSelectors(usePreferencesStoreBase);

export default usePreferencesStore;
