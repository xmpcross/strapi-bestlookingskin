import { SOCIAL_PATHS } from './social-icons';

export type IconName =
  | 'arrow-right' | 'arrow-left' | 'chevron-down' | 'search' | 'sun' | 'moon' | 'menu' | 'close'
  | 'calendar' | 'clock' | 'bookmark';
export type SocialName = 'facebook' | 'twitter-x' | 'pinterest' | 'whatsapp' | 'envelope' | 'link-45deg' | 'rss' | 'share';

/** Small stroked UI icons on a 24x24 grid (editorial chrome). */
export function Icon({ name, size = 16, className }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {name === 'arrow-right' && <path d="M5 12h13m-6-6 6 6-6 6" />}
      {name === 'arrow-left' && <path d="M19 12H6m6-6-6 6 6 6" />}
      {name === 'chevron-down' && <path d="m6 9 6 6 6-6" />}
      {name === 'calendar' && (<><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3v4m8-4v4M3 10h18" /></>)}
      {name === 'clock' && (<><circle cx="12" cy="12" r="9" /><path d="M12 7v5.2l3.2 1.9" /></>)}
      {name === 'search' && (<><circle cx="11" cy="11" r="6.5" /><path d="m16.5 16.5 4 4" /></>)}
      {name === 'sun' && (<><circle cx="12" cy="12" r="4" /><path d="M12 3v2m0 14v2M3 12h2m14 0h2M5.6 5.6 7 7m10 10 1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4" /></>)}
      {name === 'bookmark' && <path d="M6.5 4.5h11V21L12 16.6 6.5 21Z" />}
      {name === 'moon' && <path d="M20 14.2A7.4 7.4 0 0 1 9.8 4a8.6 8.6 0 1 0 10.2 10.2Z" />}
      {name === 'menu' && <path d="M4 7h16M4 12h16M4 17h16" />}
      {name === 'close' && <path d="M6 6l12 12M18 6 6 18" />}
    </svg>
  );
}

/** Filled brand marks on a 16x16 grid. */
export function SocialIcon({ name, size = 16, className }: { name: SocialName; size?: number; className?: string }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" focusable="false">
      {(SOCIAL_PATHS[name] ?? []).map((d, i) => <path key={i} d={d} />)}
    </svg>
  );
}
