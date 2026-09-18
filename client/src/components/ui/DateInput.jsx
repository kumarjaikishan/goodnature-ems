import React, { forwardRef, useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, RotateCcw } from 'lucide-react';
import dayjs from 'dayjs';

/**
 * Custom Tailwind Date Picker Component matching the modern card design:
 * - Rendered via React Portal directly into document.body to prevent parent modal/container scrolling
 * - Smart viewport collision detection (opens above or below based on available space)
 * - Clean calendar popover with header year/month arrows
 * - Quick 'Yesterday', 'Today' shortcut pills
 * - Formatted date display (e.g. "07 Sep, 2026")
 * - 100% compatible with existing standard onChange(e) / value props
 */
export const DateInput = forwardRef(({
  label,
  value,
  onChange,
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
  align = 'left', // 'left' | 'right'
  placeholder = 'Select date',
  ...props
}, ref) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  const triggerRef = useRef(null);
  const popoverRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, openAbove: false });

  // Parse current value
  const parsedValue = value ? dayjs(value) : null;
  const isValidDate = parsedValue && parsedValue.isValid();

  // Current calendar view month/year
  const [viewDate, setViewDate] = useState(() => (isValidDate ? parsedValue : dayjs()));

  // Calculate coordinates relative to viewport
  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const popoverWidth = 285;
    const popoverHeight = 315;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    // Determine if it should open above or below
    const shouldOpenAbove = spaceBelow < popoverHeight + 10 && spaceAbove > spaceBelow;

    let top = shouldOpenAbove ? rect.top - popoverHeight - 6 : rect.bottom + 6;

    // Determine horizontal placement
    let left = align === 'right' ? rect.right - popoverWidth : rect.left;

    // Horizontal viewport boundaries
    if (left + popoverWidth > window.innerWidth - 10) {
      left = window.innerWidth - popoverWidth - 10;
    }
    if (left < 10) {
      left = 10;
    }

    setCoords({
      top: Math.max(10, top),
      left: Math.max(10, left),
      openAbove: shouldOpenAbove,
    });
  }, [align]);

  // Sync viewDate and position when opened
  useEffect(() => {
    if (isOpen) {
      if (isValidDate) {
        setViewDate(parsedValue);
      }
      updatePosition();
    }
  }, [isOpen, isValidDate, updatePosition]);

  // Click outside and escape listeners
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target) &&
        popoverRef.current && !popoverRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    const handleScrollOrResize = () => {
      updatePosition();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isOpen, updatePosition]);

  const handleSelectDate = (dateObj) => {
    const formatted = dateObj.format('YYYY-MM-DD');
    if (onChange) {
      onChange({ target: { value: formatted, name: props.name || inputId } });
    }
    setIsOpen(false);
  };

  const handleToday = () => {
    handleSelectDate(dayjs());
  };

  const handleYesterday = () => {
    handleSelectDate(dayjs().subtract(1, 'day'));
  };

  // Calendar grid math
  const startOfMonth = viewDate.startOf('month');
  const daysInMonth = viewDate.daysInMonth();
  const startDayOfWeek = startOfMonth.day(); // 0 = Sunday, 1 = Monday ...

  // Preceding month filler days
  const prevMonth = viewDate.subtract(1, 'month');
  const prevMonthDays = prevMonth.daysInMonth();
  const prevDays = [];
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    prevDays.push({
      day: prevMonthDays - i,
      date: prevMonth.date(prevMonthDays - i),
      isCurrentMonth: false,
    });
  }

  // Current month days
  const currentDays = [];
  for (let d = 1; d <= daysInMonth; d++) {
    currentDays.push({
      day: d,
      date: viewDate.date(d),
      isCurrentMonth: true,
    });
  }

  // Trailing next month filler days to complete 42 slots (6 weeks) or 35 slots
  const totalSlots = (prevDays.length + currentDays.length) <= 35 ? 35 : 42;
  const nextDaysCount = totalSlots - (prevDays.length + currentDays.length);
  const nextMonth = viewDate.add(1, 'month');
  const nextDays = [];
  for (let d = 1; d <= nextDaysCount; d++) {
    nextDays.push({
      day: d,
      date: nextMonth.date(d),
      isCurrentMonth: false,
    });
  }

  const allCalendarDays = [...prevDays, ...currentDays, ...nextDays];

  const sizeClasses = {
    sm: 'py-1.5 text-xs px-2.5',
    md: 'py-2 text-sm px-3.5',
    lg: 'py-2.5 text-base px-4',
  };

  const daysHeader = [
    { label: 'Su', isWeekend: true },
    { label: 'Mo' },
    { label: 'Tu' },
    { label: 'We' },
    { label: 'Th' },
    { label: 'Fr' },
    { label: 'Sa', isWeekend: true },
  ];

  return (
    <div className={`relative flex flex-col gap-1 w-full ${containerClassName}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label
            htmlFor={inputId}
            className="text-xs font-semibold text-slate-700 tracking-wide flex items-center gap-1"
          >
            {label}
            {required && <span className="text-rose-500 font-bold">*</span>}
          </label>
          {isValidDate && (
            <span className="text-[10px] font-mono text-teal-700/80">
              {parsedValue.format('YYYY-MM-DD')}
            </span>
          )}
        </div>
      )}

      {/* Interactive Trigger Button Styled as an Input */}
      <button
        ref={(node) => {
          triggerRef.current = node;
          if (typeof ref === 'function') ref(node);
          else if (ref) ref.current = node;
        }}
        id={inputId}
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            updatePosition();
            setIsOpen(!isOpen);
          }
        }}
        className={`
          w-full rounded-lg border bg-white text-slate-800 transition-all duration-150 outline-none
          flex items-center justify-between text-left cursor-pointer
          ${sizeClasses[size] || sizeClasses.md}
          ${error
            ? 'border-rose-400 focus:border-rose-500 ring-2 ring-rose-100 bg-rose-50/20 text-rose-900'
            : isOpen
            ? 'border-teal-600 ring-2 ring-teal-100 shadow-sm'
            : 'border-slate-300 hover:border-slate-400 focus:border-teal-600 shadow-xs'}
          ${disabled ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200' : ''}
          ${className}
        `}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <Calendar size={16} className={isOpen ? 'text-teal-700 shrink-0' : 'text-slate-400 shrink-0'} />
          <span className={`truncate font-medium ${isValidDate ? 'text-slate-900' : 'text-slate-400'}`}>
            {isValidDate ? parsedValue.format('DD MMM, YYYY') : placeholder}
          </span>
        </div>
      </button>

      {/* Portal Calendar Popover rendered on body to float over modals without scrollbars */}
      {isOpen && typeof document !== 'undefined' && createPortal(
        <div
          ref={popoverRef}
          style={{
            position: 'fixed',
            top: `${coords.top}px`,
            left: `${coords.left}px`,
            zIndex: 99999,
          }}
          className="w-[285px] bg-white rounded-2xl shadow-2xl border border-slate-200/90 p-3 animate-in fade-in zoom-in-95 duration-150 select-none"
        >
          {/* Header Month / Year Navigation */}
          <div className="flex items-center justify-between pb-2 mb-1.5 border-b border-slate-100">
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                title="Previous Year"
                onClick={() => setViewDate(viewDate.subtract(1, 'year'))}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <ChevronsLeft size={15} />
              </button>
              <button
                type="button"
                title="Previous Month"
                onClick={() => setViewDate(viewDate.subtract(1, 'month'))}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <ChevronLeft size={15} />
              </button>
            </div>

            <span className="text-xs font-bold text-slate-800 tracking-tight">
              {viewDate.format('MMMM YYYY')}
            </span>

            <div className="flex items-center gap-0.5">
              <button
                type="button"
                title="Next Month"
                onClick={() => setViewDate(viewDate.add(1, 'month'))}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <ChevronRight size={15} />
              </button>
              <button
                type="button"
                title="Next Year"
                onClick={() => setViewDate(viewDate.add(1, 'year'))}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <ChevronsRight size={15} />
              </button>
            </div>
          </div>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 gap-0.5 text-center mb-1">
            {daysHeader.map((d, i) => (
              <span
                key={i}
                className={`text-[10px] font-bold py-0.5 ${
                  d.isWeekend ? 'text-rose-500' : 'text-slate-500'
                }`}
              >
                {d.label}
              </span>
            ))}
          </div>

          {/* Day Numbers Grid */}
          <div className="grid grid-cols-7 gap-0.5 text-center">
            {allCalendarDays.map((item, idx) => {
              const isSelected =
                isValidDate &&
                item.date.isSame(parsedValue, 'day');
              const isToday = item.date.isSame(dayjs(), 'day');

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectDate(item.date)}
                  className={`
                    h-7 w-7 mx-auto flex items-center justify-center text-[11px] font-semibold rounded-full transition-all cursor-pointer
                    ${
                      isSelected
                        ? 'bg-teal-700 text-white shadow-md font-bold scale-105 ring-2 ring-teal-200'
                        : item.isCurrentMonth
                        ? isToday
                          ? 'border border-teal-600 text-teal-800 font-bold bg-teal-50 hover:bg-teal-100'
                          : 'text-slate-700 hover:bg-teal-50 hover:text-teal-900'
                        : 'text-slate-300 hover:bg-slate-50 hover:text-slate-400 font-normal'
                    }
                  `}
                >
                  {item.day}
                </button>
              );
            })}
          </div>

          {/* Footer with Shortcuts */}
          <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleYesterday}
                className="px-2 py-0.5 rounded-md text-[10px] font-semibold text-slate-600 hover:bg-teal-50 hover:text-teal-800 transition-colors cursor-pointer flex items-center gap-1"
              >
                <RotateCcw size={10} className="text-slate-400" />
                Yesterday
              </button>
              <button
                type="button"
                onClick={handleToday}
                className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200 hover:bg-teal-700 hover:text-white transition-all cursor-pointer shadow-2xs"
              >
                Today
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-[10px] font-semibold text-slate-400 hover:text-slate-700 px-1.5 py-0.5 rounded-md transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>,
        document.body
      )}

      {(error || helperText) && (
        <p className={`text-xs ${error ? 'text-rose-500 font-medium' : 'text-slate-500'} mt-0.5`}>
          {error || helperText}
        </p>
      )}
    </div>
  );
});

DateInput.displayName = 'DateInput';
export default DateInput;

