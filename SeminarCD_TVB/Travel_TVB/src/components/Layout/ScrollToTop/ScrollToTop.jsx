// src/components/Layout/ScrollToTop/ScrollToTop.jsx

import { useLayoutEffect } from 'react'; // 1. Import useLayoutEffect
import { useLocation } from 'react-router-dom';

function ScrollToTop() {
  const { pathname } = useLocation();

  // 2. Use useLayoutEffect instead of useEffect
  useLayoutEffect(() => {
    // This now runs synchronously before the browser can paint
    window.scrollTo(0, 0);
  }, [pathname]); // The effect still depends on the pathname

  return null;
}

export default ScrollToTop;