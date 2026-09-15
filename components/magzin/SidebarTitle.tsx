/* Sidebar widget title (Magzin "Weekly trending" heading): star mark + 1.2rem heading (.sidebar-heading). Used by
   the post page and product page sidebars. */
export default function SidebarTitle({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`d-flex align-items-center gap-2 mb-3 ${className}`.trim()}>
      <svg className="dark-mode-invert" xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M0.582044 11.7285C8.79451 13.4712 10.252 14.8614 12.125 22.7372C13.8067 14.8768 15.2308 13.4992 23.4018 11.8279C15.1894 10.0852 13.7319 8.69503 11.8589 0.81924C10.1769 8.67956 8.75306 10.0571 0.582044 11.7285Z" fill="#0E0E0F" />
      </svg>
      <h2 className="h5 mb-0 sidebar-heading">{children}</h2>
    </div>
  );
}
