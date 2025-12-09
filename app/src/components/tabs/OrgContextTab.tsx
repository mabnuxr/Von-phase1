import { useState } from "react";
import { PencilSimpleIcon, XIcon, CheckIcon, BrainIcon } from "@phosphor-icons/react";
import usePreferencesStore from "../../store/preferencesStore";
import { useUpdatePreferences } from "../../hooks/usePreferences";
import { OrgContextDocumentList } from "../OrgContextDocumentList";
import { OrgContextEditor } from "../OrgContextEditor";

// Default content for all documents
const DEFAULT_DOCUMENT_CONTENT: Record<string, string> = {
  "revenue-deal-value": `<h2>Source of Truth</h2>
<p>Use <code>@ARR__c</code> for all revenue reporting. This is the primary business metric representing Annual Recurring Revenue.</p>
<p>Do <strong>NOT</strong> use <code>@Amount</code> for revenue analysis. Amount holds the first payment or setup fee ($1,925–$6,605 typical range), which is a fraction of the actual deal value.</p>

<h2>Field-by-Field Breakdown</h2>
<table>
  <tr>
    <th>Field</th>
    <th>What It Represents</th>
    <th>When to Use</th>
    <th>When NOT to Use</th>
  </tr>
  <tr>
    <td><code>@ARR__c</code></td>
    <td>Annual Recurring Revenue — the annualized subscription value</td>
    <td>Pipeline reporting, revenue forecasting, deal value analysis, win/loss analysis</td>
    <td>Never avoid this field for revenue questions</td>
  </tr>
  <tr>
    <td><code>@Amount</code></td>
    <td>First payment or setup fee</td>
    <td>Understanding cash timing, first invoice value</td>
    <td>Revenue reporting, pipeline value, deal size comparisons</td>
  </tr>
  <tr>
    <td><code>@ACV__c</code></td>
    <td>Annual Contract Value</td>
    <td>Typically mirrors ARR for annual deals</td>
    <td>Redundant if ARR__c is available</td>
  </tr>
  <tr>
    <td><code>@TCV__c</code></td>
    <td>Total Contract Value over full term</td>
    <td>Multi-year deal total value</td>
    <td>Single-year deal analysis</td>
  </tr>
  <tr>
    <td><code>@New_ARR__c</code></td>
    <td>Incremental ARR added</td>
    <td>Expansion deal value, net new ARR reporting</td>
    <td>Renewal flat/contraction deals</td>
  </tr>
  <tr>
    <td><code>@net_arr__c</code></td>
    <td>Dollar change in ARR vs. prior contract</td>
    <td>Renewal expansion/contraction analysis, NRR calculation</td>
    <td>New business deals (no prior contract)</td>
  </tr>
  <tr>
    <td><code>@churn_arr__c</code></td>
    <td>Lost ARR from downsell or churn</td>
    <td>GRR calculation, contraction analysis</td>
    <td>Expansion deals</td>
  </tr>
  <tr>
    <td><code>@previous_contract_arr__c</code></td>
    <td>Prior contract's ARR value</td>
    <td>Renewal comparison, uplift calculation</td>
    <td>New business deals</td>
  </tr>
  <tr>
    <td><code>@arr_increase_on_renewal__c</code></td>
    <td>Percentage change from prior ARR</td>
    <td>Renewal health analysis, expansion rate</td>
    <td>New business deals</td>
  </tr>
</table>

<h2>Revenue Model Context</h2>
<p><strong>Model:</strong> Subscription-based ARR with annual contracts.</p>
<p><strong>Pricing Structure:</strong> Platform fee + per-user licensing</p>
<ul>
  <li>Platform fees: $750–$5,000/year depending on tier</li>
  <li>User licenses: $19–$49/user/month depending on tier (Starter/Pro/Premium)</li>
</ul>

<h3>Deal Value Ranges by Segment:</h3>
<table>
  <tr>
    <th>Segment</th>
    <th>Avg ARR</th>
    <th>Typical Range</th>
  </tr>
  <tr>
    <td>SMB</td>
    <td>$9K</td>
    <td>$5K–$15K</td>
  </tr>
  <tr>
    <td>Commercial</td>
    <td>$20K</td>
    <td>$10K–$35K</td>
  </tr>
  <tr>
    <td>Enterprise</td>
    <td>$55K</td>
    <td>$40K–$100K+</td>
  </tr>
</table>

<h3>Multi-Year Deals:</h3>
<ul>
  <li>Tracked via <code>@term_months__c</code> (12, 24, 36 months common)</li>
  <li><code>@multi_year_contract__c</code> (boolean) flags multi-year contracts</li>
  <li><code>@contract_start_date__c</code> and <code>@contract_end_date__c</code> define the subscription period</li>
  <li>Example: Tock renewed for 36 months with contract_end_date of 2029-01-31</li>
</ul>`,

  "sales-motions": `<h2>Sales Motion Types</h2>
<p>The organization uses distinct sales motions based on deal type and customer lifecycle stage.</p>

<h3>New Business Motion</h3>
<p>Identified by <code>@Type</code> = "New Business" or when <code>@AccountId</code> has no prior closed-won opportunities.</p>
<ul>
  <li><strong>Cycle Time:</strong> 45-90 days typical</li>
  <li><strong>Key Stages:</strong> Discovery → Demo → Proposal → Negotiation → Closed</li>
  <li><strong>Required Fields:</strong> <code>@Lead_Source__c</code>, <code>@Primary_Contact__c</code>, <code>@Decision_Criteria__c</code></li>
</ul>

<h3>Expansion Motion</h3>
<p>Triggered when existing customer opportunities have <code>@Type</code> = "Expansion" or "Upsell".</p>
<ul>
  <li><strong>Cycle Time:</strong> 30-60 days typical</li>
  <li><strong>Key Metrics:</strong> Track <code>@expansion_arr__c</code> and <code>@seats_added__c</code></li>
  <li><strong>Success Indicators:</strong> Customer health score > 70, NPS > 8</li>
</ul>

<h3>Renewal Motion</h3>
<p>Auto-created 120 days before <code>@contract_end_date__c</code>.</p>
<ul>
  <li><strong>Cycle Time:</strong> 30-45 days</li>
  <li><strong>Risk Indicators:</strong> <code>@churn_risk_score__c</code> > 50, declining usage</li>
  <li><strong>Required Actions:</strong> QBR within 90 days of renewal</li>
</ul>

<h3>Motion Segmentation</h3>
<table>
  <tr>
    <th>Segment</th>
    <th>Sales Motion</th>
    <th>Rep Assignment</th>
    <th>Support Level</th>
  </tr>
  <tr>
    <td>Enterprise ($50K+)</td>
    <td>High-touch, consultative</td>
    <td>Named AE + SE</td>
    <td>Dedicated CSM</td>
  </tr>
  <tr>
    <td>Commercial ($15K-$50K)</td>
    <td>Standard sales cycle</td>
    <td>Territory AE</td>
    <td>Pooled CSM</td>
  </tr>
  <tr>
    <td>SMB (< $15K)</td>
    <td>Velocity/transactional</td>
    <td>Inside Sales</td>
    <td>Self-serve + Support</td>
  </tr>
</table>`,

  "top-of-funnel": `<h2>Lead Management Overview</h2>
<p>Leads are managed through a qualification-first approach with clear handoff criteria between marketing and sales.</p>

<h3>Lead Sources</h3>
<p>Tracked via <code>@LeadSource</code> on both Lead and Opportunity objects.</p>
<table>
  <tr>
    <th>Source Category</th>
    <th>Lead Source Values</th>
    <th>Typical Conversion Rate</th>
  </tr>
  <tr>
    <td>Inbound</td>
    <td>Website, Content Download, Webinar, Demo Request</td>
    <td>15-25%</td>
  </tr>
  <tr>
    <td>Outbound</td>
    <td>Cold Outreach, SDR Sourced, Sales Prospecting</td>
    <td>5-10%</td>
  </tr>
  <tr>
    <td>Partner</td>
    <td>Partner Referral, Channel, Co-sell</td>
    <td>20-35%</td>
  </tr>
  <tr>
    <td>Existing</td>
    <td>Customer Referral, Expansion, Cross-sell</td>
    <td>40-60%</td>
  </tr>
</table>

<h3>Lead Qualification Criteria (BANT+)</h3>
<ul>
  <li><strong>Budget:</strong> <code>@Budget_Confirmed__c</code> = Yes, or <code>@Budget_Range__c</code> specified</li>
  <li><strong>Authority:</strong> <code>@Decision_Maker_Engaged__c</code> = True</li>
  <li><strong>Need:</strong> <code>@Pain_Points__c</code> documented, <code>@Use_Case__c</code> identified</li>
  <li><strong>Timeline:</strong> <code>@Target_Start_Date__c</code> within 6 months</li>
  <li><strong>Fit:</strong> <code>@ICP_Score__c</code> >= 70</li>
</ul>

<h3>MQL to SQL Handoff</h3>
<p>Lead status progression tracked via <code>@Status</code>:</p>
<ol>
  <li><strong>New</strong> → Marketing owned, initial touch</li>
  <li><strong>MQL</strong> → Marketing Qualified, meets scoring threshold</li>
  <li><strong>SAL</strong> → Sales Accepted, SDR picks up</li>
  <li><strong>SQL</strong> → Sales Qualified, converts to Opportunity</li>
  <li><strong>Disqualified</strong> → Not a fit, with <code>@Disqualification_Reason__c</code></li>
</ol>`,

  "customer-identification": `<h2>Customer Definition</h2>
<p>A customer is defined as any Account where <code>@Type</code> = "Customer" or has at least one Closed Won opportunity with an active contract.</p>

<h3>Account Classification</h3>
<table>
  <tr>
    <th>Account Type</th>
    <th>Definition</th>
    <th>Key Fields</th>
  </tr>
  <tr>
    <td>Prospect</td>
    <td>No closed-won deals, actively engaged</td>
    <td><code>@Type</code> = "Prospect"</td>
  </tr>
  <tr>
    <td>Customer</td>
    <td>Active contract, paying</td>
    <td><code>@Type</code> = "Customer", <code>@Customer_Since__c</code></td>
  </tr>
  <tr>
    <td>Former Customer</td>
    <td>Churned, no active contracts</td>
    <td><code>@Type</code> = "Former Customer", <code>@Churn_Date__c</code></td>
  </tr>
  <tr>
    <td>Partner</td>
    <td>Referral/reseller relationship</td>
    <td><code>@Type</code> = "Partner", <code>@Partner_Tier__c</code></td>
  </tr>
</table>

<h3>Customer Lifecycle Stages</h3>
<ol>
  <li><strong>Onboarding</strong> (0-30 days): <code>@Lifecycle_Stage__c</code> = "Onboarding"
    <ul>
      <li>Key milestones: Kickoff call, admin training, first user login</li>
    </ul>
  </li>
  <li><strong>Adoption</strong> (30-90 days): <code>@Lifecycle_Stage__c</code> = "Adoption"
    <ul>
      <li>Key milestones: Feature adoption > 50%, active users > threshold</li>
    </ul>
  </li>
  <li><strong>Growth</strong> (90+ days): <code>@Lifecycle_Stage__c</code> = "Growth"
    <ul>
      <li>Key milestones: Expansion opportunities, reference customer</li>
    </ul>
  </li>
  <li><strong>Renewal</strong> (90 days before contract end): <code>@Lifecycle_Stage__c</code> = "Renewal"
    <ul>
      <li>Key milestones: QBR completed, renewal opp created</li>
    </ul>
  </li>
</ol>

<h3>Customer Health Indicators</h3>
<ul>
  <li><code>@Health_Score__c</code>: Composite score (0-100) based on usage, engagement, support</li>
  <li><code>@NPS_Score__c</code>: Latest NPS response</li>
  <li><code>@Last_Login_Date__c</code>: Most recent product access</li>
  <li><code>@Support_Tickets_Open__c</code>: Current open support cases</li>
</ul>`,

  "segmentation-firmographics": `<h2>Account Segmentation Model</h2>
<p>Accounts are segmented based on a combination of ARR potential, employee count, and industry vertical.</p>

<h3>Primary Segmentation (by ARR Potential)</h3>
<table>
  <tr>
    <th>Segment</th>
    <th>ARR Range</th>
    <th>Employee Count</th>
    <th>Field Value</th>
  </tr>
  <tr>
    <td>Enterprise</td>
    <td>$50K+</td>
    <td>1,000+</td>
    <td><code>@Segment__c</code> = "Enterprise"</td>
  </tr>
  <tr>
    <td>Commercial</td>
    <td>$15K-$50K</td>
    <td>200-999</td>
    <td><code>@Segment__c</code> = "Commercial"</td>
  </tr>
  <tr>
    <td>SMB</td>
    <td>< $15K</td>
    <td>< 200</td>
    <td><code>@Segment__c</code> = "SMB"</td>
  </tr>
</table>

<h3>Industry Verticals</h3>
<p>Tracked via <code>@Industry</code> (standard) and <code>@Industry_Vertical__c</code> (custom granular).</p>
<ul>
  <li><strong>Technology:</strong> SaaS, IT Services, Hardware</li>
  <li><strong>Financial Services:</strong> Banking, Insurance, FinTech</li>
  <li><strong>Healthcare:</strong> Providers, Payers, Life Sciences</li>
  <li><strong>Manufacturing:</strong> Industrial, Consumer Goods, Automotive</li>
  <li><strong>Retail:</strong> E-commerce, Brick & Mortar, CPG</li>
  <li><strong>Professional Services:</strong> Consulting, Legal, Accounting</li>
</ul>

<h3>Geographic Segmentation</h3>
<p>Regions defined by <code>@BillingCountry</code> and <code>@Region__c</code>:</p>
<table>
  <tr>
    <th>Region</th>
    <th>Countries</th>
    <th>Currency</th>
  </tr>
  <tr>
    <td>NAM</td>
    <td>US, Canada</td>
    <td>USD</td>
  </tr>
  <tr>
    <td>EMEA</td>
    <td>UK, Germany, France, etc.</td>
    <td>EUR/GBP</td>
  </tr>
  <tr>
    <td>APAC</td>
    <td>Australia, Japan, Singapore, etc.</td>
    <td>Local</td>
  </tr>
  <tr>
    <td>LATAM</td>
    <td>Brazil, Mexico, etc.</td>
    <td>USD</td>
  </tr>
</table>

<h3>ICP (Ideal Customer Profile) Scoring</h3>
<p><code>@ICP_Score__c</code> calculated from:</p>
<ul>
  <li>Employee count fit (25%)</li>
  <li>Industry alignment (25%)</li>
  <li>Technology stack match (20%)</li>
  <li>Growth indicators (15%)</li>
  <li>Geographic fit (15%)</li>
</ul>`,

  "ownership-team": `<h2>Ownership Model</h2>
<p>Clear ownership definitions ensure accountability and proper routing throughout the customer lifecycle.</p>

<h3>Account Ownership</h3>
<table>
  <tr>
    <th>Role</th>
    <th>Field</th>
    <th>Responsibility</th>
  </tr>
  <tr>
    <td>Account Owner</td>
    <td><code>@OwnerId</code></td>
    <td>Primary relationship owner, quota-carrying rep</td>
  </tr>
  <tr>
    <td>Customer Success Manager</td>
    <td><code>@CSM__c</code></td>
    <td>Post-sale relationship, health & adoption</td>
  </tr>
  <tr>
    <td>Solutions Engineer</td>
    <td><code>@SE__c</code></td>
    <td>Technical pre-sales, POC support</td>
  </tr>
  <tr>
    <td>Executive Sponsor</td>
    <td><code>@Executive_Sponsor__c</code></td>
    <td>Strategic accounts, escalation path</td>
  </tr>
</table>

<h3>Opportunity Ownership</h3>
<ul>
  <li><code>@OwnerId</code>: Sales rep who owns the deal (inherits from Account by default)</li>
  <li><code>@SDR__c</code>: SDR who sourced/qualified the opportunity</li>
  <li><code>@SE_Assigned__c</code>: Solutions Engineer supporting the deal</li>
</ul>

<h3>Team Structure</h3>
<p>Sales teams organized by segment and region:</p>
<table>
  <tr>
    <th>Team</th>
    <th>Focus</th>
    <th>Quota Type</th>
  </tr>
  <tr>
    <td>Enterprise Sales</td>
    <td>Named accounts, $50K+ deals</td>
    <td>New + Expansion ARR</td>
  </tr>
  <tr>
    <td>Commercial Sales</td>
    <td>Territory-based, $15K-$50K</td>
    <td>New ARR</td>
  </tr>
  <tr>
    <td>SMB/Velocity</td>
    <td>Inbound-led, < $15K</td>
    <td>New ARR + Volume</td>
  </tr>
  <tr>
    <td>Customer Success</td>
    <td>Existing customers</td>
    <td>NRR + Health Score</td>
  </tr>
  <tr>
    <td>SDR Team</td>
    <td>Pipeline generation</td>
    <td>SQLs + Pipeline $</td>
  </tr>
</table>

<h3>Territory Assignment</h3>
<p>Territories defined by combination of:</p>
<ul>
  <li><code>@BillingState</code> / <code>@BillingCountry</code> for geographic territories</li>
  <li><code>@Industry</code> for vertical territories</li>
  <li><code>@Named_Account__c</code> = True for strategic named accounts</li>
</ul>`,

  "products-pricing": `<h2>Product Catalog</h2>
<p>Products and pricing are managed through Salesforce CPQ with the following structure.</p>

<h3>Product Lines</h3>
<table>
  <tr>
    <th>Product</th>
    <th>SKU Prefix</th>
    <th>Pricing Model</th>
    <th>Billing</th>
  </tr>
  <tr>
    <td>Platform Core</td>
    <td>PLT-</td>
    <td>Flat fee by tier</td>
    <td>Annual upfront</td>
  </tr>
  <tr>
    <td>User Licenses</td>
    <td>USR-</td>
    <td>Per seat/month</td>
    <td>Annual upfront</td>
  </tr>
  <tr>
    <td>Add-on Modules</td>
    <td>ADD-</td>
    <td>Flat fee</td>
    <td>Annual upfront</td>
  </tr>
  <tr>
    <td>Professional Services</td>
    <td>SVC-</td>
    <td>Fixed project</td>
    <td>Milestone-based</td>
  </tr>
  <tr>
    <td>Support</td>
    <td>SUP-</td>
    <td>% of ARR</td>
    <td>Annual upfront</td>
  </tr>
</table>

<h3>Pricing Tiers</h3>
<table>
  <tr>
    <th>Tier</th>
    <th>Platform Fee</th>
    <th>Per User/Month</th>
    <th>Features</th>
  </tr>
  <tr>
    <td>Starter</td>
    <td>$750/year</td>
    <td>$19</td>
    <td>Core features, 5 users min</td>
  </tr>
  <tr>
    <td>Pro</td>
    <td>$2,500/year</td>
    <td>$35</td>
    <td>+ Advanced analytics, integrations</td>
  </tr>
  <tr>
    <td>Premium</td>
    <td>$5,000/year</td>
    <td>$49</td>
    <td>+ Custom workflows, API, SSO</td>
  </tr>
  <tr>
    <td>Enterprise</td>
    <td>Custom</td>
    <td>Custom</td>
    <td>+ Dedicated support, SLA</td>
  </tr>
</table>

<h3>Key Pricing Fields</h3>
<ul>
  <li><code>@Product2Id</code>: Links to Product record</li>
  <li><code>@UnitPrice</code>: Negotiated price per unit</li>
  <li><code>@Quantity</code>: Number of units (seats, etc.)</li>
  <li><code>@Discount__c</code>: Applied discount percentage</li>
  <li><code>@List_Price__c</code>: Standard list price</li>
  <li><code>@Net_Price__c</code>: Final price after discounts</li>
</ul>

<h3>Discount Approval Matrix</h3>
<table>
  <tr>
    <th>Discount Level</th>
    <th>Approval Required</th>
  </tr>
  <tr>
    <td>0-15%</td>
    <td>Rep authority</td>
  </tr>
  <tr>
    <td>16-25%</td>
    <td>Manager approval</td>
  </tr>
  <tr>
    <td>26-35%</td>
    <td>Director approval</td>
  </tr>
  <tr>
    <td>36%+</td>
    <td>VP/C-level approval</td>
  </tr>
</table>`,

  "quotes-contracts": `<h2>Quote-to-Contract Process</h2>
<p>Quotes are generated through Salesforce CPQ and progress through defined approval workflows.</p>

<h3>Quote Stages</h3>
<table>
  <tr>
    <th>Stage</th>
    <th>Field Value</th>
    <th>Description</th>
  </tr>
  <tr>
    <td>Draft</td>
    <td><code>@SBQQ__Status__c</code> = "Draft"</td>
    <td>Quote being built, not yet submitted</td>
  </tr>
  <tr>
    <td>In Review</td>
    <td><code>@SBQQ__Status__c</code> = "In Review"</td>
    <td>Submitted for internal approval</td>
  </tr>
  <tr>
    <td>Approved</td>
    <td><code>@SBQQ__Status__c</code> = "Approved"</td>
    <td>Ready to send to customer</td>
  </tr>
  <tr>
    <td>Presented</td>
    <td><code>@SBQQ__Status__c</code> = "Presented"</td>
    <td>Sent to customer for review</td>
  </tr>
  <tr>
    <td>Accepted</td>
    <td><code>@SBQQ__Status__c</code> = "Accepted"</td>
    <td>Customer signed, ready for contract</td>
  </tr>
</table>

<h3>Contract Fields</h3>
<ul>
  <li><code>@ContractId</code>: Related Contract record</li>
  <li><code>@contract_start_date__c</code>: Service start date</li>
  <li><code>@contract_end_date__c</code>: Service end date</li>
  <li><code>@term_months__c</code>: Contract duration in months</li>
  <li><code>@Auto_Renewal__c</code>: Whether contract auto-renews</li>
  <li><code>@Notice_Period_Days__c</code>: Required notice for non-renewal</li>
</ul>

<h3>Legal Terms</h3>
<p>Standard vs. custom terms tracked via:</p>
<ul>
  <li><code>@Terms_Type__c</code>: "Standard" | "Custom" | "Negotiated"</li>
  <li><code>@Legal_Review_Required__c</code>: Boolean flag for legal approval</li>
  <li><code>@Custom_Terms_Summary__c</code>: Description of non-standard terms</li>
  <li><code>@MSA_Date__c</code>: Date of Master Service Agreement</li>
</ul>

<h3>Approval Workflow</h3>
<ol>
  <li>Rep creates quote with products and pricing</li>
  <li>System checks discount thresholds and flags for approval</li>
  <li>Approver reviews and approves/rejects in <code>@Approval_Status__c</code></li>
  <li>Once approved, quote can be sent via <code>@SBQQ__DocumentStatus__c</code></li>
  <li>Customer e-signs, quote converts to Contract</li>
</ol>`,

  "deal-outcomes": `<h2>Win/Loss Analysis Framework</h2>
<p>Understanding deal outcomes helps optimize sales strategy and improve win rates.</p>

<h3>Opportunity Stages (Closed)</h3>
<table>
  <tr>
    <th>Stage</th>
    <th>Field Value</th>
    <th>Definition</th>
  </tr>
  <tr>
    <td>Closed Won</td>
    <td><code>@StageName</code> = "Closed Won"</td>
    <td>Contract signed, revenue booked</td>
  </tr>
  <tr>
    <td>Closed Lost</td>
    <td><code>@StageName</code> = "Closed Lost"</td>
    <td>Deal lost to competitor or no decision</td>
  </tr>
  <tr>
    <td>Closed Disqualified</td>
    <td><code>@StageName</code> = "Closed Disqualified"</td>
    <td>Not a valid opportunity (bad fit, duplicate)</td>
  </tr>
</table>

<h3>Win/Loss Reason Tracking</h3>
<p>For Closed Lost opportunities:</p>
<ul>
  <li><code>@Loss_Reason__c</code>: Primary reason
    <ul>
      <li>Lost to Competitor</li>
      <li>No Decision / Timing</li>
      <li>Budget Constraints</li>
      <li>Product Gap</li>
      <li>Champion Left</li>
      <li>Internal Solution</li>
    </ul>
  </li>
  <li><code>@Competitor_Won__c</code>: Which competitor won (if applicable)</li>
  <li><code>@Loss_Notes__c</code>: Detailed explanation</li>
</ul>

<p>For Closed Won opportunities:</p>
<ul>
  <li><code>@Win_Reason__c</code>: Primary reason
    <ul>
      <li>Product Fit</li>
      <li>Price/Value</li>
      <li>Relationship</li>
      <li>Implementation Speed</li>
      <li>References</li>
    </ul>
  </li>
  <li><code>@Competitors_Defeated__c</code>: Multi-select of competitors beaten</li>
</ul>

<h3>Key Win Rate Metrics</h3>
<table>
  <tr>
    <th>Metric</th>
    <th>Calculation</th>
    <th>Target</th>
  </tr>
  <tr>
    <td>Stage 2+ Win Rate</td>
    <td>Won / (Won + Lost) after Discovery</td>
    <td>> 25%</td>
  </tr>
  <tr>
    <td>Proposal Win Rate</td>
    <td>Won / Proposals sent</td>
    <td>> 40%</td>
  </tr>
  <tr>
    <td>Competitive Win Rate</td>
    <td>Won vs specific competitor</td>
    <td>Varies</td>
  </tr>
</table>

<h3>Deal Quality Indicators</h3>
<ul>
  <li><code>@MEDDPICC_Score__c</code>: Sales methodology score (0-100)</li>
  <li><code>@Forecast_Category</code>: Commit, Best Case, Pipeline, Omit</li>
  <li><code>@Next_Steps__c</code>: Clear, actionable next steps documented</li>
</ul>`,

  "forecasting-pipeline": `<h2>Forecasting Methodology</h2>
<p>The organization uses a multi-layered forecasting approach combining AI predictions with rep judgment.</p>

<h3>Forecast Categories</h3>
<table>
  <tr>
    <th>Category</th>
    <th>Field Value</th>
    <th>Definition</th>
    <th>Close Probability</th>
  </tr>
  <tr>
    <td>Closed</td>
    <td><code>@ForecastCategory</code> = "Closed"</td>
    <td>Already won, in current period</td>
    <td>100%</td>
  </tr>
  <tr>
    <td>Commit</td>
    <td><code>@ForecastCategory</code> = "Commit"</td>
    <td>Rep commits to closing this period</td>
    <td>> 90%</td>
  </tr>
  <tr>
    <td>Best Case</td>
    <td><code>@ForecastCategory</code> = "Best Case"</td>
    <td>Likely to close, some risk</td>
    <td>60-90%</td>
  </tr>
  <tr>
    <td>Pipeline</td>
    <td><code>@ForecastCategory</code> = "Pipeline"</td>
    <td>In active sales cycle</td>
    <td>20-60%</td>
  </tr>
  <tr>
    <td>Omit</td>
    <td><code>@ForecastCategory</code> = "Omit"</td>
    <td>Excluded from forecast</td>
    <td>< 20%</td>
  </tr>
</table>

<h3>Pipeline Metrics</h3>
<ul>
  <li><code>@CloseDate</code>: Expected close date</li>
  <li><code>@Probability</code>: Stage-based probability (auto-calculated)</li>
  <li><code>@Amount</code> / <code>@ARR__c</code>: Deal value</li>
  <li><code>@Weighted_ARR__c</code>: ARR × Probability</li>
  <li><code>@Days_in_Stage__c</code>: Time in current stage</li>
  <li><code>@Total_Age__c</code>: Days since opportunity created</li>
</ul>

<h3>Pipeline Coverage</h3>
<p>Target pipeline coverage ratios by segment:</p>
<table>
  <tr>
    <th>Segment</th>
    <th>Coverage Ratio</th>
    <th>Calculation</th>
  </tr>
  <tr>
    <td>Enterprise</td>
    <td>2.5x</td>
    <td>Pipeline / Quota</td>
  </tr>
  <tr>
    <td>Commercial</td>
    <td>3.0x</td>
    <td>Pipeline / Quota</td>
  </tr>
  <tr>
    <td>SMB</td>
    <td>4.0x</td>
    <td>Pipeline / Quota</td>
  </tr>
</table>

<h3>Forecast Hygiene</h3>
<p>Key indicators of forecast quality:</p>
<ul>
  <li><code>@CloseDate</code> push rate: < 15% of deals pushed month-over-month</li>
  <li>Stage regression rate: < 5% of deals moving backwards</li>
  <li>Coverage in Commit: > 95% of commit should be closed</li>
  <li>Aging deals: Flag opportunities > 90 days without stage movement</li>
</ul>`,

  "customer-health": `<h2>Customer Health Framework</h2>
<p>Customer health is measured through a composite score combining product usage, engagement, and support metrics.</p>

<h3>Health Score Composition</h3>
<p><code>@Health_Score__c</code> is calculated as weighted average:</p>
<table>
  <tr>
    <th>Component</th>
    <th>Weight</th>
    <th>Metrics</th>
  </tr>
  <tr>
    <td>Product Usage</td>
    <td>35%</td>
    <td>DAU/MAU ratio, feature adoption, login frequency</td>
  </tr>
  <tr>
    <td>Engagement</td>
    <td>25%</td>
    <td>CSM meetings attended, email response rate, QBR completion</td>
  </tr>
  <tr>
    <td>Support</td>
    <td>20%</td>
    <td>Ticket volume trend, CSAT scores, escalation rate</td>
  </tr>
  <tr>
    <td>Business</td>
    <td>20%</td>
    <td>Expansion potential, contract value trend, payment history</td>
  </tr>
</table>

<h3>Health Score Thresholds</h3>
<table>
  <tr>
    <th>Score Range</th>
    <th>Category</th>
    <th>Action Required</th>
  </tr>
  <tr>
    <td>80-100</td>
    <td>Healthy</td>
    <td>Identify expansion opportunities</td>
  </tr>
  <tr>
    <td>60-79</td>
    <td>Neutral</td>
    <td>Monitor, proactive engagement</td>
  </tr>
  <tr>
    <td>40-59</td>
    <td>At Risk</td>
    <td>Intervention plan required</td>
  </tr>
  <tr>
    <td>0-39</td>
    <td>Critical</td>
    <td>Executive escalation, save plan</td>
  </tr>
</table>

<h3>Churn Risk Indicators</h3>
<ul>
  <li><code>@Churn_Risk_Score__c</code>: ML-predicted churn probability (0-100)</li>
  <li><code>@Last_Login_Date__c</code>: > 30 days = warning, > 60 days = critical</li>
  <li><code>@Support_Sentiment__c</code>: Negative, Neutral, Positive</li>
  <li><code>@NPS_Score__c</code>: Detractor (0-6), Passive (7-8), Promoter (9-10)</li>
  <li><code>@Champion_Risk__c</code>: Champion leaving or role change detected</li>
</ul>

<h3>Success Milestones</h3>
<p>Key milestones tracked via <code>@Success_Milestones__c</code>:</p>
<ol>
  <li>Kickoff Complete</li>
  <li>Admin Trained</li>
  <li>First Value Delivered</li>
  <li>50% Feature Adoption</li>
  <li>First QBR Complete</li>
  <li>Expansion Opportunity Identified</li>
  <li>Reference Customer</li>
</ol>`,

  "activities-engagement": `<h2>Activity Tracking</h2>
<p>All sales and customer success activities are logged to Salesforce for pipeline and relationship analysis.</p>

<h3>Activity Types</h3>
<table>
  <tr>
    <th>Type</th>
    <th><code>@Type</code> Value</th>
    <th>Key Fields</th>
  </tr>
  <tr>
    <td>Call</td>
    <td>"Call"</td>
    <td><code>@Call_Duration__c</code>, <code>@Call_Disposition__c</code></td>
  </tr>
  <tr>
    <td>Email</td>
    <td>"Email"</td>
    <td><code>@Email_Template__c</code>, auto-logged from Outlook/Gmail</td>
  </tr>
  <tr>
    <td>Meeting</td>
    <td>"Meeting"</td>
    <td><code>@Meeting_Type__c</code>, <code>@Attendees__c</code></td>
  </tr>
  <tr>
    <td>Demo</td>
    <td>"Demo"</td>
    <td><code>@Demo_Score__c</code>, <code>@Features_Shown__c</code></td>
  </tr>
  <tr>
    <td>Note</td>
    <td>"Note"</td>
    <td><code>@Description</code> for general notes</td>
  </tr>
</table>

<h3>Engagement Scoring</h3>
<p><code>@Engagement_Score__c</code> on Account calculated from:</p>
<ul>
  <li>Email opens/clicks (from marketing automation)</li>
  <li>Website visits (tracked via <code>@Web_Visits_30d__c</code>)</li>
  <li>Meeting attendance</li>
  <li>Content downloads</li>
  <li>Event participation</li>
</ul>

<h3>Activity Metrics by Stage</h3>
<table>
  <tr>
    <th>Stage</th>
    <th>Expected Activities</th>
    <th>Key Indicators</th>
  </tr>
  <tr>
    <td>Discovery</td>
    <td>3-5 calls/meetings</td>
    <td>Multi-threaded (3+ contacts engaged)</td>
  </tr>
  <tr>
    <td>Demo</td>
    <td>1-2 demos</td>
    <td>Demo score > 7/10</td>
  </tr>
  <tr>
    <td>Proposal</td>
    <td>2-3 meetings</td>
    <td>Decision maker engaged</td>
  </tr>
  <tr>
    <td>Negotiation</td>
    <td>Daily contact</td>
    <td>Legal/procurement involved</td>
  </tr>
</table>

<h3>Contact Roles</h3>
<p>Tracked via <code>@OpportunityContactRole</code>:</p>
<ul>
  <li><strong>Decision Maker:</strong> Final authority on purchase</li>
  <li><strong>Economic Buyer:</strong> Controls budget</li>
  <li><strong>Champion:</strong> Internal advocate</li>
  <li><strong>Influencer:</strong> Provides input to decision</li>
  <li><strong>End User:</strong> Primary product user</li>
  <li><strong>Blocker:</strong> Potential obstacle to deal</li>
</ul>

<h3>Recency Alerts</h3>
<p>Stale engagement triggers:</p>
<ul>
  <li>No activity in 7+ days on active opportunity → Alert to rep</li>
  <li>No activity in 14+ days → Manager notification</li>
  <li>No activity in 30+ days → Deal review required</li>
</ul>`,
};

