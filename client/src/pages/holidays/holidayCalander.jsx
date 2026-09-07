import dayjs from "dayjs";
import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const HolidayCalander = ({ title = true, highlightedDates = [], weeklyOffs = [] }) => {
    const [currentMonth, setCurrentMonth] = useState(dayjs());

    const startOfMonth = currentMonth.startOf('month');
    const endOfMonth = currentMonth.endOf('month');
    const startDayOfWeek = startOfMonth.day(); // 0 is Sunday
    const totalDaysInMonth = endOfMonth.date();

    const prevMonth = () => setCurrentMonth(currentMonth.subtract(1, 'month'));
    const nextMonth = () => setCurrentMonth(currentMonth.add(1, 'month'));

    const daysArray = Array.from({ length: totalDaysInMonth }, (_, i) => i + 1);
    const blanksArray = Array.from({ length: startDayOfWeek }, (_, i) => i);

    return (
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-5 w-full max-w-md select-none">
            {title && (
                <h3 className="font-bold text-center text-base text-slate-800 mb-3 tracking-tight">
                    Holiday & Weekly Off Calendar
                </h3>
            )}

            {/* Month & Year Navigation Header */}
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
                <span className="font-bold text-slate-800 text-sm tracking-wide">
                    {currentMonth.format("MMMM YYYY")}
                </span>
                <div className="flex gap-1">
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
                    const isWeeklyOff = weeklyOffs?.includes(dateObj.day());
                    const matchedHoliday = highlightedDates?.find(d => {
                        const hDate = dayjs(d.date);
                        return hDate.isValid() &&
                            hDate.date() === dayNum &&
                            hDate.month() === currentMonth.month() &&
                            hDate.year() === currentMonth.year();
                    });

                    let cellStyle = "text-slate-700 hover:bg-slate-100";
                    let tooltip = "";

                    if (matchedHoliday) {
                        cellStyle = "bg-amber-600 text-white font-bold shadow-xs hover:bg-amber-700";
                        tooltip = matchedHoliday.name || "Holiday";
                    } else if (isWeeklyOff) {
                        cellStyle = "bg-teal-700 text-white font-bold shadow-xs hover:bg-teal-800";
                        tooltip = "Weekly Off";
                    } else if (dateObj.isSame(dayjs(), 'day')) {
                        cellStyle = "border-2 border-teal-600 font-black text-teal-800";
                        tooltip = "Today";
                    }

                    return (
                        <div
                            key={dayNum}
                            title={tooltip}
                            className={`h-9 w-9 mx-auto flex items-center justify-center rounded-full transition cursor-default ${cellStyle}`}
                        >
                            {dayNum}
                        </div>
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
            </div>
        </div>
    );
};

export default HolidayCalander;
