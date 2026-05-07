import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { mcpServerService } from "../services/mcpServerService";
import type { MCPServer, MCPSettings } from "../types/mcp";

const KEYS = {
  servers: ["mcp-servers"] as const,
  server: (id: string) => ["mcp-servers", id] as const,
  catalog: ["mcp-catalog"] as const,
  settings: ["mcp-settings"] as const,
  serverGrants: (id: string) => ["mcp-server-grants", id] as const,
  registrationGrants: ["mcp-registration-grants"] as const,
};

/* ── Queries ── */

export function useMCPServers() {
  return useQuery({
    queryKey: KEYS.servers,
    queryFn: () => mcpServerService.listServers(),
  });
}

export function useMCPServer(id: string | null) {
  return useQuery({
    queryKey: KEYS.server(id!),
    queryFn: () => mcpServerService.getServer(id!),
    enabled: !!id,
  });
}

export function useMCPCatalog() {
  return useQuery({
    queryKey: KEYS.catalog,
    queryFn: () => mcpServerService.getCatalog(),
  });
}

export function useMCPSettings() {
  return useQuery({
    queryKey: KEYS.settings,
    queryFn: () => mcpServerService.getSettings(),
  });
}

export function useServerGrants(id: string | null) {
  return useQuery({
    queryKey: KEYS.serverGrants(id!),
    queryFn: () => mcpServerService.listServerGrants(id!),
    enabled: !!id,
  });
}

export function useRegistrationGrants() {
  return useQuery({
    queryKey: KEYS.registrationGrants,
    queryFn: () => mcpServerService.listRegistrationGrants(),
  });
}

/* ── Mutations ── */

function useInvalidate() {
  const qc = useQueryClient();
  return (...keys: readonly (readonly string[])[]) => {
    keys.forEach((k) => qc.invalidateQueries({ queryKey: k }));
  };
}

export function useCreateMCPServer() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (data: Parameters<typeof mcpServerService.createServer>[0]) =>
      mcpServerService.createServer(data),
    onSuccess: () => invalidate(KEYS.servers, KEYS.catalog),
  });
}

export function useUpdateMCPServer() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof mcpServerService.updateServer>[1];
    }) => mcpServerService.updateServer(id, data),
    onSuccess: (_d, vars) => invalidate(KEYS.servers, KEYS.server(vars.id)),
  });
}

export function useDeleteMCPServer() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => mcpServerService.deleteServer(id),
    onSuccess: () => invalidate(KEYS.servers, KEYS.catalog),
  });
}

export function useMCPAuthorize() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => mcpServerService.authorize(id),
    onSuccess: (_d, id) => invalidate(KEYS.servers, KEYS.server(id)),
  });
}

export function useMCPCheckAuthStatus(id: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ["mcp-auth-status", id],
    queryFn: () => mcpServerService.checkAuthStatus(id!),
    enabled: !!id && enabled,
    refetchInterval: (query) => {
      const status = query.state.data?.authentication_status;
      if (status === "AUTHENTICATED" || status === "AUTHENTICATION_FAILED")
        return false;
      return 2000;
    },
    refetchIntervalInBackground: true,
  });
}

export function useDiscoverTools() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => mcpServerService.discoverTools(id),
    onSuccess: (_d, id) => invalidate(KEYS.servers, KEYS.server(id)),
  });
}

export function useRefreshTools() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => mcpServerService.refreshTools(id),
    onSuccess: (_d, id) => invalidate(KEYS.servers, KEYS.server(id)),
  });
}

export function usePublishServer() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: {
        status: "published" | "draft" | "archived";
        type?: string;
        roles?: string[];
      };
    }) => mcpServerService.setAvailability(id, data),
    onSuccess: (_d, vars) =>
      invalidate(KEYS.servers, KEYS.server(vars.id), KEYS.catalog),
  });
}

export function useRequestPromotion() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => mcpServerService.requestPromotion(id),
    onSuccess: (_d, id) => invalidate(KEYS.servers, KEYS.server(id)),
  });
}

export function usePromoteServer() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => mcpServerService.promote(id),
    onSuccess: (_d, id) => invalidate(KEYS.servers, KEYS.server(id)),
  });
}

export function useDeclinePromotion() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => mcpServerService.declinePromotion(id),
    onSuccess: (_d, id) => invalidate(KEYS.servers, KEYS.server(id)),
  });
}

export function useUpdateMCPSettings() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (data: Partial<MCPSettings>) =>
      mcpServerService.updateSettings(data),
    onSuccess: () => invalidate(KEYS.settings),
  });
}

export function useAddServerGrant() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ serverId, userId }: { serverId: string; userId: string }) =>
      mcpServerService.addServerGrant(serverId, userId),
    onSuccess: (_d, vars) => invalidate(KEYS.serverGrants(vars.serverId)),
  });
}

export function useRemoveServerGrant() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ serverId, userId }: { serverId: string; userId: string }) =>
      mcpServerService.removeServerGrant(serverId, userId),
    onSuccess: (_d, vars) => invalidate(KEYS.serverGrants(vars.serverId)),
  });
}

/* ── Re-export for convenience ── */
export type { MCPServer };
