import React, { useEffect, useState } from 'react';
import { motion, useSpring } from 'framer-motion';

export default function CustomCursor() {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [isHovering, setIsHovering] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    const springConfig = { damping: 25, stiffness: 200 };
    const cursorX = useSpring(0, springConfig);
    const cursorY = useSpring(0, springConfig);

    useEffect(() => {
        const handleMouseMove = (e) => {
            setMousePosition({ x: e.clientX, y: e.clientY });
            cursorX.set(e.clientX - 20);
            cursorY.set(e.clientY - 20);
            if (!isVisible) setIsVisible(true);
        };

        const handleMouseOver = (e) => {
            if (
                e.target.tagName === 'BUTTON' || 
                e.target.tagName === 'A' || 
                e.target.tagName === 'INPUT' ||
                e.target.closest('button') ||
                e.target.closest('a')
            ) {
                setIsHovering(true);
            } else {
                setIsHovering(false);
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseover', handleMouseOver);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseover', handleMouseOver);
        };
    }, [isVisible]);

    if (!isVisible) return null;

    return (
        <div className="hidden lg:block pointer-events-none fixed inset-0 z-[9999]">
            {/* Main Dot */}
            <motion.div
                className="cursor-dot"
                animate={{
                    x: mousePosition.x - 4,
                    y: mousePosition.y - 4,
                    scale: isHovering ? 1.5 : 1,
                    backgroundColor: isHovering ? '#ffffff' : '#00ffcc'
                }}
                transition={{ type: 'spring', damping: 30, stiffness: 300, mass: 0.5 }}
            />

            {/* Trailing Outline */}
            <motion.div
                className="cursor-outline"
                style={{
                    x: cursorX,
                    y: cursorY,
                }}
                animate={{
                    scale: isHovering ? 1.8 : 1,
                    borderColor: isHovering ? '#ffffff' : '#00ffcc',
                    opacity: isHovering ? 0.8 : 0.5
                }}
            />
        </div>
    );
}
