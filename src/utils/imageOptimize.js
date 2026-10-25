// Client-side image optimization: downscales to a max dimension and
// re-encodes as JPEG/WEBP at a target quality before upload. Runs entirely
// in the browser via <canvas> — no server-side image pipeline exists yet
// (that would need something like Sharp/Thumbor on the backend), so this is
// the honest scope: it shrinks bytes over the wire and keeps uploads under
// the 2MB backend limit more often, it doesn't do CDN transforms or
// responsive srcsets.
const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.82;

export function optimizeImage(file, { maxDimension = MAX_DIMENSION, quality = JPEG_QUALITY } = {}) {
  return new Promise((resolve, reject) => {
    // GIFs can be animated — re-encoding via canvas would flatten them to a
    // single frame, so pass those through untouched.
    if (file.type === 'image/gif') { resolve({ file, originalBytes: file.size, optimizedBytes: file.size, skipped: true }); return; }

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      try {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          const scale = maxDimension / Math.max(width, height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const outType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        canvas.toBlob((blob) => {
          URL.revokeObjectURL(objectUrl);
          if (!blob || blob.size >= file.size) {
            // Optimization didn't help (small/simple image) — keep the original.
            resolve({ file, originalBytes: file.size, optimizedBytes: file.size, skipped: true });
            return;
          }
          const optimizedFile = new File([blob], file.name, { type: outType, lastModified: Date.now() });
          resolve({ file: optimizedFile, originalBytes: file.size, optimizedBytes: blob.size, skipped: false });
        }, outType, outType === 'image/jpeg' ? quality : undefined);
      } catch (err) {
        URL.revokeObjectURL(objectUrl);
        reject(err);
      }
    };
    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error('Could not read image')); };
    img.src = objectUrl;
  });
}
