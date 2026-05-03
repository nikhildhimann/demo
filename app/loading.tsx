export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-50 pt-28 pb-20">
      <div className="container mx-auto px-4 space-y-8">
        <div className="h-40 rounded-3xl bg-white border border-slate-100 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((item) => (
            <div key={item} className="rounded-3xl bg-white border border-slate-100 overflow-hidden">
              <div className="h-56 bg-slate-200 animate-pulse" />
              <div className="p-6 space-y-3">
                <div className="h-5 bg-slate-200 rounded animate-pulse" />
                <div className="h-4 bg-slate-100 rounded animate-pulse" />
                <div className="h-10 bg-slate-100 rounded-xl animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
