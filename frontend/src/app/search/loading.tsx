export default function SearchLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-r from-primary-dark via-primary to-primary-light py-10 relative">
        <div className="container mx-auto px-4 text-center">
          <div className="h-10 w-64 bg-white/20 animate-pulse rounded-lg mx-auto mb-6"></div>
          <div className="h-16 w-full max-w-4xl bg-white/20 animate-pulse rounded-full mx-auto"></div>
        </div>
      </div>
      <div className="container mx-auto px-4 py-10">
        <div className="h-8 w-48 bg-gray-200 animate-pulse rounded-lg mb-6"></div>
        <div className="flex gap-4 mb-6">
          <div className="h-10 w-32 bg-gray-200 animate-pulse rounded-lg"></div>
          <div className="h-10 w-32 bg-gray-200 animate-pulse rounded-lg"></div>
          <div className="h-10 w-32 bg-gray-200 animate-pulse rounded-lg hidden md:block"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
              <div className="h-48 bg-gray-200 animate-pulse"></div>
              <div className="p-4 space-y-3">
                <div className="h-4 w-1/4 bg-gray-200 animate-pulse rounded"></div>
                <div className="h-5 w-full bg-gray-200 animate-pulse rounded"></div>
                <div className="h-4 w-3/4 bg-gray-200 animate-pulse rounded"></div>
                <div className="flex justify-between pt-2 border-t border-gray-100">
                  <div className="h-4 w-1/3 bg-gray-200 animate-pulse rounded"></div>
                  <div className="h-4 w-1/3 bg-gray-200 animate-pulse rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
