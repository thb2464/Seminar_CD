// src/pages/News/News.jsx

import React from 'react';
import { motion } from 'framer-motion';
import CommunityHeader from '../../components/CommunityHeader/CommunityHeader';
import CommunityPostArchive from '../../components/CommunityPostArchive/CommunityPostArchive';

// Assuming other components might be added later
// import NewsGrid from '../../components/NewsGrid/NewsGrid'; 
// import Pagination from '../../components/Pagination/Pagination';

// Animation variants for the header
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

const Community = () => {
  return (
    <div className="news-page">
      {/* NewsHeader animates on page load */}
      <motion.div
        variants={pageVariants}
        initial="hidden"
        animate="visible"
      >
        <CommunityHeader />
        <CommunityPostArchive />
      </motion.div>
    </div>
  );
};

export default Community;