export type BrandCategory =
  | 'All'
  | 'Dermatologist-Backed'
  | 'Clinical Actives'
  | 'K-Beauty'
  | 'Luxury & Prestige'
  | 'Clean & Botanical'
  | 'Daily Essentials';

export type BrandMeta = {
  name: string;
  slug: string;
  category: BrandCategory;
  logo: string;
  tagline: string;
  description?: string;
  featured?: boolean;
  website?: string;
  origin?: string;
};

export const BRAND_DIRECTORY: Record<string, BrandMeta> = {
  'Anua': {
    name: 'Anua',
    slug: 'Anua',
    category: 'K-Beauty',
    logo: '/brand-logos/anua.png',
    tagline: 'Heartleaf-infused Korean calming skincare',
    featured: true,
    website: 'https://anua.us',
    origin: 'South Korea',
    description: 'Driven by the philosophy of gentle simplicity and skin relaxation, South Korean brand Anua focuses on calming sensitized, irritated complexions using high-purity natural extracts. Their signature Heartleaf 77% Soothing Toner is a global K-beauty sensation celebrated for its exceptional ability to reduce redness, soothe breakout-prone skin, and restore balanced hydration. Formulated with dermatologically tested, non-comedogenic ingredients, Anua provides clean, minimalist routines that soothe the skin barrier and bring stressed skin back to equilibrium.',
  },
  'Aveeno': {
    name: 'Aveeno',
    slug: 'Aveeno',
    category: 'Daily Essentials',
    logo: '/brand-logos/aveeno.png',
    tagline: 'Nourishing oat-based barrier hydration',
    website: 'https://aveeno.com',
    origin: 'United States',
    description: 'For over seventy years, Aveeno has championed dermatological wellness through the therapeutic power of nature. Centered around nourishing prebiotic colloidal oat, Aveeno products are clinically proven to soothe, moisturize, and rebuild compromised skin barriers. From everyday daily moisturizing lotions to specialized eczema therapy balms, Aveeno formulas are pediatrician- and dermatologist-recommended, providing fragrance-free, gentle relief for sensitive, dry, and irritated skin.',
  },
  'Avene': {
    name: 'Avene',
    slug: 'Avene',
    category: 'Dermatologist-Backed',
    logo: '/brand-logos/avene.png',
    tagline: 'French thermal spring water soothing care',
    website: 'https://aveneusa.com',
    origin: 'France',
    description: 'Originating from the picturesque Cévennes mountains of France, Eau Thermale Avène is globally recognized for calming hyper-sensitive, reactive, and allergy-prone skin. Centered around sterile cosmetics technology and therapeutic, mineral-rich thermal spring water backed by more than three hundred pharmacological studies, Avène provides immediate, anti-irritant soothing. Hero treatments like Cicalfate+ Restorative Protective Cream and Tolérance Control offer clinically proven barrier repair for post-procedure, compromised, and eczema-prone complexions.',
  },
  'Banila Co': {
    name: 'Banila Co',
    slug: 'Banila Co',
    category: 'K-Beauty',
    logo: '/brand-logos/banila-co.png',
    tagline: 'Cult-favorite Korean cleansing balms',
    website: 'https://banilausa.com',
    origin: 'South Korea',
    description: 'A trailblazer in modern Korean beauty, Banila Co is world-renowned for transforming makeup removal into an effortless, luxurious self-care ritual. Their cult-classic Clean It Zero 3-in-1 Cleansing Balm melts away waterproof makeup, excess sebum, and daily environmental impurities without stripping the skin of essential moisture. Infused with soothing acerola extract, hot spring water, and vitamin C, Banila Co pairs innovative sensorial textures with barrier-friendly skincare technology suitable for all skin types.',
  },
  'Beauty of Joseon': {
    name: 'Beauty of Joseon',
    slug: 'Beauty of Joseon',
    category: 'K-Beauty',
    logo: '/brand-logos/beauty-of-joseon.png',
    tagline: 'Traditional Hanbang botanical formulations',
    featured: true,
    website: 'https://beautyofjoseon.com',
    origin: 'South Korea',
    description: 'Drawing inspiration from the Joseon Dynasty’s royal court beauty philosophies and the historical Korean holistic manual Gyuhap Chongseo, Beauty of Joseon blends ancient Hanbang herbal medicine with contemporary cosmetic science. Featuring time-honored ingredients like ginseng root, green plum water, propolis, and rice bran extract, their iconic Relief Sun SPF 50+ and Glow Serums restore skin vitality, calm irritation, and deliver an ethereal, dewy radiance that honors timeless Korean heritage.',
  },
  'Belif': {
    name: 'Belif',
    slug: 'Belif',
    category: 'K-Beauty',
    logo: '/brand-logos/belif.png',
    tagline: 'Herbal true decoction skin hydration bombs',
    website: 'https://belifusa.com',
    origin: 'South Korea',
    description: 'Fusing traditional 19th-century herbal apothecary techniques with cutting-edge Korean skincare science, Belif delivers exceptional hydration through authentic botanical decoctions. Free of mineral oils, synthetic fragrances, and parabens, Belif is famed for its iconic True Cream Aqua Bomb and Moisturizing Bomb, which provide clinical bursts of refreshing moisture that last up to twenty-six hours. Their lightweight, cushiony formulas revitalize tired, parched skin with soothing lady’s mantle and apothecary herbs.',
  },
  'Best Naturals': {
    name: 'Best Naturals',
    slug: 'Best Naturals',
    category: 'Daily Essentials',
    logo: '/brand-logos/best-naturals.png',
    tagline: 'Pure wellness and beauty supplements',
    website: 'https://shopbestnaturals.com',
    origin: 'United States',
    description: 'Dedicated to pure, reliable wellness and nutritional support, Best Naturals formulates premium vitamins, minerals, and beauty supplements manufactured in state-of-the-art cGMP facilities. From marine collagen peptides to biotin and antioxidant botanical extracts, Best Naturals products support foundational skin health, elasticity, and keratin production from within, empowering consumers to maintain vibrant skin, hair, and nails through scientifically sound daily nutrition.',
  },
  'Bioderma': {
    name: 'Bioderma',
    slug: 'Bioderma',
    category: 'Dermatologist-Backed',
    logo: '/brand-logos/bioderma.png',
    tagline: 'Pioneers of dermatological micellar cleansing',
    featured: true,
    website: 'https://bioderma.us',
    origin: 'France',
    description: 'Guided by the visionary principle of ecobiology, French dermatological brand Bioderma designs treatments that respect the skin’s natural biological ecosystem rather than artificially over-treating it. Universally celebrated for inventing the modern micellar water with Sensibio H2O, Bioderma provides clinically tested solutions for redness, severe dehydration, eczema, and acne. By strengthening cutaneous defenses, Bioderma empowers compromised and sensitive skin to preserve its long-term health and vitality.',
  },
  'Biossance': {
    name: 'Biossance',
    slug: 'Biossance',
    category: 'Luxury & Prestige',
    logo: '/brand-logos/biossance.png',
    tagline: 'Sugarcane-derived squalane biotechnology',
    website: 'https://biossance.com',
    origin: 'United States',
    description: 'Pioneering sustainable biotechnology in luxury skincare, Biossance revolutionized the beauty industry by developing 100% plant-based squalane derived from renewable sugarcane—saving millions of sharks from unethical harvesting. Squalane mimics the skin’s natural sebum to deliver weightless, non-comedogenic moisture deep into cellular layers. Paired with potent actives like vitamin C, copper peptides, and vegan lactic acid, Biossance provides clean, high-performance anti-aging solutions verified by rigorous clinical standards.',
  },
  'Bubble Skincare': {
    name: 'Bubble Skincare',
    slug: 'Bubble Skincare',
    category: 'Clean & Botanical',
    logo: '/brand-logos/bubble-skincare.png',
    tagline: 'Playful, dermatologist-tested clean formulas',
    website: 'https://hellobubble.com',
    origin: 'United States',
    description: 'Created to make effective, dermatologist-developed skincare approachable, fun, and accessible, Bubble Skincare offers science-backed routines tailored to youthful and evolving skin. Free of fragrance, harsh sulfates, and common irritants, Bubble utilizes gentle plant extracts paired with proven actives like niacinamide, salicylic acid, and ceramides. Their vibrant, recyclable packaging and straightforward product regimens help clear blemishes, balance oil production, and restore healthy skin barriers.',
  },
  'Byoma': {
    name: 'Byoma',
    slug: 'Byoma',
    category: 'Clean & Botanical',
    logo: '/brand-logos/byoma.png',
    tagline: 'Barrier-boosting tri-ceramide skin therapy',
    featured: true,
    website: 'https://byoma.com',
    origin: 'United Kingdom',
    description: 'Dedicated to ending the cycle of over-exfoliation and compromised skin barriers, Byoma formulates barrier-repairing skincare anchored by a science-backed Tri-Ceramide Complex (ceramides, cholesterol, and fatty acids). Packaged in bright, recyclable modular bottles with transparent active ingredient percentages, Byoma provides gentle, non-comedogenic hydration and soothing care for everyday barrier maintenance, leaving skin balanced, calm, and resilient.',
  },
  'Caudalie': {
    name: 'Caudalie',
    slug: 'Caudalie',
    category: 'Luxury & Prestige',
    logo: '/brand-logos/caudalie.png',
    tagline: 'French vinotherapy polyphenol antioxidant power',
    website: 'https://caudalie.com',
    origin: 'France',
    description: 'Born in the sun-drenched vineyards of Bordeaux, France, Caudalie is an eco-luxury skincare brand powered by patented grapevine antioxidants and grape-seed polyphenols. Celebrated for iconic formulations like the Vinoperfect Radiance Dark Spot Serum and the refreshing Beauty Elixir, Caudalie pairs clean, natural botanical chemistry with peer-reviewed anti-aging science to brighten uneven skin tone, refine texture, and protect against environmental oxidative stress.',
  },
  'CeraVe': {
    name: 'CeraVe',
    slug: 'CeraVe',
    category: 'Dermatologist-Backed',
    logo: '/brand-logos/cerave.png',
    tagline: 'Developed with dermatologists, 3 essential ceramides',
    featured: true,
    website: 'https://cerave.com',
    origin: 'United States',
    description: 'Developed with dermatologists, CeraVe is celebrated worldwide for its barrier-first skincare philosophy. Every formulation is powered by three essential, skin-identical ceramides (1, 3, and 6-II) alongside patented MultiVesicular Emulsion (MVE) delivery technology, which continuously releases moisturizing ingredients over twenty-four hours. From the iconic Hydrating Facial Cleanser to the rich Moisturizing Cream, CeraVe provides non-comedogenic, fragrance-free relief suitable for sensitive, acne-prone, and eczema-prone complexions.',
  },
  'Cetaphil': {
    name: 'Cetaphil',
    slug: 'Cetaphil',
    category: 'Dermatologist-Backed',
    logo: '/brand-logos/cetaphil.png',
    tagline: 'Gentle, sensitive skin dermatologist formula',
    website: 'https://cetaphil.com',
    origin: 'United States',
    description: 'Formulated in 1947 by an American pharmacist, Cetaphil is one of the world’s most trusted, dermatologist-recommended sensitive skincare brands. Featuring hypoallergenic formulas fortified with hydrating glycerin, panthenol (vitamin B5), and niacinamide (vitamin B3), Cetaphil’s Gentle Skin Cleansers and Daily Moisturizing Lotions defend against the five signs of skin sensitivity without compromising the protective lipid barrier or causing irritation.',
  },
  'Clinique': {
    name: 'Clinique',
    slug: 'Clinique',
    category: 'Luxury & Prestige',
    logo: '/brand-logos/clinique.png',
    tagline: 'Allergy tested, 100% fragrance free skincare',
    featured: true,
    website: 'https://clinique.com',
    origin: 'United States',
    description: 'Founded in 1968 as the world’s first dermatologist-developed prestige beauty brand, Clinique revolutionized the industry with its custom 3-Step Skin Care System: Cleanse, Exfoliate, and Moisturize. Renowned for its 100% fragrance-free, allergy-tested formulas, Clinique delivers gentle yet high-performance solutions for hydration, brightening, and anti-aging, featuring timeless staples like the Dramatically Different Moisturizing Lotion+ and Moisture Surge 100H Auto-Replenishing Hydrator.',
  },
  'COSRX': {
    name: 'COSRX',
    slug: 'COSRX',
    category: 'K-Beauty',
    logo: '/brand-logos/cosrx.png',
    tagline: 'Effective Korean skin solutions and snail mucin',
    featured: true,
    website: 'https://cosrx.com',
    origin: 'South Korea',
    description: 'A cornerstone of modern Korean skincare, COSRX (Cosmetics + Prescription) is revered for its results-driven, minimalist formulations designed to treat sensitive and acne-prone skin without irritation. Famous for harnessing ultra-nourishing Advanced Snail 96 Mucin Power Essence and soothing Centella Asiatica, COSRX combines high percentages of natural actives with low-pH balance to heal breakouts, rebuild depleted moisture barriers, and restore lasting suppleness.',
  },
  'Dermalogica': {
    name: 'Dermalogica',
    slug: 'Dermalogica',
    category: 'Clinical Actives',
    logo: '/brand-logos/dermalogica.png',
    tagline: 'Professional-grade skin health innovation',
    featured: true,
    website: 'https://dermalogica.com',
    origin: 'United States',
    description: 'Founded in 1986 by skin therapist Jane Wurwand, Dermalogica was created with a clear focus on skin health over superficial beauty. Free of common irritants like artificial colors, synthetic fragrances, and mineral oils, Dermalogica is the trusted choice of professional skin therapists worldwide, known for innovative heroes like the Daily Microfoliant, Special Cleansing Gel, and Dynamic Skin Recovery.',
  },
  "Dickinson's": {
    name: "Dickinson's",
    slug: "Dickinson's",
    category: 'Daily Essentials',
    logo: '/brand-logos/dickinson-s.png',
    tagline: 'Genuine distilled natural witch hazel',
    website: 'https://dickinsonsusa.com',
    origin: 'United States',
  },
  'Differin': {
    name: 'Differin',
    slug: 'Differin',
    category: 'Dermatologist-Backed',
    logo: '/brand-logos/differin.png',
    tagline: 'Prescription-strength retinoid acne clearing',
    website: 'https://differin.com',
    origin: 'United States',
    description: 'Differin revolutionized acne therapy by introducing adapalene—the first FDA-approved over-the-counter prescription-strength retinoid for acne treatment in more than thirty years. Backed by extensive clinical dermatology, Differin Gel targets the root causes of breakouts by regulating cellular turnover, clearing clogged pores, and preventing new acne formations while reducing the risk of post-inflammatory scarring.',
  },
  "Doctor's": {
    name: "Doctor's Best",
    slug: "Doctor's",
    category: 'Daily Essentials',
    logo: '/brand-logos/doctor-s.png',
    tagline: 'Science-based nutritional and beauty formulas',
    website: 'https://doctorsbest.com',
    origin: 'United States',
  },
  'Dr.': {
    name: 'Dr. Jart+',
    slug: 'Dr.',
    category: 'K-Beauty',
    logo: '/brand-logos/dr.png',
    tagline: 'Innovative Korean derma-skincare & Cicapair',
    website: 'https://drjart.com',
    origin: 'South Korea',
    description: 'Dr. clinical skincare brands combine medical dermatology with innovative cosmetic formulations to address targeted concerns such as hyperpigmentation, barrier degradation, and premature aging. Utilizing potent actives with soothing buffering agents, these doctor-developed treatments deliver transformative results with balanced tolerance.',
  },
  'Drunk Elephant': {
    name: 'Drunk Elephant',
    slug: 'Drunk Elephant',
    category: 'Luxury & Prestige',
    logo: '/brand-logos/drunk-elephant.png',
    tagline: 'Biocompatible skincare free of the Suspicious 6',
    featured: true,
    website: 'https://drunkelephant.com',
    origin: 'United States',
    description: 'Founded by Tiffany Masterson, Drunk Elephant pioneered the "clean-compatible" skincare movement by formulating strictly without the "Suspicious 6" (essential oils, drying alcohols, silicones, chemical sunscreens, fragrances/dyes, and SLS). Emphasizing bio-compatible, skin-mimicking ingredients that absorb seamlessly into the acid mantle, Drunk Elephant encourages users to create custom "skincare smoothies" with award-winning heroes like the C-Firma Fresh Day Serum, Protini Polypeptide Cream, and T.L.C. Sukari Babyfacial.',
  },
  'e.l.f.': {
    name: 'e.l.f. Skin',
    slug: 'e.l.f.',
    category: 'Daily Essentials',
    logo: '/brand-logos/e-l-f.png',
    tagline: 'Clean, cruelty-free, accessible powerhouse formulas',
    website: 'https://elfcosmetics.com',
    origin: 'United States',
    description: 'e.l.f. Cosmetics & Skincare makes high-performance, trend-forward beauty accessible to every eye, lip, and face. Certified 100% vegan and cruelty-free, e.l.f. SKIN formulates with dermatologist-loved staples including hyaluronic acid, niacinamide, ceramides, and peptides. With cult-favorite collections like Holy Hydration! and Blemish Breakthrough, e.l.f. delivers prestige-caliber results at democratically accessible prices.',
  },
  'Elf': {
    name: 'e.l.f. Skin',
    slug: 'Elf',
    category: 'Daily Essentials',
    logo: '/brand-logos/elf.png',
    tagline: 'Holy-grail everyday skincare for all skin types',
    website: 'https://elfcosmetics.com',
    origin: 'United States',
    description: 'e.l.f. (Eyes, Lips, Face) provides high-quality, cruelty-free, and vegan skincare formulated with proven dermatological actives. From hydrating cleansers to nourishing barrier creams and SPF essentials, e.l.f. ensures radiant, healthy-looking skin is within everyone’s reach without compromise.',
  },
  'Estee Lauder': {
    name: 'Estee Lauder',
    slug: 'Estee Lauder',
    category: 'Luxury & Prestige',
    logo: '/brand-logos/estee-lauder.png',
    tagline: 'Advanced Night Repair & legendary prestige care',
    featured: true,
    website: 'https://esteelauder.com',
    origin: 'United States',
    description: 'A cornerstone of prestige global beauty since 1946, Estée Lauder combines cutting-edge cellular repair technology with timeless luxury skincare. Their iconic Advanced Night Repair Synchronized Multi-Recovery Complex pioneered nighttime recovery science, harnessing chronobiology to visibly reduce signs of aging, smooth fine lines, and restore skin firmness across all ethnicities and skin types.',
  },
  'Farmacy': {
    name: 'Farmacy',
    slug: 'Farmacy',
    category: 'Clean & Botanical',
    logo: '/brand-logos/farmacy.png',
    tagline: 'Farm-to-face clean science & honey antioxidants',
    website: 'https://farmacybeauty.com',
    origin: 'United States',
    description: 'Rooted in science-backed farm-to-face clean beauty, Farmacy sources nutrient-rich botanicals directly from organic farms to formulate potent, clinically proven skincare. Celebrated for its cult-favorite Green Clean Cleansing Balm and honey-infused ceramide moisturizers, Farmacy combines fresh antioxidant superfoods with dermatologist-trusted actives for clean, radiant, and intensely hydrated skin.',
  },
  'First Aid Beauty': {
    name: 'First Aid Beauty',
    slug: 'First Aid Beauty',
    category: 'Dermatologist-Backed',
    logo: '/brand-logos/first-aid-beauty.png',
    tagline: 'Ultra Repair relief for sensitive, dry skin',
    featured: true,
    website: 'https://firstaidbeauty.com',
    origin: 'United States',
    description: 'Founded to rescue distressed, dry, and sensitive skin, First Aid Beauty (FAB) creates head-to-toe problem-solving skincare that is allergy-tested and fragrance-free. Their cult-classic Ultra Repair Cream features colloidal oatmeal, shea butter, and ceramides to provide immediate, long-lasting relief from irritation, flaky dryness, and eczema, making it an indispensable home remedy for reactive skin.',
  },
  'Fresh': {
    name: 'Fresh',
    slug: 'Fresh',
    category: 'Luxury & Prestige',
    logo: '/brand-logos/fresh.png',
    tagline: 'Sensory natural textures powered by modern science',
    website: 'https://fresh.com',
    origin: 'France',
    description: 'Bridging time-honored natural beauty rituals with modern cosmetic science, Fresh creates luxurious, sensory skincare powered by potent natural ingredients like soy proteins, real rose petals, black tea ferment, and Umbrian clay. Their indulgent cleansers, antioxidant essences, and sugar lip treatments replenish moisture while providing a comforting, spa-grade experience at home.',
  },
  'Garnier': {
    name: 'Garnier',
    slug: 'Garnier',
    category: 'Daily Essentials',
    logo: '/brand-logos/garnier.png',
    tagline: 'Everyday micellar waters and vitamin C brighteners',
    website: 'https://garnierusa.com',
    origin: 'France',
    description: 'Bringing nature-inspired beauty to households worldwide, Garnier blends botanical ingredients with proven skincare actives to deliver approachable, effective daily care. Globally celebrated for its versatile Micellar Cleansing Waters and vitamin C brightening serums, Garnier offers gentle, dermatologist-tested solutions that remove impurities, protect skin barriers, and illuminate dull skin.',
  },
  'Glow Recipe': {
    name: 'Glow Recipe',
    slug: 'Glow Recipe',
    category: 'Luxury & Prestige',
    logo: '/brand-logos/glow-recipe.png',
    tagline: 'Fruit-forward clinical dew drops & glow toners',
    featured: true,
    website: 'https://glowrecipe.com',
    origin: 'United States',
    description: 'Co-founded by Sarah Lee and Christine Chang, Glow Recipe champions fruit-powered, clinically effective skincare that makes achieving glass skin an uplifting sensory ritual. Known for antioxidant-rich, clean formulas featuring watermelon, plum, avocado, and strawberry, their viral Watermelon Glow Niacinamide Dew Drops and PHA+BHA Pore-Tight Toner impart instantaneous hydration, gentle exfoliation, and a lit-from-within glow.',
  },
  'Good Molecules': {
    name: 'Good Molecules',
    slug: 'Good Molecules',
    category: 'Clinical Actives',
    logo: '/brand-logos/good-molecules.png',
    tagline: 'Transparent, targeted clinical actives for clear skin',
    featured: true,
    website: 'https://goodmolecules.com',
    origin: 'United States',
    description: 'Built on the mission of creating "a world where good skincare is actually accessible," Good Molecules designs clean, clinical formulations with complete ingredient transparency and honest pricing. Known for bestsellers like the Niacinamide Brightening Toner and Discoloration Correcting Serum, Good Molecules targets hyperpigmentation, uneven texture, and enlarged pores with scientifically proven concentrations.',
  },
  'Hada Labo': {
    name: 'Hada Labo',
    slug: 'Hada Labo',
    category: 'K-Beauty',
    logo: '/brand-logos/hada-labo.png',
    tagline: 'Japanese multi-molecular hyaluronic acid hydration',
    featured: true,
    website: 'https://hadalabousa.com',
    origin: 'Japan',
    description: 'Guided by the Japanese philosophy of "Perfect and Simple" (Rohto Pharmaceutical), Hada Labo eliminates all unnecessary additives, colorants, and fragrances. World-renowned for its Gokujyun Premium Lotion containing multi-molecular-weight hyaluronic acids, Hada Labo provides unprecedented multi-depth dermal hydration with a lightweight, non-sticky finish that plumps skin from within.',
  },
  'Innisfree': {
    name: 'Innisfree',
    slug: 'Innisfree',
    category: 'K-Beauty',
    logo: '/brand-logos/innisfree.png',
    tagline: 'Jeju Island green tea & volcanic pore innovations',
    website: 'https://innisfree.com',
    origin: 'South Korea',
    description: 'Sourcing its botanicals from the pristine volcanic island of Jeju, South Korea, Innisfree is a pioneer in eco-conscious K-beauty. Formulating with organically grown green tea seed extracts, volcanic clusters, and soothing cica, Innisfree delivers balancing hydration, pore-purifying care, and revitalizing radiance tailored for modern, eco-minded lifestyles.',
  },
  "Kiehl's": {
    name: "Kiehl's",
    slug: "Kiehl's",
    category: 'Luxury & Prestige',
    logo: '/brand-logos/kiehl-s.png',
    tagline: 'Apothecary heritage since 1851 with Ultra Facial care',
    featured: true,
    website: 'https://kiehls.com',
    origin: 'United States',
  },
  "L'Oreal": {
    name: "L'Oreal Paris",
    slug: "L'Oreal",
    category: 'Daily Essentials',
    logo: '/brand-logos/l-oreal.png',
    tagline: 'Accessible dermatological science & Revitalift',
    website: 'https://lorealparisusa.com',
    origin: 'France',
  },
  'La Roche-Posay': {
    name: 'La Roche-Posay',
    slug: 'La Roche-Posay',
    category: 'Dermatologist-Backed',
    logo: '/brand-logos/la-roche-posay.png',
    tagline: 'Recommended by 90,000+ dermatologists worldwide',
    featured: true,
    website: 'https://laroche-posay.us',
    origin: 'France',
    description: 'Rooted in dermatological medicine and enriched by the prebiotic, selenium-dense thermal spring water of southwestern France, La Roche-Posay is recommended by over ninety thousand dermatologists worldwide. Formulated under stringent safety standards, their hypoallergenic treatments—including the barrier-restoring Cicaplast Baume B5+, Effaclar acne systems, and Anthelios sun care—are clinically tested to soothe, repair, and defend even the most sensitive and compromised skin barriers.',
  },
  'Laneige': {
    name: 'Laneige',
    slug: 'Laneige',
    category: 'K-Beauty',
    logo: '/brand-logos/laneige.png',
    tagline: 'Water Bank hydration science & iconic lip sleeping masks',
    featured: true,
    website: 'https://us.laneige.com',
    origin: 'South Korea',
    description: 'A leader in Korean hydration science, Laneige has dedicated decades to researching water science and skin vitality. Famous worldwide for its cult-classic Lip Sleeping Mask, Water Sleeping Mask, and Cream Skin Cerapeptide Toner & Moisturizer, Laneige utilizes hydro-ionized mineral water and ceramide peptides to lock in deep, lasting moisture for bouncy, luminous skin.',
  },
  'Mario Badescu': {
    name: 'Mario Badescu',
    slug: 'Mario Badescu',
    category: 'Clean & Botanical',
    logo: '/brand-logos/mario-badescu.png',
    tagline: 'Botanical salon heritage & iconic drying lotion',
    website: 'https://mariobadescu.com',
    origin: 'United States',
    description: 'Founded in 1967 in New York City, Mario Badescu is an enduring botanical skincare institution renowned for personalized, European-style facial solutions. Best known for the iconic pink Drying Lotion that clears blemishes overnight and refreshing Facial Sprays with aloe, herbs, and rosewater, Mario Badescu combines natural botanicals with simple, effective formulations for timeless skin clarity.',
  },
  'Medik8': {
    name: 'Medik8',
    slug: 'Medik8',
    category: 'Clinical Actives',
    logo: '/brand-logos/medik8.png',
    tagline: 'Pioneers of CSA retinol & retinal anti-aging science',
    featured: true,
    website: 'https://medik8.com',
    origin: 'United Kingdom',
    description: 'A British clinical skincare brand driven by science and sustainability, Medik8 is renowned for its signature CSA philosophy: Vitamin C plus Sunscreen by day, Vitamin A (Retinal) by night. Utilizing time-release technology and groundbreaking retinaldehyde formulations, Medik8 delivers transformative anti-aging results with minimal irritation, smoothing fine lines and restoring skin elasticity.',
  },
  'Micro Ingredients': {
    name: 'Micro Ingredients',
    slug: 'Micro Ingredients',
    category: 'Daily Essentials',
    logo: '/brand-logos/micro-ingredients.png',
    tagline: 'Pure raw powder actives and wellness botanicals',
    website: 'https://microingredients.com',
    origin: 'United States',
    description: 'Specializing in pure, concentrated powder formulations, Micro Ingredients delivers raw superfoods and nutritional beauty supplements free of fillers, additives, and preservatives. Their hydrolyzed collagen peptides, pure hyaluronic acid powders, and organic botanical extracts offer versatile, high-potency daily nourishment to support radiant skin, joint comfort, and hair vitality.',
  },
  'Murad': {
    name: 'Murad',
    slug: 'Murad',
    category: 'Clinical Actives',
    logo: '/brand-logos/murad.png',
    tagline: 'Doctor-developed cellular hydration and clarity',
    featured: true,
    website: 'https://murad.com',
    origin: 'United States',
    description: 'Founded in 1989 by board-certified dermatologist and pharmacist Dr. Howard Murad, Murad combines clinical skincare science with holistic cellular hydration philosophies. Renowned for high-potency retinol youth renewals, blemish control clarifying cleansers, and environmental defense vitamin C treatments, Murad targets complex skin concerns with clinical precision.',
  },
  'Naturium': {
    name: 'Naturium',
    slug: 'Naturium',
    category: 'Clinical Actives',
    logo: '/brand-logos/naturium.png',
    tagline: 'Biocompatible, potent actives at accessible pricing',
    featured: true,
    website: 'https://naturium.com',
    origin: 'United States',
    description: 'Founded with the conviction that high-performance skincare should be democratically accessible, Naturium creates biocompatible formulations utilizing potent active ingredients, plant botanicals, and advanced encapsulation technologies. From multi-action Niacinamide Serum 12% Plus Zinc 2% to rich body washes infused with salicylic acid and glycolic acid, Naturium balances clinical strength with skin comfort.',
  },
  'Neutrogena': {
    name: 'Neutrogena',
    slug: 'Neutrogena',
    category: 'Daily Essentials',
    logo: '/brand-logos/neutrogena.png',
    tagline: 'Hydro Boost hyaluronic barrier care & trusted sun protection',
    featured: true,
    website: 'https://neutrogena.com',
    origin: 'United States',
    description: 'Backed by decades of clinical dermatology and consumer skin research, Neutrogena provides accessible, science-led treatments for hydration, acne control, and broad-spectrum sun protection. Famous for breakthrough formulations like the hyaluronic acid-infused Hydro Boost Water Gel and dermatological Helioplex sunscreens, Neutrogena combines cosmetic elegance with proven active efficacy.',
  },
  'No7': {
    name: 'No7',
    slug: 'No7',
    category: 'Clinical Actives',
    logo: '/brand-logos/no7.png',
    tagline: 'Clinically proven British peptides & Protect & Perfect',
    website: 'https://no7beauty.com',
    origin: 'United Kingdom',
    description: 'With heritage dating back to 1935 in the United Kingdom, No7 is a trailblazer in accessible, clinically proven anti-aging skincare. Backed by extensive independent clinical trials and dermatological science, No7 is celebrated for its groundbreaking Protect & Perfect and Future Renew peptide serums, which visibly reverse signs of skin damage and restore firm, youthful skin.',
  },
  'NOW Foods': {
    name: 'NOW Foods',
    slug: 'NOW Foods',
    category: 'Daily Essentials',
    logo: '/brand-logos/now-foods.png',
    tagline: 'Certified organic pure oils & skin nutrition',
    website: 'https://nowfoods.com',
    origin: 'United States',
    description: 'As an industry-leading family-owned wellness pioneer since 1968, NOW Foods provides comprehensive, pure nutritional supplements and personal care products. Their extensive beauty line features cold-pressed vegetable oils, pure essential oils, hyaluronic acid serums, and hydrolyzed collagen powders tested in state-of-the-art analytical laboratories to guarantee exceptional purity and value.',
  },
  'Olay': {
    name: 'Olay',
    slug: 'Olay',
    category: 'Daily Essentials',
    logo: '/brand-logos/olay.png',
    tagline: 'Regenerist niacinamide and micro-sculpting science',
    featured: true,
    website: 'https://olay.com',
    origin: 'United States',
    description: 'With over seven decades of pioneering anti-aging research and cellular science, Olay is one of the world’s most iconic skincare brands. Powered by proprietary formulations like Vitamin B3 (Niacinamide), Amino-Peptides, and Retinol24 complexes, Olay delivers clinically proven improvements in skin elasticity, moisture retention, and wrinkle reduction across its beloved Regenerist and Super Serum lines.',
  },
  'Origins': {
    name: 'Origins',
    slug: 'Origins',
    category: 'Clean & Botanical',
    logo: '/brand-logos/origins.png',
    tagline: 'Plant-powered skin clarity with Mega-Mushroom soothing',
    website: 'https://origins.com',
    origin: 'United States',
    description: 'Pioneering the intersection of plant science and skincare efficacy since 1990, Origins harnesses potent botanical extracts and earth-friendly chemistry to formulate high-performance skincare. Renowned for hero collections such as the Mega-Mushroom Relief & Resilience Soothing Treatment Lotion and GinZing Energy-Boosting Moisturizers, Origins revitalizes tired skin while adhering to sustainable, eco-conscious standards.',
  },
  "Paula's Choice": {
    name: "Paula's Choice",
    slug: "Paula's Choice",
    category: 'Clinical Actives',
    logo: '/brand-logos/paula-s-choice.png',
    tagline: 'Truth in beauty: 2% BHA liquid exfoliant leader',
    featured: true,
    website: 'https://paulaschoice.com',
    origin: 'United States',
  },
  'Peter': {
    name: 'Peter Thomas Roth',
    slug: 'Peter',
    category: 'Clinical Actives',
    logo: '/brand-logos/peter.png',
    tagline: 'Breakthrough clinical skincare with potent active percentages',
    website: 'https://peterthomasroth.com',
    origin: 'United States',
    description: 'Peter Thomas Roth clinical skincare combines breakthrough technologies with effective ingredient concentrations to deliver rapid, dramatic improvements in skin health. Famous for innovative exfoliating peel pads, peptide wrinkle fighters, and refreshing hydrating gel masks, the brand addresses tough concerns from deep wrinkles to acne with clinical strength.',
  },
  'Pixi': {
    name: 'Pixi',
    slug: 'Pixi',
    category: 'Clean & Botanical',
    logo: '/brand-logos/pixi.png',
    tagline: 'Glow Tonic 5% glycolic acid radiant skin heroes',
    website: 'https://pixibeauty.com',
    origin: 'United Kingdom',
    description: 'Created by makeup artist and product developer Petra Strand, Pixi Beauty provides botanical-infused skincare designed to reveal naturally radiant, "just had a good night’s sleep" skin. Celebrated globally for the iconic Glow Tonic formulated with 5% glycolic acid, aloe vera, and ginseng, Pixi gently exfoliates dead surface cells to clarify pores and impart a luminous, youthful glow.',
  },
  'Pyunkang Yul': {
    name: 'Pyunkang Yul',
    slug: 'Pyunkang Yul',
    category: 'K-Beauty',
    logo: '/brand-logos/pyunkang-yul.png',
    tagline: 'Eastern medicine formulation for irritated skin barriers',
    website: 'https://pyunkangyul.us',
    origin: 'South Korea',
    description: 'Developed by the renowned Pyunkang Oriental Medicine Clinic in South Korea, Pyunkang Yul formulates minimalist, hypoallergenic skincare rooted in Eastern holistic principles. Stripping away unnecessary fragrances and synthetic fillers, their iconic Essence Toner harnesses milk vetch root extract to replenish moisture balance, calm inflammation, and restore vitality to stressed complexions.',
  },
  'RoC': {
    name: 'RoC',
    slug: 'RoC',
    category: 'Clinical Actives',
    logo: '/brand-logos/roc.png',
    tagline: 'French pharmacy retinol pioneers for firm skin',
    website: 'https://rocskincare.com',
    origin: 'France',
    description: 'Founded in France by pharmacist Dr. Jean-Louis Dousseau in 1957, RoC was the first brand to discover a method of stabilizing pure retinol. Backed by dozens of published clinical studies, RoC’s anti-aging treatments—including the Retinol Correxion Deep Wrinkle Daily Moisturizer and Eye Creams—remain dermatologist-recommended benchmarks for smoothing wrinkles and firming aging skin.',
  },
  'Round Lab': {
    name: 'Round Lab',
    slug: 'Round Lab',
    category: 'K-Beauty',
    logo: '/brand-logos/round-lab.png',
    tagline: 'Dokdo deep sea mineral water & birch juice hydration',
    featured: true,
    website: 'https://roundlab.com',
    origin: 'South Korea',
    description: 'Utilizing pure, nutrient-dense natural resources from pristine regions across the Korean peninsula—such as mineral-rich deep sea water from Ulleungdo and birch sap from Inje—Round Lab creates gentle, hypoallergenic skincare. Their Dokdo 1025 Toner and Birch Juice Moisturizing Sun Cream are celebrated globally for reinforcing skin barrier function and providing lasting, cooling hydration.',
  },
  'Shiseido': {
    name: 'Shiseido',
    slug: 'Shiseido',
    category: 'Luxury & Prestige',
    logo: '/brand-logos/shiseido.png',
    tagline: 'Japanese heritage beauty & Ultimune skin immunity',
    featured: true,
    website: 'https://shiseido.com',
    origin: 'Japan',
    description: 'Merging over 150 years of Japanese aesthetic tradition with modern dermatological biotechnology, Shiseido creates transformative, high-performance skincare. Famous for its Ultimune Power Infusing Serum and Bio-Performance lines, Shiseido focuses on strengthening skin’s natural immunity, defensive barriers, and inner vitality for timeless, resilient radiance.',
  },
  'Simple': {
    name: 'Simple',
    slug: 'Simple',
    category: 'Daily Essentials',
    logo: '/brand-logos/simple.png',
    tagline: 'Kind to skin: no artificial perfumes or harsh chemicals',
    website: 'https://simpleskincare.com',
    origin: 'United Kingdom',
    description: 'Born in the United Kingdom in 1960, Simple is the pioneer in clean, sensitive skincare crafted with zero artificial perfumes, dyes, or harsh chemicals that can upset skin. Enriched with skin-loving ingredients like pro-vitamin B5, vitamin E, and triple-purified water, Simple’s cleansers, micellar waters, and lightweight moisturizers deliver gentle, barrier-friendly care every day.',
  },
  'SKIN1004': {
    name: 'SKIN1004',
    slug: 'SKIN1004',
    category: 'K-Beauty',
    logo: '/brand-logos/skin1004.png',
    tagline: 'Madagascar Centella Asiatica pure soothing care',
    featured: true,
    website: 'https://skin1004.com',
    origin: 'South Korea',
    description: 'Harnessing the pure, untreated healing power of Centella Asiatica harvested from the untouched nature of Madagascar, SKIN1004 delivers soothing, hypoallergenic skincare for sensitive and acne-prone skin. Their signature Madagascar Centella Ampoule and Hyalu-Cica sun serums offer lightweight, non-sticky hydration that repairs weakened moisture barriers and calms irritation.',
  },
  'SkinCeuticals': {
    name: 'SkinCeuticals',
    slug: 'SkinCeuticals',
    category: 'Clinical Actives',
    logo: '/brand-logos/skinceuticals.png',
    tagline: 'Advanced clinical skincare backed by Duke antioxidant patent',
    featured: true,
    website: 'https://skinceuticals.com',
    origin: 'United States',
    description: 'As the pioneer of cosmeceuticals founded on Dr. Sheldon Pinnell’s peer-reviewed antioxidant research, SkinCeuticals is the gold standard in medical-grade skincare. Known for patented stabilized formulations featuring optimal pH levels and pure L-ascorbic acid, their legendary C E Ferulic serum and Triple Lipid Restore 2:4:2 are clinically proven to neutralize environmental free radicals, reverse visible photo-damage, and accelerate post-procedure recovery.',
  },
  'Skinfix': {
    name: 'Skinfix',
    slug: 'Skinfix',
    category: 'Dermatologist-Backed',
    logo: '/brand-logos/skinfix.png',
    tagline: 'Clinical barrier+ triple lipid lipid restoration',
    featured: true,
    website: 'https://skinfix.com',
    origin: 'Canada',
    description: 'Formulated by dermatologists and validated through rigorous clinical trials, Skinfix is dedicated exclusively to restoring and reinforcing the cutaneous lipid barrier. Utilizing active lipid complexes, ceramides, and targeted cosmeceutical actives, Skinfix delivers clinically proven relief for eczema, redness, post-procedure recovery, and severe dryness without compromising skin balance.',
  },
  'Solgar': {
    name: 'Solgar',
    slug: 'Solgar',
    category: 'Daily Essentials',
    logo: '/brand-logos/solgar.png',
    tagline: 'Gold standard nutritional skincare supplements since 1947',
    website: 'https://solgar.com',
    origin: 'United States',
    description: 'For over seventy-five years, Solgar has represented the gold standard in premium nutritional science. Packaged in iconic amber glass bottles to preserve nutrient potency, Solgar’s dermatological supplements—including advanced Zinc Picolinate, Biotin, and Skin, Nails & Hair formula—nourish the dermal matrix and promote radiant elasticity through bioavailable minerals and amino acids.',
  },
  'Some By Mi': {
    name: 'Some By Mi',
    slug: 'Some By Mi',
    category: 'K-Beauty',
    logo: '/brand-logos/some-by-mi.png',
    tagline: 'AHA BHA PHA 30-day miracle clearing solutions',
    website: 'https://somebymi.com',
    origin: 'South Korea',
    description: 'Renowned for its transformative "30 Days Miracle" line, Korean skincare brand Some By Mi combines gentle chemical exfoliants (AHA, BHA, and PHA) with soothing tea tree leaf water and centella asiatica. Designed to refine pore texture, clear stubborn blemishes, and gently lift dead skin cells, Some By Mi delivers visible clinical results without stripping delicate facial skin.',
  },
  'St. Ives': {
    name: 'St. Ives',
    slug: 'St. Ives',
    category: 'Daily Essentials',
    logo: '/brand-logos/st-ives.png',
    tagline: '100% natural exfoliants & invigorating washes',
    website: 'https://stives.com',
    origin: 'United States',
    description: 'Dedicated to bringing the mood-boosting power of nature into everyday self-care, St. Ives formulates with 100% natural exfoliants, extracts, and moisturizers. Famous for its classic Apricot Scrubs and soothing oatmeal body washes, St. Ives gently polishes away dull surface skin to reveal fresh, glowing, and velvety soft skin.',
  },
  'Summer Fridays': {
    name: 'Summer Fridays',
    slug: 'Summer Fridays',
    category: 'Luxury & Prestige',
    logo: '/brand-logos/summer-fridays.png',
    tagline: 'Jet Lag hydration masks and effortless everyday glow',
    featured: true,
    website: 'https://summerfridays.com',
    origin: 'United States',
    description: 'Founded by beauty influencers Marianna Hewitt and Lauren Ireland, Summer Fridays crafts clean, vegan skincare formulated to provide instant radiance and effortless daily pampering. Famous for the viral Jet Lag Mask and nourishing Lip Butter Balms, Summer Fridays blends hydrating ceramides, hyaluronic acid, and botanical extracts to banish dull, fatigued skin.',
  },
  'Tatcha': {
    name: 'Tatcha',
    slug: 'Tatcha',
    category: 'Luxury & Prestige',
    logo: '/brand-logos/tatcha.png',
    tagline: 'Japanese Hadasei-3 ritual skincare & The Dewy Skin Cream',
    featured: true,
    website: 'https://tatcha.com',
    origin: 'Japan',
    description: 'Inspired by centuries-old Japanese beauty rituals and geisha skincare traditions recorded in Kyoto, Tatcha crafts luxury skincare centered on Hadasei-3—a proprietary fermented complex of green tea, rice, and Okinawa red algae. Harmonizing mindful ritual with modern biomimicry, Tatcha’s award-winning formulations like The Dewy Skin Cream, The Water Cream, and The Rice Polish gently refine texture while replenishing deep moisture and radiant luminescence.',
  },
  'Thayers': {
    name: 'Thayers',
    slug: 'Thayers',
    category: 'Clean & Botanical',
    logo: '/brand-logos/thayers.png',
    tagline: 'Natural witch hazel & aloe vera balancing toners',
    website: 'https://thayers.com',
    origin: 'United States',
    description: 'Founded in 1847 by Dr. Henry Thayer, Thayers is an American heritage brand celebrated for its gentle, alcohol-free facial toners. Infused with organic, non-distilled certified witch hazel and aloe vera, Thayers calms irritation, refines pores, and balances facial moisture while preserving the natural skin barrier.',
  },
  'The Inkey List': {
    name: 'The Inkey List',
    slug: 'The Inkey List',
    category: 'Clinical Actives',
    logo: '/brand-logos/the-inkey-list.png',
    tagline: 'Single-ingredient clarity and accessible education',
    featured: true,
    website: 'https://theinkeylist.com',
    origin: 'United Kingdom',
    description: 'Built on the belief that better knowledge powers better skin, The Inkey List breaks down complex cosmetic science into straightforward, single-hero ingredient treatments. Offering targeted solutions from Salicylic Acid Cleansers to Polyglutamic Acid Serums and Retinol eye creams, the brand delivers transparent, budget-friendly skincare education paired with potent clinical efficacy.',
  },
  'The Ordinary': {
    name: 'The Ordinary',
    slug: 'The Ordinary',
    category: 'Clinical Actives',
    logo: '/brand-logos/the-ordinary.png',
    tagline: 'Clinical formulations with integrity by DECIEM',
    featured: true,
    website: 'https://theordinary.com',
    origin: 'Canada',
    description: 'Launched by DECIEM to democratize high-potency skincare, The Ordinary transformed the global beauty landscape by stripping away marketing jargon and presenting clinical actives at honest, accessible prices. Known for single-molecule serums like Niacinamide 10% + Zinc 1% and Hyaluronic Acid 2% + B5, the brand empowers users to customize their skincare routines based on targeted scientific mechanisms. Their minimalist, clinical dropper bottles are an indispensable staple for active-focused skincare enthusiasts.',
  },
  'Torriden': {
    name: 'Torriden',
    slug: 'Torriden',
    category: 'K-Beauty',
    logo: '/brand-logos/torriden.png',
    tagline: 'Award-winning DIVE-IN low molecular hyaluronic acid',
    featured: true,
    website: 'https://torriden.com',
    origin: 'South Korea',
    description: 'Award-winning Korean hydration specialist Torriden is renowned for its DIVE-IN collection, engineered with a 5D-Complex Multi-Hyaluronic Acid formula that penetrates various dermal layers to quench parched skin. Lightweight, hypoallergenic, and soothing, Torriden’s soothing serums and sheet masks provide clean, non-greasy moisture that plumps and revitalizes fatigued complexions.',
  },
  'Vanicream': {
    name: 'Vanicream',
    slug: 'Vanicream',
    category: 'Dermatologist-Backed',
    logo: '/brand-logos/vanicream.png',
    tagline: 'Dermatological simplicity for hyper-sensitive skin',
    website: 'https://vanicream.com',
    origin: 'United States',
    description: 'Formulated specifically for individuals with ultra-sensitive skin, eczema, and dermatologist-managed allergies, Vanicream eliminates common chemical irritants such as dyes, fragrances, masking fragrances, lanolin, parabens, and formaldehyde. Their cleansers and moisturizing creams provide gentle, dermatological barrier protection trusted by families and medical professionals alike.',
  },
  'Versed': {
    name: 'Versed',
    slug: 'Versed',
    category: 'Clean & Botanical',
    logo: '/brand-logos/versed.png',
    tagline: 'High-performance clean vegan skincare made accessible',
    website: 'https://versedskin.com',
    origin: 'United States',
    description: 'Versed is a clean, accessible skincare brand founded on community feedback and strict European Union cosmetic safety standards. Vegan and cruelty-free, Versed formulates with proven actives like retinol, vitamin C, and zinc without artificial colors, fragrances, or parabens. Packaged sustainably with post-consumer recycled materials, Versed delivers uncomplicated, high-performance skincare for everyday skin goals.',
  },
  'Vichy': {
    name: 'Vichy',
    slug: 'Vichy',
    category: 'Dermatologist-Backed',
    logo: '/brand-logos/vichy.png',
    tagline: 'French volcanic mineralizing water & Minéral 89 booster',
    featured: true,
    website: 'https://vichyusa.com',
    origin: 'France',
    description: 'Sourced from the volcanic region of Auvergne in France, Vichy formulations are enriched with 15 essential minerals found exclusively in Vichy Volcanic Thermal Water. Clinically proven to strengthen the skin barrier against daily exposome aggressors—including pollution, UV rays, and stress—Vichy provides dermatologist-backed hydration through hero lines like Minéral 89 and LiftActiv.',
  },
  'Youth To The People': {
    name: 'Youth To The People',
    slug: 'Youth To The People',
    category: 'Clean & Botanical',
    logo: '/brand-logos/youth-to-the-people.png',
    tagline: 'Superfood antioxidants powered by green biotechnology',
    featured: true,
    website: 'https://youthtothepeople.com',
    origin: 'United States',
    description: 'Born in Los Angeles and grounded in three generations of family esthetics heritage, Youth To The People formulates nutrient-dense superfood skincare powered by cold-pressed greens, antioxidants, and green biotechnology. Known for its best-selling Superfood Cleanser (kale, spinach, green tea) and peptide serums, YTTP delivers clean, pro-grade performance packaged sustainably in recyclable glass.',
  },
};


