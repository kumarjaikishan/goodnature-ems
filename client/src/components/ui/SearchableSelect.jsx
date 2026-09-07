import React, { useState, useRef, useEffect, forwardRef, useMemo } from 'react';
import { ChevronDown, Search, X, Check } from 'lucide-react';

/**
 * SearchableSelect / Combobox Component
 * Beautiful, lightweight, accessible searchable dropdown with full keyboard navigation and clear options.
 *
 * Props:
 * - label: string
 * - value: string | number
 * - onChange: (value: string | number, selectedOption?: object) => void
 * - options: Array<{ label: string, value: string | number, subtitle?: string, disabled?: boolean }> or Array<string>
 * - placeholder: string
 * - searchPlaceholder: string
 * - disabled: boolean
 * - required: boolean
 * - error: string | boolean
 * - helperText: string
 * - allowClear: boolean
 * - size: 'sm' | 'md' | 'lg'
 */
export const SearchableSelect = forwardRef(({
  label,
  value,
  onChange,
  options = [],
  placeholder = 'Select option...',
  searchPlaceholder = 'Search...',
  className = '',
  containerClassName = '',
  disabled = false,
  required = false,
  error,
  helperText,
  allowClear = true,
  size = 'md',
  id,
  renderOption,
  ...props
}, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef(null);
  const searchInputRef = useRef(null);
  const optionsListRef = useRef(null);

  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  // Normalize options array
  const normalizedOptions = useMemo(() => {
    return options.map((opt) => {
      if (typeof opt === 'object' && opt !== null) {
        return {
          value: opt.value,
          label: String(opt.label ?? opt.name ?? opt.value ?? ''),
          subtitle: opt.subtitle,
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
  }, [options]);

  // Selected option lookup
  const selectedOption = useMemo(() => {
    return normalizedOptions.find((opt) => String(opt.value) === String(value));
  }, [normalizedOptions, value]);

  // Filtered options based on search string
  const filteredOptions = useMemo(() => {
    if (!search.trim()) return normalizedOptions;
    const q = search.toLowerCase().trim();
    return normalizedOptions.filter((opt) =>
      opt.label.toLowerCase().includes(q) ||
      (opt.subtitle && opt.subtitle.toLowerCase().includes(q))
    );
  }, [normalizedOptions, search]);

  // Handle outside clicks to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setHighlightedIndex(0);
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearch('');
    }
  }, [isOpen]);

  // Select an option
  const handleSelect = (opt) => {
    if (opt.disabled) return;
    if (onChange) {
      onChange(opt.value, opt.raw);
    }
    setIsOpen(false);
    setSearch('');
  };

  // Clear current selection
  const handleClear = (e) => {
    e.stopPropagation();
    if (onChange) {
      onChange('', null);
    }
  };

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredOptions[highlightedIndex]) {
          handleSelect(filteredOptions[highlightedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSearch('');
        break;
      default:
        break;
    }
  };

  const sizeClasses = {
    sm: 'min-h-[30px] py-1 text-xs px-2.5',
    md: 'min-h-[36px] py-1.5 text-sm px-3',
    lg: 'min-h-[42px] py-2 text-base px-3.5',
  };

  return (
    <div
      ref={containerRef}
      className={`flex flex-col gap-1 w-full relative ${containerClassName}`}
      onKeyDown={handleKeyDown}
    >
      {label && (
        <label
          htmlFor={selectId}
          className="text-xs font-semibold text-slate-700 tracking-wide flex items-center gap-1 select-none"
        >
          {label}
          {required && <span className="text-red-500 font-bold">*</span>}
        </label>
      )}

      {/* Combobox Trigger Button */}
      <div
        ref={ref}
        id={selectId}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        tabIndex={disabled ? -1 : 0}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={`
          relative flex items-center justify-between w-full rounded-lg border bg-white text-slate-800 transition-all duration-150 outline-none select-none
          ${sizeClasses[size] || sizeClasses.md}
          ${error
            ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100 bg-red-50/20 text-red-900'
            : isOpen
            ? 'border-teal-600 ring-2 ring-teal-100/80 shadow-xs'
            : 'border-slate-300 hover:border-slate-400'}
          ${disabled ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200' : 'cursor-pointer shadow-xs'}
          ${className}
        `}
        {...props}
      >
        <span className={`truncate flex-1 pr-2 ${!selectedOption ? 'text-slate-400' : 'text-slate-800 font-medium'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>

        <div className="flex items-center gap-1 ml-auto text-slate-400">
          {allowClear && selectedOption && !disabled && (
            <button
              type="button"
              tabIndex={-1}
              onClick={handleClear}
              className="p-0.5 rounded-full hover:bg-slate-100 hover:text-slate-600 transition-colors"
              title="Clear selection"
            >
              <X size={13} />
            </button>
          )}
          <ChevronDown
            size={15}
            className={`transition-transform duration-200 text-slate-400 ${isOpen ? 'rotate-180 text-teal-600' : ''}`}
          />
        </div>
      </div>

      {/* Floating Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 w-full bg-white rounded-xl border border-slate-200 shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100 flex flex-col">
          {/* Search Box Input */}
          <div className="p-2 border-b border-slate-100 bg-slate-50/60 relative flex items-center">
            <Search size={13} className="absolute left-4 text-slate-400 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setHighlightedIndex(0);
              }}
              placeholder={searchPlaceholder}
              className="w-full pl-7 pr-7 py-1 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-4 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Options List */}
          <div
            ref={optionsListRef}
            role="listbox"
            className="max-h-56 overflow-y-auto p-1 space-y-0.5 scrollbar-thin"
          >
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-slate-400">
                No matching options found
              </div>
            ) : (
              filteredOptions.map((opt, index) => {
                const isSelected = selectedOption && String(selectedOption.value) === String(opt.value);
                const isHighlighted = index === highlightedIndex;

                return (
                  <div
                    key={opt.value ?? index}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(opt)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`
                      px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between cursor-pointer transition-colors
                      ${opt.disabled ? 'opacity-40 cursor-not-allowed bg-transparent' : ''}
                      ${isSelected ? 'bg-teal-700 text-white font-semibold' : isHighlighted ? 'bg-teal-50 text-teal-900' : 'text-slate-700 hover:bg-slate-50'}
                    `}
                  >
                    <div className="flex flex-col truncate pr-2">
                      {renderOption ? (
                        renderOption(opt.raw, isSelected)
                      ) : (
                        <>
                          <span className="truncate">{opt.label}</span>
                          {opt.subtitle && (
                            <span className={`text-[10px] truncate ${isSelected ? 'text-teal-100' : 'text-slate-400'}`}>
                              {opt.subtitle}
                            </span>
                          )}
                        </>
                      )}
                    </div>

                    {isSelected && (
                      <Check size={14} className="shrink-0 text-white ml-2" />
                    )}
                  </div>
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

SearchableSelect.displayName = 'SearchableSelect';
export default SearchableSelect;
