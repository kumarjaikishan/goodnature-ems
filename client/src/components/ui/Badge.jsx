import React from 'react';

/**
 * Modern Status Badge Component
 */
export const Badge = ({
  children,
  variant = 'default', // 'default' | 'success' | 'warning' | 'danger' | 'info' | 'primary' | 'neutral'
  size = 'md', // 'sm' | 'md' | 'lg'
  dot = false,
  className = '',
  ...props
}) => {
  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-0.5 font-semibold',
    lg: 'text-sm px-3 py-1 font-semibold',
  };

  const variantClasses = {
    default: 'bg-slate-100 text-slate-700 border-slate-200/80',
    neutral: 'bg-slate-100 text-slate-600 border-slate-200',
    primary: 'bg-teal-50 text-teal-800 border-teal-200/80',
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
    warning: 'bg-amber-50 text-amber-800 border-amber-200/80',
    danger: 'bg-rose-50 text-rose-800 border-rose-200/80',
    info: 'bg-sky-50 text-sky-800 border-sky-200/80',
  };

  const dotColors = {
    default: 'bg-slate-400',
    neutral: 'bg-slate-400',
    primary: 'bg-teal-500',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
    info: 'bg-sky-500',
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full border shadow-2xs transition-colors
        ${sizeClasses[size] || sizeClasses.md}
        ${variantClasses[variant] || variantClasses.default}
        ${className}
      `}
      {...props}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant] || dotColors.default}`} />
      )}
      {children}
    </span>
  );
};

export default Badge;
