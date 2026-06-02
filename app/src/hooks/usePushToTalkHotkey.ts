import { useEffect, useRef } from "react";

interface Options {
  /** Fires on keydown when the chord is held. */
  onPress: () => void;
  /** Fires on keyup of any chord key while held. */
  onRelease: () => void;
  /** Set false to temporarily disable (e.g. during teardown). */
  enabled?: boolean;
}

// Hold-to-talk hotkey: ⌥ Option (Alt) on every platform.
//
// Browsers map both physical Option keys to `event.altKey === true` /
// `event.code === "AltLeft" | "AltRight"`. We listen for the press without
// any modifier requirement so a single hold dictates — matching the inline
// "hold ⌥ Option to talk" hint in the chat input.
export function usePushToTalkHotkey({
  onPress,
  onRelease,
  enabled = true,
}: Options): void {
  const isHeldRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    const isOptionKey = (e: KeyboardEvent): boolean =>
      e.code === "AltLeft" || e.code === "AltRight";

    const handleDown = (e: KeyboardEvent) => {
      if (!isOptionKey(e)) return;
      if (e.repeat) return; // OS keydown auto-repeats while held
      // Push-to-talk from anywhere, including inside text inputs — dictation
      // landing in the chat input IS the goal.
      e.preventDefault();
      if (isHeldRef.current) return;
      isHeldRef.current = true;
      onPress();
    };

    const handleUp = (e: KeyboardEvent) => {
      if (!isHeldRef.current) return;
      if (!isOptionKey(e)) return;
      isHeldRef.current = false;
      onRelease();
    };

    const handleBlur = () => {
      // If the window loses focus mid-press, OS may swallow the keyup.
      if (isHeldRef.current) {
        isHeldRef.current = false;
        onRelease();
      }
    };

    window.addEventListener("keydown", handleDown);
    window.addEventListener("keyup", handleUp);
    window.addEventListener("blur", handleBlur);
    return () => {
      window.removeEventListener("keydown", handleDown);
      window.removeEventListener("keyup", handleUp);
      window.removeEventListener("blur", handleBlur);
    };
  }, [enabled, onPress, onRelease]);
}
