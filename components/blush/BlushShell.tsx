import { b } from '@/lib/blush';
import { getBlushNav } from '@/lib/blush-nav';
import BlushHeader from './BlushHeader';
import BlushFooter from './BlushFooter';

/**
 * The Blush page frame: a .blush wrapper (all Blush CSS is scoped under it), the header, the page's own
 * <main>, and the footer. The saved colour theme is applied before first paint by the inline script, so a
 * dark-mode visitor does not see a light flash.
 */
export default async function BlushShell({ children }: { children: React.ReactNode }) {
  const nav = await getBlushNav();
  return (
    <div className="blush" data-theme="light" suppressHydrationWarning>
      <script
        dangerouslySetInnerHTML={{
          __html:
            "try{var t=localStorage.getItem('theme');if(t==='dark'||t==='light'){document.currentScript.parentElement.setAttribute('data-theme',t)}}catch(e){}",
        }}
      />
      <a className={b('skip-link')} href="#content">
        Skip to content
      </a>
      <BlushHeader nav={nav} />
      {children}
      <BlushFooter />
    </div>
  );
}
