export interface TeamRow {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  updatedBy: string;
  updatedAt: string;
  admins: string[];
  source: "Salesforce sync" | "AI-created" | "Manual";
}

export const teamsMock: TeamRow[] = [
  {
    id: "enterprise-sales",
    name: "Enterprise Sales",
    description: "Account executives and sales leadership responsible for new business revenue.",
    memberCount: 16,
    updatedBy: "Von",
    updatedAt: "2 days ago",
    admins: ["Sarah Chen", "Brady Henry"],
    source: "Salesforce sync",
  },
  {
    id: "revenue-leadership",
    name: "Revenue Leadership",
    description: "VP-level and above revenue org leadership.",
    memberCount: 4,
    updatedBy: "Von",
    updatedAt: "5 days ago",
    admins: ["Brady Henry"],
    source: "AI-created",
  },
  {
    id: "solutions-engineering",
    name: "Solutions Engineering",
    description: "Pre-sales SEs supporting complex enterprise deals.",
    memberCount: 8,
    updatedBy: "Marcus Williams",
    updatedAt: "1 week ago",
    admins: ["Marcus Williams"],
    source: "Manual",
  },
  {
    id: "customer-success",
    name: "Customer Success",
    description: "CSMs managing post-sales relationships and renewals.",
    memberCount: 11,
    updatedBy: "Von",
    updatedAt: "3 days ago",
    admins: ["Priya Nair"],
    source: "Salesforce sync",
  },
  {
    id: "deal-desk",
    name: "Deal Desk",
    description: "Ops team that reviews and approves large deal structures.",
    memberCount: 3,
    updatedBy: "Von",
    updatedAt: "1 day ago",
    admins: ["James O'Brien"],
    source: "AI-created",
  },
];
