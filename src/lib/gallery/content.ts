import type { GalleryStatus } from './types';

export const statusContent = (status: GalleryStatus) => status === 'sold' ? {
  supporting: 'This stone has been sold, but we may have similar material available. Send us a direct inquiry and tell us what you are looking for.',
  cta: 'Ask about similar stones',
} : {
  supporting: 'Interested in this stone or looking for something similar? Send us a direct inquiry and we will help you find the right material.',
  cta: 'Inquire about this stone',
};

export const inquiryMessage = (status: GalleryStatus, title: string, reference: string) => status === 'sold'
  ? `I’m interested in stones similar to ${title} (${reference}). Please share any comparable material currently available.`
  : `I’m interested in ${title} (${reference}). Please share availability and next steps.`;
