import { apiClient } from "./apiClient";
import type {
  IqColumn,
  IqColumnsListResponse,
  CreateIqColumnRequest,
  UpdateIqColumnRequest,
  DryRunRequest,
  DryRunResponse,
  ExecuteResponse,
  Execution,
  IqColumnResults,
  IqScheduleConfigRequest,
  IqScheduleResponse,
  OpportunitySearchResponse,
} from "../types/vonAiFields";

const BASE = "/api/v1/iq-columns";

class VonAiFieldsService {
  // ─── Opportunity Search ───────────────────────────────────
  async searchOpportunities(
    search: string,
    page = 1,
    pageSize = 20,
  ): Promise<OpportunitySearchResponse> {
    const params = new URLSearchParams({
      page: String(page),
      page_size: String(pageSize),
    });
    if (search) params.set("search", search);
    return apiClient.get<OpportunitySearchResponse>(
      `${BASE}/opportunities?${params}`,
    );
  }

  // ─── Column CRUD ──────────────────────────────────────────
  async listColumns(status?: string): Promise<IqColumnsListResponse> {
    const qs = status ? `?${new URLSearchParams({ status })}` : "";
    return apiClient.get<IqColumnsListResponse>(`${BASE}${qs}`);
  }

  async getColumn(columnId: string): Promise<IqColumn> {
    return apiClient.get<IqColumn>(`${BASE}/${columnId}`);
  }

  async createColumn(data: CreateIqColumnRequest): Promise<IqColumn> {
    return apiClient.post<IqColumn>(BASE, data);
  }

  async updateColumn(
    columnId: string,
    data: UpdateIqColumnRequest,
  ): Promise<IqColumn> {
    return apiClient.put<IqColumn>(`${BASE}/${columnId}`, data);
  }

  async deleteColumn(columnId: string): Promise<void> {
    return apiClient.delete<void>(`${BASE}/${columnId}`);
  }

  // ─── Execution ────────────────────────────────────────────
  async dryRun(data: DryRunRequest): Promise<DryRunResponse> {
    return apiClient.post<DryRunResponse>(`${BASE}/dry-run`, data);
  }

  async execute(): Promise<ExecuteResponse> {
    return apiClient.post<ExecuteResponse>(`${BASE}/execute`);
  }

  async listExecutions(limit = 20): Promise<Execution[]> {
    return apiClient.get<Execution[]>(`${BASE}/executions?limit=${limit}`);
  }

  async getExecution(executionId: string): Promise<Execution> {
    return apiClient.get<Execution>(`${BASE}/executions/${executionId}`);
  }

  async getResults(executionId: string): Promise<IqColumnResults> {
    return apiClient.get<IqColumnResults>(`${BASE}/results/${executionId}`);
  }

  // ─── Schedule ─────────────────────────────────────────────
  async getSchedule(): Promise<IqScheduleResponse> {
    return apiClient.get<IqScheduleResponse>(`${BASE}/schedule`);
  }

  async createSchedule(
    config: IqScheduleConfigRequest,
  ): Promise<IqScheduleResponse> {
    return apiClient.post<IqScheduleResponse>(`${BASE}/schedule`, config);
  }

  async updateSchedule(
    config: IqScheduleConfigRequest,
  ): Promise<IqScheduleResponse> {
    return apiClient.put<IqScheduleResponse>(`${BASE}/schedule`, config);
  }

  async pauseSchedule(): Promise<IqScheduleResponse> {
    return apiClient.post<IqScheduleResponse>(`${BASE}/schedule/pause`);
  }

  async resumeSchedule(): Promise<IqScheduleResponse> {
    return apiClient.post<IqScheduleResponse>(`${BASE}/schedule/resume`);
  }

  async deleteSchedule(): Promise<void> {
    return apiClient.delete<void>(`${BASE}/schedule`);
  }
}

export const vonAiFieldsService = new VonAiFieldsService();
