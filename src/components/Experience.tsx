import { jobs } from "@/content";

export function Experience() {
  return (
    <section id="experience" aria-labelledby="experience-title" className="flex scroll-mt-4 flex-col gap-3.5 px-4 pt-8 pb-9 sm:gap-5 sm:px-10 sm:pt-[72px] sm:pb-20">
      <h2 id="experience-title" className="mb-1 text-[30px] font-extrabold tracking-[-0.03em] sm:mb-2 sm:text-[40px]">
        Work experience
      </h2>
      <div className="grid auto-rows-fr gap-3.5 sm:gap-5 md:grid-cols-2">
        {jobs.map((job) => (
          <article key={job.company} className="flex flex-col gap-2.5 rounded-3xl bg-card px-[18px] py-[22px] sm:gap-3.5 sm:rounded-[28px] sm:p-8">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h3 className="text-[28px] leading-[1.1] font-extrabold tracking-[-0.03em] sm:text-[32px]">{job.company}</h3>
              <p className="font-mono text-[13px] text-muted">
                {job.dates}
                <span className="sm:hidden"> · {job.location}</span>
              </p>
            </div>
            <p className="text-base font-semibold sm:text-[17px]">{job.role}</p>
            <p className="-mt-2 hidden text-[15px] text-muted sm:block">{job.location}</p>
            <ul className="mt-1 flex list-disc flex-col gap-2 pl-5 text-[15px] leading-[1.55] sm:text-base">
              {job.points.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
            <ul aria-label="Technologies" className="mt-auto flex flex-wrap gap-2 pt-2 font-mono text-[13px]">
              {job.tech.map((t) => (
                <li key={t} className="rounded-full bg-chip px-3 py-1.5">{t}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
