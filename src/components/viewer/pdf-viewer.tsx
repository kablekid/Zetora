'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, Loader2, Minus, Plus, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// pdf.js types are loaded lazily with the library itself.
type PDFDocumentProxy = import('pdfjs-dist').PDFDocumentProxy;
type PDFPageProxy = import('pdfjs-dist').PDFPageProxy;

const MIN_ZOOM = 0.6;
const MAX_ZOOM = 3;

function PdfPage({
  pdf, pageNumber, width, onVisible, scrollRoot,
}: {
  pdf: PDFDocumentProxy; pageNumber: number; width: number; onVisible: (n: number) => void; scrollRoot: React.RefObject<HTMLDivElement | null>;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [page, setPage] = useState<PDFPageProxy | null>(null);
  const [near, setNear] = useState(pageNumber <= 2);
  const [ratio, setRatio] = useState(1.414);

  useEffect(() => {
    let alive = true;
    pdf.getPage(pageNumber).then((p) => {
      if (!alive) return;
      const v = p.getViewport({ scale: 1 });
      setRatio(v.height / v.width);
      setPage(p);
    });
    return () => { alive = false; };
  }, [pdf, pageNumber]);

  // Render only pages near the viewport — keeps memory low on phones.
  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          setNear(e.isIntersecting);
          if (e.isIntersecting && e.intersectionRatio > 0.35) onVisible(pageNumber);
        }
      },
      { root: scrollRoot.current, rootMargin: '900px 0px', threshold: [0, 0.35] },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [pageNumber, onVisible, scrollRoot]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!page || !canvas) return;
    if (!near) {
      canvas.width = 0; // free the bitmap
      canvas.height = 0;
      return;
    }
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const base = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({ scale: (width / base.width) * dpr });
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const task = page.render({ canvas, canvasContext: ctx, viewport });
    task.promise.catch(() => {});
    return () => task.cancel();
  }, [page, near, width]);

  return (
    <div ref={hostRef} data-page={pageNumber} className="mx-auto overflow-hidden rounded-md bg-white shadow-[var(--shadow-card)] ring-1 ring-black/5" style={{ width, height: width * ratio }}>
      <canvas ref={canvasRef} className="block size-full" style={{ width: '100%', height: '100%' }} aria-label={`Page ${pageNumber}`} role="img" />
    </div>
  );
}

export function PdfViewer({ url, onError }: { url: string; onError?: (m: string) => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [current, setCurrent] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [boxWidth, setBoxWidth] = useState(0);
  const [progress, setProgress] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    let loadingTask: { destroy: () => Promise<void> } | null = null;
    (async () => {
      try {
        const pdfjs = await import('pdfjs-dist');
        pdfjs.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.mjs';
        const task = pdfjs.getDocument({
          url,
          cMapUrl: '/pdfjs/cmaps/',
          cMapPacked: true,
          standardFontDataUrl: '/pdfjs/standard_fonts/',
          wasmUrl: '/pdfjs/wasm/',
          iccUrl: '/pdfjs/iccs/',
        });
        task.onProgress = (p: { loaded: number; total: number }) => {
          if (!cancelled && p.total) setProgress(Math.round((p.loaded / p.total) * 100));
        };
        loadingTask = task;
        const doc = await task.promise;
        if (cancelled) { void task.destroy(); return; }
        setPdf(doc);
      } catch (e) {
        if (cancelled) return;
        const msg = (e as Error)?.message?.includes('Password') ? 'This PDF is password protected.' : 'We couldn’t open this PDF. It may have expired — please go back and try again.';
        setError(msg);
        onError?.(msg);
      }
    })();
    return () => {
      cancelled = true;
      void loadingTask?.destroy();
    };
  }, [url, onError]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setBoxWidth(el.clientWidth));
    ro.observe(el);
    setBoxWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const onVisible = useCallback((n: number) => setCurrent(n), []);
  const pageWidth = Math.max(0, Math.min(boxWidth - 24, 900)) * zoom;
  const numPages = pdf?.numPages ?? 0;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border bg-muted/60">
      <div className="flex items-center justify-between gap-2 border-b bg-card px-3 py-2">
        <p className="text-sm font-medium tabular-nums" aria-live="polite">
          {numPages ? <>Page {current} <span className="text-muted-foreground">of {numPages}</span></> : 'Loading…'}
        </p>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" aria-label="Zoom out" onClick={() => setZoom((z) => Math.max(MIN_ZOOM, +(z - 0.2).toFixed(2)))} disabled={zoom <= MIN_ZOOM}><Minus /></Button>
          <span className="w-12 text-center text-xs font-medium tabular-nums text-muted-foreground">{Math.round(zoom * 100)}%</span>
          <Button variant="ghost" size="icon-sm" aria-label="Zoom in" onClick={() => setZoom((z) => Math.min(MAX_ZOOM, +(z + 0.2).toFixed(2)))} disabled={zoom >= MAX_ZOOM}><Plus /></Button>
          <Button variant="ghost" size="icon-sm" aria-label="Fit to width" onClick={() => setZoom(1)}><Maximize2 /></Button>
        </div>
      </div>
      <div ref={scrollRef} className={cn('min-h-0 flex-1 overflow-auto overscroll-contain p-3', error && 'flex items-center justify-center')} tabIndex={0} aria-label="PDF pages">
        {error ? (
          <div className="max-w-sm text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-destructive-soft text-destructive"><AlertTriangle className="size-6" /></div>
            <p className="mt-4 text-sm text-muted-foreground">{error}</p>
          </div>
        ) : !pdf ? (
          <div className="flex h-full min-h-60 flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
            <Loader2 className="size-6 animate-spin" />
            {progress != null ? `Loading document… ${progress}%` : 'Loading document…'}
          </div>
        ) : (
          <div className="space-y-3" style={{ width: Math.max(pageWidth, 0) + 0, margin: '0 auto' }}>
            {Array.from({ length: numPages }, (_, i) => (
              <PdfPage key={i} pdf={pdf} pageNumber={i + 1} width={pageWidth} onVisible={onVisible} scrollRoot={scrollRef} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
