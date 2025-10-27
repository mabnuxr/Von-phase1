import { memo } from "react";

export interface IconProps {
  className?: string;
  size?: number;
}

// Settings Icon - Memoized for performance
export const SettingsIcon = memo<IconProps>(
  ({ className = "w-[18px] h-[18px] text-[#6e6e73]" }) => (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
    >
      <path
        d="M12 15a3 3 0 100-6 3 3 0 000 6z"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
);
SettingsIcon.displayName = "SettingsIcon";

// Logout Icon - Memoized for performance
export const LogoutIcon = memo<IconProps>(
  ({ className = "w-[18px] h-[18px] text-[#6e6e73]" }) => (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
    >
      <path
        d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 17l5-5-5-5M21 12H9"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
);
LogoutIcon.displayName = "LogoutIcon";

// Integrations Icon - Memoized for performance
export const IntegrationsIcon = memo<IconProps>(
  ({ className = "w-full h-full" }) => (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
    >
      <path
        d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
);
IntegrationsIcon.displayName = "IntegrationsIcon";

// Plus Icon - Used for "New Chat" and add buttons - Memoized
export const PlusIcon = memo<IconProps>(
  ({ className = "w-4 h-4", size = 16 }) => (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
    >
      <path
        d="M12 5v14M5 12h14"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
);
PlusIcon.displayName = "PlusIcon";

// Clock Icon - Used for timestamps and history - Memoized
export const ClockIcon = memo<IconProps>(
  ({ className = "w-[14px] h-[14px]", size = 14 }) => (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 6v6l4 2"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
);
ClockIcon.displayName = "ClockIcon";

// Document Icon - Used for file/document cards - Memoized
export const DocumentIcon = memo<IconProps>(
  ({ className = "w-[18px] h-[18px]", size = 18 }) => (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
    >
      <path
        d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 2v6h6M16 13H8M16 17H8M10 9H8"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
);
DocumentIcon.displayName = "DocumentIcon";

// Fields Icon (Salesforce Cloud) - Used for Salesforce fields settings - Memoized
export const FieldsIcon = memo<IconProps>(
  ({ className = "w-[18px] h-[18px]" }) => (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
    >
      {/* Salesforce-style cloud icon */}
      <path
        d="M18 10.5c1.7 0 3 1.3 3 3s-1.3 3-3 3H6c-2.2 0-4-1.8-4-4s1.8-4 4-4c0-2.8 2.2-5 5-5 2.4 0 4.4 1.7 4.9 4"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
);
FieldsIcon.displayName = "FieldsIcon";

// Defaults Icon - Used for default settings/preferences - Memoized
export const DefaultsIcon = memo<IconProps>(
  ({ className = "w-[18px] h-[18px]" }) => (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
    >
      <path
        d="M12 2L2 7l10 5 10-5-10-5z"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M2 17l10 5 10-5"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M2 12l10 5 10-5"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
);
DefaultsIcon.displayName = "DefaultsIcon";

// Sales Process Icon - Used for sales workflow settings - Memoized
export const SalesProcessIcon = memo<IconProps>(
  ({ className = "w-[18px] h-[18px]" }) => (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
    >
      <path
        d="M22 12h-4l-3 9L9 3l-3 9H2"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
);
SalesProcessIcon.displayName = "SalesProcessIcon";

// Manager Agent Icon - Used for AI/manager agent settings - Memoized
export const ManagerAgentIcon = memo<IconProps>(
  ({ className = "w-[18px] h-[18px]" }) => (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
    >
      <path
        d="M12 2a3 3 0 013 3v4a3 3 0 01-6 0V5a3 3 0 013-3z"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M19 10v2a7 7 0 01-14 0v-2"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 19v3M8 22h8"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
);
ManagerAgentIcon.displayName = "ManagerAgentIcon";

// Tabs Icon - Used for tab/navigation settings - Memoized
export const TabsIcon = memo<IconProps>(
  ({ className = "w-[18px] h-[18px]" }) => (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
    >
      <path
        d="M2 3h6a2 2 0 012 2v3a2 2 0 01-2 2H2a2 2 0 01-2-2V5a2 2 0 012-2z"
        transform="translate(2 2)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 3h6a2 2 0 012 2v3a2 2 0 01-2 2h-6a2 2 0 01-2-2V5a2 2 0 012-2z"
        transform="translate(2 2)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect
        x="2"
        y="14"
        width="20"
        height="8"
        rx="2"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
);
TabsIcon.displayName = "TabsIcon";

// Sidebar Icon - Used for sidebar navigation settings - Memoized
export const SidebarIcon = memo<IconProps>(
  ({ className = "w-[18px] h-[18px]" }) => (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
    >
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="2"
        ry="2"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9 3v18"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
);
SidebarIcon.displayName = "SidebarIcon";

// ChevronDown Icon - Used for dropdown indicators - Memoized
export const ChevronDownIcon = memo<IconProps>(({ className = "w-4 h-4" }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
  >
    <path
      d="M6 9l6 6 6-6"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
));
ChevronDownIcon.displayName = "ChevronDownIcon";

// Chevron Right Icon - Used for collapsible items - Memoized
export const ChevronRightIcon = memo<IconProps>(({ className = "w-4 h-4" }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
  >
    <path
      d="M9 6l6 6-6 6"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
));
ChevronRightIcon.displayName = "ChevronRightIcon";

// Search Icon - Used for search inputs - Memoized
export const SearchIcon = memo<IconProps>(({ className = "w-4 h-4" }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
  >
    <circle
      cx="11"
      cy="11"
      r="8"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M21 21l-4.35-4.35"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
));
SearchIcon.displayName = "SearchIcon";

// Edit Icon - Used for edit buttons - Memoized
export const EditIcon = memo<IconProps>(({ className = "w-4 h-4" }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
  >
    <path
      d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
));
EditIcon.displayName = "EditIcon";
