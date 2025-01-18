'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const highlights = [
    {
        text: "Venture Partner at Contrary",
        links: [{
            url: "https://contrary.com",
            text: "Contrary"
        }]
    },
    {
        text: "Currently doing AI research in the PCC Lab",
        links: null
    },
    {
        text: "Studying machine learning at BYU",
        links: null
    },
    {
        text: "Co-founder of justbuild, the hackathon community",
        links: [{
            url: "https://justbuild.ing/",
            text: "justbuild"
        }]
    },
    {
        text: "Cofounded Sameday AI going through AI Grant and YC",
        links: [
            {
                url: "https://www.gosameday.com/",
                text: "Sameday AI"
            },
            {
                url: "https://aigrant.com/",
                text: "AI Grant"
            }
        ]
    },
    {
        text: "Recently lived in San Francisco, currently in Provo",
        links: null
    },
    {
        text: "Hiked the Grand Canyon rim to rim",
        links: null
    },
    {
        text: "Type in Colemak",
        links: [{
            url: "https://colemak.com/",
            text: "Colemak"
        }]
    },
    {
        text: "Have fun experimenting with longevity",
        links: [{
            url: "https://www.maxforsey.com/blog/longevity",
            text: "longevity"
        }]
    },
    {
        text: "Use a split keyboard and vertical mouse",
        links: [
            {
                url: "https://www.zsa.io/moonlander/",
                text: "split keyboard"
            },
            {
                url: "https://www.logitech.com/en-us/products/mice/lift-vertical-ergonomic-mouse.html",
                text: "vertical mouse"
            }
        ]
    },
    {
        text: "Daily driver is a flip phone",
        links: [{
            url: "https://sunbeamwireless.com/",
            text: "flip phone"
        }]
    }
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
        <div>
            <div className="relative h-[144px] overflow-hidden mt-2">
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
                                    {highlight.links ? (
                                        <>
                                            {highlight.text.split(new RegExp(highlight.links.map(link => link.text).join('|'))).map((part, i) => (
                                                <>
                                                    {part}
                                                    {highlight.links[i] && (
                                                        <a 
                                                            href={highlight.links[i].url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 underline"
                                                        >
                                                            {highlight.links[i].text}
                                                        </a>
                                                    )}
                                                </>
                                            ))}
                                        </>
                                    ) : (
                                        highlight.text
                                    )}
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
                                    {highlight.links ? (
                                        <>
                                            {highlight.text.split(new RegExp(highlight.links.map(link => link.text).join('|'))).map((part, i) => (
                                                <>
                                                    {part}
                                                    {highlight.links[i] && (
                                                        <a 
                                                            href={highlight.links[i].url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 underline"
                                                        >
                                                            {highlight.links[i].text}
                                                        </a>
                                                    )}
                                                </>
                                            ))}
                                        </>
                                    ) : (
                                        highlight.text
                                    )}
                                </motion.p>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            <button 
                onClick={handleMore}
                className="mt-1 px-4 py-2 text-sm bg-white dark:bg-transparent 
                    rounded-full hover:scale-105 hover:shadow-md
                    border border-black dark:border-white
                    transition-all duration-200 ease-in-out
                    text-black dark:text-white
                    hover:border-black dark:hover:border-white
                    flex items-center gap-2"
            >
                <span>{currentIndex === 0 ? 'Learn about me' : 'Keep Going'}</span>
                <svg 
                    className="w-4 h-4 text-black dark:text-white" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
            </button>
        </div>
    );
}
