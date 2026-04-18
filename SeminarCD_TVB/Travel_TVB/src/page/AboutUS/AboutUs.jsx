// page/AboutUS/AboutUs.jsx
import React from 'react';
import { motion } from 'framer-motion';
import HeroSection from '../../components/AboutUs-Hero/AboutUs-Hero.jsx';
import CoreValues from '../../components/CoreValues/CoreValues.jsx';
import Journey from '../../components/Journey/Journey.jsx';
import Team from '../../components/Team/Team.jsx';
import Portfolio from '../../components/Portfolio/Portfolio';
import AnimateOnScroll from '../../components/AnimateOnScroll/AnimateOnScroll.jsx'; // Your component with whileInView
import './AboutUs.css';

const AboutUs = () => {
  
  // --- PART 1: PAGE LOAD ANIMATIONS ---

  // 1. Variant for the Hero (fires immediately)
  const heroVariants = {
    hidden: { opacity: 0, y: -15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut", delay: 0.1 }
    }
  };

  // 2. Variant for CoreValues (fires with a slight delay)
  // This variant uses the same settings as your AnimateOnScroll
  const coreValuesVariants = {
    hidden: { opacity: 0, x: -80, scale: 0.95 },
    visible: {
        opacity: 1,
        x: 0,
        scale: 1,
        transition: { 
            duration: 0.5, 
            ease: [0.22, 1, 0.36, 1], 
            delay: 0.3 // Staggered delay AFTER the hero
        }
    }
  };

  return (
    <div className="about-us-page">
      
      {/* These components are "above the fold" and animate ON LOAD */}
      <motion.div
        variants={heroVariants}
        initial="hidden"
        animate="visible"
      >
        <HeroSection />
      </motion.div>

      <motion.div
        variants={coreValuesVariants}
        initial="hidden"
        animate="visible"
      >
        <CoreValues />
      </motion.div>

      
      {/* --- PART 2: SCROLL ANIMATIONS --- */}
      {/* These components are "below the fold" and will wait for the user to scroll */}
      
      <AnimateOnScroll direction="fromRight" delay={0.7}>
        <Journey />
      </AnimateOnScroll>

      {/* Your rule: After the first 2, all are fromBottom */}
      <AnimateOnScroll direction="fromBottom" delay={0.4}>
        <Team />
      </AnimateOnScroll>

      <AnimateOnScroll direction="fromBottom" delay={0.5}>
        <Portfolio />
      </AnimateOnScroll>
    </div>
  );
};

export default AboutUs;