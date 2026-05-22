/**
 * HtmlViewer — Renders agent-produced HTML inside a sandboxed iframe.
 *
 * Security model:
 *  - DOMPurify sanitizes the HTML before injection (strips <script>, on* handlers, etc.)
 *  - The iframe `sandbox` attribute is set with no flags by default — scripts are blocked,
 *    same-origin is denied, top-level navigation is denied. This is the maximum sandbox.
 *  - If interactive content (e.g. Plotly) is required, pass `allowScripts` — this opts into
 *    `sandbox="allow-scripts"`. We intentionally NEVER allow `allow-same-origin` (would let
 *    sandboxed code read parent cookies / localStorage).
 */

import React, { useMemo } from 'react';
import DOMPurify from 'dompurify';

interface HtmlViewerProps {
  html: string;
  allowScripts?: boolean;
}

export const HtmlViewer: React.FC<HtmlViewerProps> = ({ html, allowScripts = false }) => {
  const sanitized = useMemo(
    () =>
      DOMPurify.sanitize(html, {
        WHOLE_DOCUMENT: true,
        ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|data:image\/)/i,
      }),
    [html]
  );

  return (
    <div className="flex-1 overflow-hidden bg-white">
      <iframe
        title="HTML artifact preview"
        srcDoc={sanitized}
        sandbox={allowScripts ? 'allow-scripts' : ''}
        className="w-full h-full border-0"
      />
    </div>
  );
};
