# File Upload & Artifact Generation

## Frontend
- Upload files (any format) to S3 via **presigned PUT URL**
- S3 path: `{tenant_id}/chat/{conversation_id}/workspace/assets/{document_id}/{filename}`
  - `document_id` = Beanie ObjectId from metadata record — prevents filename collisions without a separate UUID. Also allows metadata lookup from the S3 key.
  - Each file is a separate S3 object (not zipped) — individually downloadable via presigned GET URL
- Every successful upload followed by metadata write
- Limits: 5MB per file, 10 files per conversation, 10MB total aggregate
  - Aggregate size enforced by fetching metadata (`?source=user_upload`) and summing `size_bytes` — all user uploads fit in one page (max 10)
- Duplicate handling: warn, don't block. Compare incoming file `name + size` against local attachments AND fetched conversation metadata. User may be uploading an updated version — 10 files / 10MB limits are natural guardrails.
- Only fetch file content from S3 when user explicitly clicks to download/preview

## Backend — File Upload
- Copy files from `{conversation_id}/workspace/assets` path into agent context

## Backend — Artifact Generation
- When the user requests the agent to generate a file (csv, report, etc.), agent writes to `{conversation_id}/workspace/artifacts/{document_id}/{filename}`
- Once the write is successful:
    * Update the metadata
    * Send the metadata to the frontend using Pusher (realtime updates — frontend can show the artifact without polling)

## Upload Flow (Presigned PUT, Two-Phase Commit)

```
Frontend → Backend: POST /presign { fileName, fileType, fileSize }
Backend: validate, create DB record (status: "pending"), generate presigned PUT URL (120s expiry)
Backend → Frontend: { uploadUrl, uploadId, s3Key }
Frontend → S3: PUT file directly
Frontend → Backend: POST /confirm/{uploadId}
Backend: HeadObject to verify existence + size, update DB (status: "completed")
```

