export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-shell flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="font-display text-5xl font-semibold text-text-primary tracking-tight">
            Donna
          </h1>
          <p className="mt-2 text-xs text-text-tertiary uppercase tracking-widest font-sans">
            Always three steps ahead.
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
