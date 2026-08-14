import React from 'react';
import { Skeleton } from '@mui/material';

export const TableRowSkeleton = ({ rows = 8, columns = 7 }) => {
    return (
        <div className="w-full bg-white rounded-lg border border-slate-200 overflow-hidden animate-pulse">
            {/* Table Header Skeleton */}
            <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 flex items-center justify-between gap-4">
                {Array.from({ length: columns }).map((_, idx) => (
                    <Skeleton
                        key={idx}
                        variant="text"
                        width={idx === 0 ? "15%" : idx === 1 ? "20%" : "10%"}
                        height={20}
                        animation="wave"
                        sx={{ bgcolor: 'grey.300' }}
                    />
                ))}
            </div>

            {/* Table Body Rows Skeleton */}
            <div className="divide-y divide-slate-100">
                {Array.from({ length: rows }).map((_, rIdx) => (
                    <div key={rIdx} className="px-4 py-3 flex items-center justify-between gap-4 hover:bg-slate-50">
                        {/* Column 1: Avatar + Name */}
                        <div className="flex items-center gap-2.5 w-[22%]">
                            <Skeleton variant="circular" width={32} height={32} animation="wave" sx={{ bgcolor: 'grey.200' }} />
                            <Skeleton variant="text" width="70%" height={18} animation="wave" sx={{ bgcolor: 'grey.200' }} />
                        </div>
                        {/* Column 2: Date */}
                        <div className="w-[15%]">
                            <Skeleton variant="text" width="80%" height={18} animation="wave" sx={{ bgcolor: 'grey.200' }} />
                        </div>
                        {/* Column 3: Punch In */}
                        <div className="w-[12%]">
                            <Skeleton variant="text" width="75%" height={18} animation="wave" sx={{ bgcolor: 'grey.200' }} />
                        </div>
                        {/* Column 4: Punch Out */}
                        <div className="w-[12%]">
                            <Skeleton variant="text" width="75%" height={18} animation="wave" sx={{ bgcolor: 'grey.200' }} />
                        </div>
                        {/* Column 5: Status Badge */}
                        <div className="w-[14%]">
                            <Skeleton variant="rectangular" width={70} height={24} animation="wave" sx={{ bgcolor: 'grey.200', borderRadius: '12px' }} />
                        </div>
                        {/* Column 6: Working Hours */}
                        <div className="w-[12%]">
                            <Skeleton variant="text" width="60%" height={18} animation="wave" sx={{ bgcolor: 'grey.200' }} />
                        </div>
                        {/* Column 7: Action Buttons */}
                        <div className="flex justify-end gap-2 w-[13%]">
                            <Skeleton variant="circular" width={26} height={26} animation="wave" sx={{ bgcolor: 'grey.200' }} />
                            <Skeleton variant="circular" width={26} height={26} animation="wave" sx={{ bgcolor: 'grey.200' }} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TableRowSkeleton;
