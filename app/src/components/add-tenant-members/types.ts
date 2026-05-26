import type { ReactNode } from "react";

export type AddTenantMembersTab = "individual" | "bulk";

export interface TabContentProps {
  onClose: () => void;
  onRegisterFooter: (footer: ReactNode) => void;
  registerCloseGuard?: (canClose: () => boolean) => void;
  onMemberAdded?: () => void;
}
