import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Standard Button Component with variants, sizes, icon integration, and loading states
 */
export const Button = forwardRef(({
  children,
  variant = 'primary', // 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success'
  size = 'md', // 'sm' | 'md' | 'lg' | 'icon'
  loading = false,
  disabled = false,
  startIcon: StartIcon,
  endIcon: EndIcon,
  className = '',
  type = 'button',
  ...props
}, ref) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 select-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed';

  const sizeClasses = {
    sm: 'text-xs px-2.5 py-1.5 gap-1.5',
    md: 'text-sm px-3.5 py-2 gap-2',
    lg: 'text-base px-4 py-2.5 gap-2.5',
    icon: 'p-2 text-sm aspect-square',
    'icon-sm': 'p-1.5 text-xs aspect-square',
  };

  const variantClasses = {
    primary: 'bg-teal-700 hover:bg-teal-800 active:bg-teal-900 text-white shadow-xs focus:ring-teal-500 border border-teal-800/30',
    secondary: 'bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 shadow-xs focus:ring-slate-400 border border-slate-200',
    outline: 'bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 border border-slate-300 shadow-xs focus:ring-teal-500',
    ghost: 'bg-transparent hover:bg-slate-100 active:bg-slate-200 text-slate-600 hover:text-slate-900 focus:ring-slate-300',
    danger: 'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-xs focus:ring-red-500 border border-red-700/30',
    success: 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-xs focus:ring-emerald-500 border border-emerald-700/30',
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
    icon: 'w-4 h-4',
    'icon-sm': 'w-3.5 h-3.5',
  };

  const currentIconSize = iconSizes[size] || 'w-4 h-4';

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={`
        ${baseClasses}
        ${sizeClasses[size] || sizeClasses.md}
        ${variantClasses[variant] || variantClasses.primary}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <Loader2 className={`${currentIconSize} animate-spin`} />
      ) : StartIcon ? (
        typeof StartIcon === 'function' || typeof StartIcon === 'object' ? (
          <StartIcon className={currentIconSize} />
        ) : (
          StartIcon
        )
      ) : null}

      {children}

      {!loading && EndIcon && (
        typeof EndIcon === 'function' || typeof EndIcon === 'object' ? (
          <EndIcon className={currentIconSize} />
        ) : (
          EndIcon
        )
      )}
    </button>
  );
});

Button.displayName = 'Button';
export default Button;
