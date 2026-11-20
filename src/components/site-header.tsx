"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Atom } from "./icons";
export function SiteHeader() {
  const path = usePathname();
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link href="/" className="brand" aria-label="Physics Game Lab Home">
          <Atom />
          <span>
            Physics <span className="brand-light">Game Lab</span>
          </span>
        </Link>
        <nav aria-label="Navigasi utama">
          {[
            ["/", "Home"],
            ["/games", "Games"],
            ["/about", "About"],
          ].map(([href, label]) => (
            <Link
              key={href}
              href={href}
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
