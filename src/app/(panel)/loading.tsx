export default function Loading() {
  return (
    <div role="status" aria-label="Cargando">
      <div className="skeleton h-8 w-56" />
      <div className="skeleton mt-3 h-4 w-80 max-w-full" />
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-32" />
        ))}
      </div>
      <div className="skeleton mt-6 h-80" />
    </div>
  );
}
