"use client";

import { useRef, useState } from "react";
import { profile } from "@/content";
import { CvDocument } from "./CvDocument";
import { pill } from "./HeroCopy";
import { FileIcon } from "./icons";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "./ui/dialog";

/**
 * View CV. Server-rendered as a plain link to the PDF, so it works without
 * JavaScript; once hydrated, a plain click opens the CV in a dialog instead.
 * Modified clicks (new tab, save as) keep the normal link behaviour.
 */
export function CvPanel() {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLAnchorElement>(null);
  return (
    <>
      <a
        ref={trigger}
        data-cv-trigger
        href={profile.cvPath}
        aria-haspopup="dialog"
        className={pill}
        onClick={(e) => {
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
          e.preventDefault();
          setOpen(true);
        }}
      >
        <FileIcon />
        View CV
      </a>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          closeLabel="Close CV"
          aria-describedby="cv-description"
          onCloseAutoFocus={(e) => {
            e.preventDefault();
            trigger.current?.focus();
          }}
        >
          <DialogDescription id="cv-description" className="sr-only">
            Ahmed Nagi&apos;s CV. A PDF copy can be downloaded from the panel.
          </DialogDescription>
          <CvDocument Title={DialogTitle} />
        </DialogContent>
      </Dialog>
    </>
  );
}
