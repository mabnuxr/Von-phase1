import { apiClient } from "./apiClient";
import { config } from "../config";

export interface DeepgramKeyResponse {
  key: string;
  expires_at: string;
}

export interface VoiceCleanupArgs {
  newDictation: string;
  /** Called every time the cleaned text grows. Receives the cumulative
   *  *polished dictation* — concatenation with anything the user had
   *  already typed in the input is the caller's responsibility. */
  onProgress: (cumulative: string) => void;
  /** Caller-owned signal for cancellation when the user re-starts dictation. */
  signal: AbortSignal;
}

export const voiceService = {
  /** Mint a short-lived Deepgram key for a single voice session. */
  getDeepgramKey(): Promise<DeepgramKeyResponse> {
    return apiClient.post<DeepgramKeyResponse>("/api/v1/deepgram/key");
  },

  /** Open an SSE stream that polishes raw dictation via an LLM. Resolves
   *  to the final cleaned dictation once the server emits `done`. */
  async streamCleanup({
    newDictation,
    onProgress,
    signal,
  }: VoiceCleanupArgs): Promise<string> {
    const response = await fetch(`${config.apiBaseUrl}/api/v1/voice/cleanup`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ new_dictation: newDictation }),
      signal,
    });
    if (!response.ok || !response.body) {
      throw new Error(`Cleanup request failed (${response.status})`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let cumulative = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // SSE events are delimited by blank lines.
        let sepIdx = buffer.indexOf("\n\n");
        while (sepIdx !== -1) {
          const rawEvent = buffer.slice(0, sepIdx);
          buffer = buffer.slice(sepIdx + 2);
          sepIdx = buffer.indexOf("\n\n");

          // Each event has one or more `data: ...` lines.
          const dataLines = rawEvent
            .split("\n")
            .filter((l) => l.startsWith("data: "))
            .map((l) => l.slice(6));
          if (dataLines.length === 0) continue;

          try {
            const parsed = JSON.parse(dataLines.join("\n"));
            if (parsed.delta) {
              cumulative += parsed.delta;
              onProgress(cumulative);
            }
            // The trailing `done` event is acknowledged by exiting the loop
            // when the underlying stream closes — no special handling needed.
          } catch {
            /* swallow malformed events */
          }
        }
      }
    } finally {
      reader.cancel().catch(() => undefined);
    }
    return cumulative;
  },
};
