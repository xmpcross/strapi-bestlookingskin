import Link from 'next/link';
import type { Metadata } from 'next';
import { listPosts, type BlsPost } from '@/lib/strapi';
import { decodeEntities } from '@/lib/toc';
import { postPath } from '@/lib/format';
import { SITE } from '@/lib/site';

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
  const html = post.content || '';
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
    <div className="mx-auto max-w-4xl px-6 pb-16 pt-8" data-testid="faqs-page">
      {total > 0 && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      )}

      <nav className="flex items-center gap-2 py-0 text-[12px] font-semibold text-ink/55" aria-label="Breadcrumb">
        <Link href="/" className="font-semibold text-primary hover:text-primary-highlight">Home</Link>
        <span>/</span>
        <span className="text-ink/75" aria-current="page">FAQs</span>
      </nav>

      <h1 className="mt-6 font-display text-[2rem] font-bold leading-tight tracking-tight text-ink">
        Frequently asked questions
      </h1>
      <p className="mt-4 max-w-2xl text-[17px] leading-8 text-ink/60">
        {total > 0
          ? `${total} questions answered across our guides. Each answer links to the article it came from, where you will find the full context.`
          : 'Questions answered across our guides, each linked to the article it came from.'}
      </p>

      {sections.length > 1 && (
        <nav aria-label="FAQ topics" className="mt-8 flex flex-wrap gap-2">
          {sections.map((s) => (
            <a
              key={s.slug}
              href={`#faq-${s.slug}`}
              className="rounded-full border border-ink/15 px-4 py-1.5 text-[13px] font-semibold text-ink/70 transition hover:border-primary hover:text-primary"
            >
              {s.name} <span className="text-ink/40">{s.entries.length}</span>
            </a>
          ))}
        </nav>
      )}

      {total === 0 ? (
        <p className="mt-10 text-ink/60">No questions have been published yet.</p>
      ) : (
        sections.map((s) => (
          <section key={s.slug} id={`faq-${s.slug}`} className="mt-12 scroll-mt-24">
            <h2 className="font-display text-[1.4rem] font-bold text-ink">{s.name}</h2>
            <div className="mt-4 border-t border-ink/10">
              {s.entries.map((e) => (
                <details key={e.question} className="border-b border-ink/10">
                  <summary className="flex cursor-pointer items-start justify-between gap-4 py-4 font-display text-[16px] font-bold text-ink transition hover:text-primary [&::-webkit-details-marker]:hidden">
                    {e.question}
                    <span aria-hidden className="mt-1 shrink-0 text-primary">+</span>
                  </summary>
                  <div className="pb-5 text-[15px] leading-7 text-ink/70">
                    <p>{e.answer}</p>
                    <Link href={e.href} className="mt-3 inline-block text-[14px] font-semibold text-primary hover:underline">
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
  );
}
