import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { Atom } from "@/components/icons";
import "./globals.css";
export const metadata: Metadata = {
  title: {
    default: "Physics Game Lab — Discover Physics Through Play",
    template: "%s | Physics Game Lab",
  },
  description:
    "Jelajahi lima game simulasi fisika: biliar, golf, roket, meriam, dan ramp race. Belajar melalui eksperimen dan permainan.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>
        <a className="skip-link" href="#main">
          Lewati ke konten
        </a>
        <SiteHeader />
        <main id="main" className="container">
          {children}
        </main>
        <footer className="site-footer">
          <div className="container footer-inner">
            <Link href="/" className="footer-brand">
              <Atom />
              Physics Game Lab
            </Link>
            <p>Explore. Experiment. Understand.</p>
            <span>© 2026 Physics Game Lab</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
