import type { GalleryStatus, GalleryStone } from './types';

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

const familyFacts: Record<string, string> = {
  Aquamarine: 'Aquamarine is the blue to blue-green variety of beryl. Its colour develops when trace iron is incorporated as the crystal grows, typically in mineral-rich pegmatites.',
  Beryl: 'Beryl grows as six-sided crystals. Small changes in trace elements create several familiar varieties, including blue aquamarine, pink morganite and colourless goshenite.',
  Morganite: 'Morganite is the pink to peach variety of beryl. Its colour is associated primarily with trace manganese incorporated during crystal growth.',
  Tourmaline: 'Tourmaline has one of the widest colour ranges of any gemstone family because its complex crystal structure can accommodate many different trace elements.',
  Rubellite: 'Rubellite is the trade name for richly pink to red tourmaline whose colour remains vivid across different lighting conditions.',
  Rubylite: 'Rubellite is the trade name for richly pink to red tourmaline whose colour remains vivid across different lighting conditions.',
  Goshenite: 'Goshenite is colourless beryl. Its lack of strong colour reflects a relatively low concentration of the trace elements that colour other beryl varieties.',
  Agate: 'Agate forms when silica-rich fluids deposit microscopic layers of quartz inside cavities, producing the bands and patterns that make each piece distinctive.',
  Gemstone: 'Rough material preserves the natural crystal surfaces and inclusions that cutters study when deciding how a finished stone can best be oriented.',
};

export const educationalFact = (stone: Pick<GalleryStone, 'family' | 'educationalNote'>) =>
  stone.educationalNote || familyFacts[stone.family] || familyFacts.Gemstone;
