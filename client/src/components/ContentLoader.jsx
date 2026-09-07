import React from 'react';
import { Settings } from 'lucide-react';

const ContentLoader = () => {
    return (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] w-full transition-all duration-500 animate-in fade-in">
            <div className="relative flex items-center justify-center">
                {/* Background soft glow */}
                <div className="absolute inset-0 bg-teal-500/10 blur-3xl rounded-full scale-150 animate-pulse"></div>
                
                <div className="relative z-10 animate-spin [animation-duration:3s]">
                    <Settings
                        className="text-teal-600 drop-shadow-lg"
                        size={60}
                    />
                </div>
                
                <div className="absolute -bottom-2 -right-2 z-20 animate-spin [animation-direction:reverse] [animation-duration:2s]">
                    <Settings
                        className="text-teal-400 drop-shadow-md"
                        size={25}
                    />
                </div>
            </div>
            
            <div className="mt-8 flex flex-col items-center animate-in fade-in duration-500 delay-150">
                <p className="text-teal-700 font-semibold tracking-wide text-sm uppercase opacity-80">
                    Loading Content
                </p>
                <div className="mt-2 flex gap-1.5">
                    <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce [animation-delay:0ms]"></span>
                    <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce [animation-delay:150ms]"></span>
                    <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce [animation-delay:300ms]"></span>
                </div>
            </div>
        </div>
    );
};

export default ContentLoader;
