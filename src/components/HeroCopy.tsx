import { profile } from "@/content";
import { DownloadIcon, FileIcon } from "./icons";
import { SocialLinks } from "./SocialLinks";

export const pill =
  "inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full bg-control px-2.5 text-[15px] font-bold text-text transition-colors hover:bg-chip sm:flex-none sm:px-5";

export function HeroCopy({ cvTrigger }: { cvTrigger?: React.ReactNode }) {
  return (
    <div className="relative z-[2] flex flex-col gap-2 px-4 pt-5 pb-1 sm:gap-3.5 sm:px-10 sm:pt-8 sm:pb-0">
      <h1 className="text-[58px] leading-none font-extrabold tracking-[-0.045em] sm:text-[clamp(56px,8vw,116px)]">{profile.name}</h1>
      <p className="text-[17px] leading-[1.45] font-medium text-muted sm:text-[21px]">{profile.tagline}</p>
      <div className="mt-2.5 flex flex-wrap items-center gap-2 sm:gap-2.5">
        {cvTrigger ?? (
          <a data-cv-trigger href={profile.cvPath} className={pill}>
            <FileIcon />
            View CV
          </a>
        )}
        <a href={profile.cvPath} download={profile.cvFileName} className={pill}>
          <DownloadIcon />
          Download CV
        </a>
        <SocialLinks className="hidden sm:flex" />
      </div>
    </div>
  );
}
