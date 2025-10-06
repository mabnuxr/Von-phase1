import React from 'react';
import { colors } from '../../theme';

export interface AvatarProps {
  /**
   * Size of the avatar
   * @default 'medium'
   */
  size?: 'small' | 'medium' | 'large';

  /**
   * Source URL for the avatar image
   */
  src?: string;

  /**
   * Alt text for the avatar image
   */
  alt?: string;

  /**
   * Fallback text (initials) when no image is provided
   */
  fallback?: string;

  /**
   * Click handler
   */
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;

  /**
   * Additional CSS class name
   */
  className?: string;

  /**
   * ARIA label for accessibility
   */
  ariaLabel?: string;
}

/**
 * Avatar component for displaying user profile pictures or initials
 */
export const Avatar: React.FC<AvatarProps> = ({
  size = 'medium',
  src,
  alt = 'Avatar',
  fallback,
  onClick,
  className,
  ariaLabel,
}) => {
  const [imageError, setImageError] = React.useState(false);

  // Size mappings - Apple style
  const sizeStyles: Record<AvatarProps['size'] & string, React.CSSProperties> = {
    small: {
      width: '32px',
      height: '32px',
      fontSize: '0.75rem', // 12px
    },
    medium: {
      width: '40px',
      height: '40px',
      fontSize: '0.875rem', // 14px
    },
    large: {
      width: '56px',
      height: '56px',
      fontSize: '1.125rem', // 18px
    },
  };

  const baseStyles: React.CSSProperties = {
    borderRadius: '50%',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutral[300],
    color: colors.neutral[700],
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif',
    fontWeight: 600,
    cursor: onClick ? 'pointer' : 'default',
    userSelect: 'none',
    overflow: 'hidden',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
  };

  const [isHovered, setIsHovered] = React.useState(false);

  const hoverStyles: React.CSSProperties =
    isHovered && onClick
      ? {
          opacity: 0.8,
          transform: 'scale(1.05)',
        }
      : {};

  const handleImageError = () => {
    setImageError(true);
  };

  const showImage = src && !imageError;
  const showFallback = !showImage && fallback;

  return (
    <div
      onClick={onClick}
      className={className}
      aria-label={ariaLabel || alt}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick(e as unknown as React.MouseEvent<HTMLDivElement>);
        }
      }}
      style={{
        ...baseStyles,
        ...sizeStyles[size],
        ...hoverStyles,
      }}
    >
      {showImage ? (
        <img
          src={src}
          alt={alt}
          onError={handleImageError}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      ) : showFallback ? (
        <span>{fallback}</span>
      ) : (
        <svg
          width="60%"
          height="60%"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z"
            fill="currentColor"
          />
        </svg>
      )}
    </div>
  );
};

export default Avatar;
