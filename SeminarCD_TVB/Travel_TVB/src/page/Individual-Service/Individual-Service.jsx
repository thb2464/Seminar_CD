// page/Individual-Service/Individual-Service.jsx
import React from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion'; // 1. Import motion
import CoreValues from '../../components/CoreValues/CoreValues';
import ServiceContent from '../../components/ServiceContent/ServiceContent';
import AnimateOnScroll from '../../components/AnimateOnScroll/AnimateOnScroll.jsx'; // 2. Import AnimateOnScroll
import './Individual.css';

const IndividualService = () => {
  const { slug } = useParams();

  // 3. Define a page-load variant for the main content
  const contentVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" }
    }
  };

  return (
    <div className="individual-service-page">
      {/* 4. Wrap the main content in a page-load animation */}
      <motion.div
        variants={contentVariants}
        initial="hidden"
        animate="visible"
      >
        <ServiceContent slug={slug} />
      </motion.div>
      
      {/* 5. Wrap the secondary content in a scroll animation */}
      <AnimateOnScroll direction="fromBottom" delay={0.4}>
        <CoreValues />
      </AnimateOnScroll>
    </div>
  );
};

export default IndividualService;