// Every piece of text on the site lives here, so the cards, the CV panel
// and a future projects section can never disagree.

export type Job = {
  company: string;
  role: string;
  dates: string;
  location: string;
  points: [string, string, string];
  tech: string[];
};

export type CvJob = {
  company: string;
  role: string;
  dates: string;
  location: string;
  bullets: string[];
};

export const profile = {
  name: "Ahmed Nagi",
  tagline: "Front-End Developer working with React and Next.js",
  email: "ahmednagi730@gmail.com",
  linkedin: "https://www.linkedin.com/in/ahmed-mohamed-680b99232",
  github: "https://github.com/AhmedNagii",
  cvPath: "/Ahmed_Nagi_Front-End_Developer_CV.pdf",
  cvFileName: "Ahmed_Nagi_Front-End_Developer_CV.pdf",
} as const;

export const jobs: Job[] = [
  {
    company: "Serva",
    role: "Front-End Developer, fleet management platform",
    dates: "Jan 2026 – Oct 2026",
    location: "Remote",
    points: [
      "Took ownership of features from requirements through deployment, working directly with the product manager and product owner.",
      "Used RTK Query to streamline data fetching and caching, improving performance and reducing redundant API calls.",
      "Turned Figma designs into responsive, accessible components with MUI and Tailwind CSS.",
    ],
    tech: ["React", "TypeScript", "RTK Query", "MUI", "Tailwind"],
  },
  {
    company: "Solve-IT",
    role: "Front-End Developer, data-focused web app",
    dates: "Dec 2022 – Dec 2025",
    location: "Cairo, Egypt",
    points: [
      "Built interactive charts, maps and grids with PrimeReact and React Leaflet.",
      "Developed and maintained a long-term product for three years, with heavy emphasis on state management and data visualization.",
      "Mentored a newly graduated developer through onboarding and foundational front-end skills.",
    ],
    tech: ["React", "Redux Toolkit", "PrimeReact", "Leaflet", "JavaScript"],
  },
];

export const cv: {
  headline: string;
  location: string;
  summary: string;
  experience: CvJob[];
  skills: string;
  certificates: { name: string; url?: string }[];
  education: string;
  languages: string[];
} = {
  headline: "Front-End Developer, React",
  location: "Helwan, Cairo, Egypt",
  summary:
    "Front-End Developer with 3+ years of experience building responsive, data-driven web applications using React, TypeScript and Tailwind CSS. Skilled in translating Figma designs into accurate, accessible UI components, with a strong focus on state management (Redux Toolkit, RTK Query) and performance. Experienced working within Agile/Scrum product teams and mentoring junior developers.",
  experience: [
    {
      company: "Serva",
      role: "Front-End Developer, Fleet Management Platform",
      dates: "Jan 2026 – Oct 2026",
      location: "Remote",
      bullets: [
        "Built and maintained front-end features using React, TypeScript, RTK Query, MUI and Tailwind CSS.",
        "Used TypeScript across the codebase to improve type safety, reduce runtime errors and make components easier to maintain.",
        "Worked in a cross-functional team in Agile/Scrum sprints with a product manager and product owner.",
        "Used RTK Query to streamline data fetching and caching, improving performance and reducing redundant API calls.",
        "Took ownership of feature development from requirements through deployment.",
        "Translated product requirements and Figma designs into responsive, accessible UI components.",
      ],
    },
    {
      company: "Solve-IT for Consultancies and Engineering Services",
      role: "Front-End Developer",
      dates: "Dec 2022 – Dec 2025",
      location: "Cairo, Egypt",
      bullets: [
        "Developed and maintained a data-focused web application using React and Redux Toolkit over a 3-year tenure, with heavy emphasis on state management and data visualization.",
        "Implemented interactive charts, maps and grids using PrimeReact and React Leaflet.",
        "Contributed to ongoing performance improvements and bug fixes for a long-term product.",
        "Mentored a newly graduated developer through onboarding and foundational front-end skills.",
      ],
    },
  ],
  skills:
    "React, Next.js, JavaScript (ES6+), TypeScript, HTML5, CSS3, Tailwind CSS, Redux, Redux Toolkit, RTK Query, MUI, PrimeReact, React Leaflet, Figma, Cypress, Agile, Scrum",
  certificates: [
    { name: "The Joy of React, Josh Comeau" },
    { name: "CSS for JavaScript Developers, Josh Comeau" },
    { name: "Front-End Web Developer Nanodegree, Udacity", url: "https://www.udacity.com/certificate/AMR7GFJ4" },
  ],
  education: "Bachelor's in Law, Cairo University, 2019",
  languages: ["Arabic, native", "English, B2"],
};
