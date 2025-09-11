import React from "react";

type TextProps = {
  variant?: "h1" | "h2" | "h3" | "body" | "caption";
  color?: string;
  children: React.ReactNode;
};

const Text: React.FC<TextProps> = ({
  variant = "body",
  color = "#111827", // default dark gray
  children,
}) => {
  const styles: Record<TextProps["variant"], React.CSSProperties> = {
    h1: { fontSize: "2rem", fontWeight: 700 },
    h2: { fontSize: "1.5rem", fontWeight: 600 },
    h3: { fontSize: "1.25rem", fontWeight: 600 },
    body: { fontSize: "1rem", fontWeight: 400 },
    caption: { fontSize: "0.875rem", fontWeight: 300 },
  };

  return (
    <span style={{ ...styles[variant], color }}>
      {children}
    </span>
  );
};

export default Text;
