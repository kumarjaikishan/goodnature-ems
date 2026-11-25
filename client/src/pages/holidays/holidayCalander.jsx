import dayjs from "dayjs";
import React, { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const HolidayCalander = ({
  title = true,
  highlightedDates = [],
  weeklyOffs = [],
  showMonthlyList = false,
  onDateClick,
  onHolidayClick,
}) => {
  const [currentMonth, setCurrentMonth] = useState(dayjs());

  const startOfMonth = currentMonth.startOf("month");
  const endOfMonth = currentMonth.endOf("month");
  const startDayOfWeek = startOfMonth.day(); // 0 is Sunday
  const totalDaysInMonth = endOfMonth.date();
  const todayStr = dayjs().format("YYYY-MM-DD");

  // O(1) lookup map keyed by YYYY-MM-DD
  const holidayMap = useMemo(() => {
    const map = new Map();
    if (!Array.isArray(highlightedDates)) return map;

    highlightedDates.forEach((item) => {
      if (!item?.date) return;
      const key = typeof item.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(item.date)
        ? item.date
        : dayjs(item.date).isValid()
          ? dayjs(item.date).format("YYYY-MM-DD")
          : null;
      if (!key) return;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(item);
    });
    return map;
  }, [highlightedDates]);

  // All holidays in the currently viewed month
  const monthHolidays = useMemo(() => {
    const prefix = currentMonth.format("YYYY-MM-");
    const list = [];
    holidayMap.forEach((items, dateKey) => {
      if (dateKey.startsWith(prefix)) {
        items.forEach((item) => {
          list.push({ dateKey, ...item });
        });
      }
    });
    return list.sort((a, b) => a.dateKey.localeCompare(b.dateKey));
  }, [holidayMap, currentMonth]);

  // Year options for quick jump
  const yearOptions = useMemo(() => {
    const currentYear = dayjs().year();
    const set = new Set([currentYear - 1, currentYear, currentYear + 1, currentMonth.year()]);
    holidayMap.forEach((_, key) => {
      const y = parseInt(key.slice(0, 4), 10);
      if (!Number.isNaN(y)) set.add(y);
    });
    return Array.from(set).sort((a, b) => b - a);
  }, [holidayMap, currentMonth]);

  const prevMonth = () => setCurrentMonth((prev) => prev.subtract(1, "month"));
  const nextMonth = () => setCurrentMonth((prev) => prev.add(1, "month"));
  const goToToday = () => setCurrentMonth(dayjs());

  const daysArray = Array.from({ length: totalDaysInMonth }, (_, i) => i + 1);
  const blanksArray = Array.from({ length: startDayOfWeek }, (_, i) => i);

  const isViewingCurrentMonth = currentMonth.isSame(dayjs(), "month");

  return (
    <div
      className={`bg-white rounded-2xl shadow-xs border border-slate-200/80 p-5 w-full select-none ${
        showMonthlyList ? "grid grid-cols-1 md:grid-cols-12 gap-5" : "max-w-md"
      }`}
    >
      <div className={showMonthlyList ? "md:col-span-7" : "w-full"}>
        {title && (
          <h3 className="font-bold text-center text-base text-slate-800 mb-3 tracking-tight">
            Holiday & Weekly Off Calendar
          </h3>
        )}

        {/* Month & Year Navigation Header */}
        <div className="flex flex-wrap justify-between items-center gap-2 mb-4 pb-2.5 border-b border-slate-100">
          <div className="flex items-center gap-1.5">
            <select
              aria-label="Select month"
              value={currentMonth.month()}
              onChange={(e) => setCurrentMonth((prev) => prev.month(Number(e.target.value)))}
              className="text-xs font-bold text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 outline-none focus:border-teal-600 cursor-pointer"
            >
              {MONTHS.map((m, idx) => (
                <option key={m} value={idx}>
                  {m}
                </option>
              ))}
            </select>
            <select
              aria-label="Select year"
              value={currentMonth.year()}
              onChange={(e) => setCurrentMonth((prev) => prev.year(Number(e.target.value)))}
              className="text-xs font-bold text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 outline-none focus:border-teal-600 cursor-pointer"
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1">
            {!isViewingCurrentMonth && (
              <button
                type="button"
                onClick={goToToday}
                className="px-2 py-1 text-[11px] font-semibold rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 transition cursor-pointer mr-1"
              >
                Today
              </button>
            )}
            <button
              type="button"
              onClick={prevMonth}
              className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition cursor-pointer"
              title="Next Month"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-slate-400 mb-2">
          <span>Su</span>
          <span>Mo</span>
          <span>Tu</span>
          <span>We</span>
          <span>Th</span>
          <span>Fr</span>
          <span>Sa</span>
        </div>

        {/* Grid of days */}
        <div className="grid grid-cols-7 gap-1 text-center text-xs">
          {blanksArray.map((_, i) => (
            <div key={`blank-${i}`} className="h-9" />
          ))}

          {daysArray.map((dayNum) => {
            const dateObj = currentMonth.date(dayNum);
            const dateStr = dateObj.format("YYYY-MM-DD");
            const isWeeklyOff = weeklyOffs?.includes(dateObj.day());
            const dayHolidays = holidayMap.get(dateStr) || [];
            const hasHoliday = dayHolidays.length > 0;
            const isToday = dateStr === todayStr;

            let cellStyle = "text-slate-700 hover:bg-slate-100";
            let tooltipParts = [];

            if (hasHoliday) {
              cellStyle = "bg-amber-600 text-white font-bold shadow-xs hover:bg-amber-700";
              tooltipParts.push(dayHolidays.map((h) => h.name || "Holiday").join(", "));
            } else if (isWeeklyOff) {
              cellStyle = "bg-teal-700 text-white font-bold shadow-xs hover:bg-teal-800";
            }

            if (isWeeklyOff) {
              tooltipParts.push("Weekly Off");
            }
            if (isToday) {
              tooltipParts.push("Today");
              cellStyle += hasHoliday || isWeeklyOff
                ? " ring-2 ring-teal-500 ring-offset-1"
                : " border-2 border-teal-600 font-black text-teal-800";
            }

            const isInteractive = Boolean(
              (hasHoliday && onHolidayClick) || (!hasHoliday && onDateClick)
            );

            const handleClick = () => {
              if (hasHoliday && onHolidayClick) {
                onHolidayClick(dayHolidays[0], dateStr);
              } else if (!hasHoliday && onDateClick) {
                onDateClick(dateStr);
              }
            };

            return (
              <button
                key={dayNum}
                type="button"
                title={tooltipParts.join(" • ") || undefined}
                onClick={isInteractive ? handleClick : undefined}
                className={`relative h-9 w-9 mx-auto flex items-center justify-center rounded-full transition ${
                  isInteractive ? "cursor-pointer" : "cursor-default"
                } ${cellStyle}`}
              >
                {dayNum}
                {hasHoliday && isWeeklyOff && (
                  <span
                    className="absolute -bottom-0.5 w-1.5 h-1.5 rounded-full bg-teal-300 border border-white"
                    aria-hidden="true"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-4 mt-5 pt-3 border-t border-slate-100 text-xs font-semibold">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-teal-700"></span>
            <span className="text-slate-600">Weekly Off</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-600"></span>
            <span className="text-slate-600">Company Holiday</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full border-2 border-teal-600"></span>
            <span className="text-slate-600">Today</span>
          </div>
        </div>
      </div>

      {/* Monthly Holiday List (shown when showMonthlyList is enabled) */}
      {showMonthlyList && (
        <div className="md:col-span-5 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-5 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <CalendarDays size={14} className="text-teal-700" />
              {currentMonth.format("MMMM YYYY")}
            </h4>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {monthHolidays.length} day{monthHolidays.length !== 1 ? "s" : ""}
            </span>
          </div>

          {monthHolidays.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-6 text-slate-400">
              <p className="text-xs font-medium text-slate-500">No holidays this month</p>
              {onDateClick && (
                <p className="text-[11px] mt-1">Click any date on the calendar to add one.</p>
              )}
            </div>
          ) : (
            <ul className="space-y-2 max-h-[290px] overflow-y-auto pr-1">
              {monthHolidays.map((h, idx) => (
                <li key={`${h.dateKey}-${idx}`}>
                  <button
                    type="button"
                    onClick={() => onHolidayClick?.(h, h.dateKey)}
                    className={`w-full text-left p-2.5 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-teal-50/60 hover:border-teal-200 transition flex items-start justify-between gap-2 ${
                      onHolidayClick ? "cursor-pointer" : "cursor-default"
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate">{h.name}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {dayjs(h.dateKey, "YYYY-MM-DD").format("ddd, DD MMM")}
                      </p>
                    </div>
                    {h.type && (
                      <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                        {h.type}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {onDateClick && (
            <p className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-400">
              Tip: Click an empty date to add a holiday, or a highlighted date to edit.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default HolidayCalander;
