'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Loader2, X, ZoomIn } from 'lucide-react';
import { useLang } from '../_lib/use-lang';

// Square avatar cropper. Loads the picked file, lets the user pan (drag) and
// zoom, then exports a centered square as a compressed JPEG (default 512×512),
// guaranteed well under the backend's 2 MB cap. No external dependency.

const VIEWPORT = 288; // on-screen crop window (px)
const OUTPUT = 512; // exported image size (px)
const MAX_BYTES = 2 * 1024 * 1024;

interface AvatarCropModalProps {
  file: File;
  onCancel: () => void;
  onCropped: (blob: Blob) => void | Promise<void>;
  /** Whether the parent is uploading the cropped result. */
  busy?: boolean;
}

export function AvatarCropModal({ file, onCancel, onCropped, busy = false }: AvatarCropModalProps) {
  const { t, tx } = useLang();
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1); // multiplier over the cover-fit scale
  const [offset, setOffset] = useState({ x: 0, y: 0 }); // image top-left vs viewport
  const [loadError, setLoadError] = useState(false);
  const dragRef = useRef<{ x: number; y: number } | null>(null);

  // Cover-fit base scale: the smallest scale that fills the square viewport.
  const coverScale = img ? Math.max(VIEWPORT / img.naturalWidth, VIEWPORT / img.naturalHeight) : 1;
  const scale = coverScale * zoom;
  const dw = img ? img.naturalWidth * scale : 0;
  const dh = img ? img.naturalHeight * scale : 0;

  // Keep the image fully covering the viewport (offsets within [VP - size, 0]).
  const clamp = useCallback(
    (x: number, y: number) => ({
      x: Math.min(0, Math.max(VIEWPORT - dw, x)),
      y: Math.min(0, Math.max(VIEWPORT - dh, y)),
    }),
    [dw, dh],
  );

  // Load the file into an Image element and center it (in the load callback,
  // so we never call setState synchronously inside an effect body). The
  // `cancelled` guard prevents a stale image (e.g. from React StrictMode's
  // double-invoke, whose object URL was already revoked) from flipping state.
  useEffect(() => {
    let cancelled = false;
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      if (cancelled) return;
      const cs = Math.max(VIEWPORT / image.naturalWidth, VIEWPORT / image.naturalHeight);
      const w = image.naturalWidth * cs;
      const h = image.naturalHeight * cs;
      setImg(image);
      setZoom(1);
      setOffset({ x: (VIEWPORT - w) / 2, y: (VIEWPORT - h) / 2 });
    };
    image.onerror = () => {
      if (!cancelled) setLoadError(true);
    };
    image.src = url;
    return () => {
      cancelled = true;
      URL.revokeObjectURL(url);
    };
  }, [file]);

  // Re-clamp / keep the viewport center stable when zoom changes.
  const onZoom = (nextZoom: number) => {
    const sOld = scale;
    const sNew = coverScale * nextZoom;
    const cx = (VIEWPORT / 2 - offset.x) / sOld;
    const cy = (VIEWPORT / 2 - offset.y) / sOld;
    const nx = VIEWPORT / 2 - cx * sNew;
    const ny = VIEWPORT / 2 - cy * sNew;
    const ndw = img ? img.naturalWidth * sNew : 0;
    const ndh = img ? img.naturalHeight * sNew : 0;
    setZoom(nextZoom);
    setOffset({
      x: Math.min(0, Math.max(VIEWPORT - ndw, nx)),
      y: Math.min(0, Math.max(VIEWPORT - ndh, ny)),
    });
  };

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.x;
    const dy = e.clientY - dragRef.current.y;
    dragRef.current = { x: e.clientX, y: e.clientY };
    setOffset((o) => clamp(o.x + dx, o.y + dy));
  };
  const onPointerUp = () => {
    dragRef.current = null;
  };

  // Export the cropped square to a compressed JPEG, shrinking quality if the
  // (already tiny) result ever exceeds the cap.
  const exportBlob = async (): Promise<Blob | null> => {
    if (!img) return null;
    const canvas = document.createElement('canvas');
    canvas.width = OUTPUT;
    canvas.height = OUTPUT;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.imageSmoothingQuality = 'high';
    // Map the viewport onto the source image in natural pixels.
    const sx = -offset.x / scale;
    const sy = -offset.y / scale;
    const sSize = VIEWPORT / scale;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, OUTPUT, OUTPUT);
    ctx.drawImage(img, sx, sy, sSize, sSize, 0, 0, OUTPUT, OUTPUT);

    const toBlob = (q: number) =>
      new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', q));
    for (const q of [0.92, 0.8, 0.7, 0.6]) {
      const blob = await toBlob(q);
      if (blob && blob.size <= MAX_BYTES) return blob;
    }
    return toBlob(0.5);
  };

  const handleConfirm = async () => {
    const blob = await exportBlob();
    if (blob) await onCropped(blob);
  };

  // Close on Escape (unless uploading).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [busy, onCancel]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={() => !busy && onCancel()} />
      <div className="relative w-full max-w-[360px] rounded-2xl bg-background border border-border shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/60">
          <div className="text-sm font-semibold">{t('Crop your photo', '裁剪头像')}</div>
          <button
            type="button"
            onClick={() => !busy && onCancel()}
            disabled={busy}
            className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 disabled:opacity-40"
            aria-label={tx('Close')}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {loadError ? (
            <div className="h-[288px] flex items-center justify-center text-sm text-red-500">
              {t('Could not load this image.', '无法读取该图片。')}
            </div>
          ) : (
            <div
              className="relative mx-auto overflow-hidden rounded-full border border-border bg-muted touch-none select-none cursor-grab active:cursor-grabbing"
              style={{ width: VIEWPORT, height: VIEWPORT }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            >
              {img && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={img.src}
                  alt=""
                  draggable={false}
                  className="absolute max-w-none pointer-events-none"
                  style={{ width: dw, height: dh, left: offset.x, top: offset.y }}
                />
              )}
            </div>
          )}

          <div className="flex items-center gap-3">
            <ZoomIn className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => onZoom(Number(e.target.value))}
              disabled={!img || loadError}
              className="w-full accent-foreground"
              aria-label={t('Zoom', '缩放')}
            />
          </div>

          <p className="text-[11px] text-muted-foreground text-center">
            {t('Drag to reposition · scroll the slider to zoom.', '拖动调整位置 · 拖滑块缩放。')}
          </p>
        </div>

        <div className="px-5 py-3.5 border-t border-border/60 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => !busy && onCancel()}
            disabled={busy}
            className="h-9 px-4 text-xs font-medium rounded-md border border-border bg-background hover:bg-muted/50 disabled:opacity-50"
          >
            {tx('Cancel')}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!img || loadError || busy}
            className="h-9 px-4 text-xs font-semibold rounded-md bg-foreground text-background hover:brightness-110 disabled:opacity-50 inline-flex items-center gap-1.5"
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            {busy ? t('Uploading…', '上传中…') : t('Apply', '应用')}
          </button>
        </div>
      </div>
    </div>
  );
}
