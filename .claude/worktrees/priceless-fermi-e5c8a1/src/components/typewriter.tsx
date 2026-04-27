'use client';

import { useState, useEffect } from 'react';

export function Typewriter({
  texts,
  className = '',
  speed = 80,
  deleteSpeed = 40,
  pauseMs = 2000,
}: {
  texts: string[];
  className?: string;
  speed?: number;
  deleteSpeed?: number;
  pauseMs?: number;
}) {
  const [index, setIndex] = useState(0);
  const [displayed, setDisplayed] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const current = texts[index];

    if (!isDeleting && displayed === current) {
      const timer = setTimeout(() => setIsDeleting(true), pauseMs);
      return () => clearTimeout(timer);
    }

    if (isDeleting && displayed === '') {
      const timer = setTimeout(() => {
        setIsDeleting(false);
        setIndex((i) => (i + 1) % texts.length);
      }, 0);
      return () => clearTimeout(timer);
    }

    const timeout = isDeleting ? deleteSpeed : speed;
    const timer = setTimeout(() => {
      setDisplayed(
        isDeleting
          ? current.slice(0, displayed.length - 1)
          : current.slice(0, displayed.length + 1)
      );
    }, timeout);

    return () => clearTimeout(timer);
  }, [displayed, isDeleting, index, texts, speed, deleteSpeed, pauseMs]);

  return (
    <span className={className}>
      {displayed}
      <span className="inline-block w-[2px] h-[1em] bg-foreground/70 ml-0.5 align-middle animate-pulse" />
    </span>
  );
}
