import { ArrowLeftIcon } from "@phosphor-icons/react";

// ─── SettingsPageLayout ───────────────────────────────────────────────────────

export interface SettingsPageBreadcrumb {
  label: string;
  onClick: () => void;
}

export interface SettingsPageBadge {
  text: string;
}

export interface SettingsPageLayoutProps {
  title: string;
  subtitle?: string;
  badge?: SettingsPageBadge;
  headerRight?: React.ReactNode;
  breadcrumb?: SettingsPageBreadcrumb;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

export function SettingsPageLayout({
  title,
  subtitle,
  badge,
  headerRight,
  breadcrumb,
  footer,
  children,
}: SettingsPageLayoutProps) {
  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto settings-scrollbar">
        <div className="px-8 py-6">
          {/* Breadcrumb */}
          {breadcrumb && (
            <button
              onClick={breadcrumb.onClick}
              className="flex items-center gap-1 text-sm text-gray-400 mb-3 cursor-pointer hover:text-gray-600 transition-colors"
            >
              <ArrowLeftIcon size={13} />
              {breadcrumb.label}
            </button>
          )}

          {/* Header row */}
          <div className="flex items-start justify-between">
            {/* Title block */}
            <div>
              <div className="flex items-center">
                <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
                  {title}
                </h1>
                {badge && (
                  <span className="ml-3 text-xs font-medium px-2 py-0.5 rounded-full border border-gray-200 text-gray-500">
                    {badge.text}
                  </span>
                )}
              </div>
              {subtitle && (
                <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
              )}
            </div>

            {/* Header right slot */}
            {headerRight && (
              <div className="flex-shrink-0 ml-6">{headerRight}</div>
            )}
          </div>

          {/* Spacing below header */}
          <div className="mt-6" />

          {/* Page content */}
          {children}

          {/* Footer */}
          {footer && (
            <div className="text-xs text-gray-400 mt-8 flex items-center gap-1.5">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── SettingsEmptyState ───────────────────────────────────────────────────────

export interface SettingsEmptyStateProps {
  icon: React.ReactNode;
  heading: string;
  subtext: string;
  actions?: React.ReactNode;
}

export function SettingsEmptyState({
  icon,
  heading,
  subtext,
  actions,
}: SettingsEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[320px] w-full">
      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <p className="text-base font-medium text-gray-800 mt-4">{heading}</p>
      <p className="text-sm text-gray-400 mt-1.5 text-center max-w-[320px]">
        {subtext}
      </p>
      {actions && <div className="mt-5 flex gap-3">{actions}</div>}
    </div>
  );
}

// ─── Shared button class exports (for use in headerRight / empty state) ────────

/** Primary settings button — black, used in headerRight slot */
export const settingsPrimaryBtn =
  "bg-gray-900 text-white text-sm font-medium px-3.5 py-2 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer flex items-center gap-2";

/** Secondary settings button — outlined, used in empty state actions */
export const settingsSecondaryBtn =
  "border border-gray-200 text-gray-700 text-sm font-medium px-3.5 py-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer flex items-center gap-2";
