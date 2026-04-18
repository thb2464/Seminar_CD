// page/Service/Service.jsx
import React from 'react';
import { motion } from 'framer-motion';
import ServiceHero from '../../components/Service-Hero/Service-Hero';
import InsuranceType from '../../components/InsuranceType/InsuranceType';
import AnimateOnScroll from '../../components/AnimateOnScroll/AnimateOnScroll.jsx';
import MainService from '../../components/MainService/MainService.jsx';
import './Service.css';

const Service = () => {
  // 1. Variant for the Hero
  const heroVariants = {
    hidden: { opacity: 1, y: -15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut", delay: 0.1 }
    }
  };

  // 2. NEW: Variant for MainService (above the fold)
  const mainServiceVariants = {
    hidden: { opacity: 0, x: -80, scale: 0.95 },
    visible: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: { 
        duration: 0.5, 
        ease: [0.22, 1, 0.36, 1], 
        delay: 0.3 // Staggered delay after hero
      }
    }
  };

  return (
    <div className="service-page">
      {/* --- PAGE LOAD ANIMATIONS (ABOVE THE FOLD) --- */}

      {/* 1. Hero animates on page load */}
      <motion.div
        variants={heroVariants}
        initial="hidden"
        animate="visible"
      >
        <ServiceHero />
      </motion.div>

      {/* 2. MainService ALSO animates on page load */}
      <motion.div
        variants={mainServiceVariants}
        initial="hidden"
        animate="visible"
      >
        <MainService />
      </motion.div>

      {/* --- SCROLL ANIMATIONS (BELOW THE FOLD) --- */}

      {/* 3. InsuranceType is now the FIRST scroll component */}
      <AnimateOnScroll direction="fromBottom" delay={0.2}>
        <InsuranceType />
      </AnimateOnScroll>
    </div>
  );
};

export default Service;