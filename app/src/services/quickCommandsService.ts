import type { CommandAttachment } from '@vonlabs/design-components';
import { apiClient } from './apiClient';

/** Shape the backend expects when creating/updating a command's data sources */
export interface CommandDataSource {
  fileId: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  extension: string;
  category: 'document' | 'spreadsheet' | 'presentation' | 'text' | 'image';
  s3Key: string;
}

/** Shape returned by the backend when reading a command's data sources */
export interface CommandDataSourceResponse {
  fileId: string;
  fileName: string;
  mimeType?: string;
  fileSize?: number;
  url?: string;
  s3Key?: string;
  extension?: string;
  category?: string;
}

export interface QuickCommand {
  id: string;
  name: string;
  slug: string;
  prompt: string;
  prefillText: string;
  accessLevel: 'tenant' | 'user';
  dataSources: CommandDataSourceResponse[];
  lastUsedAt: string | null;
  usageCount: number;
  isBookmarked: boolean;
  createdAt: string;
  createdBy: string;
  updatedAt: string | null;
}

export interface QuickCommandListResponse {
  data: QuickCommand[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface CreateQuickCommandInput {
  id?: string;
  name: string;
  prompt: string;
  prefillText?: string;
  accessLevel?: 'tenant' | 'user';
  dataSources?: CommandDataSource[];
}

export interface UpdateQuickCommandInput {
  name?: string;
  prompt?: string;
  prefillText?: string;
  accessLevel?: 'tenant' | 'user';
  dataSources?: CommandDataSource[];
}

export interface PresignRequest {
  fileName: string;
  fileType: string;
  fileSize: number;
}

export interface PresignResponse {
  uploadUrl: string;
  uploadId: string;
  s3Key: string;
}

export const quickCommandsService = {
  list(params?: {
    accessLevel?: 'all' | 'tenant' | 'user';
    search?: string;
    orderBy?: 'lastUsed' | 'mostUsed';
    page?: number;
    limit?: number;
  }): Promise<QuickCommandListResponse> {
    const searchParams = new URLSearchParams();
    if (params?.accessLevel) searchParams.set('accessLevel', params.accessLevel);
    if (params?.search) searchParams.set('search', params.search);
    if (params?.orderBy) searchParams.set('orderBy', params.orderBy);
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    const query = searchParams.toString();
    return apiClient.get<QuickCommandListResponse>(
      `/api/v1/quick-commands${query ? `?${query}` : ''}`,
    );
  },

  create(data: CreateQuickCommandInput): Promise<QuickCommand> {
    return apiClient.post<QuickCommand>('/api/v1/quick-commands', data);
  },

  update(id: string, data: UpdateQuickCommandInput): Promise<QuickCommand> {
    return apiClient.patch<QuickCommand>(`/api/v1/quick-commands/${id}`, data);
  },

  delete(id: string): Promise<void> {
    return apiClient.delete<void>(`/api/v1/quick-commands/${id}`);
  },

  bookmark(id: string): Promise<void> {
    return apiClient.post<void>(`/api/v1/quick-commands/${id}/bookmark`);
  },

  unbookmark(id: string): Promise<void> {
    return apiClient.delete<void>(`/api/v1/quick-commands/${id}/bookmark`);
  },

  presignFile(commandId: string, data: PresignRequest): Promise<PresignResponse> {
    return apiClient.post<PresignResponse>(
      `/api/v1/quick-commands/${commandId}/files/presign`,
      data,
    );
  },

  /**
   * Get a presigned download URL for a command data source file.
   */
  getFileDownloadUrl(
    commandId: string,
    fileId: string,
  ): Promise<{ downloadUrl: string; fileName: string }> {
    return apiClient.get<{ downloadUrl: string; fileName: string }>(
      `/api/v1/quick-commands/${commandId}/files/${fileId}/download`,
    );
  },

  /**
   * Upload a file directly to S3 using a presigned PUT URL.
   * Uses XMLHttpRequest for upload progress tracking support.
   */
  uploadToS3(
    uploadUrl: string,
    file: File,
    onProgress?: (progress: number) => void,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          onProgress?.(Math.round((e.loaded / e.total) * 100));
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`S3 upload failed with status ${xhr.status}`));
        }
      });

      xhr.addEventListener('error', () => reject(new Error('S3 upload failed: network error')));
      xhr.addEventListener('abort', () => reject(new Error('S3 upload aborted')));

      xhr.open('PUT', uploadUrl);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.send(file);
    });
  },
};

/**
 * Uploads all pending (newly selected) files for a command and returns their
 * CommandDataSource descriptors ready to be saved to the backend.
 *
 * A "pending" file is one whose attachment id exists as a key in `pendingFiles`.
 * Existing already-uploaded attachments (those with an s3Key but no pending entry)
 * are intentionally skipped here — the caller is responsible for including them.
 */
export async function uploadPendingFiles(
  commandId: string,
  dataSources: CommandAttachment[],
  pendingFiles: Record<string, File>,
): Promise<CommandDataSource[]> {
  const results: CommandDataSource[] = [];

  for (const ds of dataSources) {
    const file = pendingFiles[ds.id];
    if (!file) continue; // skip existing (already uploaded) attachments

    const presign = await quickCommandsService.presignFile(commandId, {
      fileName: file.name,
      fileType: file.type || 'application/octet-stream',
      fileSize: file.size,
    });

    await quickCommandsService.uploadToS3(presign.uploadUrl, file);

    results.push({
      fileId: presign.uploadId,
      fileName: file.name,
      mimeType: file.type || 'application/octet-stream',
      fileSize: file.size,
      extension: ds.extension,
      category: ds.category as CommandDataSource['category'],
      s3Key: presign.s3Key,
    });
  }

  return results;
}
