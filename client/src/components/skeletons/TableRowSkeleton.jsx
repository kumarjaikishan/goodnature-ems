import React from 'react';

export const TableRowSkeleton = ({ rows = 8, _columns = 7 }) => {
    return (
        <div className="w-full bg-white divide-y divide-slate-100 animate-pulse">
            {Array.from({ length: rows }).map((_, rIdx) => (
                <div key={rIdx} className="px-4 py-4 flex items-center justify-between gap-4">
                    {/* Column 1: Avatar + Name / ID */}
                    <div className="flex items-center gap-3 w-[22%]">
                        <div className="w-9 h-9 rounded-full bg-slate-200 shrink-0" />
                        <div className="space-y-1.5 flex-1">
                            <div className="w-28 h-4 bg-slate-200 rounded" />
                            <div className="w-16 h-3 bg-slate-100 rounded" />
                        </div>
                    </div>
                    {/* Column 2: Date / Subtext */}
                    <div className="w-[15%] space-y-1.5">
                        <div className="w-24 h-4 bg-slate-200 rounded" />
                        <div className="w-16 h-3 bg-slate-100 rounded" />
                    </div>
                    {/* Column 3: Punch In */}
                    <div className="w-[12%]">
                        <div className="w-20 h-5 bg-slate-200 rounded-md" />
                    </div>
                    {/* Column 4: Punch Out */}
                    <div className="w-[12%]">
                        <div className="w-20 h-5 bg-slate-200 rounded-md" />
                    </div>
                    {/* Column 5: Status Badge */}
                    <div className="w-[14%]">
                        <div className="w-20 h-6 bg-slate-200 rounded-full" />
                    </div>
                    {/* Column 6: Working Hours */}
                    <div className="w-[12%]">
                        <div className="w-16 h-4 bg-slate-200 rounded" />
                    </div>
                    {/* Column 7: Action Buttons */}
                    <div className="flex justify-end gap-2 w-[13%]">
                        <div className="w-7 h-7 rounded-lg bg-slate-200" />
                        <div className="w-7 h-7 rounded-lg bg-slate-200" />
                    </div>
                </div>
            ))}
        </div>
    );
};

export default TableRowSkeleton;