export const BRAND_DESCRIPTIONS: Record<string, string> = {
  'Anua': 'Driven by the philosophy of gentle simplicity and skin relaxation, South Korean brand Anua focuses on calming sensitized, irritated complexions using high-purity natural extracts. Their signature Heartleaf 77% Soothing Toner is a global K-beauty sensation celebrated for its exceptional ability to reduce redness, soothe breakout-prone skin, and restore balanced hydration. Formulated with dermatologically tested, non-comedogenic ingredients, Anua provides clean, minimalist routines that soothe the skin barrier and bring stressed skin back to equilibrium.',
  
  'Aveeno': 'For over seventy years, Aveeno has championed dermatological wellness through the therapeutic power of nature. Centered around nourishing prebiotic colloidal oat, Aveeno products are clinically proven to soothe, moisturize, and rebuild compromised skin barriers. From everyday daily moisturizing lotions to specialized eczema therapy balms, Aveeno formulas are pediatrician- and dermatologist-recommended, providing fragrance-free, gentle relief for sensitive, dry, and irritated skin.',
  
  'Avene': 'Originating from the picturesque Cévennes mountains of France, Eau Thermale Avène is globally recognized for calming hyper-sensitive, reactive, and allergy-prone skin. Centered around sterile cosmetics technology and therapeutic, mineral-rich thermal spring water backed by more than three hundred pharmacological studies, Avène provides immediate, anti-irritant soothing. Hero treatments like Cicalfate+ Restorative Protective Cream and Tolérance Control offer clinically proven barrier repair for post-procedure, compromised, and eczema-prone complexions.',
  
  'Banila Co': 'A trailblazer in modern Korean beauty, Banila Co is world-renowned for transforming makeup removal into an effortless, luxurious self-care ritual. Their cult-classic Clean It Zero 3-in-1 Cleansing Balm melts away waterproof makeup, excess sebum, and daily environmental impurities without stripping the skin of essential moisture. Infused with soothing acerola extract, hot spring water, and vitamin C, Banila Co pairs innovative sensorial textures with barrier-friendly skincare technology suitable for all skin types.',
  
  'Beauty of Joseon': 'Drawing inspiration from the Joseon Dynasty’s royal court beauty philosophies and the historical Korean holistic manual Gyuhap Chongseo, Beauty of Joseon blends ancient Hanbang herbal medicine with contemporary cosmetic science. Featuring time-honored ingredients like ginseng root, green plum water, propolis, and rice bran extract, their iconic Relief Sun SPF 50+ and Glow Serums restore skin vitality, calm irritation, and deliver an ethereal, dewy radiance that honors timeless Korean heritage.',
  
  'Belif': 'Fusing traditional 19th-century herbal apothecary techniques with cutting-edge Korean skincare science, Belif delivers exceptional hydration through authentic botanical decoctions. Free of mineral oils, synthetic fragrances, and parabens, Belif is famed for its iconic True Cream Aqua Bomb and Moisturizing Bomb, which provide clinical bursts of refreshing moisture that last up to twenty-six hours. Their lightweight, cushiony formulas revitalize tired, parched skin with soothing lady’s mantle and apothecary herbs.',
  
  'Best Naturals': 'Dedicated to pure, reliable wellness and nutritional support, Best Naturals formulates premium vitamins, minerals, and beauty supplements manufactured in state-of-the-art cGMP facilities. From marine collagen peptides to biotin and antioxidant botanical extracts, Best Naturals products support foundational skin health, elasticity, and keratin production from within, empowering consumers to maintain vibrant skin, hair, and nails through scientifically sound daily nutrition.',
  
  'Bioderma': 'Guided by the visionary principle of ecobiology, French dermatological brand Bioderma designs treatments that respect the skin’s natural biological ecosystem rather than artificially over-treating it. Universally celebrated for inventing the modern micellar water with Sensibio H2O, Bioderma provides clinically tested solutions for redness, severe dehydration, eczema, and acne. By strengthening cutaneous defenses, Bioderma empowers compromised and sensitive skin to preserve its long-term health and vitality.',
  
  'Biossance': 'Pioneering sustainable biotechnology in luxury skincare, Biossance revolutionized the beauty industry by developing 100% plant-based squalane derived from renewable sugarcane—saving millions of sharks from unethical harvesting. Squalane mimics the skin’s natural sebum to deliver weightless, non-comedogenic moisture deep into cellular layers. Paired with potent actives like vitamin C, copper peptides, and vegan lactic acid, Biossance provides clean, high-performance anti-aging solutions verified by rigorous clinical standards.',
  
  'Bluebonnet Nutrition': 'For more than three decades, Bluebonnet Nutrition has crafted whole-food-based supplements and beauty nutrients with uncompromising purity and environmental integrity. Featuring clean, non-GMO, and allergen-free formulas, Bluebonnet supplies essential beauty building blocks including hydrolyzed collagen, hyaluronic acid, and cellular antioxidants. Their targeted formulas support dermal elasticity, keratin density, and cellular rejuvenation to promote radiant skin health from the inside out.',
  
  'Bubble Skincare': 'Created to make effective, dermatologist-developed skincare approachable, fun, and accessible, Bubble Skincare offers science-backed routines tailored to youthful and evolving skin. Free of fragrance, harsh sulfates, and common irritants, Bubble utilizes gentle plant extracts paired with proven actives like niacinamide, salicylic acid, and ceramides. Their vibrant, recyclable packaging and straightforward product regimens help clear blemishes, balance oil production, and restore healthy skin barriers.',
  
  'Byoma': 'Dedicated to ending the cycle of over-exfoliation and compromised skin barriers, Byoma formulates barrier-repairing skincare anchored by a science-backed Tri-Ceramide Complex (ceramides, cholesterol, and fatty acids). Packaged in bright, recyclable modular bottles with transparent active ingredient percentages, Byoma provides gentle, non-comedogenic hydration and soothing care for everyday barrier maintenance, leaving skin balanced, calm, and resilient.',
  
  'California Gold Nutrition': 'California Gold Nutrition is a premier wellness brand known for clinical-grade dietary supplements, bioactive botanicals, and inner-beauty essentials. Manufactured in compliant cGMP facilities with independent third-party testing, their hydrolyzed marine collagen peptides, hyaluronic acid complexes, and liposomal vitamin C provide foundational structural support. These targeted nutrients promote dermal collagen synthesis, skin hydration, and youthful radiance from within.',
  
  'Caudalie': 'Born in the sun-drenched vineyards of Bordeaux, France, Caudalie is an eco-luxury skincare brand powered by patented grapevine antioxidants and grape-seed polyphenols. Celebrated for iconic formulations like the Vinoperfect Radiance Dark Spot Serum and the refreshing Beauty Elixir, Caudalie pairs clean, natural botanical chemistry with peer-reviewed anti-aging science to brighten uneven skin tone, refine texture, and protect against environmental oxidative stress.',
  
  'CeraVe': 'Developed with dermatologists, CeraVe is celebrated worldwide for its barrier-first skincare philosophy. Every formulation is powered by three essential, skin-identical ceramides (1, 3, and 6-II) alongside patented MultiVesicular Emulsion (MVE) delivery technology, which continuously releases moisturizing ingredients over twenty-four hours. From the iconic Hydrating Facial Cleanser to the rich Moisturizing Cream, CeraVe provides non-comedogenic, fragrance-free relief suitable for sensitive, acne-prone, and eczema-prone complexions.',
  
  'Cetaphil': 'Formulated in 1947 by an American pharmacist, Cetaphil is one of the world’s most trusted, dermatologist-recommended sensitive skincare brands. Featuring hypoallergenic formulas fortified with hydrating glycerin, panthenol (vitamin B5), and niacinamide (vitamin B3), Cetaphil’s Gentle Skin Cleansers and Daily Moisturizing Lotions defend against the five signs of skin sensitivity without compromising the protective lipid barrier or causing irritation.',
  
  'Clinique': 'Founded in 1968 as the world’s first dermatologist-developed prestige beauty brand, Clinique revolutionized the industry with its custom 3-Step Skin Care System: Cleanse, Exfoliate, and Moisturize. Renowned for its 100% fragrance-free, allergy-tested formulas, Clinique delivers gentle yet high-performance solutions for hydration, brightening, and anti-aging, featuring timeless staples like the Dramatically Different Moisturizing Lotion+ and Moisture Surge 100H Auto-Replenishing Hydrator.',
  
  'COSRX': 'A cornerstone of modern Korean skincare, COSRX (Cosmetics + Prescription) is revered for its results-driven, minimalist formulations designed to treat sensitive and acne-prone skin without irritation. Famous for harnessing ultra-nourishing Advanced Snail 96 Mucin Power Essence and soothing Centella Asiatica, COSRX combines high percentages of natural actives with low-pH balance to heal breakouts, rebuild depleted moisture barriers, and restore lasting suppleness.',
  
  'DaVinci Laboratories': 'With over forty-five years of research-driven clinical nutrition expertise, DaVinci Laboratories crafts physician-formulated supplements designed to support full-body vitality and healthy cellular aging. Their specialty dermal formulas utilize bioactive peptides, antioxidants, and hyaluronic acid to promote collagen production, reinforce cellular membranes, and sustain resilient, hydrated skin from within.',
  
  'Dermalogica': 'Founded in 1986 by skin therapist Jane Wurwand, Dermalogica was created with a clear focus on skin health over superficial beauty. Free of common irritants like artificial colors, synthetic fragrances, and mineral oils, Dermalogica is the trusted choice of professional skin therapists worldwide, known for innovative heroes like the Daily Microfoliant, Special Cleansing Gel, and Dynamic Skin Recovery.',
  
  'Deva': 'Deva Nutrition is a pioneer in 100% vegan, cruelty-free dietary supplements and wellness products. Engineered without animal derivatives or harsh binders, Deva’s beauty and wellness line includes vegan collagen boosters, evening primrose oil, and essential vitamins that nourish cellular rejuvenation and support supple, glowing skin for plant-based lifestyles.',
  
  'Dickinson\'s': 'Carrying on an American botanical legacy established in 1866, Dickinson’s is famous for genuine, all-natural witch hazel distillation. Harvested sustainably from native New England shrublands, Dickinson’s witch hazel cleanses, conditions, and tones skin without synthetic fragrances or harsh additives. Their balancing toners and wipes soothe redness, tighten pores, and gently clarify complexions for everyday skin clarity.',
  
  'Differin': 'Differin revolutionized acne therapy by introducing adapalene—the first FDA-approved over-the-counter prescription-strength retinoid for acne treatment in more than thirty years. Backed by extensive clinical dermatology, Differin Gel targets the root causes of breakouts by regulating cellular turnover, clearing clogged pores, and preventing new acne formations while reducing the risk of post-inflammatory scarring.',
  
  'Doctor\'s': 'Doctor’s formulated wellness lines provide clinical-grade nutritional solutions created in collaboration with healthcare professionals. Combining evidence-based botanical extracts with high-absorption vitamins and bioavailable collagen, these formulas support skin repair, antioxidant defense, and connective tissue resilience.',
  
  'Doctor\'s Best': 'Founded by physicians in 1990, Doctor’s Best delivers science-based nutritional supplements crafted with thoroughly researched, branded raw ingredients. Their beauty-from-within portfolio features bioactive collagen types 1 and 3, pure hyaluronic acid, and Kaneka Q10, all engineered for optimal bioavailability to combat oxidative stress, support dermal matrix integrity, and enhance skin moisture retention.',
  
  'Dr.': 'Dr. clinical skincare brands combine medical dermatology with innovative cosmetic formulations to address targeted concerns such as hyperpigmentation, barrier degradation, and premature aging. Utilizing potent actives with soothing buffering agents, these doctor-developed treatments deliver transformative results with balanced tolerance.',
  
  'Drunk Elephant': 'Founded by Tiffany Masterson, Drunk Elephant pioneered the "clean-compatible" skincare movement by formulating strictly without the "Suspicious 6" (essential oils, drying alcohols, silicones, chemical sunscreens, fragrances/dyes, and SLS). Emphasizing bio-compatible, skin-mimicking ingredients that absorb seamlessly into the acid mantle, Drunk Elephant encourages users to create custom "skincare smoothies" with award-winning heroes like the C-Firma Fresh Day Serum, Protini Polypeptide Cream, and T.L.C. Sukari Babyfacial.',
  
  'e.l.f.': 'e.l.f. Cosmetics & Skincare makes high-performance, trend-forward beauty accessible to every eye, lip, and face. Certified 100% vegan and cruelty-free, e.l.f. SKIN formulates with dermatologist-loved staples including hyaluronic acid, niacinamide, ceramides, and peptides. With cult-favorite collections like Holy Hydration! and Blemish Breakthrough, e.l.f. delivers prestige-caliber results at democratically accessible prices.',
  
  'Elf': 'e.l.f. (Eyes, Lips, Face) provides high-quality, cruelty-free, and vegan skincare formulated with proven dermatological actives. From hydrating cleansers to nourishing barrier creams and SPF essentials, e.l.f. ensures radiant, healthy-looking skin is within everyone’s reach without compromise.',
  
  'Estee Lauder': 'A cornerstone of prestige global beauty since 1946, Estée Lauder combines cutting-edge cellular repair technology with timeless luxury skincare. Their iconic Advanced Night Repair Synchronized Multi-Recovery Complex pioneered nighttime recovery science, harnessing chronobiology to visibly reduce signs of aging, smooth fine lines, and restore skin firmness across all ethnicities and skin types.',
  
  'Farmacy': 'Rooted in science-backed farm-to-face clean beauty, Farmacy sources nutrient-rich botanicals directly from organic farms to formulate potent, clinically proven skincare. Celebrated for its cult-favorite Green Clean Cleansing Balm and honey-infused ceramide moisturizers, Farmacy combines fresh antioxidant superfoods with dermatologist-trusted actives for clean, radiant, and intensely hydrated skin.',
  
  'First Aid Beauty': 'Founded to rescue distressed, dry, and sensitive skin, First Aid Beauty (FAB) creates head-to-toe problem-solving skincare that is allergy-tested and fragrance-free. Their cult-classic Ultra Repair Cream features colloidal oatmeal, shea butter, and ceramides to provide immediate, long-lasting relief from irritation, flaky dryness, and eczema, making it an indispensable home remedy for reactive skin.',
  
  'Force Factor': 'Force Factor is an innovative nutritional supplement brand that formulates clinically researched performance and wellness products. Sourcing premium patented ingredients, their vitality and beauty line features marine collagen, biotin boosters, and superfood antioxidants that support cellular energy, healthy hair, glowing skin, and strong nails.',
  
  'Fresh': 'Bridging time-honored natural beauty rituals with modern cosmetic science, Fresh creates luxurious, sensory skincare powered by potent natural ingredients like soy proteins, real rose petals, black tea ferment, and Umbrian clay. Their indulgent cleansers, antioxidant essences, and sugar lip treatments replenish moisture while providing a comforting, spa-grade experience at home.',
  
  'Garden of Life': 'Garden of Life is dedicated to empowering extraordinary health through clean, certified organic, non-GMO verified whole food nutrition. Their inner-beauty collection offers grass-fed and marine collagen peptides, plant-based biotin, and live probiotics designed to support dermal collagen synthesis, digestive balance, and radiant vitality from within.',
  
  'Garnier': 'Bringing nature-inspired beauty to households worldwide, Garnier blends botanical ingredients with proven skincare actives to deliver approachable, effective daily care. Globally celebrated for its versatile Micellar Cleansing Waters and vitamin C brightening serums, Garnier offers gentle, dermatologist-tested solutions that remove impurities, protect skin barriers, and illuminate dull skin.',
  
  'Glow Recipe': 'Co-founded by Sarah Lee and Christine Chang, Glow Recipe champions fruit-powered, clinically effective skincare that makes achieving glass skin an uplifting sensory ritual. Known for antioxidant-rich, clean formulas featuring watermelon, plum, avocado, and strawberry, their viral Watermelon Glow Niacinamide Dew Drops and PHA+BHA Pore-Tight Toner impart instantaneous hydration, gentle exfoliation, and a lit-from-within glow.',
  
  'Good Molecules': 'Built on the mission of creating "a world where good skincare is actually accessible," Good Molecules designs clean, clinical formulations with complete ingredient transparency and honest pricing. Known for bestsellers like the Niacinamide Brightening Toner and Discoloration Correcting Serum, Good Molecules targets hyperpigmentation, uneven texture, and enlarged pores with scientifically proven concentrations.',
  
  'Hada Labo': 'Guided by the Japanese philosophy of "Perfect and Simple" (Rohto Pharmaceutical), Hada Labo eliminates all unnecessary additives, colorants, and fragrances. World-renowned for its Gokujyun Premium Lotion containing multi-molecular-weight hyaluronic acids, Hada Labo provides unprecedented multi-depth dermal hydration with a lightweight, non-sticky finish that plumps skin from within.',
  
  'Hyalogic': 'Hyalogic is a pioneer and industry leader in premium hyaluronic acid solutions for both topical skincare and nutritional wellness. Utilizing high molecular weight hyaluronic acid produced via natural fermentation, Hyalogic’s serums, mists, and dietary supplements hydrate connective tissues, cushion joint cartilage, and deliver deep cellular moisture for smooth, supple skin.',
  
  'Innisfree': 'Sourcing its botanicals from the pristine volcanic island of Jeju, South Korea, Innisfree is a pioneer in eco-conscious K-beauty. Formulating with organically grown green tea seed extracts, volcanic clusters, and soothing cica, Innisfree delivers balancing hydration, pore-purifying care, and revitalizing radiance tailored for modern, eco-minded lifestyles.',
  
  'Jarrow Formulas': 'Founded in 1977 in Los Angeles, Jarrow Formulas is recognized for science-first nutritional supplements supported by clinical research. Their beauty and cellular support range includes clinically tested biosilicon, hyaluronic acid, and reduced glutathione, which promote collagen cross-linking, antioxidant protection, and radiant cellular vitality.',
  
  'k2o by Kylie Jenner': 'k2o by Kylie Jenner brings contemporary glamour together with daily self-care essentials. Formulated to provide skin-loving moisture, radiant glow, and playful sensory indulgence, k2o combines clean hydration with effortless application for on-the-go lifestyle routines.',
  
  'Kiehl\'s': 'Originating as an old-world apothecary in New York City’s East Village in 1851, Kiehl’s marries botanically derived ingredients with modern skincare efficacy. Renowned for heritage formulations packaged in minimalist pharmaceutical jars, Kiehl’s is celebrated for cult classics such as the Ultra Facial Cream with squalane, Midnight Recovery Concentrate, and Calendula Herbal-Extract Toner, providing restorative nourishment for all skin types and climates.',
  
  'L\'Oreal': 'As a global vanguard in beauty research and cosmetic dermatological science, L\'Oréal Paris combines laboratory innovation with affordable luxury. Famous for breakthrough formulations like the Revitalift 1.5% Pure Hyaluronic Acid Serum and Derm Intensives Glycolic Acid, L\'Oréal delivers clinically verified anti-aging and brightening treatments tested across diverse global skin tones.',
  
  'La Roche-Posay': 'Rooted in dermatological medicine and enriched by the prebiotic, selenium-dense thermal spring water of southwestern France, La Roche-Posay is recommended by over ninety thousand dermatologists worldwide. Formulated under stringent safety standards, their hypoallergenic treatments—including the barrier-restoring Cicaplast Baume B5+, Effaclar acne systems, and Anthelios sun care—are clinically tested to soothe, repair, and defend even the most sensitive and compromised skin barriers.',
  
  'Laneige': 'A leader in Korean hydration science, Laneige has dedicated decades to researching water science and skin vitality. Famous worldwide for its cult-classic Lip Sleeping Mask, Water Sleeping Mask, and Cream Skin Cerapeptide Toner & Moisturizer, Laneige utilizes hydro-ionized mineral water and ceramide peptides to lock in deep, lasting moisture for bouncy, luminous skin.',
  
  'Mario Badescu': 'Founded in 1967 in New York City, Mario Badescu is an enduring botanical skincare institution renowned for personalized, European-style facial solutions. Best known for the iconic pink Drying Lotion that clears blemishes overnight and refreshing Facial Sprays with aloe, herbs, and rosewater, Mario Badescu combines natural botanicals with simple, effective formulations for timeless skin clarity.',
  
  'Mason Natural': 'With over five decades of excellence in nutritional health, Mason Natural manufactures vitamins and wellness supplements committed to purity, affordability, and cGMP standards. Their collagen creams, vitamin E oils, and skin vitamins provide reliable everyday nourishment to sustain skin suppleness and defend against environmental dryness.',
  
  'Maxi Health': 'Maxi Health formulates high-potency, doctor-formulated nutritional supplements strictly adhering to kosher standards and premium quality ingredients. Their specialized dermal and anti-aging supplements combine bioavailable antioxidants, vitamins C and E, and collagen-boosting nutrients to maintain healthy epithelial tissue and vibrant skin integrity.',
  
  'Medik8': 'A British clinical skincare brand driven by science and sustainability, Medik8 is renowned for its signature CSA philosophy: Vitamin C plus Sunscreen by day, Vitamin A (Retinal) by night. Utilizing time-release technology and groundbreaking retinaldehyde formulations, Medik8 delivers transformative anti-aging results with minimal irritation, smoothing fine lines and restoring skin elasticity.',
  
  'MegaFood': 'MegaFood crafts clean, whole-food dietary supplements made with real food sourced from trusted farm partners. Non-GMO Project Verified and certified glyphosate residue free, MegaFood’s skin, hair, and nail formulas blend organic botanicals with whole-food vitamins to support cellular renewal and radiant, healthy skin from the inside out.',
  
  'Metabolic Maintenance': 'Metabolic Maintenance is a practitioner-trusted manufacturer of hypoallergenic, preservative-free nutritional supplements. Packaged in glass bottles to ensure optimal stability, their targeted amino acids, antioxidants, and trace minerals provide fundamental biochemical support for collagen synthesis and tissue repair.',
  
  'Micro Ingredients': 'Specializing in pure, concentrated powder formulations, Micro Ingredients delivers raw superfoods and nutritional beauty supplements free of fillers, additives, and preservatives. Their hydrolyzed collagen peptides, pure hyaluronic acid powders, and organic botanical extracts offer versatile, high-potency daily nourishment to support radiant skin, joint comfort, and hair vitality.',
  
  'Murad': 'Founded in 1989 by board-certified dermatologist and pharmacist Dr. Howard Murad, Murad combines clinical skincare science with holistic cellular hydration philosophies. Renowned for high-potency retinol youth renewals, blemish control clarifying cleansers, and environmental defense vitamin C treatments, Murad targets complex skin concerns with clinical precision.',
  
  'Natural Factors': 'Natural Factors is a family-owned Canadian leader in nutritional wellness, cultivating organic herbs on its own certified organic farmland in the Okanagan Valley. Their inner-beauty portfolio features clinically proven BioSil collagen generators, high-potency antioxidants, and essential fatty acids that nourish dermal health at the cellular level.',
  
  'Nature\'s Bounty': 'For over fifty years, Nature’s Bounty has blended the latest breakthroughs in nutritional science with the finest ingredients to create trusted wellness supplements. Globally famous for their Hair, Skin & Nails gummies with biotin and antioxidant vitamins C and E, Nature’s Bounty supports natural beauty and vitality from within.',
  
  'Nature\'s Truth': 'Nature’s Truth delivers premium-quality dietary supplements, herbal extracts, and essential oils designed to fit modern healthy lifestyles. From collagen peptides to biotin softgels, their beauty formulations provide daily nutritional support to help skin retain moisture, firmness, and natural radiance.',
  
  'Nature\'s Way': 'Dedicated to harnessing the restorative power of nature since 1969, Nature’s Way produces herbal remedies, premium vitamins, and beauty nutrition. Formulated with rigorous botanical validation, their hair, skin, and nail complexes combine biotin, keratin, and whole-plant antioxidants to nourish beauty from the inside out.',
  
  'Naturium': 'Founded with the conviction that high-performance skincare should be democratically accessible, Naturium creates biocompatible formulations utilizing potent active ingredients, plant botanicals, and advanced encapsulation technologies. From multi-action Niacinamide Serum 12% Plus Zinc 2% to rich body washes infused with salicylic acid and glycolic acid, Naturium balances clinical strength with skin comfort.',
  
  'Neocell': 'NeoCell is a pioneering leader in collagen supplementation, dedicated to illuminating individual beauty through the science of bioavailable collagen peptides. Specializing in hydrolyzed collagen types 1 and 3 paired with hyaluronic acid and vitamin C, NeoCell formulas rebuild dermal matrices, improve skin hydration, and restore youthful elasticity from within.',
  
  'Neutrogena': 'Backed by decades of clinical dermatology and consumer skin research, Neutrogena provides accessible, science-led treatments for hydration, acne control, and broad-spectrum sun protection. Famous for breakthrough formulations like the hyaluronic acid-infused Hydro Boost Water Gel and dermatological Helioplex sunscreens, Neutrogena combines cosmetic elegance with proven active efficacy.',
  
  'No BS Skincare': 'Created to strip away deceptive beauty claims, toxic ingredients, and excessive packaging, No B.S. Skincare offers clean, effective skincare formulas that deliver straightforward results. Infused with potent botanicals and dermatological actives like retinol, hyaluronic acid, and vitamin C, No B.S. protects the skin barrier without harmful chemicals or compromises.',
  
  'No7': 'With heritage dating back to 1935 in the United Kingdom, No7 is a trailblazer in accessible, clinically proven anti-aging skincare. Backed by extensive independent clinical trials and dermatological science, No7 is celebrated for its groundbreaking Protect & Perfect and Future Renew peptide serums, which visibly reverse signs of skin damage and restore firm, youthful skin.',
  
  'NOW Foods': 'As an industry-leading family-owned wellness pioneer since 1968, NOW Foods provides comprehensive, pure nutritional supplements and personal care products. Their extensive beauty line features cold-pressed vegetable oils, pure essential oils, hyaluronic acid serums, and hydrolyzed collagen powders tested in state-of-the-art analytical laboratories to guarantee exceptional purity and value.',
  
  'Nutricost': 'Nutricost is committed to providing straightforward, high-potency nutritional supplements made with premium ingredients at fair prices. Sourced and manufactured in GMP-compliant facilities, their beauty products—including hydrolyzed collagen peptides and high-dose biotin—provide clean, dependable nutritional building blocks for skin elasticity and strength.',
  
  'Olay': 'With over seven decades of pioneering anti-aging research and cellular science, Olay is one of the world’s most iconic skincare brands. Powered by proprietary formulations like Vitamin B3 (Niacinamide), Amino-Peptides, and Retinol24 complexes, Olay delivers clinically proven improvements in skin elasticity, moisture retention, and wrinkle reduction across its beloved Regenerist and Super Serum lines.',
  
  'Origins': 'Pioneering the intersection of plant science and skincare efficacy since 1990, Origins harnesses potent botanical extracts and earth-friendly chemistry to formulate high-performance skincare. Renowned for hero collections such as the Mega-Mushroom Relief & Resilience Soothing Treatment Lotion and GinZing Energy-Boosting Moisturizers, Origins revitalizes tired skin while adhering to sustainable, eco-conscious standards.',
  
  'Paula\'s Choice': 'Founded in 1995 by cosmetics cop Paula Begoun, Paula\'s Choice is an industry pioneer in science-backed, truth-in-beauty skincare. Renowned for formulating with optimal concentrations of active ingredients without synthetic fragrances or irritants, the brand revolutionized exfoliation with its cult-status Skin Perfecting 2% BHA Liquid Exfoliant. Their comprehensive line targets stubborn concerns such as enlarged pores, uneven skin texture, stubborn hyperpigmentation, and premature aging with complete ingredient transparency.',
  
  'Peter': 'Peter Thomas Roth clinical skincare combines breakthrough technologies with effective ingredient concentrations to deliver rapid, dramatic improvements in skin health. Famous for innovative exfoliating peel pads, peptide wrinkle fighters, and refreshing hydrating gel masks, the brand addresses tough concerns from deep wrinkles to acne with clinical strength.',
  
  'Pixi': 'Created by makeup artist and product developer Petra Strand, Pixi Beauty provides botanical-infused skincare designed to reveal naturally radiant, "just had a good night’s sleep" skin. Celebrated globally for the iconic Glow Tonic formulated with 5% glycolic acid, aloe vera, and ginseng, Pixi gently exfoliates dead surface cells to clarify pores and impart a luminous, youthful glow.',
  
  'Protocol for Life Balance': 'Protocol for Life Balance is a healthcare-exclusive brand of clinical supplements formulated to support physiological homeostasis and tissue longevity. Utilizing pharmaceutical-grade testing and bioavailable delivery systems, their skin support nutrients provide targeted cellular protection against oxidative stress and environmental aging.',
  
  'Purity Products': 'For more than twenty-five years, Purity Products has developed evidence-based nutritional supplements that merge cutting-edge clinical science with whole-body vitality. Their beauty formulas feature patented collagen complexes, astaxanthin, and liposomal antioxidants that work synergistically to support dermal structure and healthy aging.',
  
  'Pyunkang Yul': 'Developed by the renowned Pyunkang Oriental Medicine Clinic in South Korea, Pyunkang Yul formulates minimalist, hypoallergenic skincare rooted in Eastern holistic principles. Stripping away unnecessary fragrances and synthetic fillers, their iconic Essence Toner harnesses milk vetch root extract to replenish moisture balance, calm inflammation, and restore vitality to stressed complexions.',
  
  'RoC': 'Founded in France by pharmacist Dr. Jean-Louis Dousseau in 1957, RoC was the first brand to discover a method of stabilizing pure retinol. Backed by dozens of published clinical studies, RoC’s anti-aging treatments—including the Retinol Correxion Deep Wrinkle Daily Moisturizer and Eye Creams—remain dermatologist-recommended benchmarks for smoothing wrinkles and firming aging skin.',
  
  'Round Lab': 'Utilizing pure, nutrient-dense natural resources from pristine regions across the Korean peninsula—such as mineral-rich deep sea water from Ulleungdo and birch sap from Inje—Round Lab creates gentle, hypoallergenic skincare. Their Dokdo 1025 Toner and Birch Juice Moisturizing Sun Cream are celebrated globally for reinforcing skin barrier function and providing lasting, cooling hydration.',
  
  'Shiseido': 'Merging over 150 years of Japanese aesthetic tradition with modern dermatological biotechnology, Shiseido creates transformative, high-performance skincare. Famous for its Ultimune Power Infusing Serum and Bio-Performance lines, Shiseido focuses on strengthening skin’s natural immunity, defensive barriers, and inner vitality for timeless, resilient radiance.',
  
  'Simple': 'Born in the United Kingdom in 1960, Simple is the pioneer in clean, sensitive skincare crafted with zero artificial perfumes, dyes, or harsh chemicals that can upset skin. Enriched with skin-loving ingredients like pro-vitamin B5, vitamin E, and triple-purified water, Simple’s cleansers, micellar waters, and lightweight moisturizers deliver gentle, barrier-friendly care every day.',
  
  'SKIN1004': 'Harnessing the pure, untreated healing power of Centella Asiatica harvested from the untouched nature of Madagascar, SKIN1004 delivers soothing, hypoallergenic skincare for sensitive and acne-prone skin. Their signature Madagascar Centella Ampoule and Hyalu-Cica sun serums offer lightweight, non-sticky hydration that repairs weakened moisture barriers and calms irritation.',
  
  'SkinCeuticals': 'As the pioneer of cosmeceuticals founded on Dr. Sheldon Pinnell’s peer-reviewed antioxidant research, SkinCeuticals is the gold standard in medical-grade skincare. Known for patented stabilized formulations featuring optimal pH levels and pure L-ascorbic acid, their legendary C E Ferulic serum and Triple Lipid Restore 2:4:2 are clinically proven to neutralize environmental free radicals, reverse visible photo-damage, and accelerate post-procedure recovery.',
  
  'Skinfix': 'Formulated by dermatologists and validated through rigorous clinical trials, Skinfix is dedicated exclusively to restoring and reinforcing the cutaneous lipid barrier. Utilizing active lipid complexes, ceramides, and targeted cosmeceutical actives, Skinfix delivers clinically proven relief for eczema, redness, post-procedure recovery, and severe dryness without compromising skin balance.',
  
  'Solaray': 'Founded in 1973, Solaray is an industry pioneer in clean, lab-verified herbal supplements and whole-body wellness. Packaged in post-consumer recycled bottles, Solaray’s targeted beauty line includes timed-release vitamin C, zinc, and collagen support formulas designed to defend against cellular oxidation and sustain glowing skin health.',
  
  'Solgar': 'For over seventy-five years, Solgar has represented the gold standard in premium nutritional science. Packaged in iconic amber glass bottles to preserve nutrient potency, Solgar’s dermatological supplements—including advanced Zinc Picolinate, Biotin, and Skin, Nails & Hair formula—nourish the dermal matrix and promote radiant elasticity through bioavailable minerals and amino acids.',
  
  'Some By Mi': 'Renowned for its transformative "30 Days Miracle" line, Korean skincare brand Some By Mi combines gentle chemical exfoliants (AHA, BHA, and PHA) with soothing tea tree leaf water and centella asiatica. Designed to refine pore texture, clear stubborn blemishes, and gently lift dead skin cells, Some By Mi delivers visible clinical results without stripping delicate facial skin.',
  
  'Source Naturals': 'Founded in 1982 by Ira Goldberg, Source Naturals is committed to bio-aligned wellness formulas that support systemic physiological balance. Sourcing pure nutrients, their beauty supplements include alpha lipoic acid, hyaluronic acid complexes, and marine collagen designed to protect against free radical damage and maintain firm, healthy skin.',
  
  'St. Ives': 'Dedicated to bringing the mood-boosting power of nature into everyday self-care, St. Ives formulates with 100% natural exfoliants, extracts, and moisturizers. Famous for its classic Apricot Scrubs and soothing oatmeal body washes, St. Ives gently polishes away dull surface skin to reveal fresh, glowing, and velvety soft skin.',
  
  'Summer Fridays': 'Founded by beauty influencers Marianna Hewitt and Lauren Ireland, Summer Fridays crafts clean, vegan skincare formulated to provide instant radiance and effortless daily pampering. Famous for the viral Jet Lag Mask and nourishing Lip Butter Balms, Summer Fridays blends hydrating ceramides, hyaluronic acid, and botanical extracts to banish dull, fatigued skin.',
  
  'Swanson Vitamins': 'Since 1969, Swanson Vitamins has delivered high-purity, science-backed wellness supplements directly to consumers worldwide. Formulated to meet stringent cGMP requirements, Swanson’s inner-beauty collection offers hydrolyzed collagen, hyaluronic acid, and evening primrose oil to support dermal moisture retention, keratin production, and youthful suppleness.',
  
  'Tatcha': 'Inspired by centuries-old Japanese beauty rituals and geisha skincare traditions recorded in Kyoto, Tatcha crafts luxury skincare centered on Hadasei-3—a proprietary fermented complex of green tea, rice, and Okinawa red algae. Harmonizing mindful ritual with modern biomimicry, Tatcha’s award-winning formulations like The Dewy Skin Cream, The Water Cream, and The Rice Polish gently refine texture while replenishing deep moisture and radiant luminescence.',
  
  'Thayers': 'Founded in 1847 by Dr. Henry Thayer, Thayers is an American heritage brand celebrated for its gentle, alcohol-free facial toners. Infused with organic, non-distilled certified witch hazel and aloe vera, Thayers calms irritation, refines pores, and balances facial moisture while preserving the natural skin barrier.',
  
  'The Inkey List': 'Built on the belief that better knowledge powers better skin, The Inkey List breaks down complex cosmetic science into straightforward, single-hero ingredient treatments. Offering targeted solutions from Salicylic Acid Cleansers to Polyglutamic Acid Serums and Retinol eye creams, the brand delivers transparent, budget-friendly skincare education paired with potent clinical efficacy.',
  
  'The Ordinary': 'Launched by DECIEM to democratize high-potency skincare, The Ordinary transformed the global beauty landscape by stripping away marketing jargon and presenting clinical actives at honest, accessible prices. Known for single-molecule serums like Niacinamide 10% + Zinc 1% and Hyaluronic Acid 2% + B5, the brand empowers users to customize their skincare routines based on targeted scientific mechanisms. Their minimalist, clinical dropper bottles are an indispensable staple for active-focused skincare enthusiasts.',
  
  'Toniiq': 'Toniiq creates ultra-high potency, standardized botanical extracts and health supplements verified through third-party laboratory testing. Utilizing advanced extraction methods, Toniiq beauty formulations—such as concentrated resveratrol, glutathione, and nicotinamide mononucleotide—provide powerful antioxidant defense to protect dermal cells from oxidative aging.',
  
  'Torriden': 'Award-winning Korean hydration specialist Torriden is renowned for its DIVE-IN collection, engineered with a 5D-Complex Multi-Hyaluronic Acid formula that penetrates various dermal layers to quench parched skin. Lightweight, hypoallergenic, and soothing, Torriden’s soothing serums and sheet masks provide clean, non-greasy moisture that plumps and revitalizes fatigued complexions.',
  
  'Vanicream': 'Formulated specifically for individuals with ultra-sensitive skin, eczema, and dermatologist-managed allergies, Vanicream eliminates common chemical irritants such as dyes, fragrances, masking fragrances, lanolin, parabens, and formaldehyde. Their cleansers and moisturizing creams provide gentle, dermatological barrier protection trusted by families and medical professionals alike.',
  
  'Versed': 'Versed is a clean, accessible skincare brand founded on community feedback and strict European Union cosmetic safety standards. Vegan and cruelty-free, Versed formulates with proven actives like retinol, vitamin C, and zinc without artificial colors, fragrances, or parabens. Packaged sustainably with post-consumer recycled materials, Versed delivers uncomplicated, high-performance skincare for everyday skin goals.',
  
  'Vichy': 'Sourced from the volcanic region of Auvergne in France, Vichy formulations are enriched with 15 essential minerals found exclusively in Vichy Volcanic Thermal Water. Clinically proven to strengthen the skin barrier against daily exposome aggressors—including pollution, UV rays, and stress—Vichy provides dermatologist-backed hydration through hero lines like Minéral 89 and LiftActiv.',
  
  'Vitamatic': 'Vitamatic offers innovative nutritional supplements designed to make daily health support enjoyable and easy. Specializing in delicious gummy vitamins and chewables formulated without artificial flavors, their beauty collection features biotin and collagen boosters that support healthy skin, thick hair, and resilient nails.',
  
  'Vitauthority': 'Vitauthority is dedicated to providing high-potency, multi-collagen wellness products formulated with bioavailable peptides and complementary beauty actives. Combining multiple collagen types with hyaluronic acid and vitamin C, Vitauthority formulas support skin elasticity, cellulite reduction, and joint flexibility for whole-body radiance.',
  
  'Youth To The People': 'Born in Los Angeles and grounded in three generations of family esthetics heritage, Youth To The People formulates nutrient-dense superfood skincare powered by cold-pressed greens, antioxidants, and green biotechnology. Known for its best-selling Superfood Cleanser (kale, spinach, green tea) and peptide serums, YTTP delivers clean, pro-grade performance packaged sustainably in recyclable glass.',
  
  'Youtheory': 'Youtheory is a Southern California wellness brand dedicated to inspiring wellness in all through premium supplements and beauty nutrition. Famous for its doctor-recommended hydrolyzed collagen formulas enhanced with vitamin C, Youtheory replenishes vital structural proteins to counteract the effects of aging and support firm, youthful skin.'
};

