import { profile } from "@/content";
import { GitHubIcon, LinkedInIcon, MailIcon, WhatsAppIcon } from "./icons";

const links = [
  { label: "LinkedIn", href: profile.linkedin, Icon: LinkedInIcon },
  { label: "GitHub", href: profile.github, Icon: GitHubIcon },
  { label: "Email", href: `mailto:${profile.email}`, Icon: MailIcon },
  { label: "WhatsApp", href: profile.whatsapp, Icon: WhatsAppIcon },
];

export function SocialLinks({ className = "" }: { className?: string }) {
  return (
    <span className={`gap-2 ${className}`}>
      {links.map(({ label, href, Icon }) => (
        <a
          key={label}
          href={href}
          aria-label={label}
          {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          className="inline-flex size-11 items-center justify-center rounded-full bg-raised text-text transition-colors hover:bg-control"
        >
          <Icon />
        </a>
      ))}
    </span>
  );
}
