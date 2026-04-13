export default function DocumentLoading() {
  return (
    <div className="min-h-screen bg-[#F7F6F3]">
      <div className="max-w-[720px] mx-auto px-4 py-6 sm:px-14 sm:py-12">
        {/* Back link */}
        <div className="h-3 w-24 bg-[#EBEBEB] rounded animate-pulse mb-10" />

        {/* Header */}
        <header className="mb-10">
          <div className="flex gap-2 mb-4">
            <div className="h-5 w-14 bg-[#EBEBEB] rounded animate-pulse" />
            <div className="h-5 w-28 bg-[#EBEBEB] rounded animate-pulse" />
          </div>
          <div className="h-8 w-full bg-[#EBEBEB] rounded animate-pulse mb-2" />
          <div className="h-8 w-3/4 bg-[#EBEBEB] rounded animate-pulse mb-4" />
          <div className="flex gap-6">
            <div className="h-3 w-32 bg-[#EBEBEB] rounded animate-pulse" />
            <div className="h-3 w-20 bg-[#EBEBEB] rounded animate-pulse" />
          </div>
        </header>

        {/* Quick stats bar */}
        <div className="grid grid-cols-3 gap-4 mb-10 p-5 border border-[#E2E0DB] rounded">
          {[1, 2, 3].map((i) => (
            <div key={i}>
              <div className="h-3 w-16 bg-[#EBEBEB] rounded animate-pulse mb-2" />
              <div className="h-5 w-10 bg-[#EBEBEB] rounded animate-pulse" />
            </div>
          ))}
        </div>

        {/* Plain summary */}
        <section className="mb-10">
          <div className="h-3 w-24 bg-[#EBEBEB] rounded animate-pulse mb-3" />
          <div className="pl-4 border-l-2 border-[#E2E0DB] space-y-2.5">
            <div className="h-6 w-full bg-[#EBEBEB] rounded animate-pulse" />
            <div className="h-6 w-full bg-[#EBEBEB] rounded animate-pulse" />
            <div className="h-6 w-2/3 bg-[#EBEBEB] rounded animate-pulse" />
          </div>
        </section>

        <hr className="border-[#E2E0DB] mb-10" />

        {/* Detailed summary */}
        <section className="space-y-3">
          {[100, 100, 100, 100, 60].map((w, i) => (
            <div
              key={i}
              className="h-4 bg-[#EBEBEB] rounded animate-pulse"
              style={{ width: `${w}%` }}
            />
          ))}
        </section>
      </div>
    </div>
  );
}
