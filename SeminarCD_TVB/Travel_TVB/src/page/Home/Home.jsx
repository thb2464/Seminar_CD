// pages/Home/Home.jsx
import React from 'react';
import { motion } from 'framer-motion';
import HeroSlider from '../../components/HeroSlider/HeroSlider';
import Statistic from '../../components/Statistic/Statistic';
import Commitment from '../../components/Commitment/Commitment';
import Portfolio from '../../components/Portfolio/Portfolio';
import FAQ from '../../components/FAQ/FAQ';
import Diagram from '../../components/Diagram/Diagram';
import AnimateOnScroll from '../../components/AnimateOnScroll/AnimateOnScroll.jsx';
import MainService from '../../components/MainService/MainService.jsx';
import './Home.css';

const Home = () => {
  const heroVariants = {
    hidden: { opacity: 1, y: -15 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 1.5, ease: [0.25, 0.46, 0.45, 0.94] }
    }
  };

  return (
    <div className="home-page">
      {/* 1. Hero animates on page load */}
      <motion.div
        variants={heroVariants}
        initial="hidden"
        animate="visible"
      >
        <HeroSlider />
      </motion.div>

      {/* 2. Statistic (Scroll component 1) */}
      <AnimateOnScroll direction="fromLeft" delay={0.3}>
        <Statistic />
      </AnimateOnScroll>

      {/* 3. Commitment (Scroll component 2) */}
      <AnimateOnScroll direction="fromRight" delay={0.3}>
        <Commitment />
      </AnimateOnScroll>

      {/* 4. Diagram (Scroll component 3) - NOW fromBottom */}
      <AnimateOnScroll direction="fromBottom" delay={0.3}>
        <Diagram />
      </AnimateOnScroll>

      {/* 5. MainService (Scroll component 4) - NOW fromBottom 
      <AnimateOnScroll direction="fromBottom" delay={0.3}>
        <MainService />
      </AnimateOnScroll>*/}

      {/* 6. Portfolio (Scroll component 5) - NOW fromBottom */}
      <AnimateOnScroll direction="fromBottom" delay={0.3}>
        <Portfolio />
      </AnimateOnScroll>

      {/* 7. FAQ (Scroll component 6) - fromBottom */}
      <AnimateOnScroll direction="fromBottom" delay={0.3}>
        <FAQ />
      </AnimateOnScroll>
    </div>
  );
};

export default Home;