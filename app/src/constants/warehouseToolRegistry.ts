export interface WarehouseToolConfig {
  /** Tool name as sent by the backend (e.g., "execute_bigquery_query") */
  toolName: string;
  /** Human-readable label for the pill/tab (e.g., "BigQuery Query") */
  displayName: string;
  /** Label for the collapsible query section (e.g., "BigQuery SQL") */
  queryLabel: string;
  /** SQL dialect for syntax highlighting in QueryBlock */
  dialect: string;
  /** Integration ID matching integrationMetadata.ts (e.g., "bigquery") */
  integrationId: string;
  /** Category of tool for grouping purposes */
  category: "data-warehouse" | "crm";
}

/**
 * Registry of all tools that produce query + tabular results
 * in the Data Sources transparency drawer.
 *
 * To add a new warehouse:
 *   1. Add an entry here
 *   2. Done — transformation, labeling, and rendering are automatic
 */
export const WAREHOUSE_TOOL_REGISTRY: WarehouseToolConfig[] = [
  // --- CRM ---
  {
    toolName: "execute_salesforce_query",
    displayName: "Query",
    queryLabel: "SOQL Query",
    dialect: "soql",
    integrationId: "salesforce",
    category: "crm",
  },
  {
    toolName: "salesforce_tooling_query",
    displayName: "Metadata Query",
    queryLabel: "SOQL Query",
    dialect: "soql",
    integrationId: "salesforce",
    category: "crm",
  },
  // --- Data Warehouses ---
  {
    toolName: "execute_sql_query",
    displayName: "Query",
    queryLabel: "SQL Query",
    dialect: "sql",
    integrationId: "snowflake",
    category: "data-warehouse",
  },
  {
    toolName: "execute_bigquery_query",
    displayName: "Query",
    queryLabel: "BigQuery SQL",
    dialect: "sql",
    integrationId: "bigquery",
    category: "data-warehouse",
  },
  {
    toolName: "databricks_execute_statement",
    displayName: "Query",
    queryLabel: "Databricks SQL",
    dialect: "sql",
    integrationId: "databricks",
    category: "data-warehouse",
  },
  {
    toolName: "execute_snowflake_query",
    displayName: "Query",
    queryLabel: "Snowflake SQL",
    dialect: "sql",
    integrationId: "snowflake",
    category: "data-warehouse",
  },
];

/** Lookup map: tool_name → config */
const TOOL_CONFIG_MAP = new Map(
  WAREHOUSE_TOOL_REGISTRY.map((c) => [c.toolName, c]),
);

/** Check if a tool_name is a registered warehouse/query tool */
export function isQueryTool(toolName: string): boolean {
  return TOOL_CONFIG_MAP.has(toolName);
}

/** Get config for a tool, or undefined if not registered */
export function getToolConfig(
  toolName: string,
): WarehouseToolConfig | undefined {
  return TOOL_CONFIG_MAP.get(toolName);
}
