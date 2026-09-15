/**
 * Outline-cartoon author avatar.
 *
 * Inline SVG line art rather than an image: no upload to manage, no request,
 * and it inherits currentColor so it works on the light byline and the dark
 * footer alike.
 *
 * Two variants, chosen from the name, so the site's authors are visually
 * distinct without anyone drawing a portrait. Deliberately generic faces --
 * a cartoon that looked like a specific person would be inventing a likeness
 * for a byline, which is the sort of small fiction this site should avoid.
 *
 * bls-author.avatarUrl wins when it is set, so a real photo can replace this
 * without touching any of the call sites.
 */
export default function AuthorAvatar({
  name,
  src,
  size = 28,
  shape = 'circle',
  className = '',
}: {
  name: string;
  src?: string | null;
  size?: number;
  /** The bio card uses a rounded square; bylines stay circular. */
  shape?: 'circle' | 'square';
  className?: string;
}) {
  const radius = shape === 'square' ? 16 : '50%';
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={src}
        alt={name}
        width={size}
        height={size}
        className={className}
        style={{ borderRadius: radius, objectFit: 'cover', flexShrink: 0 }}
        loading="lazy"
      />
    );
  }

  /* Sum of code points: stable for a given name, and unlike a random pick it
     gives the same author the same face on every page. */
  const variant = [...name].reduce((n, c) => n + c.charCodeAt(0), 0) % 2;

  return (
    <span
      className={`d-inline-flex align-items-center justify-content-center text-600 ${className}`}
      style={{ width: size, height: size, borderRadius: radius, border: '1px solid var(--tc-neutral-300)', background: 'var(--tc-neutral-50)', flexShrink: 0 }}
      aria-hidden
    >
      <svg
        viewBox="0 0 32 32"
        width={size * 0.72}
        height={size * 0.72}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* head */}
        <circle cx="16" cy="12" r="6" />
        {/* shoulders */}
        <path d="M5.5 28c1.4-5.4 5.6-8.2 10.5-8.2S25.1 22.6 26.5 28" />
        {variant === 0 ? (
          /* short fringe */
          <path d="M10.4 9.6c1.7-2.4 9.5-2.4 11.2 0" />
        ) : (
          /* longer hair, tucked behind */
          <path d="M10 12.4c-.4-4 2.5-6.4 6-6.4s6.4 2.4 6 6.4M10.6 12.6c-.9 1.6-.9 3.4-.4 4.6M21.4 12.6c.9 1.6.9 3.4.4 4.6" />
        )}
      </svg>
    </span>
  );
}
