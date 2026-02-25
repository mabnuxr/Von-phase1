import type { TextWidgetProps } from '../types';

const variantStyles: Record<string, string> = {
  heading: 'text-xl font-bold text-gray-900',
  subheading: 'text-base font-semibold text-gray-700',
  body: 'text-sm text-gray-600',
  caption: 'text-xs text-gray-500',
};

const alignmentStyles: Record<string, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

/**
 * Text widget for headings, body text, and captions.
 */
const TextWidget: React.FC<TextWidgetProps> = ({ config }) => {
  const { content, variant, alignment = 'left' } = config;

  return (
    <div className={`flex items-center h-full px-4 py-2 ${alignmentStyles[alignment]}`}>
      <p className={`${variantStyles[variant]} w-full`}>{content}</p>
    </div>
  );
};

export { TextWidget };
