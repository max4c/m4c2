'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const highlights = [
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
        <section className="mb-8">
            <h2 className="text-xl font-bold mb-4">Highlights</h2>
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
            className="text-sm px-3 py-1 rounded-full border border-gray-300 dark:border-gray-600 
              hover:border-gray-400 dark:hover:border-gray-500 
              text-blue-600 dark:text-yellow-500 hover:text-orange-500 dark:hover:text-orange-500
              transition-all duration-200"
        >
            {currentIndex === 0 ? 'More' : 'Keep Going'}
        </button>
        </section>
    );
}
