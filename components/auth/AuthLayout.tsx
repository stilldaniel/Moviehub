import Link from "next/link";
import type { ReactNode } from "react";
import { FaGoogle } from "react-icons/fa";
import ZoraLogo from "@/components/brand/ZoraLogo";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

// Shared frame for sign-in and sign-up: logo, card, Google option, then the email form
export default function AuthLayout({
  subtitle,
  onGoogle,
  googleLabel = "Continue with Google",
  children,
  footer,
}: {
  subtitle: string;
  onGoogle: () => void;
  googleLabel?: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex" aria-label="Zora Stream home">
            <span className="sm:hidden"><ZoraLogo size={46} speedLines /></span>
            <span className="hidden sm:inline"><ZoraLogo size={60} speedLines /></span>
          </Link>
          <p className="mt-3 text-sm text-fg-muted">{subtitle}</p>
        </div>

        <Card className="sm:p-8">
          <Button variant="inverse" size="lg" className="w-full" onClick={onGoogle} icon={<FaGoogle size={16} />}>
            {googleLabel}
          </Button>

          <div className="my-6 flex items-center gap-4" role="separator">
            <span className="h-px flex-1 bg-line" />
            <span className="text-xs uppercase tracking-wider text-fg-subtle">or</span>
            <span className="h-px flex-1 bg-line" />
          </div>

          {children}

          <p className="mt-6 text-center text-sm text-fg-muted">{footer}</p>
        </Card>
      </div>
    </div>
  );
}
