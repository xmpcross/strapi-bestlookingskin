'use client';

import { usePathname } from 'next/navigation';
import { isBlushPath } from '@/lib/blush';

/**
 * Wraps the Magzin header, footer and back-to-top in the root layout. On the home page and on articles, which
 * draw their own Blush header and footer, it renders nothing, so the page carries one set of navigation, not two.
 */
export default function ChromeGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return isBlushPath(pathname) ? null : <>{children}</>;
}

/**
 * The root layout's <main>. Blush pages draw their own header, <main> and footer, so for them this is a plain
 * fragment; every other page keeps the <main> it always had.
 */
export function MainGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return isBlushPath(pathname) ? <>{children}</> : <main>{children}</main>;
}
