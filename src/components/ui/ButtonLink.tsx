import React from 'react';
import { Link, type LinkProps } from 'react-router-dom';

export interface ButtonLinkProps extends LinkProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const ButtonLink: React.FC<ButtonLinkProps> = ({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1';

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-5 py-2.5 gap-2.5',
  };

  const variantStyles = {
    primary:
      'bg-[#0f766e] text-white hover:bg-[#0d635d] focus:ring-[#0f766e]',
    secondary:
      'bg-neutral-100 text-neutral-800 hover:bg-neutral-200 focus:ring-neutral-400',
    outline:
      'border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50 focus:ring-neutral-300',
    ghost:
      'bg-transparent text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 focus:ring-neutral-300',
  };

  return (
    <Link
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </Link>
  );
};
