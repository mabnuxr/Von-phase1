import React from 'react';
import { spacing, colors } from '../../theme';

export interface BoxProps {
  /**
   * Padding (applies to all sides)
   */
  padding?: keyof typeof spacing;

  /**
   * Padding X (left and right)
   */
  paddingX?: keyof typeof spacing;

  /**
   * Padding Y (top and bottom)
   */
  paddingY?: keyof typeof spacing;

  /**
   * Padding Top
   */
  paddingTop?: keyof typeof spacing;

  /**
   * Padding Right
   */
  paddingRight?: keyof typeof spacing;

  /**
   * Padding Bottom
   */
  paddingBottom?: keyof typeof spacing;

  /**
   * Padding Left
   */
  paddingLeft?: keyof typeof spacing;

  /**
   * Margin (applies to all sides)
   */
  margin?: keyof typeof spacing;

  /**
   * Margin X (left and right)
   */
  marginX?: keyof typeof spacing;

  /**
   * Margin Y (top and bottom)
   */
  marginY?: keyof typeof spacing;

  /**
   * Margin Top
   */
  marginTop?: keyof typeof spacing;

  /**
   * Margin Right
   */
  marginRight?: keyof typeof spacing;

  /**
   * Margin Bottom
   */
  marginBottom?: keyof typeof spacing;

  /**
   * Margin Left
   */
  marginLeft?: keyof typeof spacing;

  /**
   * Background color
   */
  backgroundColor?: string;

  /**
   * Border radius
   */
  borderRadius?: 'none' | 'sm' | 'md' | 'lg' | 'full';

  /**
   * Whether to show a border
   */
  border?: boolean;

  /**
   * Border color
   */
  borderColor?: string;

  /**
   * Box content
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
  as?: 'div' | 'section' | 'article' | 'aside' | 'nav' | 'header' | 'footer' | 'main';

  /**
   * Inline styles (for demos/stories only, prefer using props)
   */
  style?: React.CSSProperties;
}

/**
 * Box component - a generic container with spacing and styling utilities
 */
export const Box: React.FC<BoxProps> = ({
  padding,
  paddingX,
  paddingY,
  paddingTop,
  paddingRight,
  paddingBottom,
  paddingLeft,
  margin,
  marginX,
  marginY,
  marginTop,
  marginRight,
  marginBottom,
  marginLeft,
  backgroundColor,
  borderRadius = 'none',
  border = false,
  borderColor,
  children,
  className,
  id,
  as: Component = 'div',
  style,
}) => {
  // Border radius mapping
  const borderRadiusMap: Record<BoxProps['borderRadius'] & string, string> = {
    none: '0',
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    full: '9999px',
  };

  // Build padding styles
  const getPadding = () => {
    if (padding) return spacing[padding];
    return undefined;
  };

  const getPaddingTop = () => {
    if (paddingTop) return spacing[paddingTop];
    if (paddingY) return spacing[paddingY];
    return undefined;
  };

  const getPaddingRight = () => {
    if (paddingRight) return spacing[paddingRight];
    if (paddingX) return spacing[paddingX];
    return undefined;
  };

  const getPaddingBottom = () => {
    if (paddingBottom) return spacing[paddingBottom];
    if (paddingY) return spacing[paddingY];
    return undefined;
  };

  const getPaddingLeft = () => {
    if (paddingLeft) return spacing[paddingLeft];
    if (paddingX) return spacing[paddingX];
    return undefined;
  };

  // Build margin styles
  const getMargin = () => {
    if (margin) return spacing[margin];
    return undefined;
  };

  const getMarginTop = () => {
    if (marginTop) return spacing[marginTop];
    if (marginY) return spacing[marginY];
    return undefined;
  };

  const getMarginRight = () => {
    if (marginRight) return spacing[marginRight];
    if (marginX) return spacing[marginX];
    return undefined;
  };

  const getMarginBottom = () => {
    if (marginBottom) return spacing[marginBottom];
    if (marginY) return spacing[marginY];
    return undefined;
  };

  const getMarginLeft = () => {
    if (marginLeft) return spacing[marginLeft];
    if (marginX) return spacing[marginX];
    return undefined;
  };

  const styles: React.CSSProperties = {
    padding: getPadding(),
    paddingTop: getPaddingTop(),
    paddingRight: getPaddingRight(),
    paddingBottom: getPaddingBottom(),
    paddingLeft: getPaddingLeft(),
    margin: getMargin(),
    marginTop: getMarginTop(),
    marginRight: getMarginRight(),
    marginBottom: getMarginBottom(),
    marginLeft: getMarginLeft(),
    backgroundColor: backgroundColor,
    borderRadius: borderRadiusMap[borderRadius],
    border: border ? `1px solid ${borderColor || colors.neutral[200]}` : 'none',
    boxSizing: 'border-box',
  };

  return (
    <Component id={id} className={className} style={{ ...styles, ...style }}>
      {children}
    </Component>
  );
};

export default Box;
