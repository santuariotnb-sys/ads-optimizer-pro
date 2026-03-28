export function SkeletonCard({ width = '100%', height = 120 }: { width?: string | number; height?: number }) {
  return (
    <div style={{
      width, height, borderRadius: 16,
      background: 'rgba(22,22,32,0.85)',
      border: '1px solid rgba(255,255,255,0.06)',
      overflow: 'hidden', position: 'relative',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.04) 50%, rgba(255,255,255,0) 100%)',
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
