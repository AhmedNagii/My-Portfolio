import { describe, expect, test } from "vitest";
import { cv, jobs, profile } from "@/content";

describe("site content", () => {
  test("two jobs, newest first, with exact dates and locations", () => {
    expect(jobs).toHaveLength(2);
    expect(jobs[0]).toMatchObject({ company: "Serva", dates: "Jan 2026 – Oct 2026", location: "Remote" });
    expect(jobs[1]).toMatchObject({ company: "Solve-IT", dates: "Dec 2022 – Dec 2025", location: "Cairo, Egypt" });
  });

  test("technology chips match the spec", () => {
    expect(jobs[0].tech).toEqual(["React", "TypeScript", "RTK Query", "MUI", "Tailwind"]);
    expect(jobs[1].tech).toEqual(["React", "Redux Toolkit", "PrimeReact", "Leaflet", "JavaScript"]);
  });

  test("each job card has exactly three points", () => {
    for (const job of jobs) expect(job.points).toHaveLength(3);
  });

  test("profile copy and CV path", () => {
    expect(profile.name).toBe("Ahmed Nagi");
    expect(profile.tagline).toBe("Front-End Developer working with React and Next.js");
    expect(profile.cvPath).toBe("/Ahmed_Nagi_Front-End_Developer_CV.pdf");
    expect(profile.email).toBe("ahmednagi730@gmail.com");
  });

  test("on-page CV keeps education and Next.js but never the phone number", () => {
    expect(JSON.stringify(cv)).not.toContain("1129471326");
    expect(cv.skills).toContain("Next.js");
    expect(cv.education).toContain("Law");
  });
});
