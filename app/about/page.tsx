import Link from 'next/link';
import type { Metadata } from 'next';
import { SITE, AFFILIATE_LINKS_ENABLED } from '@/lib/site';
import Breadcrumb from '@/components/magzin/Breadcrumb';

export const metadata: Metadata = {
  title: 'About Us',
  description:
    'Learn how BestLooking.Skin researches skincare products, compares formulas, reviews ingredients, and helps readers build confident routines.',
  alternates: { canonical: '/about' },
};

const METHOD = [
  {
    title: 'Formula-first research',
    text: 'We look at ingredients, product claims, use case, skin-type fit, texture, price, availability, and where a product belongs in a real routine.',
  },
  {
    title: 'Clear product comparisons',
    text: 'Our guides are written to make trade-offs visible, so you can compare similar cleansers, serums, moisturisers, toners, and treatments quickly.',
  },
  {
    title: 'Practical routine advice',
    text: 'We focus on how products work together: what to start with, what to layer carefully, and when a simpler routine may be the smarter choice.',
  },
];

const VALUES = ['Clarity over hype', 'Inclusive skincare education', 'Budget-aware recommendations', 'Transparent affiliate disclosure'];

/*
 * Magzin "About" layout: centred intro, then the template's two-column "What we do / Our values" lists.
 * The previous design had two image placeholders that rendered their labels as literal text
 * ("Editorial skincare research image placeholder", "Skincare products flat-lay image placeholder").
 * They are gone rather than replaced: the site has no real team or studio photography to put there.
 */
export default function AboutPage() {
  return (
    <div data-testid="about-page">
      <section className="sec-breadcumb">
        <div className="container">
          <Breadcrumb items={[{ label: 'About Us' }]} />
        </div>
      </section>

      <section className="sec-padding pt-4">
        <div className="container">
          <div className="row">
            <div className="col-lg-8 col-12 text-center mx-auto">
              <p className="bls-eyebrow mb-3">About Us</p>
              <h1 className="h2 mb-0">Skincare research made easier to understand.</h1>
              <p className="bls-page-lead mt-4 mb-0">
                BestLooking.Skin helps readers compare skincare products, understand ingredients,
                and build routines with more confidence. We translate product pages, ingredient
                lists, reviews, and price details into practical editorial guidance for everyday
                skincare decisions.
              </p>
              <div className="d-flex flex-wrap justify-content-center gap-2 mt-4">
                <Link href="/products" className="btn btn-dark bls-btn">
                  Browse products
                </Link>
                <Link href="/articles" className="btn bls-btn bls-btn-outline">
                  Read articles
                </Link>
              </div>
            </div>
          </div>

          <hr className="bls-divider" />

          <div className="row g-4">
            <div className="col-lg-5 col-12">
              <p className="bls-eyebrow mb-2">Our purpose</p>
              <h2 className="h4 mb-0">Helping you choose skincare with less confusion.</h2>
            </div>
            <div className="col-lg-7 col-12 bls-prose">
              <p>
                The skincare market is crowded with bold claims, trending ingredients, and product
                launches that can make a simple routine feel complicated. Our job is to slow that down.
                We organize information so you can see what a product is designed to do, who it may
                suit, and whether it makes sense for your skin goals.
              </p>
              <p className="mb-0">
                We cover product reviews, side-by-side comparisons, how-to guides, and ingredient-led
                explainers. The goal is not to tell every reader to buy the same thing. It is to give
                you enough context to make a choice that fits your skin, your preferences, and your
                budget.
              </p>
            </div>
          </div>

          <hr className="bls-divider" />

          <div className="row g-5">
            <div className="col-lg-6 col-12 pe-lg-5">
              <p className="bls-eyebrow mb-2">How we work</p>
              <h2 className="h5 mb-4">A practical review process for real routines.</h2>
              <ul className="bls-about-list list-unstyled m-0 p-0">
                {METHOD.map((item) => (
                  <li key={item.title} className="d-flex flex-column flex-md-row py-3">
                    <h3 className="bls-about-term fs-6 fw-semi-bold text-dark mb-0">{item.title}</h3>
                    <p className="mb-0">{item.text}</p>
                  </li>
                ))}
              </ul>
            </div>
            <div className="col-lg-6 col-12">
              <p className="bls-eyebrow mb-2">What we value</p>
              <h2 className="h5 mb-4">Useful guidance, not skincare noise.</h2>
              <p>
                Every article is built for readers who want skincare information they can actually use.
                We prefer clear explanations, honest limitations, and recommendations that acknowledge
                different skin types, sensitivities, budgets, and levels of experience.
              </p>
              <ul className="block-tag list-unstyled d-flex flex-wrap gap-2 m-0 p-0 mt-4">
                {VALUES.map((value) => (
                  <li key={value} className="tag-item bls-tag">
                    {value}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="pb-70">
        <div className="container">
          <div className="bls-panel-muted p-4 p-md-5">
            <div className="row g-4">
              <div className="col-lg-4 col-12">
                <p className="bls-eyebrow mb-2">Disclosure</p>
                <h2 className="h5 mb-0">Reader trust comes first.</h2>
              </div>
              <div className="col-lg-8 col-12 bls-prose">
                {AFFILIATE_LINKS_ENABLED ? (
                  <>
                    <p>
                      BestLooking.Skin may earn a commission when readers buy through affiliate links,
                      including qualifying purchases as an Amazon Associate. This does not add extra cost
                      for you, and it helps support our research, publishing, and site maintenance.
                    </p>
                    <p className="mb-0">
                      Affiliate relationships do not change the goal of our content: to make skincare
                      shopping easier to understand. We aim to explain why a product may be worth considering,
                      where it may fall short, and what kind of routine it fits best.
                    </p>
                  </>
                ) : (
                  <>
                    <p>
                      BestLooking.Skin is supported by advertising, served by Google AdSense and labelled
                      &ldquo;Advertisement&rdquo;. We do not currently use affiliate links, so we earn nothing when you
                      buy a product we write about, and retailer links go straight to the retailer&rsquo;s own page.
                    </p>
                    <p className="mb-0">
                      Advertisers have no say in what we write. Our goal stays the same: to make skincare shopping
                      easier to understand, including where a product may fall short and what routine it fits best.
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="pb-70">
        <div className="container">
          <div className="bls-panel-muted p-4 p-md-5">
            <div className="row g-4">
              <div className="col-lg-4 col-12">
                <p className="bls-eyebrow mb-2">Who runs this site</p>
                <h2 className="h5 mb-0">Business details</h2>
              </div>
              <div className="col-lg-8 col-12 bls-prose">
                <p>
                  {SITE.business.tradingName} is a trading name of {SITE.business.legalName}, an Australian business
                  based in Western Australia. ABN {SITE.business.abnDisplay}.
                </p>
                <p className="mb-0">
                  Mailing address: {SITE.business.postalAddress.join(', ')}. For anything else, see our{' '}
                  <Link href="/contact" className="bls-link">contact page</Link>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
