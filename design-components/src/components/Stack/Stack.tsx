import React from 'react';
import { componentSpacing } from '../../theme';

export interface StackProps {
  /**
   * Direction of the stack
   * @default 'vertical'
   */
  direction?: 'vertical' | 'horizontal';

  /**
   * Gap between items
   * @default 'md'
   */
  gap?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';

  /**
   * Alignment of items along the cross axis
   * @default 'stretch'
   */
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';

  /**
   * Justify content along the main axis
   * @default 'start'
   */
  justify?: 'start' | 'center' | 'end' | 'space-between' | 'space-around' | 'space-evenly';

  /**
   * Whether items should wrap
   * @default false
   */
  wrap?: boolean;

  /**
   * Whether the stack should take full width/height
   * @default false
   */
  fullWidth?: boolean;

  /**
   * Stack content
   */
  children: React.ReactNode;

  /**
   * Additional CSS class name
   */
  className?: string;

  /**
   * HTML id attribute
   */
  id?: string;

  /**
   * HTML element to render
   * @default 'div'
   */
  as?: 'div' | 'section' | 'nav' | 'aside' | 'header' | 'footer';

  /**
   * Inline styles (for demos/stories only, prefer using props)
   */
  style?: React.CSSProperties;
}

/**
 * Stack component for flexible vertical or horizontal layouts
 */
export const Stack: React.FC<StackProps> = ({
  direction = 'vertical',
  gap = 'md',
  align = 'stretch',
  justify = 'start',
  wrap = false,
  fullWidth = false,
  children,
  className,
  id,
  as: Component = 'div',
  style,
}) => {
  // Alignment mapping
  const alignMap: Record<StackProps['align'] & string, string> = {
    start: 'flex-start',
    center: 'center',
    end: 'flex-end',
    stretch: 'stretch',
    baseline: 'baseline',
  };

  // Justify mapping
  const justifyMap: Record<StackProps['justify'] & string, string> = {
    start: 'flex-start',
    center: 'center',
    end: 'flex-end',
    'space-between': 'space-between',
    'space-around': 'space-around',
    'space-evenly': 'space-evenly',
  };

  const styles: React.CSSProperties = {
    display: 'flex',
    flexDirection: direction === 'vertical' ? 'column' : 'row',
    gap: componentSpacing.stack.gap[gap],
    alignItems: alignMap[align],
    justifyContent: justifyMap[justify],
    flexWrap: wrap ? 'wrap' : 'nowrap',
    width: fullWidth ? '100%' : 'auto',
  };

  return (
    <Component id={id} className={className} style={{ ...styles, ...style }}>
      {children}
    </Component>
  );
};

export default Stack;
