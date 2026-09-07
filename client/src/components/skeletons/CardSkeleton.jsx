import React from 'react';

export const CardSkeleton = ({ height = 120 }) => {
    return (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm animate-pulse flex flex-col justify-between" style={{ minHeight: height }}>
            <div className="flex justify-between items-center mb-3">
                <div className="w-3/5 h-5 bg-slate-200 rounded" />
                <div className="w-8 h-8 rounded-full bg-slate-200" />
            </div>
            <div className="w-2/5 h-8 bg-slate-200 rounded-lg mb-1" />
            <div className="w-3/4 h-3.5 bg-slate-200 rounded" />
        </div>
    );
};

export default CardSkeleton;
