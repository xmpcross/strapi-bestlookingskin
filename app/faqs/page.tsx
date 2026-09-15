import { isMarkdownBody, markdownToHtml } from '@/lib/markdown';
import Link from 'next/link';
import type { Metadata } from 'next';
import { listPosts, type BlsPost } from '@/lib/strapi';
import { decodeEntities } from '@/lib/toc';
import { postPath } from '@/lib/format';
import { SITE } from '@/lib/site';
import Breadcrumb from '@/components/magzin/Breadcrumb';

export const revalidate = 600;

export const metadata: Metadata = {
  title: 'FAQs',
  description: `Common skincare questions answered across ${SITE.name}, each linked to the guide the answer comes from.`,
  alternates: { canonical: `${SITE.url}/faqs` },
};

/**
 * Site-wide FAQ index.
 *
 * Built because the footer links here and /faqs was not a route -- it fell
 * through to the catch-all category page, which renders an empty "No posts here
 * yet" with a 200, so the link looked fine and led nowhere.
 *
 * Every question is lifted from an article's own FAQ section rather than
 * written for this page: these are answers the site already stands behind, and
 * each links back to the article it came from. Nothing is invented to pad it.
 */
type Entry = { question: string; answer: string; href: string; postTitle: string };
type Group = { name: string; slug: string; entries: Entry[] };

const strip = (v: string) => decodeEntities(v.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();

/**
 * Pull the Q&A pairs out of one post.
 *
 * Scans *every* FAQ-shaped heading rather than stopping at the first. The
 * imported WordPress posts carry GreenShift blocks whose own markup mentions
 * FAQ well above the real section, so anchoring on the first match read an
 * empty block and reported the post as having no FAQ -- six posts and roughly
 * forty answers were being dropped that way.
 */
function extract(post: BlsPost): Entry[] {
  const html = isMarkdownBody(post.content) ? markdownToHtml(post.content ?? '') : post.content || '';
  const headings = [...html.matchAll(/<h([23])\b[^>]*>(?:(?!<\/h\1>).)*(?:FAQ|Frequently\s+Asked)(?:(?!<\/h\1>).)*<\/h\1>/gi)];

  for (const m of headings) {
    if (m.index === undefined) continue;
    const after = html.slice(m.index + m[0].length);
    const stop = after.search(/<h2\b/i);
    const body = stop === -1 ? after : after.slice(0, stop);

    /* The same two shapes the in-article accordion handles: h3 headings, or a
       bold question leading a paragraph. */
    let pairs = [...body.matchAll(/<h3\b[^>]*>([\s\S]*?)<\/h3>([\s\S]*?)(?=<h3\b|$)/gi)]
      .map((p) => ({ q: strip(p[1]), a: strip(p[2]) }));
    if (pairs.length < 2) {
      pairs = [...body.matchAll(/<p[^>]*>\s*<strong[^>]*>([\s\S]*?)<\/strong>([\s\S]*?)<\/p>/gi)]
        .map((p) => ({ q: strip(p[1]), a: strip(p[2]) }))
        .filter((p) => p.q.endsWith('?'));
    }

    pairs = pairs.filter((p) => p.q && p.a);
    if (pairs.length >= 2) {
      return pairs.map((p) => ({ question: p.q, answer: p.a, href: postPath(post), postTitle: post.title }));
    }
  }
  return [];
}

/** Every published post, not just the first page -- the library is ~200. */
async function allPosts(): Promise<BlsPost[]> {
  const out: BlsPost[] = [];
  for (let page = 1; page <= 5; page += 1) {
    const res = await listPosts({ page, pageSize: 100 }).catch(() => null);
    if (!res?.data?.length) break;
    out.push(...res.data);
    const total = res.meta?.pagination?.pageCount ?? 1;
    if (page >= total) break;
  }
  return out;
}

export default async function FaqsPage() {
  const posts = await allPosts();

  /* One question is often asked in several articles; keep the first. */
  const seen = new Set<string>();
  const groups = new Map<string, Group>();

  for (const post of posts) {
    const cat = post.categories?.[0];
    const key = cat?.slug || 'general';
    for (const entry of extract(post)) {
      const dedupe = entry.question.toLowerCase();
      if (seen.has(dedupe)) continue;
      seen.add(dedupe);
      const group = groups.get(key) || { name: cat?.name || 'General', slug: key, entries: [] };
      group.entries.push(entry);
      groups.set(key, group);
    }
  }

  const sections = [...groups.values()].sort((a, b) => b.entries.length - a.entries.length);
  const total = seen.size;

  /* Capped: Google reads a sample, and the whole set would be a very large
     blob of JSON on a page that already carries the answers in its markup. */
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: sections.flatMap((s) => s.entries).slice(0, 50).map((e) => ({
      '@type': 'Question',
      name: e.question,
      acceptedAnswer: { '@type': 'Answer', text: e.answer },
    })),
  };

  return (
    <div data-testid="faqs-page">
      {total > 0 && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      )}

      <section className="sec-breadcumb">
        <div className="container">
          <Breadcrumb items={[{ label: 'FAQs' }]} />
          <div className="row align-items-end">
            <div className="col-lg-8 col-12">
              <div className="title">
                <h1 className="h3 mb-0">FAQs</h1>
                <p className="bls-page-lead mt-3 mb-0">
                  {total > 0
                    ? `${total} questions answered across our guides. Each answer links to the article it came from, where you will find the full context.`
                    : 'Questions answered across our guides, each linked to the article it came from.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="pt-5 pb-70">
        <div className="container">
          <div className="row">
            <div className="col-lg-9 col-xl-8 col-12">
              {sections.length > 1 && (
                <nav aria-label="FAQ topics" className="block-tag d-flex flex-wrap gap-2 mb-5">
                  {sections.map((s) => (
                    <a key={s.slug} href={`#faq-${s.slug}`} className="tag-item bls-tag">
                      <span>{s.name}</span>
                      <span className="number">{s.entries.length}</span>
                    </a>
                  ))}
                </nav>
              )}

              {total === 0 ? (
                <p className="mb-0">No questions have been published yet.</p>
              ) : (
                sections.map((s) => (
                  <section key={s.slug} id={`faq-${s.slug}`} className="bls-faq-section mb-5">
                    <h2 className="h5 mb-3">{s.name}</h2>
                    <div className="faq-accordion">
                      {s.entries.map((e) => (
                        <details key={e.question} className="faq-item">
                          <summary className="faq-question">
                            {e.question}
                            <span className="faq-icon" aria-hidden />
                          </summary>
                          <div className="faq-answer">
                            <p>{e.answer}</p>
                            <Link href={e.href} className="bls-link fs-7 fw-semi-bold faq-source">
                              From: {e.postTitle}
                            </Link>
                          </div>
                        </details>
                      ))}
                    </div>
                  </section>
                ))
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
