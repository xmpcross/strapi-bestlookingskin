/**
 * A category's introduction: the CMS description split into paragraphs on blank lines.
 *
 * The first paragraph always shows; any further paragraphs sit behind a "Read more" link. It is a native
 * <details>, so it needs no client JavaScript and the collapsed text stays in the HTML for search engines.
 */
export default function CategoryIntro({ text }: { text: string }) {
  const paras = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  if (!paras.length) return null;
  const [first, ...rest] = paras;

  return (
    <div className="bls-category-intro mt-3">
      <p>{first}</p>
      {rest.length > 0 && (
        <details className="bls-category-intro-more">
          <summary>
            <span className="more">Read more</span>
            <span className="less">Read less</span>
          </summary>
          {rest.map((para) => (
            <p key={para.slice(0, 40)}>{para}</p>
          ))}
        </details>
      )}
    </div>
  );
}
