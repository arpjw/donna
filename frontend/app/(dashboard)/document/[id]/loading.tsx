export default function DocumentLoading() {
  return (
    <div className="min-h-screen" style={{ background: "#F5F2EC" }}>
      <div className="max-w-[720px] mx-auto px-4 py-6 sm:px-14 sm:py-12">
        {/* Back link */}
        <div className="h-3 w-24 skeleton rounded animate-pulse mb-10" />

        {/* Header */}
        <header className="mb-10">
          <div className="flex gap-2 mb-4">
            <div className="h-5 w-14 skeleton rounded animate-pulse" />
            <div className="h-5 w-28 skeleton rounded animate-pulse" />
          </div>
          <div className="h-8 w-full skeleton rounded animate-pulse mb-2" />
          <div className="h-8 w-3/4 skeleton rounded animate-pulse mb-4" />
          <div className="flex gap-6">
            <div className="h-3 w-32 skeleton rounded animate-pulse" />
            <div className="h-3 w-20 skeleton rounded animate-pulse" />
          </div>
        </header>

        {/* Quick stats bar */}
        <div
          className="grid grid-cols-3 gap-4 mb-10 p-5 rounded"
          style={{ background: "#EEE9E0", border: "1px solid #E2DDD5" }}
        >
          {[1, 2, 3].map((i) => (
            <div key={i}>
              <div className="h-3 w-16 skeleton rounded animate-pulse mb-2" />
              <div className="h-5 w-10 skeleton rounded animate-pulse" />
            </div>
          ))}
        </div>

        {/* Plain summary */}
        <section className="mb-10">
          <div className="h-3 w-24 skeleton rounded animate-pulse mb-3" />
          <div className="pl-4 space-y-2.5" style={{ borderLeft: "2px solid #E2DDD5" }}>
            <div className="h-6 w-full skeleton rounded animate-pulse" />
            <div className="h-6 w-full skeleton rounded animate-pulse" />
            <div className="h-6 w-2/3 skeleton rounded animate-pulse" />
          </div>
        </section>

        <hr style={{ borderColor: "#E2DDD5", marginBottom: 40 }} />

        {/* Detailed summary */}
        <section className="space-y-3">
          {[100, 100, 100, 100, 60].map((w, i) => (
            <div
              key={i}
              className="h-4 skeleton rounded animate-pulse"
              style={{ width: `${w}%` }}
            />
          ))}
        </section>
      </div>
    </div>
  );
}
