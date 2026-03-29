export function SkeletonCard({ width = '100%', height = 120 }: { width?: string | number; height?: number }) {
  return (
    <div style={{
      width, height, borderRadius: 20,
      background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.72) 0%, rgba(241, 245, 249, 0.8) 100%)',
      border: '1px solid rgba(255, 255, 255, 0.55)',
      overflow: 'hidden', position: 'relative',
      boxShadow: '0 1px 3px rgba(15,23,42,0.06), 0 4px 12px rgba(15,23,42,0.04)',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(90deg, rgba(15,23,42,0) 0%, rgba(15,23,42,0.04) 50%, rgba(15,23,42,0) 100%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s ease-in-out infinite',
      }} />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} height={100} />)}
      </div>
      <SkeletonCard height={400} />
    </div>
  );
}
