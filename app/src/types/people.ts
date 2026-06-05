export type PersonRole = "Admin" | "Member";
export type PersonStatus = "Active" | "Invite sent";

export interface Person {
  id: string;
  name: string;
  email: string;
  role: PersonRole;
  status: PersonStatus;
  joined: string;
  reportsTo: string | null;
}
