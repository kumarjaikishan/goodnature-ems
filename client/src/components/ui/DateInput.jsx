import React, { forwardRef } from 'react';
import { Calendar } from 'lucide-react';

/**
 * Standard Native Date Input Component
 * Replaces MUI @mui/x-date-pickers (DatePicker, LocalizationProvider, AdapterDayjs)
 */
export const DateInput = forwardRef(({
  label,
  error,
  helperText,
  className = '',
  containerClassName = '',
  disabled = false,
  required = false,
  size = 'md',
  min,
  max,
  id,
  ...props
}, ref) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  const sizeClasses = {
    sm: 'py-1.5 text-xs px-2.5',
    md: 'py-2 text-sm px-3',
    lg: 'py-2.5 text-base px-3.5',
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
        <input
          ref={ref}
          id={inputId}
          type="date"
          min={min}
          max={max}
          disabled={disabled}
          required={required}
          className={`
            w-full rounded-lg border bg-white text-slate-800 transition-all duration-150 outline-none
            ${sizeClasses[size] || sizeClasses.md}
            ${error
              ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100 bg-red-50/20 text-red-900'
              : 'border-slate-300 hover:border-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100/80'}
            ${disabled ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200' : 'shadow-xs cursor-pointer'}
            ${className}
          `}
          {...props}
        />
      </div>

      {(error || helperText) && (
        <p className={`text-xs ${error ? 'text-red-500 font-medium' : 'text-slate-500'} mt-0.5`}>
          {error || helperText}
        </p>
      )}
    </div>
  );
});

DateInput.displayName = 'DateInput';
export default DateInput;
