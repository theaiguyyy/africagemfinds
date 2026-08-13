export const gallerySizes = {
  card: '(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 33vw',
  detail: '(max-width: 980px) 100vw, 56vw',
};

export function storageVariant(url: string, width: 320 | 640 | 720 | 1200 | 1600) {
  if (!url.includes('/storage/v1/object/public/')) return url;
  return url.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/') + `?width=${width}&quality=92&resize=contain`;
}
