import type { Metadata } from "next";
import Link from "next/link";
import { Arrow } from "@/components/icons";
export const metadata: Metadata = { title: "About" };
export default function About() {
  return (
    <article className="about-page">
      <span className="small-label">ABOUT THE LAB</span>
      <h1>
        Rasa ingin tahu adalah
        <br />
        awal dari penemuan.
      </h1>
      <p className="about-lead">
        Physics Game Lab adalah ruang untuk memahami fisika melalui permainan
        dan eksperimen interaktif.
      </p>
      <div className="about-body">
        <h2>Belajar dari setiap gerakan</h2>
        <p>
          Dari tumbukan bola biliar hingga dorongan sebuah roket, ada cerita
          fisika di balik setiap gerakan. Kami ingin membuat cerita itu lebih
          mudah dilihat, dicoba, dan dipahami.
        </p>
        <h2>Bermain. Lalu bertanya: mengapa?</h2>
        <p>
          Setiap game direncanakan memiliki Game Mode untuk tantangan terarah
          dan Simulation Mode untuk mengubah parameter serta mengamati hasilnya.
          Kedua mode Billiard memakai model fisika yang sama, dengan asumsi yang
          dijelaskan.
        </p>
        <h2>Sedang dibangun, selangkah demi selangkah</h2>
        <p>
          Billiard Physics kini dapat dimainkan: lima tantangan Pocket Challenge
          dan eksperimen momentum, tumbukan, gesekan, energi serta restitusi.
          Empat game lainnya masih Coming Soon.
        </p>
        <Link href="/games" className="button primary">
          Explore Games <Arrow />
        </Link>
      </div>
    </article>
  );
}
