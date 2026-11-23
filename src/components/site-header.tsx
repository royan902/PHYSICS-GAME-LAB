"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import { Atom } from "./icons";

const links = [
  ["/", "Home"],
  ["/games", "Games"],
  ["/about", "About"],
] as const;
export function SiteHeader() {
  const path = usePathname();
  const [openPath, setOpenPath] = useState<string | null>(null);
  const open = openPath === path;
  const toggle = useRef<HTMLButtonElement>(null);
  if (path.endsWith("/play")) return null;
  return (
    <header
      className="site-header"
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) {
          setOpenPath(null);
          toggle.current?.focus();
        }
      }}
    >
      <div className="container header-inner">
        <Link
          href="/"
          className="brand"
          aria-label="Physics Game Lab Home"
          onClick={() => setOpenPath(null)}
        >
          <Atom />
          <span>
            Physics <span className="brand-light">Game Lab</span>
          </span>
        </Link>
        <button
          ref={toggle}
          className="menu-toggle"
          aria-label={open ? "Tutup menu" : "Buka menu"}
          aria-expanded={open}
          aria-controls="site-navigation"
          onClick={() => setOpenPath(open ? null : path)}
        >
          <span aria-hidden="true">{open ? "×" : "☰"}</span>
        </button>
        <nav id="site-navigation" aria-label="Navigasi utama" data-open={open}>
          {links.map(([href, label]) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpenPath(null)}
              aria-current={
                (href === "/" ? path === href : path.startsWith(href))
                  ? "page"
                  : undefined
              }
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
