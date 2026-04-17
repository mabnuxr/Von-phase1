import { TiptapViewer } from '../../TiptapEditor';
import type { TextWidgetProps } from '../types';

const variantStyles = {
  heading: 'text-xl font-bold text-gray-900',
  subheading: 'text-base font-semibold text-gray-700',
  body: 'text-sm text-gray-600',
  caption: 'text-xs text-gray-500',
} as const;

type VariantKey = keyof typeof variantStyles;

const alignmentStyles: Record<string, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

/**
 * Text widget for headings, body text, captions, and rich markdown content.
 *
 * Plain-styled mode fires only when `variant` is one of the known enum keys.
 * Anything else (undefined, empty string, or an unknown value the backend
 * might pass through) falls to rich markdown via TiptapViewer.
 */
const TextWidget: React.FC<TextWidgetProps> = ({ config }) => {
  const { content, variant, alignment = 'left' } = config;
  const knownVariant =
    typeof variant === 'string' && variant in variantStyles
      ? (variant as VariantKey)
      : null;

  if (!knownVariant) {
    return (
      <div className={`h-full overflow-auto px-4 py-3 ${alignmentStyles[alignment]}`}>
        <TiptapViewer content={content} className="text-sm text-gray-700" />
      </div>
    );
  }

  return (
    <div className={`flex items-center h-full px-4 py-2 ${alignmentStyles[alignment]}`}>
      <p className={`${variantStyles[knownVariant]} w-full`}>{content}</p>
    </div>
  );
};

export { TextWidget };
