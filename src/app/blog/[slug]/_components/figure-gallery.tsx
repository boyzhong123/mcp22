'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { BlogFigure } from '../../posts';

type FigureGalleryContextValue = {
  openAt: (index: number) => void;
};

const FigureGalleryContext = createContext<FigureGalleryContextValue | null>(null);

export function useFigureGallery() {
  const context = useContext(FigureGalleryContext);
  if (!context) {
    throw new Error('useFigureGallery must be used within a FigureGalleryProvider');
  }
  return context;
}

export function FigureGalleryProvider({
  figures,
  children,
}: {
  figures: readonly BlogFigure[];
  children: ReactNode;
}) {
  const [index, setIndex] = useState<number | null>(null);
  const count = figures.length;
  const open = index !== null;

  const close = useCallback(() => setIndex(null), []);
  const openAt = useCallback(
    (target: number) => {
      if (target >= 0 && target < count) setIndex(target);
    },
    [count],
  );
  const goPrev = useCallback(
    () => setIndex((current) => (current === null ? current : (current - 1 + count) % count)),
    [count],
  );
  const goNext = useCallback(
    () => setIndex((current) => (current === null ? current : (current + 1) % count)),
    [count],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
      else if (event.key === 'ArrowLeft') goPrev();
      else if (event.key === 'ArrowRight') goNext();
    };
    document.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, close, goPrev, goNext]);

  const value = useMemo<FigureGalleryContextValue>(() => ({ openAt }), [openAt]);
  const figure = open ? figures[index] : null;
  const showNav = count > 1;

  return (
    <FigureGalleryContext.Provider value={value}>
      {children}
      {figure ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={figure.alt}
          onClick={close}
          className="fixed inset-0 z-[999] flex flex-col items-center justify-center gap-4 bg-zinc-950/85 p-4 backdrop-blur-sm sm:p-8"
        >
          <button
            type="button"
            onClick={close}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/12 text-white transition-colors hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            aria-label="Close"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>

          {showNav ? (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                goPrev();
              }}
              className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/12 text-white transition-colors hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 sm:left-6"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-6 w-6" aria-hidden />
            </button>
          ) : null}

          {showNav ? (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                goNext();
              }}
              className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/12 text-white transition-colors hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 sm:right-6"
              aria-label="Next image"
            >
              <ChevronRight className="h-6 w-6" aria-hidden />
            </button>
          ) : null}

          <div
            onClick={(event) => event.stopPropagation()}
            className="relative flex max-h-[85vh] w-full max-w-5xl items-center justify-center"
          >
            <Image
              key={figure.src}
              src={figure.src}
              alt={figure.alt}
              width={1400}
              height={1400}
              sizes="(max-width: 1024px) 100vw, 1000px"
              className="max-h-[85vh] w-auto rounded-xl object-contain shadow-2xl"
            />
          </div>

          <div
            onClick={(event) => event.stopPropagation()}
            className="flex max-w-2xl flex-col items-center gap-2 text-center"
          >
            {figure.caption ? (
              <p className="text-[13px] leading-relaxed text-zinc-300">{figure.caption}</p>
            ) : null}
            {showNav ? (
              <p className="font-mono text-[11px] tracking-[0.18em] text-zinc-500">
                {String((index ?? 0) + 1).padStart(2, '0')} / {String(count).padStart(2, '0')}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </FigureGalleryContext.Provider>
  );
}
