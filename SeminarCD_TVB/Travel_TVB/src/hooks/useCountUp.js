import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook for a count-up animation.
 * @param {number} endValue The target number to count up to.
 * @param {number} duration The duration of the animation in milliseconds.
 * @returns {number} The current value of the count.
 */
const useCountUp = (endValue, duration = 2000) => {
  const [count, setCount] = useState(0);
  const animationFrameRef = useRef(null);

  useEffect(() => {
    let startTime = null;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const percentage = Math.min(progress / duration, 1);
      const currentCount = Math.floor(endValue * percentage);

      setCount(currentCount);

      if (percentage < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [endValue, duration]);

  return count;
};

export default useCountUp;