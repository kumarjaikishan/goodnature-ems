import React from 'react';
import { GoGear } from 'react-icons/go';
import { motion } from 'framer-motion';

const ContentLoader = () => {
    return (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] w-full transition-all duration-500 animate-in fade-in">
            <div className="relative flex items-center justify-center">
                {/* Background soft glow */}
                <div className="absolute inset-0 bg-teal-500/10 blur-3xl rounded-full scale-150 animate-pulse"></div>
                
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                        repeat: Infinity,
                        duration: 3,
                        ease: "linear"
                    }}
                    className="relative z-10"
                >
                    <GoGear
                        className="text-teal-600 drop-shadow-lg"
                        size={60}
                    />
                </motion.div>
                
                <motion.div
                    animate={{ rotate: -360 }}
                    transition={{
                        repeat: Infinity,
                        duration: 2,
                        ease: "linear"
                    }}
                    className="absolute -bottom-2 -right-2 z-20"
                >
                    <GoGear
                        className="text-teal-400 drop-shadow-md"
                        size={25}
                    />
                </motion.div>
            </div>
            
            <motion.div 
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-8 flex flex-col items-center"
            >
                <p className="text-teal-700 font-semibold tracking-wide text-sm uppercase opacity-80">
                    Loading Content
                </p>
                <div className="mt-2 flex gap-1">
                    {[0, 1, 2].map((i) => (
                        <motion.div
                            key={i}
                            animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                            transition={{
                                repeat: Infinity,
                                duration: 1,
                                delay: i * 0.2
                            }}
                            className="w-1.5 h-1.5 bg-teal-500 rounded-full"
                        />
                    ))}
                </div>
            </motion.div>
        </div>
    );
};

export default ContentLoader;
