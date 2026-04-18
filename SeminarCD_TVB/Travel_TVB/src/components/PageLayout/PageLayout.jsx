// src/components/PageLayout/PageLayout.jsx

import React from 'react';
import { motion } from 'framer-motion';

// This simple variant just fades the page in.
// This is all we need to fix the race condition.
const pageVariants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.5, // You can adjust this duration
      ease: "easeOut"
    }
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.3, // A faster exit
      ease: "easeIn"
    }
  }
};

const PageLayout = ({ children }) => {
  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      {children}
    </motion.div>
  );
};

export default PageLayout;