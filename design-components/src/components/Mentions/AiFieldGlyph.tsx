import React from 'react';

// "Text field / form field" glyph (svgrepo.com id 418473), inlined so the
// library doesn't ship a binary asset. fill="currentColor" lets Tailwind
// text-* classes color it. Shared across the mention-list dropdown
// (MentionsList), the tag chip strip (MentionStrip) and the chip preview
// (Chat/FileAttachment/MentionPreview) so all three surfaces stay in sync.
export interface AiFieldGlyphProps {
  size?: number;
  className?: string;
}

export const AiFieldGlyph: React.FC<AiFieldGlyphProps> = ({ size = 16, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <g>
      <polygon points="8,9 10,9 10,12 10,16 10,39 8,39 8,42 16,42 16,39 14,39 14,16 14,12 14,9 16,9 16,6 8,6" />
      <polygon points="4,16 7.021,16 7.021,12 0,12 0,36 7.042,36 7.042,32 4,32" />
      <polygon points="16.979,12 16.979,16 44,16 44,32 16.958,32 16.958,36 48,36 48,12" />
    </g>
  </svg>
);
