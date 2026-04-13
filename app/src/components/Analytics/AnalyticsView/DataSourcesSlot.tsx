/**
 * DataSourcesSlot — adapts backend DataSourceGroup[] to design-system DataSources.
 *
 * Minimal shape: each group carries a source type and its unique objects.
 */
import { useMemo } from "react";
import { DataSources } from "@vonlabs/design-components";
import type {
  DataSource,
  DataSourceIcon,
} from "@vonlabs/design-components";
import type { DataSourceGroup } from "../../../types/dashboard";

const KNOWN_ICONS: Record<string, DataSourceIcon> = {
  salesforce: "salesforce",
  sfdc: "salesforce",
  snowflake: "snowflake",
};

function iconFor(type: string): DataSourceIcon {
  return KNOWN_ICONS[type.toLowerCase()] ?? "database";
}

function prettyName(type: string): string {
  const lower = type.toLowerCase();
  if (lower === "salesforce" || lower === "sfdc") return "Salesforce";
  if (lower === "snowflake") return "Snowflake";
  if (lower === "von_iq") return "Von IQ";
  return type.charAt(0).toUpperCase() + type.slice(1);
}

interface DataSourcesSlotProps {
  dataSources?: DataSourceGroup[];
}

export const DataSourcesSlot: React.FC<DataSourcesSlotProps> = ({
  dataSources,
}) => {
  const sources = useMemo<DataSource[]>(() => {
    if (!dataSources) return [];
    return dataSources.map((group) => ({
      id: group.type,
      name: prettyName(group.type),
      icon: iconFor(group.type),
      objects: group.objects,
    }));
  }, [dataSources]);

  if (sources.length === 0) return null;

  return <DataSources sources={sources} />;
};
