import { datadogRum } from "./datadog";
import type { FileMetadataResponse } from "../services/fileUploadService";

const runStartTimes = new Map<string, number>();
const loggedRunStarts = new Set<string>();
const loggedRunFinishes = new Set<string>();
const loggedArtifact = new Set<string>();

function artifactKey(runId: string, artifactId: string) {
  return `${runId}:${artifactId}`;
}

export function recordRunStarted(runId: string, conversationId: string) {
  try {
    if (!runId || loggedRunStarts.has(runId)) return;
    loggedRunStarts.add(runId);
    runStartTimes.set(runId, performance.now());
    if (import.meta.env.DEV) {
      console.debug("[rt-file-obs] run_started", { runId, conversationId });
    }
    datadogRum.addAction("agent_run_started", {
      run_id: runId,
      conversation_id: conversationId,
    });
  } catch (err) {
    if (import.meta.env.DEV) console.warn("[rt-file-obs] suppressed", err);
  }
}

export function recordRunFinished(runId: string, conversationId: string) {
  try {
    if (!runId || loggedRunFinishes.has(runId)) return;
    loggedRunFinishes.add(runId);
    const start = runStartTimes.get(runId);
    const duration_ms =
      start != null ? Math.round(performance.now() - start) : null;
    if (import.meta.env.DEV) {
      console.debug("[rt-file-obs] run_finished", {
        runId,
        conversationId,
        duration_ms,
      });
    }
    datadogRum.addAction("agent_run_finished", {
      run_id: runId,
      conversation_id: conversationId,
      duration_ms,
    });
  } catch (err) {
    if (import.meta.env.DEV) console.warn("[rt-file-obs] suppressed", err);
  }
}

/** Called from both the Pusher `artifact_created` handler and the
 *  `useAgentArtifacts` queryFn. Emits one of three actions per
 *  (runId, artifactId), exactly once across both sources:
 *    - artifact_pusher_received:                Pusher delivered live
 *    - file_attachment_received_via_api_in_session:
 *        API caught it while the run was active in this session — Pusher
 *        missed → THIS IS THE FAILED-IN-SAME-RUN SIGNAL
 *    - file_attachment_seen_on_refresh:         API caught it cross-session
 *  Joined against the backend `artifact_pusher_published` log by
 *  (run_id, file_id) — those are unique enough; no extra correlation key
 *  is shipped through the Pusher payload. */
export function recordArtifactDelivered(
  conversationId: string,
  runId: string,
  artifacts: Pick<
    FileMetadataResponse,
    "id" | "fileName" | "mimeType" | "artifactType" | "status"
  >[],
  source: "pusher" | "api",
) {
  try {
    if (!runId || !artifacts?.length) return;
    for (const a of artifacts) {
      if (!a?.id) continue;
      if (a.status !== "completed") continue;
      const key = artifactKey(runId, a.id);
      if (loggedArtifact.has(key)) continue;
      loggedArtifact.add(key);

      const start = runStartTimes.get(runId);
      const ms_since_run_started =
        start != null ? Math.round(performance.now() - start) : null;

      const baseAttrs = {
        run_id: runId,
        conversation_id: conversationId,
        file_id: a.id,
        file_name: a.fileName,
        mime_type: a.mimeType,
        artifact_type: a.artifactType,
        source,
        ms_since_run_started,
      };

      let actionName:
        | "artifact_pusher_received"
        | "file_attachment_received_via_api_in_session"
        | "file_attachment_seen_on_refresh";

      if (source === "pusher") {
        actionName = "artifact_pusher_received";
      } else if (runStartTimes.has(runId)) {
        actionName = "file_attachment_received_via_api_in_session";
      } else {
        actionName = "file_attachment_seen_on_refresh";
      }

      if (import.meta.env.DEV) {
        console.debug(`[rt-file-obs] ${actionName}`, baseAttrs);
      }
      datadogRum.addAction(actionName, baseAttrs);
    }
  } catch (err) {
    if (import.meta.env.DEV) console.warn("[rt-file-obs] suppressed", err);
  }
}
