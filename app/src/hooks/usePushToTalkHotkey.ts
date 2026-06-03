import { useEffect, useRef } from "react";

interface Options {
  onPress: () => void;
  onRelease: () => void;
  enabled?: boolean;
}

// Hold ⌥ alone this long before dictation starts. A key pressed within the
// window is a compound shortcut (Option+Backspace, Alt+Tab), not push-to-talk.
// Sized to clear a deliberate Mac word-edit chord so editing wins on the first
// press; the cost is this much of a beat before the mic opens.
const HOLD_DELAY_MS = 400;

type Hold = "idle" | "pending" | "recording" | "chord";

// Push-to-talk on ⌥ Option (Alt) on every platform.
export function usePushToTalkHotkey({
  onPress,
  onRelease,
  enabled = true,
}: Options): void {
  const stateRef = useRef<Hold>("idle");
  const timerRef = useRef<number | null>(null);

  // Latest-callback refs so the listener effect can bind once on [enabled]
  // instead of re-running every render as the caller's closures change.
  const onPressRef = useRef(onPress);
  const onReleaseRef = useRef(onRelease);
  onPressRef.current = onPress;
  onReleaseRef.current = onRelease;

  useEffect(() => {
    if (!enabled) return;

    const isOption = (e: KeyboardEvent) =>
      e.code === "AltLeft" || e.code === "AltRight";

    const clearTimer = () => {
      if (timerRef.current != null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    const end = () => {
      clearTimer();
      if (stateRef.current === "recording") onReleaseRef.current();
      stateRef.current = "idle";
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (isOption(e)) {
        if (e.repeat || stateRef.current !== "idle") return;
        stateRef.current = "pending";
        e.preventDefault();
        timerRef.current = window.setTimeout(() => {
          timerRef.current = null;
          if (stateRef.current !== "pending") return;
          stateRef.current = "recording";
          onPressRef.current();
        }, HOLD_DELAY_MS);
      } else if (stateRef.current === "pending") {
        // Another key before dictation starts → compound shortcut, not talk.
        clearTimer();
        stateRef.current = "chord";
      } else if (stateRef.current === "recording") {
        // A key once recording (⌥ held long enough to start, then e.g.
        // Backspace) ends the session — keeping what was said and re-enabling
        // the locked input so the next keystroke edits normally.
        stateRef.current = "chord";
        onReleaseRef.current();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (isOption(e)) end();
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    // Blur can swallow the ⌥ keyup; end the session so it can't stick on.
    window.addEventListener("blur", end);
    return () => {
      clearTimer();
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", end);
    };
  }, [enabled]);
}
