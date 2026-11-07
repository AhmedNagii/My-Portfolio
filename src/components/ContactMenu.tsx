"use client";

import { useEffect, useId, useRef, useState } from "react";
import { profile } from "@/content";
import { MailIcon, WhatsAppIcon } from "./icons";

const options = [
  { label: "Email", detail: profile.email, href: `mailto:${profile.email}`, Icon: MailIcon, external: false },
  { label: "WhatsApp", detail: profile.whatsappHandle, href: profile.whatsapp, Icon: WhatsAppIcon, external: true },
];

/**
 * The header's Contact button: opens a small menu with Email and WhatsApp.
 * Without JavaScript it is a plain mailto link, so contact always works.
 */
export function ContactMenu() {
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const id = useId();

  // Mark hydrated so the server's plain link can become a menu button.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setReady(true), []);

  useEffect(() => {
    if (!open) return;
    root.current?.querySelector<HTMLAnchorElement>("a")?.focus();
    const onPointer = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      button.current?.focus();
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const pill = "rounded-full bg-accent px-5 py-3 text-[15px] font-bold text-bg transition-opacity hover:opacity-85 sm:px-[22px]";

  if (!ready) {
    return (
      <a href={`mailto:${profile.email}`} className={pill}>
        Contact
      </a>
    );
  }

  return (
    <div
      ref={root}
      className="relative"
      onBlur={(e) => {
        if (!root.current?.contains(e.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <button
        ref={button}
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className={`${pill} cursor-pointer`}
      >
        Contact
      </button>
      {open && (
        <div id={id} className="absolute top-full right-0 z-20 mt-2 flex w-64 flex-col gap-1 rounded-2xl bg-raised p-2 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
          {options.map(({ label, detail, href, Icon, external }) => (
            <a
              key={label}
              href={href}
              onClick={() => setOpen(false)}
              {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-control focus-visible:bg-control"
            >
              <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-chip text-text">
                <Icon />
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="text-[15px] font-semibold">{label}</span>
                <span className="truncate font-mono text-xs text-muted">{detail}</span>
              </span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
