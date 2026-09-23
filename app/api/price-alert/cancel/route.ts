import { NextResponse } from 'next/server';

const BASE = (process.env.NEXT_PUBLIC_STRAPI_URL || 'https://cms.fxnstudio.com').replace(/\/$/, '');
const WRITE_TOKEN = process.env.STRAPI_WRITE_TOKEN || process.env.STRAPI_API_TOKEN || '';

function page(message: string, status = 200) {
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Price alert</title>
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <style>@font-face{font-family:Outfit;font-weight:100 900;font-display:swap;src:url(/fonts/Outfit-Variable-latin.woff2) format('woff2')}body{font-family:Outfit,system-ui,sans-serif;color:#222;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0;background:#faf9f7}
    .card{max-width:420px;padding:32px;text-align:center}a{color:#e33333}</style></head>
    <body><div class="card"><h2>${message}</h2><p><a href="https://bestlooking.skin">Back to BestLooking.Skin</a></p></div></body></html>`;
  return new NextResponse(html, { status, headers: { 'Content-Type': 'text/html' } });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token') || '';
  const id = url.searchParams.get('id') || '';

  if (!token || !id) return page('Invalid cancellation link.', 400);
  if (!WRITE_TOKEN) return page('Price alerts are not configured yet.', 500);

  try {
    // Verify the token matches the stored alert before cancelling.
    const lookup = await fetch(
      `${BASE}/api/commerce-price-alerts/${encodeURIComponent(id)}?fields[0]=cancelToken&fields[1]=alertStatus`,
      { headers: { Authorization: `Bearer ${WRITE_TOKEN}` }, cache: 'no-store' },
    );
    if (!lookup.ok) return page('Alert not found.', 404);
    const found = (await lookup.json())?.data;
    if (!found || found.cancelToken !== token) return page('Invalid cancellation link.', 400);

    if (found.alertStatus === 'cancelled') return page('This alert is already cancelled.');

    const res = await fetch(`${BASE}/api/commerce-price-alerts/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${WRITE_TOKEN}` },
      body: JSON.stringify({ data: { alertStatus: 'cancelled' } }),
    });
    if (!res.ok) return page('Could not cancel the alert. Please try again.', 502);

    return page('Your price alert has been cancelled.');
  } catch {
    return page('Something went wrong. Please try again.', 500);
  }
}
