import { useRef, useState } from 'react';
import { UploadCloud, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { mediaService, MAX_UPLOAD_BYTES, ALLOWED_TYPES } from '../../services/mediaService';
import { optimizeImage } from '../../utils/imageOptimize';

// A single image upload slot: drag-drop or click-to-browse, live preview,
// 2MB / JPEG-PNG-WEBP-GIF validation before the file ever leaves the browser.
// `value` is the current image URL (or ''); `onChange(url)` is called with
// the uploaded/hosted URL once the upload finishes.
export default function ImageUploadField({ value, onChange, recommendedSize, label = 'Image' }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file) => {
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Only JPEG, PNG, WEBP, or GIF images are allowed');
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      toast.error('File exceeds the 2MB limit');
      return;
    }
    setUploading(true);
    try {
      const { file: optimized, originalBytes, optimizedBytes, skipped } = await optimizeImage(file);
      const result = await mediaService.upload(optimized);
      onChange(result.url);
      if (result.demo) toast('Preview only — running in demo mode, this won\'t be a hosted URL.', { icon: '⚠️' });
      else if (!skipped) {
        const savedPct = Math.round((1 - optimizedBytes / originalBytes) * 100);
        if (savedPct > 5) toast.success(`Optimized: ${(originalBytes / 1024).toFixed(0)}KB → ${(optimizedBytes / 1024).toFixed(0)}KB (−${savedPct}%)`, { icon: '🗜️' });
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      {value ? (
        <div className="relative inline-block">
          <img src={value} alt="" className="h-32 w-32 rounded-lg border border-slate-200 object-cover" />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-white text-red-600 shadow ring-1 ring-slate-200 hover:bg-red-50"
            aria-label="Remove image"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files?.[0]); }}
          onClick={() => inputRef.current?.click()}
          className={`flex h-32 w-32 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed text-center text-xs transition ${
            dragOver ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-300 text-ink-muted hover:border-brand-400 hover:bg-slate-50'
          }`}
        >
          {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <UploadCloud className="h-5 w-5" />}
          <span>{uploading ? 'Uploading…' : 'Drag or click to upload'}</span>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_TYPES.join(',')}
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <p className="mt-1.5 text-xs text-ink-muted">
        {recommendedSize && <>Recommended: <span className="font-medium text-ink-soft">{recommendedSize}</span> · </>}
        Max <span className="font-medium text-ink-soft">2MB</span> · JPEG, PNG, WEBP, or GIF
      </p>
    </div>
  );
}
