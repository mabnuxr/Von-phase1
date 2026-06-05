import { useState, useRef, useEffect, useCallback, Profiler } from "react";
import { report } from "../lib/analytics/tracker";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useUser } from "../hooks/useUser";
import { useAuthCheck } from "../hooks/useAuthCheck";
import { getUserInitials, getDisplayName } from "../lib/userUtils";
import { AvatarMenu } from "../components/AvatarMenu";
import { SettingsSidebar } from "../components/SettingsSidebar";
import { IntegrationDetail } from "../components/prototype/IntegrationDetail";
import {
  GitCommitIcon,
  UsersIcon,
  BrainIcon,
  ChartBarIcon,
  UsersFourIcon,
  LockSimpleIcon,
} from "@phosphor-icons/react";
import { AiFieldIcon } from "../components/icons/AiFieldIcon";
import { authService } from "../services";
import { OrgContextTabV2 } from "../components/tabs/OrgContextTabV2";
import { UsageTab } from "../components/tabs/UsageTab";
import { FieldDetailPane } from "../components/FieldDetailPane";
import { VonAiFieldsTab } from "../components/tabs/VonAiFieldsTab";
import { VonAiFieldsDefaultTab } from "../components/tabs/VonAiFieldsDefaultTab";
import { VonAiFieldDetailPane } from "../components/VonAiFieldDetailPane";
import { VonAiFieldDefaultPreviewPane } from "../components/VonAiFieldDefaultPreviewPane";
import type { DefaultAiFieldDefinition } from "../types/vonAiFields";
import salesforceLogo from "../assets/salesforce.svg";
import { AIFieldRunHistory } from "../components/ai-fields/AIFieldRunHistory";
import { AddTenantMembersPane } from "../components/AddTenantMembersPane";
import { EditTenantMemberPane } from "../components/EditTenantMemberPane";
import { usePreferences } from "../hooks/usePreferences";
import usePreferencesStore from "../store/preferencesStore";
import { useFeatureFlag } from "../hooks/useFeatureFlag";
import { reportRenderTiming } from "../lib/datadog";

const TAB_LABELS: Record<string, string> = {
  integrations: "Integrations",
  memory: "Memory",
  "memory-org": "Org Memory",
  "memory-team": "Team Memory",
  "memory-user": "User Memory",
  "custom-iq": "AI Fields",
  "custom-iq-default": "Default Fields",
  "custom-iq-custom": "Custom Fields",
  team: "Manage Team",
  usage: "Usage",
};

