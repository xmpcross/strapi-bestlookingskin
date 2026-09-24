import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const outDir = path.resolve('public', 'brand-logos');
fs.mkdirSync(outDir, { recursive: true });

// 1. California Gold Nutrition SVG (crisp gold & navy seal)
const cgnSvg = `
<svg width="128" height="128" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#D4AF37"/>
      <stop offset="50%" stop-color="#FFDF73"/>
      <stop offset="100%" stop-color="#AA771C"/>
    </linearGradient>
  </defs>
  <circle cx="64" cy="64" r="60" fill="#FFFFFF" stroke="url(#gold)" stroke-width="4"/>
  <circle cx="64" cy="64" r="54" fill="none" stroke="#0D233A" stroke-width="2"/>
  <text x="64" y="52" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="900" fill="#0D233A" text-anchor="middle">CGN</text>
  <text x="64" y="74" font-family="system-ui, -apple-system, sans-serif" font-size="9" font-weight="700" fill="#AA771C" letter-spacing="1" text-anchor="middle">CALIFORNIA</text>
  <text x="64" y="87" font-family="system-ui, -apple-system, sans-serif" font-size="8" font-weight="800" fill="#0D233A" letter-spacing="0.5" text-anchor="middle">GOLD NUTRITION</text>
</svg>
`;

// 2. K2O by Kylie Jenner SVG (clean minimalist luxury aesthetic)
const kylieSvg = `
<svg width="128" height="128" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
  <circle cx="64" cy="64" r="60" fill="#FAF6F4" stroke="#E6D3CD" stroke-width="3"/>
  <text x="64" y="55" font-family="system-ui, -apple-system, sans-serif" font-size="28" font-weight="800" fill="#1A1A1A" letter-spacing="2" text-anchor="middle">K2O</text>
  <text x="64" y="74" font-family="system-ui, -apple-system, sans-serif" font-size="9" font-weight="500" fill="#887777" letter-spacing="3" text-anchor="middle">BY</text>
  <text x="64" y="89" font-family="system-ui, -apple-system, sans-serif" font-size="9" font-weight="700" fill="#222222" letter-spacing="1.5" text-anchor="middle">KYLIE JENNER</text>
</svg>
`;

async function main() {
  const cgnPath = path.join(outDir, 'california-gold-nutrition.png');
  await sharp(Buffer.from(cgnSvg))
    .png()
    .toFile(cgnPath);
  console.log(`Generated: ${cgnPath}`);

  const kyliePath = path.join(outDir, 'k2o-by-kylie-jenner.png');
  await sharp(Buffer.from(kylieSvg))
    .png()
    .toFile(kyliePath);
  console.log(`Generated: ${kyliePath}`);
}

main().catch(console.error);
