import React from "react";

interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular";
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = "",
  variant = "rectangular",
}) => {
  const variantStyles = {
    text: "h-4 rounded-md",
    circular: "rounded-full",
    rectangular: "rounded-xl",
  };

  return (
    <div
      className={`animate-pulse bg-surface-container-high/60 ${variantStyles[variant]} ${className}`}
    />
  );
};