const Settings = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Captured once at mount: did the user reach Settings via an in-app
  // navigation (sidebar click, banner CTA, etc.)? If so, back-to-home does
  // navigate(-1) to return to the previous chat. If not (deep link, fresh
  // tab), we fall back to /chat/new. The flag is on location.state from the
  // caller; intra-Settings tab replaces wipe location.state, so we capture
  // into a ref at mount before those run.
  const cameFromAppRef = useRef(
    Boolean((location.state as { fromApp?: boolean } | null)?.fromApp),
  );
  useAuthCheck();
  const { user } = useUser();

  const { isUsageMetricsEnabled } = useFeatureFlag();

  const isAdmin =
    user?.roles?.some((r) => r.toLowerCase() === "admin") ?? false;
  const showVonAiFields = isAdmin;

  // Get initial tab from URL query parameter or default to integrations.
  // Under V2 the legacy `memory` deep-link lands on the Org Memory sub-page
  // (V2 splits the tab into memory-org/memory-user children); under V1 the
  // single `memory` tab is the only one so we leave the URL alone.
  //
  // The legacy `custom-iq` deep-link lands on the Custom sub-page since
  // that's the leading sub-tab in the AI Fields nav.
  const tabFromUrl = searchParams.get("tab");
  const normalizedTab =
    tabFromUrl === "memory"
      ? "memory-org"
      : tabFromUrl === "custom-iq"
        ? "custom-iq-custom"
        : tabFromUrl;
  const initialTab = normalizedTab || "integrations";
  const [selectedSettingId, setSelectedSettingId] = useState(initialTab);
  const [detailFieldId, setDetailFieldId] = useState<string | null>(
    searchParams.get("fieldId"),
  );
  // Holds a not-yet-enabled default's definition while the user previews
  // it. The preview pane sources its content from this rather than from a
  // backend record (which doesn't exist until enable).
  const [previewDefault, setPreviewDefault] =
    useState<DefaultAiFieldDefinition | null>(null);

  // Set default tab in URL if not present, and rewrite legacy tabs that have
  // been split into children. For custom-iq, route to the Custom sub-page
  // (it's the leading sub-tab; deep-links with a fieldId go there too).
  useEffect(() => {
    if (!tabFromUrl) {
      navigate(`/settings?tab=integrations`, { replace: true });
    } else if (tabFromUrl === "memory") {
      navigate(`/settings?tab=memory-org`, { replace: true });
    } else if (tabFromUrl === "custom-iq") {
      const fieldIdFromUrl = searchParams.get("fieldId");
      const target = fieldIdFromUrl
        ? `/settings?tab=custom-iq-custom&fieldId=${fieldIdFromUrl}`
        : `/settings?tab=custom-iq-custom`;
      navigate(target, { replace: true });
    }
  }, [tabFromUrl, navigate, searchParams]);

  // Sync fieldId from URL (e.g., navigating from chat "View in Settings").
  // Field detail only applies to custom fields — defaults aren't clickable.
  useEffect(() => {
    const fieldIdFromUrl = searchParams.get("fieldId");
    const tabFromParams = searchParams.get("tab");
    if (
      fieldIdFromUrl &&
      (tabFromParams === "custom-iq" || tabFromParams === "custom-iq-custom")
    ) {
      setSelectedSettingId("custom-iq-custom");
      setDetailFieldId(fieldIdFromUrl);
    }
  }, [searchParams]);

  const getTabLabel = useCallback(
    (tabId: string) => TAB_LABELS[tabId] ?? tabId,
    [],
  );

  const pageViewCaptured = useRef(false);
  const trackSettingsPageView = useCallback(() => {
    if (!user || pageViewCaptured.current) return;
    report.settingsPageViewed();
    pageViewCaptured.current = true;
  }, [user]);

  useEffect(() => {
    trackSettingsPageView();
  }, [trackSettingsPageView]);

  // Update URL when tab changes — RBAC pages live at their own routes
  const handleTabChange = (tabId: string) => {
    if (tabId === "people") { navigate("/settings/people"); return; }
    if (tabId === "teams") { navigate("/settings/teams"); return; }
    if (tabId === "permissions") { navigate("/settings/permissions"); return; }
    if (tabId === "memory-team") { navigate("/settings/memory/team"); return; }
    setSelectedSettingId(tabId);
    setDetailFieldId(null);
    navigate(`/settings?tab=${tabId}`, { replace: true });
    report.settingsTabClicked(getTabLabel(tabId));
  };
  const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false);
  const [avatarRect, setAvatarRect] = useState<DOMRect | undefined>();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [sfDetailOpen, setSfDetailOpen] = useState(false);

  // Get current user context for preferences
  const tenantId = user?.tenantId;
  const userId = user?.id;

  // Track if initial data has been loaded
  const hasInitialLoadRef = useRef(false);

  // Fetch preferences with scoped query key
  const { data: preferencesData } = usePreferences(tenantId, userId);
  const { syncFromServer } = usePreferencesStore();

  // Sync server data to Zustand store on load (only once)
  useEffect(() => {
    if (preferencesData && !hasInitialLoadRef.current) {
      syncFromServer(preferencesData);
      hasInitialLoadRef.current = true;
    }
  }, [preferencesData, syncFromServer]);

  // Handle avatar click
  const handleAvatarClick = (rect: DOMRect) => {
    setAvatarRect(rect);
    setIsAvatarMenuOpen(true);
  };

  // Handle Settings click - navigate back to settings (refresh)
  const handleSettingsClick = () => {
    navigate("/settings");
  };

  const handleBackToHome = useCallback(() => {
    report.settingsBackToHomeClicked(getTabLabel(selectedSettingId));
    if (cameFromAppRef.current) {
      navigate(-1);
    } else {
      navigate("/chat/new", { replace: true });
    }
  }, [selectedSettingId, navigate, getTabLabel]);

  const handleHelpDocsClick = useCallback(() => {
    report.settingsHelpDocsClicked(getTabLabel(selectedSettingId));
  }, [selectedSettingId, getTabLabel]);

  // Handle Logout click
  const handleLogoutClick = async () => {
    report.settingsLogoutClicked(getTabLabel(selectedSettingId));
    const { clearAllAuth } = await import("../lib/auth");

    if (import.meta.env.DEV) {
      console.log("[Settings] Logout clicked");
    }

    try {
      // Call backend logout to invalidate token and get redirect URL
      const response = await authService.logout();
      if (import.meta.env.DEV) {
        console.log(
          "[Settings] Backend logout successful, redirect URL:",
          response.redirectUrl,
        );
      }

      // Clear all local auth tokens
      clearAllAuth();

      // Redirect to the URL provided by backend
      if (response.redirectUrl) {
        window.location.href = response.redirectUrl;
      } else {
        // Fallback to default logout flow if no redirect URL provided
        if (import.meta.env.DEV) {
          console.warn(
            "[Settings] No redirect URL provided, using default logout flow",
          );
        }
        window.location.href = window.location.origin;
      }
    } catch (error) {
      // Log error but continue with logout flow
      if (import.meta.env.DEV) {
        console.error("[Settings] Backend logout failed:", error);
      }
      clearAllAuth();
      window.location.href = window.location.origin;
    }
  };

  // Compute avatar props from user data
  const avatarLabel = user ? getUserInitials(user.name, user.email) : undefined;
  const avatarSrc =
    typeof user?.avatarUrl === "string" ? user.avatarUrl : undefined;
  const displayName = user
    ? getDisplayName(user.name, user.firstName, user.lastName, user.email)
    : undefined;

  const settingsItems = {
    integrations: [],
    configurations: [
      {
        id: "integrations",
        label: "Integrations",
        icon: <GitCommitIcon size={20} weight="regular" />,
      },
      // Memory splits into Org/User children.
      {
        id: "memory",
        label: "Memory",
        icon: <BrainIcon size={20} weight="regular" />,
        children: [
          { id: "memory-org", label: "Org Memory" },
          { id: "memory-team", label: "Team Memory" },
          { id: "memory-user", label: "User Memory" },
        ],
      },
      ...(showVonAiFields
        ? [
            {
              id: "custom-iq",
              label: "AI Fields",
              icon: <AiFieldIcon size={20} />,
              children: [
                { id: "custom-iq-custom", label: "Custom Fields" },
                { id: "custom-iq-default", label: "Default Fields" },
              ],
            },
          ]
        : []),
    ],
    team: [
      {
        id: "people",
        label: "People",
        icon: <UsersIcon size={20} weight="regular" />,
      },
      {
        id: "teams",
        label: "Teams",
        icon: <UsersFourIcon size={20} weight="regular" />,
      },
      {
        id: "permissions",
        label: "Permissions",
        icon: <LockSimpleIcon size={20} weight="regular" />,
      },
    ],
    ...(isUsageMetricsEnabled
      ? {
          usage: [
            {
              id: "usage",
              label: "Usage",
              icon: <ChartBarIcon size={20} weight="regular" />,
            },
          ],
        }
      : {}),
  };

  const renderContent = () => {
    switch (selectedSettingId) {
      case "integrations":
        if (sfDetailOpen) {
          return <IntegrationDetail onBack={() => setSfDetailOpen(false)} />;
        }
        return (
          <div className="flex flex-col h-full">
            <div className="px-6 pt-6 pb-4 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900">Integrations</h2>
              <p className="text-sm text-gray-500 mt-0.5">Connect your tools to bring data into Von</p>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
                {/* Salesforce — clickable */}
                <button
                  onClick={() => setSfDetailOpen(true)}
                  className="w-full flex items-center gap-4 px-4 py-4 bg-white hover:bg-gray-50 transition-colors cursor-pointer text-left group"
                >
                  <div className="w-10 h-10 rounded-lg border border-gray-100 overflow-hidden flex-shrink-0 bg-white">
                    <img src={salesforceLogo} alt="Salesforce" className="w-full h-full object-contain p-0.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">Salesforce</p>
                    <p className="text-xs text-gray-400 mt-0.5">CRM · Read &amp; Write · OAuth</p>
                  </div>
                  <span className="text-xs text-gray-400 group-hover:text-gray-600 transition-colors flex-shrink-0">
                    Configure →
                  </span>
                </button>
              </div>
            </div>
          </div>
        );
      case "team": // legacy — no longer in nav
        return null;
      case "memory-org":
        return <OrgContextTabV2 view="org" />;
      case "memory-user":
        return <OrgContextTabV2 view="user" />;
      case "custom-iq":
        // Legacy id — useEffect above redirects URL to custom-iq-custom.
        // Until that runs, render the Custom tab to avoid a blank frame.
        return showVonAiFields ? (
          <VonAiFieldsTab onRowClick={(id) => setDetailFieldId(id)} />
        ) : null;
      case "custom-iq-default":
        if (!showVonAiFields) return null;
        if (detailFieldId) {
          return (
            <VonAiFieldDetailPane
              fieldId={detailFieldId}
              onBack={() => setDetailFieldId(null)}
            />
          );
        }
        if (previewDefault) {
          return (
            <VonAiFieldDefaultPreviewPane
              definition={previewDefault}
              onBack={() => setPreviewDefault(null)}
              onEnabled={(id) => {
                setPreviewDefault(null);
                setDetailFieldId(id);
              }}
            />
          );
        }
        return (
          <VonAiFieldsDefaultTab
            onRowClick={(id) => setDetailFieldId(id)}
            onDefaultPreview={(def) => setPreviewDefault(def)}
          />
        );
      case "custom-iq-custom":
        if (!showVonAiFields) return null;
        if (detailFieldId) {
          return (
            <VonAiFieldDetailPane
              fieldId={detailFieldId}
              onBack={() => setDetailFieldId(null)}
            />
          );
        }
        return <VonAiFieldsTab onRowClick={(id) => setDetailFieldId(id)} />;
      case "usage":
        return isUsageMetricsEnabled ? <UsageTab /> : null;
      default:
        return null;
    }
  };

  return (
    <Profiler id="Settings" onRender={reportRenderTiming}>
      <div className="h-screen bg-gray-100 flex flex-col items-center overflow-hidden">
        {/* Field Detail Pane - Global */}
        <FieldDetailPane />

        {/* Add Tenant Members Pane - Global (Individual + Bulk import tabs) */}
        <AddTenantMembersPane />
        {/* Von AI Field Run History - Global */}
        {showVonAiFields && <AIFieldRunHistory />}

        {/* Edit Tenant Member Pane - Global */}
        <EditTenantMemberPane />

        {/* Avatar Menu Dropdown */}
        <AvatarMenu
          userEmail={user?.email}
          isOpen={isAvatarMenuOpen}
          onClose={() => setIsAvatarMenuOpen(false)}
          hideSettings
          onSettingsClick={handleSettingsClick}
          onLogoutClick={handleLogoutClick}
          onHelpDocsClick={handleHelpDocsClick}
          triggerRect={avatarRect}
        />

        {/* Two-Pane Layout */}
        <div className="flex w-full h-full p-3 gap-2 overflow-hidden min-h-0">
          {/* Left Pane - SettingsSidebar */}
          <div
            className="h-full flex flex-col min-h-0 rounded-lg overflow-hidden bg-white shadow-xs border border-gray-200 transition-all duration-300"
            style={{ width: isSidebarCollapsed ? "56px" : "240px" }}
          >
            <SettingsSidebar
              settingsItems={settingsItems}
              selectedSettingId={selectedSettingId}
              onSettingClick={handleTabChange}
              width="100%"
              isCollapsed={isSidebarCollapsed}
              onToggleCollapse={() =>
                setIsSidebarCollapsed(!isSidebarCollapsed)
              }
              avatarSrc={avatarSrc}
              avatarLabel={avatarLabel}
              userName={displayName}
              userEmail={user?.email}
              onAvatarClick={handleAvatarClick}
              onBackToHome={handleBackToHome}
            />
          </div>

          {/* Right Pane - Content Area */}
          <div className="flex-1 rounded-lg bg-white shadow-xs border border-gray-200 min-w-0">
            {renderContent()}
          </div>
        </div>
      </div>
    </Profiler>
  );
};

export default Settings;
