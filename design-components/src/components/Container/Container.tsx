import React from 'react';
import { spacing } from '../../theme';

export interface ContainerProps {
  /**
   * Maximum width of the container
   * @default 'lg'
   */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';

  /**
   * Horizontal padding
   * @default true
   */
  disablePadding?: boolean;

  /**
   * Center the container
   * @default true
   */
  center?: boolean;

  /**
   * Container content
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
}

/**
 * Container component for content layout with max-width constraints
 */
export const Container: React.FC<ContainerProps> = ({
  maxWidth = 'lg',
  disablePadding = false,
  center = true,
  children,
  className,
  id,
}) => {
  // Max width mapping
  const maxWidthMap: Record<ContainerProps['maxWidth'] & string, string> = {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
    full: '100%',
  };

  const styles: React.CSSProperties = {
    width: '100%',
    maxWidth: maxWidthMap[maxWidth],
    marginLeft: center ? 'auto' : 0,
    marginRight: center ? 'auto' : 0,
    paddingLeft: disablePadding ? 0 : spacing[4],
    paddingRight: disablePadding ? 0 : spacing[4],
    boxSizing: 'border-box',
  };

  return (
    <div id={id} className={className} style={styles}>
      {children}
    </div>
  );
};

export default Container;
