// Fictional company: Meridian Technologies (B2B SaaS, ~180 person sales org)

export const WORKSPACE = {
  name: 'Meridian Technologies',
  totalSalesforceUsers: 179,
  activeUsers: 179,
}

export const ROLES = {
  AE: 'Account Executive',
  SR_AE: 'Senior Account Executive',
  SDR: 'Sales Development Rep',
  CSM: 'Customer Success Manager',
  SC: 'Solutions Consultant',
  VP_SALES: 'VP of Sales',
  DIRECTOR_CS: 'Director of Customer Success',
  MANAGER_SDR: 'SDR Manager',
  MANAGER_AE: 'AE Manager',
  MANAGER_CSM: 'CSM Manager',
}

// The 8 users already provisioned in Von workspace
export const WORKSPACE_MEMBERS = [
  { id: 'u1', name: 'Sam Whitfield', email: 'sam.whitfield@meridiantech.com', role: 'Admin', sfRole: ROLES.VP_SALES, isActive: true, joinedDate: 'May 1, 2026' },
  { id: 'u2', name: 'Elena Vasquez', email: 'elena.vasquez@meridiantech.com', role: 'Member', sfRole: ROLES.MANAGER_AE, isActive: true, joinedDate: 'May 3, 2026' },
  { id: 'u3', name: 'Marcus Webb', email: 'marcus.webb@meridiantech.com', role: 'Member', sfRole: ROLES.SR_AE, isActive: true, joinedDate: 'May 3, 2026' },
  { id: 'u4', name: 'Priya Nair', email: 'priya.nair@meridiantech.com', role: 'Member', sfRole: ROLES.AE, isActive: true, joinedDate: 'May 5, 2026' },
  { id: 'u5', name: 'Devon Park', email: 'devon.park@meridiantech.com', role: 'Member', sfRole: ROLES.AE, isActive: true, joinedDate: 'May 5, 2026' },
  { id: 'u6', name: 'Alicia Romero', email: 'alicia.romero@meridiantech.com', role: 'Member', sfRole: ROLES.SDR, isActive: true, joinedDate: 'May 7, 2026' },
  { id: 'u7', name: 'James Okafor', email: 'james.okafor@meridiantech.com', role: 'View Only', sfRole: ROLES.CSM, isActive: true, joinedDate: 'May 7, 2026' },
  { id: 'u8', name: 'Mira Chen', email: 'mira.chen@meridiantech.com', role: 'View Only', sfRole: ROLES.SC, isActive: true, joinedDate: 'May 10, 2026' },
]

// Sam Whitfield's direct reports (for reporting line sharing scenario)
export const SAM_DIRECT_REPORTS = ['u2', 'u3', 'u4', 'u5', 'u6'] // 5 direct reports

// Salesforce users NOT yet on Von (for provisioning scenarios)
export const SALESFORCE_ONLY_USERS = [
  { id: 'sf1', name: 'Kevin Thornton', email: 'kevin.thornton@meridiantech.com', sfRole: ROLES.AE },
  { id: 'sf2', name: 'Marie Dalsgaard', email: 'marie.dalsgaard@meridiantech.com', sfRole: ROLES.SR_AE },
  { id: 'sf3', name: 'Elise Allan', email: 'elise.allan@meridiantech.com', sfRole: ROLES.MANAGER_AE },
  { id: 'sf4', name: 'Victoria Reyes', email: 'victoria.reyes@meridiantech.com', sfRole: ROLES.CSM },
  { id: 'sf5', name: 'Stephanie O\'Grady', email: 'stephanie.ogrady@meridiantech.com', sfRole: ROLES.CSM },
]

// Bulk CSV provisioning data
export const BULK_PROVISION = {
  totalParsed: 52,
  valid: 49,
  flagged: 3,
  flaggedReasons: [
    { name: 'Jordan Lee', email: 'jordan.lee@meridiantech.com', issue: 'Duplicate email — already exists in workspace' },
    { name: 'Priya Shah', email: 'priya.shah@meridiantech.com', issue: 'Missing role — will default to Member' },
    { name: 's.park@@meridiantech', email: 's.park@@meridiantech', issue: 'Invalid email format' },
  ]
}

// Teams (created during group flow scenarios)
export const TEAMS = {
  enterpriseSales: {
    id: 't1',
    name: 'Enterprise Sales',
    description: 'Senior AEs and Solutions Consultants working enterprise accounts.',
    memberCount: 7,
    members: ['u2', 'u3', 'u4', 'u5', 'u8'],
    teamAdmin: 'u2', // Elena Vasquez
    filterConditions: [
      { field: 'Role', operator: 'is', value: 'AE' },
      { field: 'Is Active', operator: 'equals', value: 'True' },
    ],
  },
  sdrTeam: {
    id: 't2',
    name: 'SDR Team',
    description: 'Sales Development Reps focused on outbound pipeline.',
    memberCount: 1,
    members: ['u6'],
    teamAdmin: null,
    filterConditions: [
      { field: 'Role', operator: 'is', value: 'SDR' },
    ],
  },
  customerSuccess: {
    id: 't3',
    name: 'Customer Success',
    description: 'CSMs and Solutions Consultants managing post-sale accounts.',
    memberCount: 3,
    members: ['u7', 'u8'],
    teamAdmin: 'u7', // James Okafor
    filterConditions: [
      { field: 'Role', operator: 'is', value: 'CSM' },
    ],
  },
}

// Artifacts for sharing scenarios
export const ARTIFACTS = {
  dashboard: { name: 'Q2 Pipeline Review', type: 'Dashboard' },
  command: { name: 'Account Health Check', type: 'Command' },
}

// Integration for scoping scenario
export const INTEGRATION = {
  name: 'Salesforce',
  type: 'CRM',
}

// Group memory entries for memory scenario
export const GROUP_MEMORY = {
  enterpriseSales: [
    { id: 'm1', content: 'Enterprise deals require VP sign-off for discounts over 20%.' },
    { id: 'm2', content: 'Preferred contract length is annual. Multi-year gets 10% discount.' },
    { id: 'm3', content: 'Key competitors: Lattice, Rippling, Workday.' },
  ]
}
