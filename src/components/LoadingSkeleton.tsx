export function SkeletonCard({ width = '100%', height = 120 }: { width?: string | number; height?: number }) {
  return (
    <div style={{
      width, height, borderRadius: 20,
      background: 'linear-gradient(145deg, rgba(22, 22, 32, 0.85) 0%, rgba(16, 16, 26, 0.9) 100%)',
      border: '1px solid rgba(255, 255, 255, 0.06)',
      overflow: 'hidden', position: 'relative',
      boxShadow: '0 1px 0 0 rgba(255,255,255,0.04) inset, 0 -1px 0 0 rgba(0,0,0,0.2) inset, 0 4px 16px rgba(0,0,0,0.4), 0 12px 40px rgba(0,0,0,0.25)',
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
