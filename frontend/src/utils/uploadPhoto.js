// Converts any image to WebP (resized to max 1200px wide, quality 0.82)
export function toWebP(file, maxWidth = 1200, quality = 0.82) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = img.width > maxWidth ? maxWidth / img.width : 1;
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width  = w;
      canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      canvas.toBlob((blob) => { URL.revokeObjectURL(url); resolve(blob); }, 'image/webp', quality);
    };
    img.src = url;
  });
}

// Uploads a WebP blob to Supabase Storage, returns the public URL.
// folder: 'orders' (default) or 'returns' — stored as order-photos/orders/ or order-photos/returns/
export async function uploadPhoto(blob, folder = 'orders') {
  const base    = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!base || !anonKey) throw new Error('Supabase env vars not set (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)');

  const filename = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.webp`;

  const res = await fetch(`${base}/storage/v1/object/order-photos/${filename}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${anonKey}`, 'Content-Type': 'image/webp' },
    body: blob,
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => res.status);
    throw new Error(`Upload failed: ${msg}`);
  }

  return `${base}/storage/v1/object/public/order-photos/${filename}`;
}
