'use client';

import { useEffect, useState } from 'react';
import { motion, useAnimation } from 'framer-motion';

const Dragon = () => {
  const [mounted, setMounted] = useState(false);
  const controls = useAnimation();

  useEffect(() => {
    setMounted(true);
    
    // Wait a brief moment after mount to ensure window is available
    const timer = setTimeout(() => {
      const flyDragon = async () => {
        // Create a curved path using keyframes
        await controls.start({
          x: [
            -100, // start offscreen left
            window.innerWidth * 0.2, // first curve point
            window.innerWidth * 0.5, // middle point
            window.innerWidth * 0.8, // second curve point
            window.innerWidth + 100 // end offscreen right
          ],
          y: [
            -100, // start offscreen top
            window.innerHeight * 0.2, // curve up
            window.innerHeight * 0.3, // middle point
            window.innerHeight * 0.6, // curve down
            window.innerHeight + 100 // end offscreen bottom
          ],
          rotate: [0, -10, 0, 10, 20], // add some rotation for flying effect
          transition: {
            duration: 6,
            ease: "easeInOut",
            times: [0, 0.25, 0.5, 0.75, 1]
          }
        });
      };

      flyDragon();
    }, 500); // Small delay to ensure smooth animation

    return () => clearTimeout(timer);
  }, [controls]);

  if (!mounted) return null;

  return (
    <motion.div
      initial={{ x: -100, y: -100, rotate: 0 }}
      animate={controls}
      style={{
        position: 'fixed',
        zIndex: 40,
        pointerEvents: 'none'
      }}
    >
      <svg
        width="50"
        height="50"
        viewBox="0 0 512 512"
        fill="none"
        className="text-primary dark:text-primary-foreground"
      >
        <path
          d="M480 256c0-123.8-100.3-224-224-224S32 132.2 32 256c0 111.8 81.9 204.5 189 221.3v-147.7c-27.4 6.2-45 15.5-56.1 22.7-14.1 9.2-27.3 20.4-40.5 31.3l-9.2 7.6c-3.7 3.1-8.4 4.8-13.2 4.8H80c-8.8 0-16-7.2-16-16s7.2-16 16-16h16c.1 0 .2 0 .3-.1.4-.2.8-.5 1.2-.8l9.8-8.2c14.1-11.7 28-23.5 43.5-33.6 19.4-12.7 45.6-25 85.3-25 10.8 0 21.5.8 31.9 2.3v-47.1c-10.5-1.6-21.2-2.4-32-2.4-39.7 0-65.9 12.3-85.3 25-14.1 9.2-27.3 20.4-40.5 31.3l-9.2 7.6c-3.7 3.1-8.4 4.8-13.2 4.8H80c-8.8 0-16-7.2-16-16s7.2-16 16-16h16c.1 0 .2 0 .3-.1.4-.2.8-.5 1.2-.8l9.8-8.2c14.1-11.7 28-23.5 43.5-33.6 19.4-12.7 45.6-25 85.3-25 10.8 0 21.5.8 31.9 2.3v-47.1c-10.5-1.6-21.2-2.4-32-2.4-39.7 0-65.9 12.3-85.3 25-14.1 9.2-27.3 20.4-40.5 31.3l-9.2 7.6c-3.7 3.1-8.4 4.8-13.2 4.8H80c-8.8 0-16-7.2-16-16s7.2-16 16-16h16c.1 0 .2 0 .3-.1.4-.2.8-.5 1.2-.8l9.8-8.2c14.1-11.7 28-23.5 43.5-33.6C169.2 108.3 195.4 96 235 96c124.1 0 224 100.3 224 224 0 123.8-100.3 224-224 224S32 379.8 32 256"
          fill="currentColor"
        />
      </svg>
    </motion.div>
  );
};

export default Dragon; 