import React from 'react';

const OrganizationLayout = ({ children, title }) => {
    return (
        <div className="w-full flex h-screen overflow-hidden flex-col md:flex-row gap-4 p-1 md:p-6 bg-gray-50">
            <div className="flex-1 space-y-6 overflow-y-auto pb-10 scrollbar-hide">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
                </div>
                {children}
            </div>
        </div>
    );
};

export default OrganizationLayout;
