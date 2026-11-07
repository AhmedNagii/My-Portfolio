import { ContactMenu } from "./ContactMenu";

export function Header() {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-10 sm:py-5">
      <a href="#top" className="py-3 font-mono text-[15px] font-medium hover:text-muted">
        <span aria-hidden="true">&lt;AN /&gt;</span>
        <span className="sr-only">Ahmed Nagi, back to top</span>
      </a>
      <nav aria-label="Main" className="flex items-center gap-1.5">
        <a href="#experience" className="hidden px-4 py-3 text-[15px] font-semibold hover:text-muted sm:inline">
          Experience
        </a>
        <ContactMenu />
      </nav>
    </header>
  );
}