**Security:** S3 key generated server-side (client never chooses), Content-Type encoded in presigned params, CORS locked to frontend origin. Size validated client-side + HeadObject on confirm (presigned PUT can't enforce Content-Length server-side).

**Error handling:** 3 retries with exponential backoff. On 403 (expired URL), re-fetch presigned URL. Use `axios` with `onUploadProgress` for progress bars.

## Existing Infrastructure

**Backend (reusable):**
- `E2BWorkspaceStateService` — `generate_upload_url()` / `generate_download_url()` via boto3 presigned URLs — **adapt this**
- `app/core/config.py` — AWS region + credential chain
- `von_db_service/models/artifact.py` — MongoDB binary storage with multi-tenant isolation

**Frontend (reusable):**
- `design-components/src/components/Chat/FileAttachment/` — `useFileUpload.ts`, `FilePreview.tsx`, `DragDropOverlay.tsx`, `types.ts` (5MB limit, 10 files limit already set)
- Need to add: aggregate 10MB total validation across conversation

## Gaps (to build)

1. Backend: `WorkspaceFileMetadata` Beanie document model
2. Backend: `POST /presign`, `POST /confirm/{id}`, `GET /workspace/metadata`, `GET /workspace/download/{file_id}`
3. `WorkspaceFileService` in `app/services/` — adapt `E2BWorkspaceStateService` (boto3 init, presigned URL gen, HeadObject verify, dynamic ContentType)
4. Config: `file_upload_bucket` (required, no default), `presigned_url_expiry` in `app/core/config.py` — `aws_region` already exists
5. Frontend: wire upload button → presign → S3 PUT → confirm flow
6. Frontend: extend `useFileUpload` duplicate check against conversation metadata (currently only checks same-batch via `name + size`)
7. Frontend: aggregate 10MB validation using metadata endpoint
8. Enable upload button in `StandardChatInput.tsx` (remove disabled + "Soon" label)

## Research

### Directive
> Research missing information step by step. Replace `<<Need to discover>>` placeholders with findings.
I will write inline comments in the tag `<<Prudhvi Query >>`, you need answer my concerns and replace these tags with your answer.


1. ~~File upload frontend~~ — **Decided: Presigned PUT with two-phase commit**

2. ~~Metadata storage~~ — **Decided: New `WorkspaceFileMetadata` model + workspace endpoints**

   **Model** (`von_db_service/models/`) — inherits `BaseRevOSDocument` (tenant + user isolation, soft delete, audit fields):
   - `conversation_id`, `file_name`, `s3_key`, `mime_type`, `size_bytes`
   - `status`: pending | completed | error
   - `source`: user_upload | agent_generated

   **Endpoints:**
   - `GET  .../workspace/metadata?source=user_upload&page=1&page_size=10` — list file metadata
   - `GET  .../workspace/download/{file_id}` — returns presigned GET URL for download/preview

   **Notes:**
   - User uploads capped at 10 files → always fits in one page → frontend sums `size_bytes` to enforce 10MB aggregate
   - Agent-generated files paginated (page_size=10)
   - `s3_key` stored in DB — not a security risk (bucket is private, access only via presigned URLs)

3. ~~Prebuilt components~~ — **They exist and are production-ready, but hidden behind two gates**

   **All components are complete** in `design-components/src/components/Chat/FileAttachment/`:
   - `useFileUpload.ts` — validation, drag-drop, file state management (5MB/file, 10 files max). Duplicate detection checks `name + size` against current batch only (not previously uploaded files). Errors surfaced via `onError(type, message)` callback — consumer handles display (toast, inline, etc.). Types: `'file_too_large'`, `'unsupported_type'`, `'max_files_exceeded'`, `'duplicate_file'`
   - `FilePreview.tsx` — category icons, image thumbnails, progress indicators, remove buttons
   - `DragDropOverlay.tsx` — full-screen drag overlay with visual feedback
   - `MessageFilePreview.tsx` — read-only file display in sent messages

   **Why not visible — two gates:**
   1. `showPlusMenu` prop on `StandardChatInput` is controlled by the `deepResearch` LaunchDarkly flag. In `Dashboard.tsx` line 1122: `showPlusMenu={isDeepResearchEnabled}`
   2. Even when Plus menu shows, the Upload button is **hardcoded disabled** with "Coming soon" in `StandardChatInput.tsx` line 168-178

   **To enable:**
   1. Enable `deepResearch` flag in LaunchDarkly (or decouple file upload into its own flag)
   2. Remove `disabled` + "Soon" label from the Upload button in `StandardChatInput.tsx`
   3. Wire the button's `onClick` to trigger `useFileUpload` → presign → S3 PUT → confirm flow

4. ~~S3 backend infrastructure~~ — **Presigned URL logic exists, but no REST API. Needs new service + endpoints.**

   **What exists (reusable pattern, not directly callable from frontend):**
   - `E2BWorkspaceStateService` in `agents-v2/services/e2b_workspace_state.py` — `generate_upload_url()` and `generate_download_url()` using `boto3.client("s3").generate_presigned_url()`
   - Bucket: `von-deep-agent-workspace-state` (env: `E2B_WORKSPACE_STATE_BUCKET`)
   - Path pattern: `{tenant_id}/chat/{conversation_id}/workspace_state.tar.gz` (single zipped blob — our use case needs individual files, not zipped)
   - Expiry: 300s, ContentType: `application/gzip` (hardcoded — our service must use the file's actual MIME type from the frontend `fileType` param instead)
   - Graceful error handling (returns None on failure, never raises)
   - Used only by Temporal activities (workspace save/restore) — **not exposed as REST API**

   **What does NOT exist:**
   - No REST endpoints for presign/confirm in `app/api/v1/` — zero file upload APIs
   - No S3 bucket config in `app/core/config.py` — only `athena_output_bucket` exists
   - No shared S3 service in `app/services/` — boto3 clients are per-service in agents-v2
   - No HeadObject / confirm flow anywhere

   **Gaps to build:**
   - New `WorkspaceFileService` in `app/services/` — adapt `E2BWorkspaceStateService` pattern (boto3 init, presigned URL gen, HeadObject verify)
   - New REST endpoints in `app/api/v1/workspace.py` — `POST /presign`, `POST /confirm/{id}`, `GET /metadata`, `GET /download/{file_id}`
   - New config in `app/core/config.py` — `file_upload_bucket` (required, no default), `presigned_url_expiry` (default: 300s). `aws_region` already exists at line 183.
   - ContentType must match the uploaded file's MIME type (e.g. `text/csv`, `application/pdf`) — passed from frontend via `fileType` in `POST /presign`, not hardcoded like `application/gzip`

5. ~~S3 config~~ — **Done. Mirrors agents-v2 pattern.**

   **`app/core/config.py`** — add two fields to `Settings` class (same pattern as `athena_output_bucket`):
   ```python
   file_upload_bucket: str = Field(description="S3 bucket for file uploads")  # no default — must be set via env var
   presigned_url_expiry: int = Field(default=300, description="Presigned URL expiry in seconds")
   ```
   - `aws_region` already exists at line 183
   - Access: `from core.config import settings` → `settings.file_upload_bucket`
   - Reuse bucket `von-deep-agent-workspace-state` — paths namespaced (`workspace/assets/` vs `workspace_state.tar.gz`)

   **`app/.env`** — added (matches `agents-v2/.env.example` lines 86-89):
   ```
   AWS_ACCESS_KEY_ID=
   AWS_SECRET_ACCESS_KEY=
   AWS_SESSION_TOKEN=
   AWS_REGION=us-west-2
   FILE_UPLOAD_BUCKET=
   PRESIGNED_URL_EXPIRY=300
   ```

   **AWS credentials — boto3 default credential chain (no credential fields in app code):**
   - **Production (ECS):** IAM task role — zero env vars needed
   - **Local dev:** boto3 reads `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY`/`AWS_SESSION_TOKEN` from environment (loaded from `app/.env` via docker-compose `env_file`)
   - CORS on S3 controls which browser origins can PUT — separate from AWS auth. Backend needs credentials to *sign* presigned URLs.

