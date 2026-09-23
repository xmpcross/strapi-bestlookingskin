import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { PRICE_ALERTS_ENABLED } from '@/lib/site';

const BASE = (process.env.NEXT_PUBLIC_STRAPI_URL || 'https://cms.fxnstudio.com').replace(/\/$/, '');
// Writes need a token with create permission on commerce-price-alert.
const WRITE_TOKEN = process.env.STRAPI_WRITE_TOKEN || process.env.STRAPI_API_TOKEN || '';

type AlertPayload = {
  email?: string;
  productDocumentId?: string;
  targetPrice?: number | string;
  currency?: string;
  currentPrice?: number | string;
};

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: Request) {
  if (!PRICE_ALERTS_ENABLED) {
    return NextResponse.json({ message: 'Price alerts are not available.' }, { status: 410 });
  }
  let payload: AlertPayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: 'Please submit the form again.' }, { status: 400 });
  }

  const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase().slice(0, 180) : '';
  const productDocumentId = typeof payload.productDocumentId === 'string' ? payload.productDocumentId.trim() : '';
  const targetPrice = Number(payload.targetPrice);
  const currency = (typeof payload.currency === 'string' && payload.currency.trim()) || 'USD';
  const priceAtSignup = Number(payload.currentPrice);

  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ message: 'Please enter a valid email address.' }, { status: 400 });
  }
  if (!productDocumentId) {
    return NextResponse.json({ message: 'Missing product reference.' }, { status: 400 });
  }
  if (!Number.isFinite(targetPrice) || targetPrice <= 0) {
    return NextResponse.json({ message: 'Please enter a valid target price.' }, { status: 400 });
  }
  if (!WRITE_TOKEN) {
    return NextResponse.json({ message: 'Price alerts are not configured yet.' }, { status: 500 });
  }

  try {
    const res = await fetch(`${BASE}/api/commerce-price-alerts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${WRITE_TOKEN}`,
      },
      body: JSON.stringify({
        data: {
          email,
          product: productDocumentId,
          targetPrice,
          currency,
          ...(Number.isFinite(priceAtSignup) && priceAtSignup > 0 ? { priceAtSignup } : {}),
          alertStatus: 'active',
          cancelToken: randomUUID().replace(/-/g, ''),
          source: 'bestlooking.skin',
        },
      }),
    });

    if (!res.ok) {
      console.error('Price alert create failed:', res.status, await res.text().catch(() => ''));
      return NextResponse.json({ message: 'Could not save your alert. Please try again.' }, { status: 502 });
    }

    return NextResponse.json({ message: "Alert set — we'll email you when the price drops." });
  } catch (error) {
    console.error('Price alert error:', error);
    return NextResponse.json({ message: 'Could not save your alert. Please try again.' }, { status: 500 });
  }
}
