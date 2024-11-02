'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const highlights = [
    "Venture Partner at Contrary",
    "Currently doing AI research in the PCC Lab",
    "Studying machine learning at BYU",
    "Cofounded Sameday AI going through YC and AI Grant",
    "Recently lived in San Francisco, currently in Provo",
    "VP of the BYU's AI Association",
    "Y Combinator alum",
    "Hiked the Grand Canyon rim to rim",
    "Type in Colemak",
    "Use a split keyboard and vertical mouse",
    "Daily driver is a flip phone"
];

export default function Highlights() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isResetting, setIsResetting] = useState(false);

    const getCurrentHighlights = () => [
        highlights[currentIndex + 2],
        highlights[currentIndex + 1],
        highlights[currentIndex]
    ];

    const handleMore = async () => {
        if (currentIndex >= highlights.length - 3) {
            setIsResetting(true);
            
            // Increased timeout to allow for exit animation
            await new Promise(resolve => setTimeout(resolve, 500));
            setCurrentIndex(0);
            
            // Removed requestAnimationFrame to ensure proper timing
            setIsResetting(false);
        } else {
            setCurrentIndex(prev => prev + 1);
        }
    };

    return (
        <section className="mb-8 p-6 rounded-lg bg-gray-100/50 dark:bg-gray-800/50">
            <h2 className="text-xl font-bold mb-4">Hi, I'm Max 👋</h2>
            <div className="relative h-[144px] overflow-hidden">
                <AnimatePresence mode="sync" initial={false}>
                    {!isResetting ? (
                        <motion.div key="normal" className="relative">
                            {getCurrentHighlights().map((highlight, index) => (
                                <motion.p
                                    key={`${highlight}-${currentIndex}-${index}`}
                                    initial={{ 
                                        opacity: index === 0 ? 0 : 1,
                                        y: index === 0 ? -48 : (index - 1) * 48,  // Only new item starts from top
                                        scale: index === 0 ? 0.9 : 1
                                    }}
                                    animate={{ 
                                        opacity: 1,
                                        y: index * 48,
                                        scale: 1
                                    }}
                                    exit={{ 
                                        opacity: index === 2 ? 0 : 1,  // Bottom item fades out
                                        y: (index + 1) * 48,  // All items move down one position
                                        scale: index === 2 ? 0.9 : 1
                                    }}
                                    transition={{ 
                                        duration: 0.5,
                                        ease: [0.4, 0, 0.2, 1]
                                    }}
                                    className="text-gray-600 dark:text-gray-400 absolute w-full"
                                    style={{ 
                                        position: 'absolute',
                                        zIndex: 3 - index
                                    }}
                                >
                                    {highlight}
                                </motion.p>
                            ))}
                        </motion.div>
                    ) : (
                        <motion.div key="reset" className="relative">
                            {getCurrentHighlights().map((highlight, index) => (
                                <motion.p
                                    key={`reset-${highlight}-${index}`}
                                    initial={{ 
                                        opacity: 0,
                                        y: -48,  // Start above
                                        scale: 0.9
                                    }}
                                    animate={{ 
                                        opacity: 1,
                                        y: index * 48,  // Move to final position
                                        scale: 1
                                    }}
                                    exit={{
                                        opacity: 0,
                                        y: 48,  // Exit downward
                                        scale: 0.9,
                                        transition: { duration: 0.3 }
                                    }}
                                    transition={{ 
                                        duration: 0.5,
                                        delay: 0.3,  // Delay entrance until after exit
                                        ease: [0.4, 0, 0.2, 1]
                                    }}
                                    className="text-gray-600 dark:text-gray-400 absolute w-full"
                                >
                                    {highlight}
                                </motion.p>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            <button 
                onClick={handleMore}
                className="px-4 py-2 text-sm bg-white dark:bg-gray-800 
                    rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 
                    border border-gray-200 dark:border-gray-700
                    transition-colors duration-200
                    text-gray-700 dark:text-gray-300
                    flex items-center gap-2"
            >
                <span>{currentIndex === 0 ? 'Learn about me' : 'Keep Going'}</span>
                <svg 
                    className="w-4 h-4 text-gray-400 transform group-hover:translate-x-1 transition-transform" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
            </button>
        </section>
    );
}
