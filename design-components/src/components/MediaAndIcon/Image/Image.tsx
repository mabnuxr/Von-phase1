// components/ImageDisplay.tsx

import React, { useState } from 'react';
import { Image } from 'rsuite';

export interface ImageDisplayProps {
  src: string;
  alt?: string;
  width?: number | string;
  height?: number | string;
  rounded?: boolean;
  circle?: boolean;
  responsive?: boolean;
  fallback?: React.ReactNode;
  children?: React.ReactNode;
}

const ImageDisplay: React.FC<ImageDisplayProps> = ({
  src,
  alt,
  width,
  height,
  rounded = false,
  circle = false,
  responsive = false,
  fallback,
  children,
}) => {
  const [imageError, setImageError] = useState(false);

  if (imageError) {
    return <>{fallback ?? children}</>;
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      rounded={rounded}
      circle={circle}
      // rsuite Image doesn't support 'responsive' prop; emulate via style
      style={responsive ? { maxWidth: '100%', height: 'auto' } : undefined}
      onError={() => setImageError(true)}
    />
  );
};

export default ImageDisplay;
