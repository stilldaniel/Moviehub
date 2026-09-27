import Link from "next/link";
import ZoraMark from "@/components/brand/ZoraMark";
import { containerClasses } from "@/components/ui/Container";
import { SITE_NAME } from "@/lib/site";

// Site footer: legal links (required by Google's sign-in branding review) and TMDB's required attribution
export default function Footer() {
  return (
    <footer className="border-t border-line bg-canvas">
      <div className={`${containerClasses} flex flex-col gap-4 py-8 text-sm sm:flex-row sm:items-center sm:justify-between`}>
        <div className="flex items-center gap-2 text-fg-muted">
          <ZoraMark size={20} />
          <span>© {new Date().getFullYear()} {SITE_NAME}</span>
        </div>
        <nav aria-label="Legal" className="flex items-center gap-5">
          <Link href="/privacy" className="text-fg-muted transition hover:text-fg">Privacy Policy</Link>
          <Link href="/terms" className="text-fg-muted transition hover:text-fg">Terms of Service</Link>
        </nav>
      </div>
      <p className={`${containerClasses} pb-8 text-xs text-fg-subtle`}>
        This product uses the TMDB API but is not endorsed or certified by TMDB.
      </p>
    </footer>
  );
}
