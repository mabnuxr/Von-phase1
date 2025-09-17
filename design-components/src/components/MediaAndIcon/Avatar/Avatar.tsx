// components/AvatarDisplay.tsx

import React from 'react';
import { Avatar } from 'rsuite';

export interface AvatarDisplayProps {
  src?: string;
  alt?: string;
  size?: 'lg' | 'md' | 'sm' | 'xs';
  circle?: boolean;
  children?: React.ReactNode;
}

const AvatarDisplay: React.FC<AvatarDisplayProps> = ({
  src,
  alt,
  size = 'md',
  circle = true,
  children,
}) => {
  return (
    <Avatar
      src={src}
      alt={alt}
      size={size}
      circle={circle}
    >
      {children}
    </Avatar>
  );
};

export default AvatarDisplay;
