import { useMemo } from "react";
import type {
  WidgetConfig,
  GridConfig,
  LayoutItem,
} from "@vonlabs/design-components";
import { useLayoutAutoSave } from "../../../../hooks/useLayoutAutoSave";
import { useDashboardAutoFit } from "../../../../hooks/useDashboardAutoFit";
import type {
  Dashboard,
  DashboardFilterDefinition,
} from "../../../../types/dashboard";
import { buildTextWidgetVariables } from "../buildTextWidgetVariables";

interface UseDashboardLayoutDataArgs {
  dashboard: Dashboard;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  paginatedWidgets?: Record<string, any>;
  filterDefinitions: DashboardFilterDefinition[];
  filterState: Record<
    string,
    { operator: string; value?: unknown; include_blank?: boolean }
  >;
  isEditMode: boolean;
  isPreview: boolean | undefined;
  isDashboardDragDropEnabled: boolean;
}

export function useDashboardLayoutData({
  dashboard,
  paginatedWidgets,
  filterDefinitions,
  filterState,
  isEditMode,
  isPreview,
  isDashboardDragDropEnabled,
}: UseDashboardLayoutDataArgs) {
  const rawGridConfig = dashboard.gridConfig as unknown as GridConfig;
  const gridConfig = {
    ...rawGridConfig,
    rowHeight: Math.min(rawGridConfig.rowHeight ?? 60, 60),
  };
  const layout = dashboard.layout as unknown as LayoutItem[];
  const widgets = (paginatedWidgets ?? dashboard.widgets) as unknown as Record<
    string,
    WidgetConfig
  >;

  const { handleLayoutChange: saveLayoutChange } = useLayoutAutoSave(
    dashboard.id,
    isEditMode,
    layout,
  );
  const { controller: autoFitController, handleLayoutChange } =
    useDashboardAutoFit({
      layout,
      onLayoutChange: saveLayoutChange,
      isEnabled: !!isPreview && isEditMode && isDashboardDragDropEnabled,
    });

  const variablesByWidget = useMemo(
    () =>
      buildTextWidgetVariables(
        dashboard.widgets as unknown as Record<string, WidgetConfig>,
        filterDefinitions,
        filterState,
      ),
    [dashboard.widgets, filterDefinitions, filterState],
  );

  return {
    gridConfig,
    layout,
    widgets,
    variablesByWidget,
    autoFitController,
    handleLayoutChange,
  };
}
