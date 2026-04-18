// page/Contact/Contact.jsx
import React from 'react';
import { motion } from 'framer-motion';
import Map from '../../components/Map/Map';
import Form from '../../components/Form/Form';
import FAQ from '../../components/FAQ/FAQ';
import AnimateOnScroll from '../../components/AnimateOnScroll/AnimateOnScroll.jsx';
import './Contact.css';

const Contact = () => {
  // 1. Variant for the Form
  const formVariants = {
    hidden: { opacity: 1, x: -50 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.8, ease: "easeOut", delay: 0.1 }
    }
  };

  // 2. NEW: Variant for the Map (above the fold)
  const mapVariants = {
    hidden: { opacity: 0, x: 80, scale: 0.95 },
    visible: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: { 
        duration: 0.5, 
        ease: [0.22, 1, 0.36, 1], 
        delay: 0.3 // Staggered delay after form
      }
    }
  };

  return (
    <div className="contact-page">
      {/* --- PAGE LOAD ANIMATIONS (ABOVE THE FOLD) --- */}

      <motion.div
        variants={formVariants}
        initial="hidden"
        animate="visible"
      >
        <Form />
      </motion.div>

      {/* Map ALSO animates on page load */}
      <motion.div
        variants={mapVariants}
        initial="hidden"
        animate="visible"
      >
        <Map />
      </motion.div>
      
      {/* --- SCROLL ANIMATIONS (BELOW THE FOLD) --- */}

      {/* FAQ is now the FIRST scroll component */}
      <AnimateOnScroll direction="fromBottom" delay={0.2}>
        <FAQ />
      </AnimateOnScroll>
    </div>
  );
};

export default Contact;