export type PersonRole = "Admin" | "Member" | "View Only";
export type PersonStatus = "Active" | "Invite sent";

export type PersonSource = "Manual" | "Salesforce sync";

export interface Person {
  id: string;
  name: string;
  email: string;
  role: PersonRole;
  status: PersonStatus;
  joined: string;
  reportsTo: string | null;
  addedBy: string;
  source: PersonSource;
}
