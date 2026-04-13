export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "#0E0B08" }}
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1
            className="font-display"
            style={{ fontSize: 48, color: "#F0EDE6" }}
          >
            Donn<em style={{ color: "#C4855A", fontStyle: "italic" }}>a</em>
          </h1>
          <p
            className="mt-2 font-mono uppercase tracking-widest"
            style={{ fontSize: 9, color: "#4A453F", letterSpacing: "0.1em" }}
          >
            Always three steps ahead.
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
