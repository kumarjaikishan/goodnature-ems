import React, { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * Standard Select Component
 * Replaces MUI Select / MenuItem / FormControl
 */
export const Select = forwardRef(({
  label,
  error,
  helperText,
  options = [], // [{ label: 'Name', value: '1' }] or strings ['A', 'B']
  placeholder = 'Select an option...',
  className = '',
  containerClassName = '',
  disabled = false,
  required = false,
  size = 'md',
  id,
  children,
  ...props
}, ref) => {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  const sizeClasses = {
    sm: 'py-1.5 text-xs pl-2.5 pr-8',
    md: 'py-2 text-sm pl-3 pr-9',
    lg: 'py-2.5 text-base pl-3.5 pr-10',
  };

  return (
    <div className={`flex flex-col gap-1 w-full ${containerClassName}`}>
      {label && (
        <label
          htmlFor={selectId}
          className="text-xs font-semibold text-slate-700 tracking-wide flex items-center gap-1"
        >
          {label}
          {required && <span className="text-red-500 font-bold">*</span>}
        </label>
      )}

      <div className="relative flex items-center w-full">
        <select
          ref={ref}
          id={selectId}
          disabled={disabled}
          required={required}
          className={`
            w-full appearance-none rounded-lg border bg-white text-slate-800 transition-all duration-150 outline-none
            ${sizeClasses[size] || sizeClasses.md}
            ${error
              ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100 bg-red-50/20 text-red-900'
              : 'border-slate-300 hover:border-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100/80'}
            ${disabled ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200' : 'shadow-xs cursor-pointer'}
            ${className}
          `}
          {...props}
        >
          {placeholder && (
            <option value="" disabled hidden={required}>
              {placeholder}
            </option>
          )}

          {children || options.map((opt, idx) => {
            const isObj = typeof opt === 'object' && opt !== null;
            const val = isObj ? opt.value : opt;
            const text = isObj ? (opt.label ?? opt.name ?? opt.value) : opt;
            const isDisabled = isObj ? opt.disabled : false;
            return (
              <option key={idx} value={val} disabled={isDisabled}>
                {text}
              </option>
            );
          })}
        </select>

        <ChevronDown className="absolute right-3 pointer-events-none text-slate-400 w-4 h-4" />
      </div>

      {(error || helperText) && (
        <p className={`text-xs ${error ? 'text-red-500 font-medium' : 'text-slate-500'} mt-0.5`}>
          {error || helperText}
        </p>
      )}
    </div>
  );
});

Select.displayName = 'Select';
export default Select;
