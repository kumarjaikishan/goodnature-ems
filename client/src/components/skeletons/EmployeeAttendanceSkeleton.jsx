import React from 'react';

export const EmployeeAttendanceSkeleton = ({ count = 15 }) => {
    return (
        <div className="px-1 md:px-3 grid grid-cols-5 md:grid-cols-10 lg:grid-cols-12 gap-2 md:gap-4 animate-pulse">
            {Array.from({ length: count }).map((_, index) => (
                <div key={index} className="flex flex-col items-center gap-1.5 py-1">
                    {/* Circle Avatar Skeleton */}
                    <div className="p-[2px] border-2 border-slate-200 rounded-full">
                        <div className="w-10 h-10 rounded-full bg-slate-200" />
                    </div>
                    {/* Name Text Skeleton */}
                    <div className="w-12 h-3 bg-slate-200 rounded" />
                </div>
            ))}
        </div>
    );
};

export default EmployeeAttendanceSkeleton;
