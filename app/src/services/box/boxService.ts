import { apiClient } from "../apiClient";

export interface ExportToBoxResponse {
  file_id: string;
  url: string;
  name: string;
}

export async function exportToBox(
  fileId: string,
  conversationId: string,
): Promise<ExportToBoxResponse> {
  return apiClient.post<ExportToBoxResponse>("/api/v1/box/export", {
    file_id: fileId,
    conversation_id: conversationId,
  });
}
