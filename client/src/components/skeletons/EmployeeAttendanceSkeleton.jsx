import React from 'react';
import { Skeleton } from '@mui/material';

export const EmployeeAttendanceSkeleton = ({ count = 15 }) => {
    return (
        <div className="px-1 md:px-3 grid grid-cols-5 md:grid-cols-10 lg:grid-cols-13 gap-2 md:gap-4 animate-pulse">
            {Array.from({ length: count }).map((_, index) => (
                <div key={index} className="flex flex-col items-center gap-1 py-1">
                    {/* Circle Avatar Skeleton */}
                    <div className="p-[2px] border-2 border-slate-200 rounded-full">
                        <Skeleton
                            variant="circular"
                            width={46}
                            height={46}
                            animation="wave"
                            sx={{ bgcolor: 'grey.200' }}
                        />
                    </div>
                    {/* Name Text Skeleton */}
                    <Skeleton
                        variant="text"
                        width={55}
                        height={16}
                        animation="wave"
                        sx={{ bgcolor: 'grey.200', borderRadius: '4px' }}
                    />
                </div>
            ))}
        </div>
    );
};

export default EmployeeAttendanceSkeleton;
