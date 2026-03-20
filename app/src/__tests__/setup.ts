/**
 * Vitest setup — stub browser globals that third-party packages (e.g. pdfjs-dist)
 * reference at module-init time but aren't needed by pure-logic tests.
 */

// pdfjs-dist reads DOMMatrix at import time for canvas support
if (typeof globalThis.DOMMatrix === "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).DOMMatrix = class DOMMatrix {
    constructor() {
      return new Proxy(this, { get: () => 0 });
    }
  };
}
