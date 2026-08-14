import React from 'react';
import { Skeleton } from '@mui/material';

export const CardSkeleton = ({ height = 120 }) => {
    return (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm animate-pulse flex flex-col justify-between" style={{ minHeight: height }}>
            <div className="flex justify-between items-center mb-3">
                <Skeleton variant="text" width="60%" height={20} animation="wave" />
                <Skeleton variant="circular" width={32} height={32} animation="wave" />
            </div>
            <Skeleton variant="rectangular" width="40%" height={32} animation="wave" className="rounded-lg mb-1" />
            <Skeleton variant="text" width="75%" height={14} animation="wave" />
        </div>
    );
};

export default CardSkeleton;
