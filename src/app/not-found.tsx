import Link from "next/link";
export default function NotFound() {
  return (
    <section className="empty-page">
      <span className="small-label">404 / OUT OF ORBIT</span>
      <h1>Halaman tidak ditemukan.</h1>
      <p>Eksperimen ini belum ada. Mari kembali ke game library.</p>
      <Link href="/games" className="button primary">
        Kembali ke katalog
      </Link>
    </section>
  );
}
