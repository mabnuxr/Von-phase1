import { apiClient } from "./apiClient";
import type {
  AiField,
  AiFieldActionResponse,
  AiFieldListResponse,
  AiFieldStatus,
  CreateAiFieldRequest,
  CreateAiFieldResponse,
  OpportunitySearchResult,
  PlaygroundRequest,
  RunHistoryResponse,
  AiFieldConversationsResponse,
} from "../types/vonAiFields";

const BASE = "/api/v1/ai-fields";

class AiFieldsService {
  // ─── List / Detail ────────────────────────────────────────
  async listFields(
    status?: AiFieldStatus,
    page = 1,
    limit = 20,
  ): Promise<AiFieldListResponse> {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (status) params.set("status", status);
    return apiClient.get<AiFieldListResponse>(`${BASE}?${params}`);
  }

  async findByName(name: string): Promise<AiFieldListResponse> {
    const params = new URLSearchParams({
      name,
      page: "1",
      limit: "1",
    });
    return apiClient.get<AiFieldListResponse>(`${BASE}?${params}`);
  }

  async getField(fieldId: string): Promise<AiField> {
    return apiClient.get<AiField>(`${BASE}/${fieldId}`);
  }

  // ─── Create ───────────────────────────────────────────────
  async createField(
    data: CreateAiFieldRequest,
  ): Promise<CreateAiFieldResponse> {
    return apiClient.post<CreateAiFieldResponse>(BASE, data);
  }

  // ─── Delete ───────────────────────────────────────────────
  async deleteField(fieldId: string): Promise<void> {
    return apiClient.delete<void>(`${BASE}/${fieldId}`);
  }

  // ─── Activate / Disable ───────────────────────────────────
  async activateField(fieldId: string): Promise<AiFieldActionResponse> {
    return apiClient.post<AiFieldActionResponse>(`${BASE}/${fieldId}/activate`);
  }

  async disableField(fieldId: string): Promise<AiField> {
    return apiClient.post<AiField>(`${BASE}/${fieldId}/disable`);
  }

  // ─── Playground ────────────────────────────────────────────
  async runPlayground(data: PlaygroundRequest): Promise<AiFieldActionResponse> {
    return apiClient.post<AiFieldActionResponse>(`${BASE}/playground`, data);
  }

  // ─── Opportunity Search ───────────────────────────────────
  async searchOpportunities(
    query: string,
    limit = 10,
    opportunityFilter?: string | null,
  ): Promise<OpportunitySearchResult[]> {
    const params = new URLSearchParams({ limit: String(limit) });
    if (query) params.set("q", query);
    if (opportunityFilter) params.set("opportunityFilter", opportunityFilter);
    return apiClient.get<OpportunitySearchResult[]>(
      `${BASE}/opportunities/search?${params}`,
    );
  }

  // ─── Run History ──────────────────────────────────────────
  async getRunHistory(
    fieldId: string,
    page = 1,
    limit = 20,
  ): Promise<RunHistoryResponse> {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    return apiClient.get<RunHistoryResponse>(
      `${BASE}/${fieldId}/runs?${params}`,
    );
  }

  // ─── Associated Conversations ─────────────────────────────
  async getConversations(
    fieldId: string,
    page = 1,
    limit = 50,
  ): Promise<AiFieldConversationsResponse> {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    return apiClient.get<AiFieldConversationsResponse>(
      `${BASE}/${fieldId}/conversations?${params}`,
    );
  }
}

export const aiFieldsService = new AiFieldsService();

/** @deprecated Use `aiFieldsService` instead. */
export const vonAiFieldsService = aiFieldsService;
