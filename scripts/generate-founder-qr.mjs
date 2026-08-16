import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import QRCode from 'qrcode';

const outputDir = path.resolve('public/qr');
const profiles = {
  aly: 'https://www.africagemfinds.com/connect/aly',
  ibrahim: 'https://www.africagemfinds.com/connect/ibrahim',
};

await mkdir(outputDir, { recursive: true });

for (const [slug, url] of Object.entries(profiles)) {
  const options = {
    errorCorrectionLevel: 'H',
    margin: 4,
    color: { dark: '#0E3938', light: '#FFFFFFFF' },
  };
  const svg = await QRCode.toString(url, { ...options, type: 'svg', width: 1200 });
  const png = await QRCode.toBuffer(url, { ...options, type: 'png', width: 1200 });
  await Promise.all([
    writeFile(path.join(outputDir, `${slug}-contact-qr.svg`), svg),
    writeFile(path.join(outputDir, `${slug}-contact-qr.png`), png),
  ]);
}

await writeFile(
  path.join(outputDir, 'README.md'),
  `# Africa Gem Finds founder QR files\n\n` +
  `- Print the SVG files where possible. PNG files are 1200 × 1200 pixels.\n` +
  `- Recommended printed size: 25–30 mm square.\n` +
  `- Keep the full white quiet zone intact; do not crop, recolour, distort, or place artwork over the codes.\n` +
  `- Aly Sylla: ${profiles.aly}\n` +
  `- Ibrahim Camara: ${profiles.ibrahim}\n`,
);

console.log(`Generated ${Object.keys(profiles).length * 2} QR assets in ${outputDir}`);
