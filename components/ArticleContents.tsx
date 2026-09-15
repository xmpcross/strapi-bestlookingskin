import type { TocItem } from '@/lib/toc';

/**
 * "Contents" box placed after the article's first paragraph: a bulleted list of the section (h2) headings,
 * each an anchor to its heading. Built from the same pass that gives the headings their ids, so the links
 * cannot drift from the body. Fewer than three sections is not worth a contents list, so it renders nothing.
 */
export default function ArticleContents({ toc }: { toc: TocItem[] }) {
  const items = toc.filter((t) => t.level === 2);
  if (items.length < 3) return null;
  return (
    <nav className="article-contents" aria-labelledby="article-contents-title" data-testid="article-contents">
      <p id="article-contents-title" className="article-contents-title">
        Contents
      </p>
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            <a href={`#${item.id}`}>{item.text}</a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
