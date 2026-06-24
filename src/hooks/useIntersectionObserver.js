import { useEffect, useRef } from 'react';

const useIntersectionObserver = (options = { threshold: 0.08 }) => {
  const elementsRef = useRef([]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          // Optionally unobserve after animating
          // observer.unobserve(entry.target);
        }
      });
    }, options);

    const currentElements = elementsRef.current;
    currentElements.forEach((el) => {
      if (el) {
        el.style.opacity = '0';
        el.style.transform = 'translateY(14px)';
        el.style.transition = 'opacity 0.55s ease, transform 0.55s ease';
        observer.observe(el);
      }
    });

    return () => {
      currentElements.forEach((el) => {
        if (el) observer.unobserve(el);
      });
    };
  }, [options]);

  const setRef = (el) => {
    if (el && !elementsRef.current.includes(el)) {
      elementsRef.current.push(el);
    }
  };

  return setRef;
};

export default useIntersectionObserver;
