import Button from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-canvas flex flex-col items-center justify-center px-4 text-center">
      {/* Soft brand glow */}
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse,rgb(227_18_27/0.08)_0%,transparent_70%)] blur-[60px]" />

      <p className="relative select-none bg-linear-to-br from-brand to-brand-deep bg-clip-text text-[clamp(120px,20vw,220px)] font-black leading-none text-transparent">
        404
      </p>

      <h1 className="relative mt-2 text-2xl sm:text-3xl font-bold tracking-tight">Page not found</h1>
      <p className="relative mt-3 max-w-md text-sm sm:text-base leading-relaxed text-fg-muted">
        Looks like this scene got cut from the film. The page you&apos;re looking for doesn&apos;t exist or has moved.
      </p>

      <div className="relative mt-10 flex flex-col sm:flex-row items-center gap-3">
        <Button href="/" size="lg">Back to home</Button>
        <Button href="/movie" size="lg" variant="secondary">Browse movies</Button>
      </div>
    </div>
  );
}
