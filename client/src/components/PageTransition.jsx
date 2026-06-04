import { useLocation } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';

export default function PageTransition({ children }) {
  const location = useLocation();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [transitionStage, setTransitionStage] = useState('fadeIn');
  const prevPath = useRef(location.pathname);

  useEffect(() => {
    if (location.pathname !== prevPath.current) {
      setTransitionStage('fadeOut');
      prevPath.current = location.pathname;
    }
  }, [location.pathname]);

  const handleTransitionEnd = () => {
    if (transitionStage === 'fadeOut') {
      setDisplayChildren(children);
      setTransitionStage('fadeIn');
    }
  };

  useEffect(() => {
    if (location.pathname === prevPath.current && transitionStage === 'fadeIn') {
      setDisplayChildren(children);
    }
  }, [children, location.pathname, transitionStage]);

  return (
    <div className={`page-transition ${transitionStage}`} onAnimationEnd={handleTransitionEnd}>
      {displayChildren}
    </div>
  );
}
