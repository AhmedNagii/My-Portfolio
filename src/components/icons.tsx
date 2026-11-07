type P = { size?: number };

export const LinkedInIcon = ({ size = 18 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M6.94 5a2 2 0 1 1-4-.002 2 2 0 0 1 4 .002zM7 8.48H3V21h4V8.48zm6.32 0H9.34V21h3.94v-6.57c0-3.66 4.77-4 4.77 0V21H22v-7.93c0-6.17-7.06-5.94-8.72-2.91l.04-1.68z" />
  </svg>
);

export const GitHubIcon = ({ size = 19 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 .5C5.73.5.67 5.56.67 11.83c0 5 3.24 9.25 7.74 10.75.57.1.78-.25.78-.55v-2.1c-3.15.68-3.81-1.34-3.81-1.34-.51-1.31-1.26-1.66-1.26-1.66-1.03-.7.08-.69.08-.69 1.14.08 1.74 1.17 1.74 1.17 1.01 1.73 2.65 1.23 3.3.94.1-.73.39-1.23.72-1.51-2.52-.29-5.16-1.26-5.16-5.6 0-1.24.44-2.25 1.17-3.04-.12-.29-.51-1.44.11-3 0 0 .95-.3 3.12 1.16a10.8 10.8 0 0 1 5.68 0c2.17-1.46 3.12-1.16 3.12-1.16.62 1.56.23 2.71.11 3 .73.79 1.17 1.8 1.17 3.04 0 4.35-2.65 5.31-5.17 5.59.41.35.77 1.04.77 2.1v3.11c0 .3.2.66.79.55a11.34 11.34 0 0 0 7.73-10.75C23.33 5.56 18.27.5 12 .5z" />
  </svg>
);

const Stroke = ({ size = 16, width = 2.4, children }: P & { width?: number; children: React.ReactNode }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

export const MailIcon = ({ size = 18 }: P) => (
  <Stroke size={size} width={2.2}>
    <rect x="3" y="5" width="18" height="14" rx="3" />
    <path d="M4 7.5l8 6 8-6" />
  </Stroke>
);

export const FileIcon = ({ size = 16 }: P) => (
  <Stroke size={size}>
    <path d="M6 3h8l5 5v13H6zM14 3v5h5M9.5 13h6M9.5 17h6" />
  </Stroke>
);

export const DownloadIcon = ({ size = 16 }: P) => (
  <Stroke size={size}>
    <path d="M12 4v11M7 11l5 5 5-5M5 20h14" />
  </Stroke>
);

export const CloseIcon = ({ size = 16 }: P) => (
  <Stroke size={size} width={2.6}>
    <path d="M5 5l14 14M19 5L5 19" />
  </Stroke>
);
