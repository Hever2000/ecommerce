import Container from '@/components/ui/Container';

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-ink/10 ${className ?? ''}`}
    />
  );
}

export default function Loading() {
  return (
    <Container className="py-12">
      <SkeletonBlock className="mx-auto mb-12 h-10 w-72" />

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-4">
            <SkeletonBlock className="aspect-[3/4] w-full" />
            <SkeletonBlock className="h-4 w-3/4" />
            <SkeletonBlock className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    </Container>
  );
}
