import React, { forwardRef, useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, RotateCcw } from 'lucide-react';
import dayjs from 'dayjs';

/**
 * Custom Tailwind Date Picker Component matching the modern card design:
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
  placeholder = 'Select date',
  ...props
}, ref) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  const containerRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);

  // Parse current value
  const parsedValue = value ? dayjs(value) : null;
  const isValidDate = parsedValue && parsedValue.isValid();

  // Current calendar view month/year
  const [viewDate, setViewDate] = useState(() => (isValidDate ? parsedValue : dayjs()));

  // Sync viewDate when opened
  useEffect(() => {
    if (isOpen && isValidDate) {
      setViewDate(parsedValue);
    }
  }, [isOpen]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

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
  const endOfMonth = viewDate.endOf('month');
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
    <div ref={containerRef} className={`relative flex flex-col gap-1 w-full ${containerClassName}`}>
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
        ref={ref}
        id={inputId}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`
          w-full rounded-xl border bg-white text-slate-800 transition-all duration-150 outline-none
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

      {/* Custom Popup DatePicker Modal / Card */}
      {isOpen && (
        <div
          className="absolute left-0 top-full mt-1.5 z-50 w-72 sm:w-80 bg-white rounded-2xl shadow-2xl border border-slate-200/90 p-3.5 animate-in fade-in zoom-in-95 duration-150"
          style={{ transformOrigin: 'top left' }}
        >
          {/* Header Month / Year Navigation */}
          <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-slate-100">
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                title="Previous Year"
                onClick={() => setViewDate(viewDate.subtract(1, 'year'))}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <ChevronsLeft size={16} />
              </button>
              <button
                type="button"
                title="Previous Month"
                onClick={() => setViewDate(viewDate.subtract(1, 'month'))}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <ChevronLeft size={16} />
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
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
              <button
                type="button"
                title="Next Year"
                onClick={() => setViewDate(viewDate.add(1, 'year'))}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <ChevronsRight size={16} />
              </button>
            </div>
          </div>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
            {daysHeader.map((d, i) => (
              <span
                key={i}
                className={`text-[11px] font-bold py-0.5 ${
                  d.isWeekend ? 'text-rose-500' : 'text-slate-500'
                }`}
              >
                {d.label}
              </span>
            ))}
          </div>

          {/* Day Numbers Grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
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
                    h-8 w-8 mx-auto flex items-center justify-center text-xs font-semibold rounded-full transition-all cursor-pointer
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
          <div className="flex items-center justify-between pt-3 mt-2.5 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleYesterday}
                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-600 hover:bg-teal-50 hover:text-teal-800 transition-colors cursor-pointer flex items-center gap-1"
              >
                <RotateCcw size={11} className="text-slate-400" />
                Yesterday
              </button>
              <button
                type="button"
                onClick={handleToday}
                className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-teal-50 text-teal-800 border border-teal-200 hover:bg-teal-700 hover:text-white transition-all cursor-pointer shadow-2xs"
              >
                Today
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-[11px] font-semibold text-slate-400 hover:text-slate-700 px-2 py-1 rounded-lg transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
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
