import React from 'react';

export const TableRowSkeleton = ({ rows = 8, columns = 7 }) => {
    return (
        <div className="w-full bg-white rounded-xl border border-slate-200 overflow-hidden animate-pulse shadow-xs">
            {/* Table Header Skeleton */}
            <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 flex items-center justify-between gap-4">
                {Array.from({ length: columns }).map((_, idx) => (
                    <div
                        key={idx}
                        className="h-4 bg-slate-300 rounded"
                        style={{ width: idx === 0 ? "15%" : idx === 1 ? "20%" : "10%" }}
                    />
                ))}
            </div>

            {/* Table Body Rows Skeleton */}
            <div className="divide-y divide-slate-100">
                {Array.from({ length: rows }).map((_, rIdx) => (
                    <div key={rIdx} className="px-4 py-3.5 flex items-center justify-between gap-4 hover:bg-slate-50">
                        {/* Column 1: Avatar + Name */}
                        <div className="flex items-center gap-2.5 w-[22%]">
                            <div className="w-8 h-8 rounded-full bg-slate-200 shrink-0" />
                            <div className="w-24 h-3.5 bg-slate-200 rounded" />
                        </div>
                        {/* Column 2: Date */}
                        <div className="w-[15%]">
                            <div className="w-20 h-3.5 bg-slate-200 rounded" />
                        </div>
                        {/* Column 3: Punch In */}
                        <div className="w-[12%]">
                            <div className="w-16 h-3.5 bg-slate-200 rounded" />
                        </div>
                        {/* Column 4: Punch Out */}
                        <div className="w-[12%]">
                            <div className="w-16 h-3.5 bg-slate-200 rounded" />
                        </div>
                        {/* Column 5: Status Badge */}
                        <div className="w-[14%]">
                            <div className="w-16 h-6 bg-slate-200 rounded-full" />
                        </div>
                        {/* Column 6: Working Hours */}
                        <div className="w-[12%]">
                            <div className="w-14 h-3.5 bg-slate-200 rounded" />
                        </div>
                        {/* Column 7: Action Buttons */}
                        <div className="flex justify-end gap-2 w-[13%]">
                            <div className="w-6 h-6 rounded-full bg-slate-200" />
                            <div className="w-6 h-6 rounded-full bg-slate-200" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TableRowSkeleton;
