// src/pages/News/News.jsx

import React from 'react';
import { motion } from 'framer-motion';
import NewsHeader from '../../components/NewsHeader/NewsHeader';
import NewsPostArchive from '../../components/NewsPostArchive/NewsPostArchive';



const pageVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { 
      duration: 0.8, 
      ease: "easeOut" 
    }
  }
};

const News = () => {
  return (
    <div className="news-page">
      {/* NewsHeader animates on page load */}
      <motion.div
        variants={pageVariants}
        initial="hidden"
        animate="visible"
      >
        <NewsHeader />
        <NewsPostArchive />
      </motion.div>
    </div>
  );
};

export default News;