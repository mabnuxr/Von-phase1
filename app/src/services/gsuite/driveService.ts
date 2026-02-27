import { apiClient } from "../apiClient";

export interface ExportToDriveResponse {
  file_id: string;
  url: string;
  name: string;
}

export async function exportToDrive(
  fileId: string,
  conversationId: string,
): Promise<ExportToDriveResponse> {
  return apiClient.post<ExportToDriveResponse>("/api/v1/gsuite/drive/export", {
    file_id: fileId,
    conversation_id: conversationId,
  });
}