export function OrgContextTab() {
  const {
    orgContext,
    setOrgContextEnabled,
    setSelectedDocumentId,
    updateDocumentContent,
  } = usePreferencesStore();

  // Local editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editingContent, setEditingContent] = useState("");

  // Get tenant and user info for API call
  const tenantId = localStorage.getItem("tenant_id") || "";
  const userId = localStorage.getItem("user_id") || "";

  // Hook for saving preferences
  const { queueUpdate, isSaving } = useUpdatePreferences(tenantId, userId);

  // Get the selected document
  const selectedDocument = orgContext.documents.find(
    (doc) => doc.id === orgContext.selectedDocumentId,
  );

  // Get the display content (prioritize saved content, fallback to default)
  const displayContent =
    selectedDocument?.content ||
    DEFAULT_DOCUMENT_CONTENT[orgContext.selectedDocumentId] ||
    "";

  // Handle entering edit mode
  const handleStartEdit = () => {
    setEditingContent(displayContent);
    setIsEditing(true);
  };

  // Handle canceling edit
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingContent("");
  };

  // Handle saving
  const handleSave = () => {
    updateDocumentContent(orgContext.selectedDocumentId, editingContent);

    // Queue save to backend
    queueUpdate({
      orgContext: {
        ...orgContext,
        documents: orgContext.documents.map((doc) =>
          doc.id === orgContext.selectedDocumentId
            ? { ...doc, content: editingContent }
            : doc,
        ),
      },
    });

    setIsEditing(false);
    setEditingContent("");
  };

  // Handle document selection
  const handleSelectDocument = (id: string) => {
    if (isEditing) {
      // If editing, cancel first
      handleCancelEdit();
    }
    setSelectedDocumentId(id);
  };

  return (
    <div className="flex flex-col h-full p-2">
      {/* Heading - Fixed */}
      <div className="">
        <div className="px-4 pt-4 pb-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Org Context</h2>
          <p className="text-sm text-gray-600">
            Configure organizational context to help Von AI understand your
            business
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto settings-scrollbar px-6">
        <div className="pt-6 pb-12 space-y-6 max-w-4xl">
          {/* Enable/Disable Toggle */}
          <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <BrainIcon size={24} weight="duotone" className="text-gray-700" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  Org Context
                </h3>
                <p className="text-sm text-gray-600 mt-0.5">
                  Allow Von to understand your organization's structure,
                  products, and business context to provide better insights.
                </p>
              </div>
            </div>
            <button
              onClick={() => setOrgContextEnabled(!orgContext.enabled)}
              className={`
                relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer
                ${orgContext.enabled ? "bg-green-500" : "bg-gray-300"}
              `}
            >
              <span
                className={`
                  absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm
                  transition-transform duration-200
                  ${orgContext.enabled ? "translate-x-5" : "translate-x-0"}
                `}
              />
            </button>
          </div>

          {/* Document Viewer/Editor */}
          {orgContext.enabled && (
            <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
              {/* Two Column Layout */}
              <div className="flex h-[520px]">
                {/* Left Panel - Document List */}
                <div className="w-64 border-r border-gray-200 bg-white flex-shrink-0">
                  <div className="px-3 py-3 border-b border-gray-200">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Context Documents
                    </h4>
                  </div>
                  <OrgContextDocumentList
                    documents={orgContext.documents}
                    selectedDocumentId={orgContext.selectedDocumentId}
                    onSelectDocument={handleSelectDocument}
                  />
                </div>

                {/* Right Panel - Content */}
                <div className="flex-1 flex flex-col min-w-0 bg-white">
                  {/* Document Title Bar */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-900 truncate">
                      {selectedDocument?.title}
                    </h3>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isEditing ? (
                        <>
                          <button
                            onClick={handleCancelEdit}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <XIcon size={16} weight="bold" />
                            Cancel
                          </button>
                          <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                          >
                            <CheckIcon size={16} weight="bold" />
                            {isSaving ? "Saving..." : "Save"}
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={handleStartEdit}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <PencilSimpleIcon size={16} weight="bold" />
                          Edit
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Editor */}
                  <div className="flex-1 overflow-hidden">
                    <OrgContextEditor
                      content={isEditing ? editingContent : displayContent}
                      onChange={setEditingContent}
                      isEditing={isEditing}
                      placeholder="Start documenting your organization's context..."
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Disabled State Message */}
          {!orgContext.enabled && (
            <div className="text-center py-12 px-6 bg-gray-50 rounded-xl border border-gray-200">
              <BrainIcon
                size={48}
                weight="duotone"
                className="text-gray-300 mx-auto mb-4"
              />
              <h3 className="text-sm font-medium text-gray-600 mb-1">
                Org Context is disabled
              </h3>
              <p className="text-sm text-gray-500">
                Enable Org Context above to configure your organization's
                business context.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default OrgContextTab;
