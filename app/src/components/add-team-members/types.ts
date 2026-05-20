import type { ReactNode } from "react";

export type AddTeamMembersTab = "individual" | "bulk";

export interface TabContentProps {
  onClose: () => void;
  onRegisterFooter: (footer: ReactNode) => void;
  registerCloseGuard?: (canClose: () => boolean) => void;
  onMemberAdded?: () => void;
}
