export function LoadingCard() {
  return (
    <div className="animate-pulse space-y-8">
      <div className="h-48 bg-muted rounded-lg" />
      <div className="space-y-4">
        <div className="h-8 bg-muted rounded w-1/3" />
        <div className="h-32 bg-muted rounded" />
      </div>
    </div>
  )
}