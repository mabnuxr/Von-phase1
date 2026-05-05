import { useEffect, useMemo, useRef, useState } from 'react';
import { TiptapViewer } from '../../TiptapEditor';
import { AddToChatButton } from '../../VonIcon';
import { DragPill } from '../DragPill';
import type { TextWidgetProps } from '../types';
import { resolveMustache } from './resolveMustache';
import { useContentHeightFit } from '../useContentHeightFit';

const variantStyles = {
  heading: 'text-xl font-bold text-gray-900',
  subheading: 'text-base font-semibold text-gray-700',
  body: 'text-sm text-gray-600',
  caption: 'text-xs text-gray-500',
} as const;

type VariantKey = keyof typeof variantStyles;

const alignmentStyles = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
} as const;

type AlignmentKey = keyof typeof alignmentStyles;

const overflowStyles = {
  auto: 'overflow-auto',
  hidden: 'overflow-hidden',
  visible: 'overflow-visible',
} as const;

type OverflowKey = keyof typeof overflowStyles;

// djb2 — cheap deterministic hash, used as a fingerprint for content changes.
function hashString(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  }
  return String(h >>> 0);
}

/**
 * Text widget for headings, body text, captions, and rich markdown content.
 *
 * Renders headerless (like CounterWidget) so the dashboard grid cell controls
 * height. Reports its measured content height to the auto-fit coordinator
 * so widgets grow/shrink to fit content without scrollbars.
 *
 * Plain-styled mode fires only when `variant` is one of the known enum keys.
 * Anything else falls to rich markdown via TiptapViewer.
 */
const TextWidget: React.FC<TextWidgetProps> = ({
  panelId,
  config,
  variables,
  onAddToChat,
  isEditMode,
}) => {
  const { content, variant, alignment = 'left', overflow = 'auto' } = config;
  const resolvedContent = useMemo(() => resolveMustache(content, variables), [content, variables]);
  const knownVariant =
    typeof variant === 'string' && variant in variantStyles ? (variant as VariantKey) : null;

  const alignmentClass =
    alignmentStyles[(alignment in alignmentStyles ? alignment : 'left') as AlignmentKey];
  const overflowClass =
    overflowStyles[(overflow in overflowStyles ? overflow : 'auto') as OverflowKey];

  const richBottomPadding = onAddToChat ? 'pb-14' : 'pb-3';

  const bodyRef = useRef<HTMLDivElement>(null);
  const [contentPx, setContentPx] = useState<number | null>(null);

  // Track the inner container's natural content height. scrollHeight reflects
  // the full rendered height even when overflow is clipped by the cell.
  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    const sample = () => setContentPx(el.scrollHeight);
    sample();
    const observer = new ResizeObserver(() => requestAnimationFrame(sample));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Re-measure when resolved content changes (variables flipped or agent
  // regenerated). Defers to next frame so Tiptap finishes its DOM commit.
  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    const raf = requestAnimationFrame(() => setContentPx(el.scrollHeight));
    return () => cancelAnimationFrame(raf);
  }, [resolvedContent]);

  const fingerprint = useMemo(
    () => hashString(`${variant ?? ''}|${resolvedContent}`),
    [variant, resolvedContent]
  );

  useContentHeightFit({
    panelId: panelId ?? '',
    fingerprint,
    measuredPx: contentPx,
    // Container chrome: outer border (2px) + body padding handled by ref'd el.
    chromePx: 2,
    // Skip auto-fit when the user explicitly opted into a scrollable container.
    enabled: !!panelId && overflow !== 'auto',
  });

  const body = knownVariant ? (
    <div ref={bodyRef} className={`flex items-center h-full px-4 py-2 ${alignmentClass}`}>
      <p className={`${variantStyles[knownVariant]} w-full`}>{resolvedContent}</p>
    </div>
  ) : (
    <div
      ref={bodyRef}
      className={`h-full ${overflowClass} [scrollbar-gutter:stable] pl-4 pr-4 pt-3 ${richBottomPadding} ${alignmentClass}`}
    >
      <TiptapViewer content={resolvedContent} className="text-sm text-gray-700" />
    </div>
  );

  return (
    <div className="group relative h-full bg-white border border-gray-200 hover:border-gray-300 transition-all overflow-hidden">
      {isEditMode && (
        <div className="absolute top-2.5 left-2.5 z-10">
          <DragPill label="Text" />
        </div>
      )}
      {body}
      {onAddToChat && (
        <div className="absolute bottom-3 right-4 z-10 pointer-events-none">
          <div className="pointer-events-auto">
            <AddToChatButton onClick={onAddToChat} variant="pill" />
          </div>
        </div>
      )}
    </div>
  );
};

export { TextWidget };
