import { useCallback, useEffect, useRef, useState } from 'react';

interface UseSplitterOptions {
  initial?: number;
  min?: number;
  max?: number;
}

export function useSplitter({ initial = 380, min = 280, max = 800 }: UseSplitterOptions = {}) {
  const [width, setWidth] = useState(initial);
  const isDraggingRef = useRef(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const next = window.innerWidth - e.clientX;
      setWidth(Math.max(min, Math.min(next, max)));
    };
    const handleMouseUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        document.body.style.cursor = 'default';
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [min, max]);

  const startDragging = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;
    document.body.style.cursor = 'col-resize';
  }, []);

  return { width, startDragging };
}
