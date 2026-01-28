export const sampleMarkdownContent = `
Update: I've successfully retrieved comprehensive risk data for 367 open deals closing in FY2026 Q4 (Nov 1, 2025 - Jan 31, 2026). The data includes Von IQ intelligence fields, custom risk indicators, and standard Salesforce metrics. Now let me analyze the risk factors and provide you with actionable insights.

## 🚨 At-Risk Deals This Quarter (FY2026 Q4)

I've identified 367 open opportunities totaling significant pipeline for this quarter. Here are the highest-risk deals requiring immediate attention:

### CRITICAL RISK - Immediate Action Required

| Deal | Amount | Stage | Risk Level | Primary Risk Factors |
|------|--------|-------|------------|---------------------|
| S&P Global (Global Drift Instances) | $500K | 3. Technical Win | 🔴 HIGH | • NDA/legal review blocking progress<br>• Fragmented decision-making across 4 divisions<br>• Active competitor evaluation (Adobe, Salesforce) |
| Canva | $451K | 4. Business Win | 🟡 MEDIUM | • Security review taking 1-2 months<br>• Pricing not yet reviewed<br>• Waiting until after Canva World Tour event |
| Internet Brands | $357K | 2. Qualified | 🔴 HIGH | • Perceived as passive vs. Conversica<br>• Low multi-threading beyond Health vertical<br>• Tight timeline for pilot before renewal |

### KEY RISK PATTERNS ACROSS THE QUARTER

#### 1. Momentum Stalls (Most Common)

30+ deals showing "Neutral/Flat" momentum with stalled progress:

**Common Causes:**
- Legal/Procurement delays (Tenable, Paychex, TeamViewer, Mimecast)
- Internal alignment issues (Trimble, Dayforce, Nielsen)
- Stakeholder unavailability (holidays, offsites, transitions)

**Example - Tenable ($275K):**
- Von IQ Risk: Procurement requesting $250K/year (below proposal)
- Momentum: Stalled in legal review, unlikely to close by Oct 31
- Action Needed: Escalate to executive sponsor, resolve pricing gap

#### 2. Customer Ghosting / Slow Response

15+ deals with decreased engagement:

**Red Flags:**
- Von IQ Customer Ghosting: "Slow to respond" or "Unresponsive"
- Days since last activity: 15-39 days
- Multiple follow-ups with no response

**Example - Holman Automotive ($255K):**
- Last activity: 39 days ago
- Momentum: Waiting on internal decision
- Risk: Deal deprioritized after adapting to Drift loss

#### 3. Budget/Pricing Concerns

20+ deals with budget uncertainty:

**Indicators:**
- Von IQ Budget Confirmed: "No budget yet" or "Unknown"
- Custom field: most_likely = false
- Stakeholder concerns about pricing vs. alternatives

**Example - Mimecast ($351K):**
- Budget not allocated for current fiscal year
- Must find savings from other tools
- Competing with 6sense, Chilipiper, internal tools

#### 4. Technical/Integration Blockers

12+ deals with unresolved technical concerns:

**Common Issues:**
- Complex Salesforce routing requirements
- Data mapping and integration complexity
- Security/compliance review delays

**Example - ServiceNow ($250K):**
- NDA blocking implementation documentation access
- Multiple RFI responses and architecture workshops required
- Key stakeholders haven't seen full demo

---

## 🔥 DEALS REQUIRING IMMEDIATE INTERVENTION

### Top 5 Deals at Highest Risk

1. **S&P Global - $500K** (3. Technical Win)
   - Risk: NDA review blocking all progress, 4-division fragmented decision
   - Action: Escalate NDA with legal teams, secure cross-division executive meeting
   - Timeline: 21 days in stage, 15 days since activity

2. **Internet Brands - $357K** (2. Qualified)
   - Risk: Perceived as complementary to Conversica, not replacement
   - Action: Schedule focused demo on outbound/cold lead engagement
   - Timeline: 77 days in stage, ghosting risk

3. **Trimble - $265K** (3. Technical Win)
   - Risk: Interim Copilot solution reducing urgency, timeline to 2026
   - Action: Demonstrate clear marketing/sales value vs. AgentForce
   - Timeline: 81 days in stage, momentum declining

4. **Insperity - $215K** (3. Technical Win)
   - Risk: Actively comparing to 6sense, IT/legal concerns
   - Action: Deliver security package, schedule competitive bake-off
   - Timeline: 50 days in stage, unclear next steps

5. **Dayforce - $200K** (3. Technical Win)
   - Risk: Stalled in RFP process, no urgency post-Drift removal
   - Action: Deliver requirements-matched demo, maintain contact
   - Timeline: 208 days in stage, process stuck

---

## RISK MITIGATION RECOMMENDATIONS

### For Stalled Deals (Neutral/Flat Momentum):
- Re-establish urgency - Highlight business impact of delays
- Executive escalation - Engage C-level sponsors
- Parallel-path activities - Start security/legal reviews early
- Clear mutual action plan - Document all steps to close

### For Ghosting/Slow Response:
- Multi-threaded outreach - Engage additional stakeholders
- Value reinforcement - Share relevant case studies
- Timeline pressure - Communicate discount/resource expiration
- Executive check-in - Request brief status update call

### For Budget Concerns:
- ROI quantification - Build detailed business case
- Flexible terms - Offer phased approach or payment options
- Consolidation story - Show savings from tool replacement
- Budget reallocation plan - Help identify funding sources

### For Technical Blockers:
- Dedicated technical resources - Assign solutions architect
- Proof of concept - Offer limited pilot to validate
- Reference customers - Connect with similar implementations
- Documentation package - Provide comprehensive integration guides

### Example Query for Risk Analysis:

\`\`\`sql
SELECT
  opportunity_name,
  amount,
  stage_name,
  days_in_stage,
  last_activity_date,
  CASE
    WHEN days_in_stage > 30 AND momentum = 'Flat' THEN 'HIGH'
    WHEN days_in_stage > 15 OR ghosting_flag = true THEN 'MEDIUM'
    ELSE 'LOW'
  END as risk_level
FROM opportunities
WHERE close_date BETWEEN '2025-11-01' AND '2026-01-31'
  AND is_closed = false
ORDER BY amount DESC;
\`\`\`

---

## SUMMARY STATISTICS

| Metric | Value |
|--------|-------|
| Total Open Deals This Quarter | 367 |
| Deals with Von IQ Data | 367 (100%) |
| High Risk (Stalled >30 days) | ~45 deals |
| Medium Risk (Slow momentum) | ~120 deals |
| Deals with overdue tasks | 89 deals |
| Average days since activity | 15 days |
| Deals pushed 3+ times | 28 deals |

**Data Sources:** Von IQ conversation intelligence (primary), custom risk fields (secondary), standard Salesforce activity metrics (tertiary)

**Assumptions:** FY2026 Q4 = Nov 1, 2025 - Jan 31, 2026 (fiscal quarter per your configuration)

---

Would you like me to deep-dive into any specific deal or create a prioritized action plan for your team?
`;
