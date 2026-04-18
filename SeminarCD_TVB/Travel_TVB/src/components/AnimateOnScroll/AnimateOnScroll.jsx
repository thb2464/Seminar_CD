// components/AnimateOnScroll/AnimateOnScroll.jsx
import React from 'react';
import { motion } from 'framer-motion';

const AnimateOnScroll = ({ children, direction = 'fromBottom', className, delay = 0.2 }) => {
    
    // 1. Define variants *inside* the component to access the `delay` prop
    const animationVariants = {
        fromLeft: {
            hidden: { opacity: 0, x: -80, scale: 0.95 },
            visible: {
                opacity: 1,
                x: 0,
                scale: 1,
                transition: { 
                    duration: 1.5, 
                    ease: [0.22, 1, 0.36, 1], 
                    delay: delay // <-- Use the delay prop
                }
            }
        },
        fromRight: {
            hidden: { opacity: 0, x: 80, scale: 0.95 },
            visible: {
                opacity: 1,
                x: 0,
                scale: 1,
                transition: { 
                    duration: 1.5, 
                    ease: [0.22, 1, 0.36, 1], 
                    delay: delay // <-- Use the delay prop
                }
            }
        },
        fromBottom: {
            hidden: { opacity: 0, y: 60, scale: 0.95 },
            visible: {
                opacity: 1,
                y: 0,
                scale: 1,
                transition: { 
                    duration: 1.5, 
                    ease: [0.25, 0.46, 0.45, 0.94], 
                    delay: delay // <-- Use the delay prop
                }
            }
        }
    };

    return (
        <motion.div
            className={className}
            variants={animationVariants[direction]} // 2. Use the dynamic variants
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-10%" }}
            
            // Your custom class logic remains unchanged
            onViewportEnter={(entry) => {
                entry.target.classList.add('is-visible');
            }}
        >
            {children}
        </motion.div>
    );
};

export default AnimateOnScroll;