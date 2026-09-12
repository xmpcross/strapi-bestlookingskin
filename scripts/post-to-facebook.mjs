import fs from 'fs';
import path from 'path';

/**
 * Facebook Graph API Auto-Poster Script for BestLooking.Skin
 * 
 * Usage Options:
 * 
 * 1. Post custom message + link:
 *    node scripts/post-to-facebook.mjs --message="Check out our new CeraVe vs Cetaphil comparison!" --link="https://www.bestlooking.skin/product-comparisons"
 * 
 * 2. Post image photo attachment + caption:
 *    node scripts/post-to-facebook.mjs --message="Hydrating Serum Battles" --imageUrl="https://www.bestlooking.skin/images/hero.jpg"
 * 
 * Environment Variables required in .env.local:
 *   FACEBOOK_PAGE_ID=your_page_id
 *   FACEBOOK_PAGE_ACCESS_TOKEN=your_long_lived_page_token
 */

function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const [key, ...valueParts] = trimmed.split('=');
        const val = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
        if (key && !process.env[key.trim()]) {
          process.env[key.trim()] = val;
        }
      }
    });
  }
}

loadEnv();

async function postToFacebook() {
  const PAGE_ID = process.env.FACEBOOK_PAGE_ID;
  const ACCESS_TOKEN = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;

  if (!PAGE_ID || !ACCESS_TOKEN) {
    console.error('❌ Missing FACEBOOK_PAGE_ID or FACEBOOK_PAGE_ACCESS_TOKEN in environment variables.');
    console.error('Please add FACEBOOK_PAGE_ID and FACEBOOK_PAGE_ACCESS_TOKEN to .env.local before running.');
    process.exit(1);
  }

  // Parse command line arguments
  const args = process.argv.slice(2);
  let message = '';
  let link = '';
  let imageUrl = '';

  args.forEach(arg => {
    if (arg.startsWith('--message=')) message = arg.replace('--message=', '');
    if (arg.startsWith('--link=')) link = arg.replace('--link=', '');
    if (arg.startsWith('--imageUrl=')) imageUrl = arg.replace('--imageUrl=', '');
  });

  if (!message) {
    message = `🧪 CeraVe vs. Cetaphil: Which Hydrating Cleanser actually wins for dry skin?\n\nRead our full formula comparison & ingredient breakdown on BestLooking.Skin:\n#Skincare #BestLookingSkin #BeautyGuide`;
  }

  if (!link && !imageUrl) {
    link = 'https://www.bestlooking.skin/product-comparisons';
  }

  // Endpoint selector: /photos for image posts vs /feed for link/text posts
  const endpoint = imageUrl
    ? `https://graph.facebook.com/v19.0/${PAGE_ID}/photos`
    : `https://graph.facebook.com/v19.0/${PAGE_ID}/feed`;

  console.log(`🚀 Publishing post to Facebook Page (${PAGE_ID})...`);

  try {
    const payload = imageUrl
      ? { caption: message, url: imageUrl, access_token: ACCESS_TOKEN }
      : { message: message, link: link, access_token: ACCESS_TOKEN };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (data.error) {
      console.error('❌ Facebook API Error:', data.error.message);
      if (data.error.code === 200) {
        console.log('\n💡 Meta verification check in progress. Once Meta completes your App Verification / permissions approval, this script will publish live automatically!');
      }
      process.exit(1);
    }

    console.log('🎉 SUCCESS! Published live to Facebook Page!');
    console.log(`📌 Facebook Post ID: ${data.id || data.post_id}`);
  } catch (err) {
    console.error('❌ Network / Request Error:', err);
    process.exit(1);
  }
}

postToFacebook();
