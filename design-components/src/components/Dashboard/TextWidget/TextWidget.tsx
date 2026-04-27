import { useMemo } from 'react';
import { TiptapViewer } from '../../TiptapEditor';
import { AddToChatButton } from '../../VonIcon';
import type { TextWidgetProps } from '../types';
import { resolveMustache } from './resolveMustache';

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

/**
 * Text widget for headings, body text, captions, and rich markdown content.
 *
 * Renders headerless (like CounterWidget) so the agent controls height via the
 * dashboard grid cell and scroll behavior via `config.overflow`.
 *
 * Plain-styled mode fires only when `variant` is one of the known enum keys.
 * Anything else (undefined, empty string, or an unknown value the backend
 * might pass through) falls to rich markdown via TiptapViewer.
 */
const TextWidget: React.FC<TextWidgetProps> = ({ config, variables, onAddToChat }) => {
  const { content, variant, alignment = 'left', overflow = 'auto' } = config;
  const resolvedContent = useMemo(() => resolveMustache(content, variables), [content, variables]);
  const knownVariant =
    typeof variant === 'string' && variant in variantStyles ? (variant as VariantKey) : null;

  const alignmentClass =
    alignmentStyles[(alignment in alignmentStyles ? alignment : 'left') as AlignmentKey];
  const overflowClass =
    overflowStyles[(overflow in overflowStyles ? overflow : 'auto') as OverflowKey];

  const richBottomPadding = onAddToChat ? 'pb-14' : 'pb-3';

  const body = knownVariant ? (
    <div className={`flex items-center h-full px-4 py-2 ${alignmentClass}`}>
      <p className={`${variantStyles[knownVariant]} w-full`}>{resolvedContent}</p>
    </div>
  ) : (
    <div
      className={`h-full ${overflowClass} [scrollbar-gutter:stable] pl-4 pr-4 pt-3 ${richBottomPadding} ${alignmentClass}`}
    >
      <TiptapViewer content={resolvedContent} className="text-sm text-gray-700" />
    </div>
  );

  return (
    <div className="group relative h-full bg-white border border-gray-200 hover:border-gray-300 transition-all overflow-hidden">
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
