import React, { useState, useRef, useEffect, forwardRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
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
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, openAbove: false });

  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);
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

  // Viewport collision positioning
  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const dropdownHeight = dropdownRef.current ? dropdownRef.current.offsetHeight : 250;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    const shouldOpenAbove = spaceBelow < dropdownHeight + 12 && spaceAbove > spaceBelow;

    const top = shouldOpenAbove
      ? Math.max(10, rect.top - dropdownHeight - 6)
      : Math.min(window.innerHeight - 30, rect.bottom + 6);

    const left = Math.max(10, Math.min(rect.left, window.innerWidth - rect.width - 10));

    setCoords({
      top,
      left,
      width: rect.width,
      openAbove: shouldOpenAbove,
    });
  }, []);

  // Handle outside clicks, ESC, and scroll/resize
  useEffect(() => {
    if (isOpen) {
      updatePosition();
      setHighlightedIndex(0);
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);

      const handleClickOutside = (e) => {
        const clickedTrigger = triggerRef.current && triggerRef.current.contains(e.target);
        const clickedDropdown = dropdownRef.current && dropdownRef.current.contains(e.target);
        if (!clickedTrigger && !clickedDropdown) {
          setIsOpen(false);
          setSearch('');
        }
      };

      const handleScrollOrResize = (e) => {
        if (dropdownRef.current && dropdownRef.current.contains(e.target)) return;
        updatePosition();
      };

      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('scroll', handleScrollOrResize, true);
      window.addEventListener('resize', handleScrollOrResize);

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        window.removeEventListener('scroll', handleScrollOrResize, true);
        window.removeEventListener('resize', handleScrollOrResize);
      };
    } else {
      setSearch('');
    }
  }, [isOpen, updatePosition]);

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
    sm: 'h-8 text-xs px-2.5',
    md: 'h-9 text-sm px-3',
    lg: 'h-10 text-base px-3.5',
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
        ref={(node) => {
          triggerRef.current = node;
          if (typeof ref === 'function') ref(node);
          else if (ref) ref.current = node;
        }}
        id={selectId}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        tabIndex={disabled ? -1 : 0}
        onClick={() => {
          if (!disabled) {
            updatePosition();
            setIsOpen((prev) => !prev);
          }
        }}
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

      {/* Floating Dropdown Menu rendered via Portal to prevent modal clipping */}
      {isOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: 'fixed',
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              width: `${coords.width}px`,
              zIndex: 99999,
            }}
            className="min-w-[160px] bg-white rounded-xl border border-slate-200 shadow-2xl overflow-hidden ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-100 flex flex-col backdrop-blur-sm"
          >
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
          </div>,
          document.body
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
