// "Text field / form field" glyph from svgrepo.com (id 418473), inlined so
// it ships with the bundle and can be colored via Tailwind text-* classes
// (the SVG fills with currentColor).
//
// Used wherever the product shows an "AI Field" entity (side panel header,
// artifact card in chat, Settings sidebar tab).

interface AiFieldIconProps {
  size?: number | string;
  className?: string;
}

export function AiFieldIcon({ size = 16, className }: AiFieldIconProps) {
  return (
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
}
