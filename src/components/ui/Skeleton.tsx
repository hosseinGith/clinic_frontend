import React from 'react';

export interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => {
  return (
    <div
      className={`animate-pulse bg-neutral-200/80 rounded ${className}`}
      aria-hidden="true"
    />
  );
};
