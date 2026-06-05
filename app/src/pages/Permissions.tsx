import { useNavigate } from "react-router-dom";
import { LockSimpleIcon, UsersIcon, CaretRightIcon } from "@phosphor-icons/react";
import { useAuthCheck } from "../hooks/useAuthCheck";
import { SettingsLayout } from "../components/SettingsLayout";
import { SettingsPageLayout } from "../components/settings/SettingsPageLayout";

interface RoleRowProps {
  icon: React.ReactNode;
  name: string;
  subtitle: string;
  onClick: () => void;
}

function RoleRow({ icon, name, subtitle, onClick }: RoleRowProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 text-left cursor-pointer"
    >
      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900">{name}</p>
        <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
      </div>
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500 border border-gray-200 mr-2 flex-shrink-0">
        System role
      </span>
      <CaretRightIcon size={14} className="text-gray-400 flex-shrink-0" />
    </button>
  );
}

export default function Permissions() {
  useAuthCheck();
  const navigate = useNavigate();

  return (
    <SettingsLayout activeId="permissions">
      <SettingsPageLayout
        title="Roles & Permissions"
        subtitle="A read-only map of who can do what. All changes happen in chat."
        badge={{ text: "Admin-only" }}
      >
        {/* Stat line */}
        <p className="text-xs text-gray-400 -mt-2 mb-6">2 roles · 1 member</p>

        {/* Roles section */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
            Roles
          </p>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <RoleRow
              icon={<LockSimpleIcon size={15} className="text-gray-600" weight="regular" />}
              name="Admin"
              subtitle="Full workspace access · 1 person"
              onClick={() => navigate("/settings/permissions/admin")}
            />
            <RoleRow
              icon={<UsersIcon size={15} className="text-gray-600" weight="regular" />}
              name="Member"
              subtitle="Standard access · 0 people"
              onClick={() => navigate("/settings/permissions/member")}
            />
          </div>
        </div>
      </SettingsPageLayout>
    </SettingsLayout>
  );
}
