/**
 * Pull quote: a sentence lifted from the article and set as a highlight (Magzin blockquote).
 *
 * No attribution line. The template showed "By Jimmy Dave" under the quote, but this is the article's own
 * sentence restated for emphasis; putting a name under it would attribute the site's words to someone who
 * never said them. If a post ever quotes a real source, that belongs in the body with the source named there.
 */
export default function PullQuote({ text }: { text: string }) {
  if (!text) return null;
  return (
    <figure className="blockquote my-5" data-testid="pull-quote">
      <blockquote className="m-0">
        <p className="text-dark m-0 fs-5 fw-medium">{text}</p>
      </blockquote>
    </figure>
  );
}
