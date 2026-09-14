import React, { forwardRef, useState } from 'react';

/**
 * PAN Card Input Component
 * - Auto-uppercase alphanumeric
 * - Max 10 characters
 * - Validates standard Indian PAN format: 5 letters, 4 digits, 1 letter (ABCDE1234F)
 * - Shows validation error below input if invalid
 */
export const PanInput = forwardRef(({
  label,
  error: customError,
  helperText,
  startIcon: StartIcon,
  value,
  onChange,
  className = '',
  containerClassName = '',
  disabled = false,
  required = false,
  size = 'md',
  placeholder = '10 character PAN No.',
  id,
  name,
  onBlur,
  ...props
}, ref) => {
  const [touched, setTouched] = useState(false);
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

  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  const currentValue = (value ?? '').toString().toUpperCase();

  // Validate only when there's text entered
  const isInvalid = currentValue.length > 0 && !panRegex.test(currentValue);
  // Show error if user typed full 10 chars and it's invalid, or if blurred and incomplete/invalid, or customError
  const displayError = customError || (touched && isInvalid ? 'Invalid PAN format (e.g. ABCDE1234F)' : (currentValue.length === 10 && !panRegex.test(currentValue) ? 'Invalid PAN format (e.g. ABCDE1234F)' : null));

  const handleInputChange = (e) => {
    // Only allow alphanumeric, auto-capitalize, max 10 chars
    const rawVal = e.target.value || '';
    const cleaned = rawVal.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);

    if (onChange) {
      const syntheticEvent = {
        ...e,
        target: {
          ...e.target,
          name: name || e.target.name,
          value: cleaned,
        },
      };
      onChange(syntheticEvent);
    }
  };

  const handleBlur = (e) => {
    setTouched(true);
    if (onBlur) onBlur(e);
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
          name={name}
          type="text"
          maxLength={10}
          placeholder={placeholder}
          value={currentValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          disabled={disabled}
          required={required}
          className={`
            w-full rounded-lg border bg-white text-slate-800 transition-all duration-150 outline-none uppercase font-mono tracking-wider font-semibold
            placeholder:text-slate-400 placeholder:font-normal placeholder:normal-case placeholder:tracking-normal
            ${sizeClasses[size] || sizeClasses.md}
            ${StartIcon ? 'pl-9' : ''}
            ${displayError
              ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100 bg-red-50/20 text-red-900'
              : 'border-slate-300 hover:border-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100/80'}
            ${disabled ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200' : 'shadow-xs'}
            ${className}
          `}
          {...props}
        />
      </div>

      {(displayError || helperText) && (
        <p className={`text-xs ${displayError ? 'text-red-500 font-medium' : 'text-slate-500'} mt-0.5`}>
          {displayError || helperText}
        </p>
      )}
    </div>
  );
});

PanInput.displayName = 'PanInput';
export default PanInput;
