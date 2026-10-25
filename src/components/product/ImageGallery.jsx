import { useState, useRef } from 'react';
import { ZoomIn, X, ChevronLeft, ChevronRight } from 'lucide-react';

export default function ImageGallery({ images = [], name = '' }) {
  const list = images.length ? images : ['https://picsum.photos/seed/placeholder/800/800'];
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [origin, setOrigin] = useState('50% 50%');
  const [lightbox, setLightbox] = useState(false);
  const ref = useRef(null);

  const onMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    setOrigin(`${Math.min(100, Math.max(0, x))}% ${Math.min(100, Math.max(0, y))}%`);
  };

  const step = (d) => setActive((i) => (i + d + list.length) % list.length);

  return (
    <div className="flex flex-col-reverse gap-3 sm:flex-row">
      {/* Thumbnails */}
      <div className="flex gap-3 sm:flex-col">
        {list.map((img, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={`h-16 w-16 overflow-hidden rounded-xl border-2 transition ${i === active ? 'border-brand-600' : 'border-slate-200 hover:border-slate-300'}`}
            aria-label={`View image ${i + 1}`}
          >
            <img src={img} alt="" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>

      {/* Main image with hover zoom */}
      <div className="flex-1">
        <div
          ref={ref}
          onMouseEnter={() => setZoom(true)}
          onMouseLeave={() => setZoom(false)}
          onMouseMove={onMove}
          onClick={() => setLightbox(true)}
          className="group relative aspect-square cursor-zoom-in overflow-hidden rounded-2xl border border-slate-200 bg-slate-100"
        >
          <img
            src={list[active]}
            alt={name}
            className="h-full w-full object-cover transition-transform duration-200"
            style={zoom ? { transform: 'scale(2)', transformOrigin: origin } : undefined}
          />
          <span className="pointer-events-none absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-ink shadow-sm backdrop-blur dark:bg-slate-900/90">
            <ZoomIn className="h-3.5 w-3.5" /> Hover to zoom
          </span>
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 animate-fade-in" onClick={() => setLightbox(false)}>
          <button className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20" aria-label="Close"><X className="h-6 w-6" /></button>
          {list.length > 1 && (
            <>
              <button onClick={(e) => { e.stopPropagation(); step(-1); }} className="absolute left-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20" aria-label="Previous"><ChevronLeft className="h-6 w-6" /></button>
              <button onClick={(e) => { e.stopPropagation(); step(1); }} className="absolute right-4 top-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20" aria-label="Next"><ChevronRight className="h-6 w-6" /></button>
            </>
          )}
          <img src={list[active]} alt={name} className="max-h-[85vh] max-w-[90vw] rounded-xl object-contain" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}
