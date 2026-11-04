/**
 * Client-side image downscaling so uploads stay small on slow connections.
 * Returns a JPEG/WebP blob no larger than `maxSize` pixels on its longest side.
 */
export async function resizeImage(file: File, maxSize = 1280, quality = 0.85): Promise<{ blob: Blob; ext: string; type: string }> {
  if (!file.type.startsWith('image/')) throw new Error('Please choose an image file.');
  if (file.type === 'image/gif') return { blob: file, ext: 'gif', type: 'image/gif' };
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) throw new Error('That image could not be read.');
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Image processing is not supported on this device.');
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();
  const webp = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/webp', quality));
  if (webp && webp.type === 'image/webp') return { blob: webp, ext: 'webp', type: 'image/webp' };
  const jpeg = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', quality));
  if (!jpeg) throw new Error('Image processing failed.');
  return { blob: jpeg, ext: 'jpg', type: 'image/jpeg' };
}
