import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { integrationCatalogService } from "../services/integrationCatalogService";
import type {
  PublishIntegrationPayload,
  UpdatePolicyPayload,
} from "../types/integrationCatalog";

export const INTEGRATION_CATALOG_KEY = ["integration-catalog"] as const;

export function useIntegrationCatalog(
  statusFilter: "all" | "published" | "unsubscribed" = "all",
  includeBuiltins?: boolean,
) {
  return useQuery({
    queryKey: [...INTEGRATION_CATALOG_KEY, statusFilter, includeBuiltins],
    queryFn: () =>
      integrationCatalogService.getCatalog({ statusFilter, includeBuiltins }),
  });
}

export function usePublishIntegration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      catalogId,
      payload,
    }: {
      catalogId: string;
      payload: PublishIntegrationPayload;
    }) => integrationCatalogService.publishIntegration(catalogId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: INTEGRATION_CATALOG_KEY }),
  });
}

export function useUpdateIntegrationPolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      catalogId,
      payload,
    }: {
      catalogId: string;
      payload: UpdatePolicyPayload;
    }) => integrationCatalogService.updatePolicy(catalogId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: INTEGRATION_CATALOG_KEY }),
  });
}

export function useDeleteIntegrationPolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (catalogId: string) =>
      integrationCatalogService.deletePolicy(catalogId),
    onSuccess: () => qc.invalidateQueries({ queryKey: INTEGRATION_CATALOG_KEY }),
  });
}
