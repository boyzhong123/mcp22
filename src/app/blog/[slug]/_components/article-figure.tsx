'use client';

import Image from 'next/image';
import { ZoomIn } from 'lucide-react';
import type { BlogFigure } from '../../posts';
import { useFigureGallery } from './figure-gallery';

export function ArticleFigure({ figure, index }: { figure: BlogFigure; index: number }) {
  const { openAt } = useFigureGallery();

  return (
    <figure className="group my-10 overflow-hidden rounded-[1.35rem] border border-zinc-900/[0.08] bg-[#eef4ee]">
      <button
        type="button"
        onClick={() => openAt(index)}
        className="relative block w-full cursor-zoom-in focus-visible:outline-none"
        aria-label={`Enlarge image: ${figure.alt}`}
      >
        <div className="relative aspect-[16/10]">
          <Image
            src={figure.src}
            alt={figure.alt}
            fill
            sizes="(max-width: 768px) 100vw, 720px"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
        </div>
        <span className="pointer-events-none absolute right-3 top-3 flex items-center gap-1 rounded-full bg-zinc-900/55 px-2.5 py-1 text-[11px] font-medium text-white opacity-0 backdrop-blur-sm transition-opacity duration-200 group-hover:opacity-100">
          <ZoomIn className="h-3.5 w-3.5" aria-hidden />
          Enlarge
        </span>
      </button>
      {figure.caption ? (
        <figcaption className="border-t border-zinc-900/[0.06] bg-white/70 px-5 py-3.5 text-[13px] leading-relaxed text-zinc-500">
          {figure.caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
