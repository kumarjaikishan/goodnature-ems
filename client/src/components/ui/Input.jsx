import React, { forwardRef } from 'react';

/**
 * Standard Form Text Input Component
 * Replaces MUI TextField / OutlinedInput
 */
export const Input = forwardRef(({
  label,
  error,
  helperText,
  startIcon: StartIcon,
  endIcon: EndIcon,
  className = '',
  containerClassName = '',
  disabled = false,
  required = false,
  size = 'md', // 'sm' | 'md' | 'lg'
  type = 'text',
  id,
  ...props
}, ref) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  const sizeClasses = {
    sm: 'py-1.5 text-xs px-2.5',
    md: 'py-2 text-sm px-3',
    lg: 'py-2.5 text-base px-3.5',
  };

  const iconSizeClasses = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <div className={`flex flex-col gap-1 w-full ${containerClassName}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-semibold text-slate-700 tracking-wide flex items-center gap-1"
        >
          {label}
          {required && <span className="text-red-500 font-bold">*</span>}
        </label>
      )}

      <div className="relative flex items-center w-full">
        {StartIcon && (
          <div className="absolute left-3 pointer-events-none text-slate-400 flex items-center justify-center">
            {typeof StartIcon === 'function' || typeof StartIcon === 'object' ? (
              <StartIcon className={iconSizeClasses[size] || 'w-4 h-4'} />
            ) : (
              StartIcon
            )}
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          type={type}
          disabled={disabled}
          required={required}
          className={`
            w-full rounded-lg border bg-white text-slate-800 transition-all duration-150 outline-none
            placeholder:text-slate-400
            ${sizeClasses[size] || sizeClasses.md}
            ${StartIcon ? 'pl-9' : ''}
            ${EndIcon ? 'pr-9' : ''}
            ${error
              ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100 bg-red-50/20 text-red-900'
              : 'border-slate-300 hover:border-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100/80'}
            ${disabled ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200 shadow-none' : 'shadow-xs'}
            ${className}
          `}
          {...props}
        />

        {EndIcon && (
          <div className="absolute right-3 pointer-events-none text-slate-400 flex items-center justify-center">
            {typeof EndIcon === 'function' || typeof EndIcon === 'object' ? (
              <EndIcon className={iconSizeClasses[size] || 'w-4 h-4'} />
            ) : (
              EndIcon
            )}
          </div>
        )}
      </div>

      {(error || helperText) && (
        <p className={`text-xs ${error ? 'text-red-500 font-medium' : 'text-slate-500'} mt-0.5`}>
          {error || helperText}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
