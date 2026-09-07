import React, { forwardRef } from 'react';

/**
 * Mobile-friendly Number Input with numeric keyboard, stepper support, formatting
 */
export const NumberInput = forwardRef(({
  label,
  error,
  helperText,
  startIcon: StartIcon,
  currency = false, // If true, shows ₹ icon
  allowDecimal = false,
  min,
  max,
  value,
  onChange,
  className = '',
  containerClassName = '',
  disabled = false,
  required = false,
  size = 'md',
  id,
  placeholder,
  ...props
}, ref) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  const sizeClasses = {
    sm: 'py-1.5 text-xs px-2.5',
    md: 'py-2 text-sm px-3',
    lg: 'py-2.5 text-base px-3.5',
  };

  const handleInputChange = (e) => {
    let val = e.target.value;
    if (allowDecimal) {
      // Allow only numbers and a single decimal point
      val = val.replace(/[^0-9.]/g, '').replace(/(\..*?)\..*/g, '$1');
    } else {
      // Strict digits only
      val = val.replace(/\D/g, '');
    }

    if (max !== undefined && val !== '') {
      if (Number(val) > Number(max)) return;
    }

    if (onChange) {
      // Create synthetic event or pass sanitized value
      const syntheticEvent = {
        ...e,
        target: {
          ...e.target,
          name: e.target.name,
          value: val,
        },
      };
      onChange(syntheticEvent);
    }
  };

  const handleKeyDown = (e) => {
    // Prevent non-numeric characters from being typed
    if (
      [
        'Backspace',
        'Delete',
        'Tab',
        'Escape',
        'Enter',
        'ArrowLeft',
        'ArrowRight',
        'Home',
        'End',
      ].includes(e.key) ||
      (e.ctrlKey || e.metaKey)
    ) {
      return;
    }

    if (allowDecimal && e.key === '.') {
      if (String(value || '').includes('.')) {
        e.preventDefault();
      }
      return;
    }

    if (!/^[0-9]$/.test(e.key)) {
      e.preventDefault();
    }
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
        {currency ? (
          <div className="absolute left-3 pointer-events-none text-slate-500 font-medium text-sm flex items-center justify-center">
            ₹
          </div>
        ) : StartIcon ? (
          <div className="absolute left-3 pointer-events-none text-slate-400 flex items-center justify-center">
            {typeof StartIcon === 'function' || typeof StartIcon === 'object' ? (
              <StartIcon className="w-4 h-4" />
            ) : (
              StartIcon
            )}
          </div>
        ) : null}

        <input
          ref={ref}
          id={inputId}
          type="tel"
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder={placeholder}
          value={value ?? ''}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          required={required}
          className={`
            w-full rounded-lg border bg-white text-slate-800 transition-all duration-150 outline-none
            placeholder:text-slate-400 font-mono
            ${sizeClasses[size] || sizeClasses.md}
            ${currency || StartIcon ? 'pl-8' : ''}
            ${error
              ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100 bg-red-50/20 text-red-900'
              : 'border-slate-300 hover:border-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100/80'}
            ${disabled ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200' : 'shadow-xs'}
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

NumberInput.displayName = 'NumberInput';
export default NumberInput;
