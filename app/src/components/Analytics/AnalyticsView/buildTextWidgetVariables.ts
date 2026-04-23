import type {
  CounterWidgetConfig,
  MustacheVariables,
  WidgetConfig,
} from "@vonlabs/design-components";
import type { DashboardFilterDefinition } from "../../../types/dashboard";
import type { ActiveFilter } from "../../../hooks/useDashboardFilters";
import { renderFilterValue } from "../AnalyticsFilters/filterTranslation";

/**
 * Build per-widget variable maps consumed by text-widget mustache tokens.
 *
 * `{{column_name}}` against the widget's own `query_ref` is handled by the
 * backend at dashboard creation time, so only `{{applied_filter_<id>}}` and
 * cross-widget counter scalars (`{{<widgetId>.value}}` etc.) need to be
 * assembled here.  Chart and table widgets have no raw row/value on the
 * client, so cross-widget references are limited to counters.
 */
export function buildTextWidgetVariables(
  widgets: Record<string, WidgetConfig>,
  definitions: DashboardFilterDefinition[],
  filterState: Record<string, ActiveFilter>,
): Record<string, MustacheVariables> {
  const appliedFilterStrings = buildAppliedFilterStrings(
    definitions,
    filterState,
  );
  const counterScalars = buildCounterScalars(widgets);

  const shared: MustacheVariables = {
    ...appliedFilterStrings,
    ...counterScalars,
  };

  const byWidget: Record<string, MustacheVariables> = {};
  for (const [widgetId, widget] of Object.entries(widgets)) {
    if (widget.type !== "text") continue;
    byWidget[widgetId] = shared;
  }
  return byWidget;
}

function buildAppliedFilterStrings(
  definitions: DashboardFilterDefinition[],
  filterState: Record<string, ActiveFilter>,
): MustacheVariables {
  const out: MustacheVariables = {};
  for (const def of definitions) {
    const active = filterState[def.id];
    if (!active) continue;
    const display = renderFilterValue(active, def, "");
    if (!display) continue;
    out[`applied_filter_${def.id}`] = stripOperatorPrefix(display);
  }
  return out;
}

function stripOperatorPrefix(display: string): string {
  const idx = display.indexOf(":");
  if (idx < 0) return display;
  return display.slice(idx + 1).trim();
}

function buildCounterScalars(
  widgets: Record<string, WidgetConfig>,
): MustacheVariables {
  const out: MustacheVariables = {};
  for (const [widgetId, widget] of Object.entries(widgets)) {
    if (widget.type !== "counter") continue;
    const config = widget.config as CounterWidgetConfig;
    out[`${widgetId}.value`] = config.value;
    if (config.comparison)
      out[`${widgetId}.comparison`] = config.comparison.value;
    if (config.target) out[`${widgetId}.target`] = config.target.value;
  }
  return out;
}
