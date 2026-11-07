import { SocialLinks } from "./SocialLinks";

export function Footer() {
  return (
    <footer className="flex flex-wrap items-center justify-between gap-3 px-4 pt-3 pb-7 text-sm text-muted sm:px-10">
      <span className="flex items-center gap-2.5 font-semibold">
        <span aria-hidden="true" className="size-[9px] rounded-full bg-accent" />
        Open to work
      </span>
      <SocialLinks className="flex" />
    </footer>
  );
}
