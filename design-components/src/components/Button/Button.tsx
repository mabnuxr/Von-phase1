import React from "react";

type ButtonProps = {
    color?: 'primary' | 'secondary' | 'danger';
    width: string | number;
    onClick?: () => void;
    children: React.ReactNode
};


const Button: React.FC<ButtonProps> = ({
    color = 'primary',
    width,
    onClick,
    children
}) => {
//@ts-ignore
const backgroundColors: Record<ButtonProps["color"], string> = {
    primary: "#2563eb", 
    secondary: "#6b7280",
    danger: "#dc2626",
  };
    return (
        <button
            onClick={onClick}
            style={{
                backgroundColor: backgroundColors[color],
                width: typeof width === "number" ? `${width}px` : width,
                padding: "0.5rem 1rem",
                border: "none",
                borderRadius: "0.375rem",
                color: "white",
                cursor: "pointer",
            }}
        >
            {children}
        </button>
    )
}

export default Button;