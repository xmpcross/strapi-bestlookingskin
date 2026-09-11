/**
 * Pull quote: a sentence lifted from the article and set as a highlight.
 *
 * No attribution line. The reference design showed "— Dalai Lama" under the
 * quote, but this is the article's own sentence restated for emphasis, which is
 * ordinary editorial practice; putting a name under it would be attributing the
 * site's words to someone who never said them. If a post ever quotes a real
 * source, that belongs in the body with the source named there.
 */
export default function PullQuote({ text }: { text: string }) {
  if (!text) return null;
  return (
    <figure className="my-10 flex gap-5 rounded-xl bg-muted px-6 py-7" data-testid="pull-quote">
      <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor" aria-hidden className="mt-1 shrink-0 text-ink">
        <path d="M3 14.5C3 10.4 5.6 7.2 9.6 6l.8 2.1C8 9 6.6 10.6 6.4 12.5H9.6V18H3v-3.5Zm10.4 0C13.4 10.4 16 7.2 20 6l.8 2.1c-2.4.9-3.8 2.5-4 4.4H20V18h-6.6v-3.5Z" />
      </svg>
      <blockquote className="!m-0 !border-0 !bg-transparent !p-0 font-display text-[17px] font-bold leading-7 !not-italic text-ink">
        {text}
      </blockquote>
    </figure>
  );
}
