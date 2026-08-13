import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const sourceArg = process.argv
  .find((arg) => arg.startsWith("--source="))
  ?.slice(9);
const source = path.resolve(sourceArg || path.join(process.cwd(), "agf"));
const output = path.join(process.cwd(), "public", "gallery-variants");
const heroSource = path.join(source, "Stone3-047.jpg");

if (!fs.existsSync(heroSource))
  throw new Error(`Gallery hero source not found: ${heroSource}`);
fs.mkdirSync(output, { recursive: true });

await sharp(heroSource)
  .rotate()
  .resize({ width: 1600, withoutEnlargement: true })
  .webp({ quality: 92, effort: 6, smartSubsample: true })
  .toFile(path.join(output, "gallery-hero-1600.webp"));

await sharp(heroSource)
  .rotate()
  .resize({ width: 800, withoutEnlargement: true })
  .webp({ quality: 92, effort: 6, smartSubsample: true })
  .toFile(path.join(output, "gallery-hero-800.webp"));

console.log(
  "Generated the review hero derivative; the source original was not modified.",
);
