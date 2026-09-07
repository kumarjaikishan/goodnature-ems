import React, { forwardRef, useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Check } from 'lucide-react';

/**
 * Modern Custom Select Component
 * - Premium floating dropdown menu with smooth animation, teal highlights, and checkmarks
 * - 100% drop-in replacement compatible with standard <Select value={...} onChange={(e) => ...} options={...} />
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
  name,
  value = '',
  onChange,
  children,
  ...props
}, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef(null);
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  // Normalize options (from props or children)
  const normalizedOptions = useMemo(() => {
    if (children) {
      const parsed = [];
      React.Children.forEach(children, (child) => {
        if (React.isValidElement(child) && child.type === 'option') {
          parsed.push({
            value: child.props.value ?? '',
            label: child.props.children ?? '',
            disabled: child.props.disabled ?? false
          });
        }
      });
      return parsed;
    }

    return options.map((opt) => {
      if (typeof opt === 'object' && opt !== null) {
        return {
          value: opt.value ?? '',
          label: String(opt.label ?? opt.name ?? opt.department ?? opt.value ?? ''),
          disabled: Boolean(opt.disabled),
          raw: opt
        };
      }
      return {
        value: opt,
        label: String(opt),
        disabled: false,
        raw: opt
      };
    });
  }, [options, children]);

  // Filtered options based on search input
  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return normalizedOptions;
    const term = searchTerm.toLowerCase().trim();
    return normalizedOptions.filter((opt) =>
      opt.label.toLowerCase().includes(term)
    );
  }, [normalizedOptions, searchTerm]);

  // Find currently selected option
  const selectedOption = useMemo(() => {
    if (value === undefined || value === null) return null;
    return normalizedOptions.find((opt) => String(opt.value) === String(value));
  }, [normalizedOptions, value]);

  // Close on outside click and reset search
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (opt) => {
    if (opt.disabled) return;
    if (onChange) {
      onChange({
        target: {
          value: opt.value,
          name: name || selectId,
        }
      });
    }
    setIsOpen(false);
  };

  const sizeClasses = {
    sm: 'py-1.5 text-xs px-2.5',
    md: 'py-2 text-sm px-3',
    lg: 'py-2.5 text-base px-3.5',
  };

  return (
    <div ref={containerRef} className={`flex flex-col gap-1 w-full relative ${containerClassName}`}>
      {label && (
        <label
          htmlFor={selectId}
          className="text-xs font-semibold text-slate-700 tracking-wide flex items-center gap-1 select-none"
        >
          {label}
          {required && <span className="text-red-500 font-bold">*</span>}
        </label>
      )}

      {/* Trigger Button Styled as an Input */}
      <button
        ref={ref}
        id={selectId}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={`
          w-full rounded-lg border bg-white text-slate-800 transition-all duration-150 outline-none
          flex items-center justify-between text-left select-none
          ${sizeClasses[size] || sizeClasses.md}
          ${error
            ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100 bg-red-50/20 text-red-900'
            : isOpen
            ? 'border-teal-600 ring-2 ring-teal-100/80 shadow-xs'
            : 'border-slate-300 hover:border-slate-400 focus:border-teal-600'}
          ${disabled ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200' : 'cursor-pointer shadow-xs'}
          ${className}
        `}
        {...props}
      >
        <span className={`truncate flex-1 pr-2 ${!selectedOption || selectedOption.value === '' ? 'text-slate-400' : 'text-slate-800 font-medium'}`}>
          {selectedOption && selectedOption.value !== '' ? selectedOption.label : placeholder}
        </span>

        <ChevronDown
          size={15}
          className={`shrink-0 transition-transform duration-200 text-slate-400 ${isOpen ? 'rotate-180 text-teal-600' : ''}`}
        />
      </button>

      {/* Modern Floating Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 w-full min-w-[160px] bg-white rounded-xl border border-slate-200/90 shadow-2xl z-50 overflow-hidden ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-150 flex flex-col backdrop-blur-sm">
          {/* Optional inline search if more than 6 options */}
          {normalizedOptions.length > 7 && (
            <div className="p-1.5 border-b border-slate-100 bg-slate-50/70">
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="w-full px-2.5 py-1 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 transition-all"
                autoFocus
              />
            </div>
          )}

          <div className="max-h-60 overflow-y-auto p-1.5 space-y-0.5 scrollbar-thin">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-slate-400 font-medium">
                No matching options
              </div>
            ) : (
              filteredOptions.map((opt, index) => {
                const isSelected = selectedOption && String(selectedOption.value) === String(opt.value);

                return (
                  <button
                    key={opt.value ?? index}
                    type="button"
                    disabled={opt.disabled}
                    onClick={() => handleSelect(opt)}
                    className={`
                      w-full px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between text-left transition-all duration-150 cursor-pointer group
                      ${opt.disabled ? 'opacity-40 cursor-not-allowed bg-transparent' : ''}
                      ${isSelected
                        ? 'bg-gradient-to-r from-teal-700 to-teal-800 text-white shadow-xs font-semibold'
                        : 'text-slate-700 hover:bg-teal-50/90 hover:text-teal-900'}
                    `}
                  >
                    <span className="truncate pr-2">{opt.label || opt.value || '—'}</span>
                    {isSelected && (
                      <span className="flex items-center justify-center w-4 h-4 rounded-full bg-white/20 ml-2 shrink-0">
                        <Check size={12} className="text-white stroke-[2.5]" />
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

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

