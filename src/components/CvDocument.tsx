import { cv, profile } from "@/content";
import { DownloadIcon } from "./icons";

const label = "mb-2 text-sm font-bold text-muted";

/** The CV as page markup. `Title` lets the dialog supply an accessible title element. */
export function CvDocument({ Title = "h2" }: { Title?: React.ElementType }) {
  return (
    <article className="flex min-h-screen w-full flex-col gap-[30px] bg-card p-[22px] text-base leading-[1.55] sm:min-h-0 sm:rounded-[28px] sm:p-[clamp(22px,4vw,44px)]">
      <header className="flex flex-wrap items-start justify-between gap-4 pr-11">
        <div className="min-w-0 flex-[1_1_280px]">
          <Title className="text-[clamp(32px,5vw,44px)] leading-[1.05] font-extrabold tracking-[-0.035em]">{profile.name}</Title>
          <p className="mt-2 text-lg font-semibold">{cv.headline}</p>
          <p className="mt-1 text-muted">{cv.location}</p>
        </div>
        <a
          href={profile.cvPath}
          download={profile.cvFileName}
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-accent px-5 text-[15px] font-bold text-bg transition-opacity hover:opacity-85"
        >
          <DownloadIcon />
          Download PDF
        </a>
      </header>
      <section>
        <h3 className={label}>Summary</h3>
        <p>{cv.summary}</p>
      </section>
      <section className="flex flex-col gap-[22px]">
        <h3 className={`${label} -mb-3.5`}>Experience</h3>
        {cv.experience.map((job) => (
          <div key={job.company}>
            <div className="flex flex-wrap justify-between gap-x-4 gap-y-0.5">
              <h4 className="text-lg font-bold">{job.company}</h4>
              <span className="font-mono text-[13px] text-muted">{job.dates}</span>
            </div>
            <p className="mt-0.5 mb-2 text-muted">
              {job.role}, {job.location}
            </p>
            <ul className="flex list-disc flex-col gap-[5px] pl-5">
              {job.bullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </div>
        ))}
      </section>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-x-8 gap-y-[26px]">
        <section>
          <h3 className={label}>Skills</h3>
          <p>{cv.skills}</p>
        </section>
        <section>
          <h3 className={label}>Certificates</h3>
          <ul>
            {cv.certificates.map((c) => (
              <li key={c.name}>
                {c.url ? (
                  <a href={c.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-[3px] hover:text-muted">
                    {c.name}
                  </a>
                ) : (
                  c.name
                )}
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h3 className={label}>Education</h3>
          <p>{cv.education}</p>
        </section>
        <section>
          <h3 className={label}>Languages</h3>
          <ul>
            {cv.languages.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </section>
      </div>
    </article>
  );
}
