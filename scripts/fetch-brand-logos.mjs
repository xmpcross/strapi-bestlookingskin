import fs from 'node:fs/promises';
import path from 'node:path';

const BRAND_DOMAINS = {
  'Anua': 'anua.us',
  'Aveeno': 'aveeno.com',
  'Avene': 'aveneusa.com',
  'Banila Co': 'banilausa.com',
  'Beauty of Joseon': 'beautyofjoseon.com',
  'Belif': 'belifusa.com',
  'Best Naturals': 'shopbestnaturals.com',
  'Bioderma': 'bioderma.us',
  'Biossance': 'biossance.com',
  'Bubble Skincare': 'hellobubble.com',
  'Byoma': 'byoma.com',
  'California Gold Nutrition': 'iherb.com',
  'Caudalie': 'caudalie.com',
  'CeraVe': 'cerave.com',
  'Cetaphil': 'cetaphil.com',
  'Clinique': 'clinique.com',
  'COSRX': 'cosrx.com',
  'Dermalogica': 'dermalogica.com',
  "Dickinson's": 'dickinsonsusa.com',
  'Differin': 'differin.com',
  "Doctor's": 'doctorsbest.com',
  'Dr.': 'drjart.com',
  'Drunk Elephant': 'drunkelephant.com',
  'e.l.f.': 'elfcosmetics.com',
  'Elf': 'elfcosmetics.com',
  'Estee Lauder': 'esteelauder.com',
  'Farmacy': 'farmacybeauty.com',
  'First Aid Beauty': 'firstaidbeauty.com',
  'Fresh': 'fresh.com',
  'Garnier': 'garnierusa.com',
  'Glow Recipe': 'glowrecipe.com',
  'Good Molecules': 'goodmolecules.com',
  'Hada Labo': 'hadalabousa.com',
  'Innisfree': 'innisfree.com',
  'K2O by Kylie Jenner': 'kyliecosmetics.com',
  "Kiehl's": 'kiehls.com',
  "L'Oreal": 'lorealparisusa.com',
  'La Roche-Posay': 'laroche-posay.us',
  'Laneige': 'us.laneige.com',
  'Mario Badescu': 'mariobadescu.com',
  'Medik8': 'medik8.com',
  'Micro Ingredients': 'microingredients.com',
  'Murad': 'murad.com',
  'Naturium': 'naturium.com',
  'Neutrogena': 'neutrogena.com',
  'No7': 'no7beauty.com',
  'NOW Foods': 'nowfoods.com',
  'Olay': 'olay.com',
  'Origins': 'origins.com',
  "Paula's Choice": 'paulaschoice.com',
  'Peter': 'peterthomasroth.com',
  'Pixi': 'pixibeauty.com',
  'Pyunkang Yul': 'pyunkangyul.us',
  'RoC': 'rocskincare.com',
  'Round Lab': 'roundlab.com',
  'Shiseido': 'shiseido.com',
  'Simple': 'simpleskincare.com',
  'SKIN1004': 'skin1004.com',
  'SkinCeuticals': 'skinceuticals.com',
  'Skinfix': 'skinfix.com',
  'Solgar': 'solgar.com',
  'Some By Mi': 'somebymi.com',
  'St. Ives': 'stives.com',
  'Summer Fridays': 'summerfridays.com',
  'Tatcha': 'tatcha.com',
  'Thayers': 'thayers.com',
  'The Inkey List': 'theinkeylist.com',
  'The Ordinary': 'theordinary.com',
  'Torriden': 'torriden.com',
  'Vanicream': 'vanicream.com',
  'Versed': 'versedskin.com',
  'Vichy': 'vichyusa.com',
  'Youth To The People': 'youthtothepeople.com',
};

function brandToFilename(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '.png';
}

async function fetchLogo(domain) {
  const sources = [
    `https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${domain}&size=128`,
    `https://unavatar.io/${domain}?fallback=false`,
    `https://icon.horse/icon/${domain}`,
  ];

  for (const src of sources) {
    try {
      const res = await fetch(src, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BrandLogoBot/1.0)' },
        signal: AbortSignal.timeout(4000),
      });
      if (res.ok) {
        const ct = res.headers.get('content-type') || '';
        if (ct.includes('image')) {
          const buf = Buffer.from(await res.arrayBuffer());
          if (buf.length > 200) {
            return buf;
          }
        }
      }
    } catch {
      // try next source
    }
  }
  return null;
}

async function main() {
  const outDir = path.resolve('public', 'brand-logos');
  await fs.mkdir(outDir, { recursive: true });

  const entries = Object.entries(BRAND_DOMAINS);
  console.log(`Fetching logos for ${entries.length} brands into ${outDir}...`);

  let success = 0;
  let missing = 0;

  for (const [name, domain] of entries) {
    const filename = brandToFilename(name);
    const dest = path.join(outDir, filename);

    // Check if already exists
    try {
      const stat = await fs.stat(dest);
      if (stat.size > 200) {
        console.log(`✓ [cached] ${name} (${filename})`);
        success++;
        continue;
      }
    } catch {
      // Not cached, fetch
    }

    const buf = await fetchLogo(domain);
    if (buf) {
      await fs.writeFile(dest, buf);
      console.log(`✓ [downloaded] ${name} -> ${filename} (${buf.length} bytes)`);
      success++;
    } else {
      console.warn(`✖ [failed] ${name} (${domain})`);
      missing++;
    }
  }

  console.log(`\nFinished: ${success} logos ready, ${missing} missing.`);
}

main().catch(console.error);
