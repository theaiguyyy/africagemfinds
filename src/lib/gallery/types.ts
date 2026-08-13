export type GalleryStatus = 'available' | 'sold';

export interface GalleryImage {
  id: string;
  storageKey: string;
  url: string;
  width: number;
  height: number;
  mimeType: string;
  alt: string;
  sortOrder: number;
  isPrimary: boolean;
}

export interface GalleryStone {
  id: string;
  sku: string;
  title: string;
  slug: string;
  family: string;
  origin: string;
  originLocality: string;
  publicWeight: string;
  description: string;
  educationalNote: string;
  form: string;
  colour: string;
  status: GalleryStatus;
  position: number;
  images: GalleryImage[];
}
