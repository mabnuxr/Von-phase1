import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { appCatalogService } from "../services/appCatalogService";
import type {
  AvailabilityStatus,
  CatalogType,
  ConnectionMode,
  PublishAppPayload,
  UpdateTenantIntegrationPayload,
} from "../types/appCatalog";

export const APP_CATALOG_KEY = ["app-catalog"] as const;

export function useAppCatalog(opts?: {
  catalogType?: "native_integration" | "mcp";
  statusFilter?: "all" | "published" | "unsubscribed";
  includeBuiltins?: boolean;
}) {
  return useQuery({
    queryKey: [...APP_CATALOG_KEY, opts],
    queryFn: () => appCatalogService.getCatalog(opts),
  });
}

export function useTenantIntegrations(opts?: {
  catalogType?: CatalogType;
  connectionMode?: ConnectionMode;
  availabilityStatus?: AvailabilityStatus;
}) {
  return useQuery({
    queryKey: [...APP_CATALOG_KEY, "tenant-integrations", opts],
    queryFn: () => appCatalogService.getTenantIntegrations(opts),
  });
}

export function useAppTools(
  catalogId: string,
  source: "catalog" | "discovered" = "catalog",
  enabled = true,
) {
  return useQuery({
    queryKey: [...APP_CATALOG_KEY, "tools", catalogId, source],
    queryFn: () => appCatalogService.getTools(catalogId, source),
    enabled: !!catalogId && enabled,
  });
}

export function usePublishApp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      catalogId,
      payload,
    }: {
      catalogId: string;
      payload: PublishAppPayload;
    }) => appCatalogService.publish(catalogId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: APP_CATALOG_KEY }),
  });
}

export function useUpdateTenantIntegration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      catalogId,
      payload,
    }: {
      catalogId: string;
      payload: UpdateTenantIntegrationPayload;
    }) => appCatalogService.updateTenantIntegration(catalogId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: APP_CATALOG_KEY }),
  });
}

export function useDeleteConnections() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (catalogId: string) => appCatalogService.deleteConnections(catalogId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: APP_CATALOG_KEY });
      qc.invalidateQueries({ queryKey: ["mcp-servers"] });
      qc.invalidateQueries({ queryKey: ["integrations"] });
    },
  });
}

export function useDeleteTenantIntegration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      catalogId,
      catalogType,
      connectionMode,
    }: {
      catalogId: string;
      catalogType: string;
      connectionMode: string;
    }) => appCatalogService.deleteTenantIntegration(catalogId, catalogType, connectionMode),
    onSuccess: () => qc.invalidateQueries({ queryKey: APP_CATALOG_KEY }),
  });
}

export function useDiscoverTools() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tenantIntegrationId: string) =>
      appCatalogService.discoverTools(tenantIntegrationId),
    onSuccess: () => qc.invalidateQueries({ queryKey: APP_CATALOG_KEY }),
  });
}

export function useConnectPersonalMcp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      tenantIntegrationId,
      apiKey,
    }: {
      tenantIntegrationId: string;
      apiKey: string;
    }) =>
      appCatalogService.connectPersonalApiKey(tenantIntegrationId, apiKey),
    onSuccess: () => qc.invalidateQueries({ queryKey: APP_CATALOG_KEY }),
  });
}

export function useConnectCatalog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      catalogId,
      payload,
    }: {
      catalogId: string;
      payload: { catalog_type: CatalogType; connection_mode: ConnectionMode; api_key?: string };
    }) => appCatalogService.connect(catalogId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: APP_CATALOG_KEY });
      qc.invalidateQueries({ queryKey: ["integrations"] });
    },
  });
}

export function useConnectCatalogStatus(
  catalogId: string | null,
  connectionMode: ConnectionMode | undefined,
  catalogType: CatalogType,
  enabled: boolean,
) {
  return useQuery({
    queryKey: [...APP_CATALOG_KEY, "connect-status", catalogId, connectionMode],
    queryFn: () =>
      appCatalogService.getConnectStatus(catalogId!, {
        catalog_type: catalogType,
        connection_mode: connectionMode!,
      }),
    enabled: !!catalogId && !!connectionMode && enabled,
    refetchInterval: (query) => {
      const status = query.state.data?.authentication_status;
      if (status === "AUTHENTICATED" || status === "AUTHENTICATION_FAILED") return false;
      return 2500;
    },
    refetchIntervalInBackground: true,
  });
}