export const BRAND_CATEGORIES: BrandCategory[] = [
  'All',
  'Clinical Actives',
  'Dermatologist-Backed',
  'K-Beauty',
  'Luxury & Prestige',
  'Clean & Botanical',
  'Daily Essentials',
];

export function getBrandMeta(brandName: string): BrandMeta {
  const trimmed = brandName?.trim() || '';
  const filename = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '.png';

  let meta: BrandMeta = {
    name: trimmed,
    slug: trimmed,
    category: 'Daily Essentials',
    logo: `/brand-logos/${filename}`,
    tagline: `Skincare products from ${trimmed}`,
  };

  if (BRAND_DIRECTORY[trimmed]) {
    meta = { ...BRAND_DIRECTORY[trimmed] };
  } else {
    // Fallback matching
    const lower = trimmed.toLowerCase();
    for (const [key, val] of Object.entries(BRAND_DIRECTORY)) {
      if (key.toLowerCase() === lower || val.name.toLowerCase() === lower) {
        meta = { ...val };
        break;
      }
    }
  }

  // Ensure description is attached from BRAND_DESCRIPTIONS if present
  if (!meta.description) {
    if (BRAND_DESCRIPTIONS[trimmed]) {
      meta.description = BRAND_DESCRIPTIONS[trimmed];
    } else {
      const lower = trimmed.toLowerCase();
      for (const [k, d] of Object.entries(BRAND_DESCRIPTIONS)) {
        if (k.toLowerCase() === lower) {
          meta.description = d;
          break;
        }
      }
    }
  }

  // Dynamic fallback description of at least 1 rich paragraph
  if (!meta.description) {
    meta.description = `${meta.name} is a curated skincare and wellness brand dedicated to effective, skin-friendly formulations. Explore our catalog to compare prices, verify ingredients, and find the best deals on authentic ${meta.name} essentials for your daily routine.`;
  }

  return meta;
}

export function getBrandLogo(brandName: string): string {
  const meta = getBrandMeta(brandName);
  return meta.logo;
}
