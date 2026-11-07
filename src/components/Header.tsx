import { profile } from "@/content";

export function Header() {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-10 sm:py-5">
      <a href="#top" aria-label="Back to top" className="py-3 font-mono text-[15px] font-medium hover:text-muted">
        &lt;AN /&gt;
      </a>
      <nav aria-label="Main" className="flex items-center gap-1.5">
        <a href="#experience" className="hidden px-4 py-3 text-[15px] font-semibold hover:text-muted sm:inline">
          Experience
        </a>
        <a href={`mailto:${profile.email}`} className="rounded-full bg-accent px-5 py-3 text-[15px] font-bold text-bg transition-opacity hover:opacity-85 sm:px-[22px]">
          Contact
        </a>
      </nav>
    </header>
  );
}
