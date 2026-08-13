import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

const source = 'public/africa-gem-finds-logo-transparent.png';
const output = 'public/africa-gem-finds-logo-nav.png';

await sharp(source)
  .resize({ height: 216, withoutEnlargement: true })
  .png({ compressionLevel: 9, adaptiveFiltering: true, palette: false })
  .toFile(output);

console.log(`Created ${output} from the untouched master ${source}`);

const samples = [
  ['aquamarine', 'public/images/Stone16-218.jpg'],
  ['tourmaline', 'public/images/Stone22-290.jpg'],
  ['rubylite', 'public/images/Stone31-446.jpg'],
  ['pale-morganite', 'public/images/Stone7-105.jpg'],
  ['fine-inclusions', 'public/images/Stone2-040.jpg'],
];

await mkdir('.performance/quality', { recursive: true });
for (const [name, master] of samples) {
  const optimized = `.performance/quality/${name}-1920-q95.webp`;
  await sharp(master).resize({ width: 1920, withoutEnlargement: true }).webp({ quality: 95 }).toFile(optimized);

  const originalCrop = await sharp(master).resize(960, 600, { fit: 'cover' }).extract({ left: 320, top: 150, width: 320, height: 300 }).png().toBuffer();
  const optimizedCrop = await sharp(optimized).resize(960, 600, { fit: 'cover' }).extract({ left: 320, top: 150, width: 320, height: 300 }).png().toBuffer();
  await sharp({ create: { width: 660, height: 340, channels: 3, background: '#fff' } })
    .composite([{ input: originalCrop, left: 10, top: 30 }, { input: optimizedCrop, left: 330, top: 30 }])
    .png()
    .toFile(`.performance/quality/${name}-comparison.png`);
}
console.log('Created five representative original-versus-quality-95 comparison crops in .performance/quality');
